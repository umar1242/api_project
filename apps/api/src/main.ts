import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Service-Token, tg-init-data',
  });

  // ── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown fields
      forbidNonWhitelisted: true,// Reject requests with unknown fields
      transform: true,           // Auto-transform primitive types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global interceptors & filters ────────────────────────────────────────
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger (development + staging only) ─────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Bot Network API')
      .setDescription('Unified REST API for the Telegram Bot Network')
      .setVersion('1.0')
      .addApiKey(
        { type: 'apiKey', name: 'X-Service-Token', in: 'header' },
        'service-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at: /api/docs');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`API is running on port ${port}`);
}

bootstrap();
