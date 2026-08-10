import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createConnection } from 'net';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check API, database and Redis connectivity' })
  async check() {
    const [db, redis] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
    ]);

    return {
      status: db === 'connected' && redis === 'connected' ? 'ok' : 'degraded',
      db,
      redis,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<'connected' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'error';
    }
  }

  /**
   * Check Redis with a raw TCP connection (no client library instantiation).
   * Sends a PING command and expects "+PONG" in response.
   * This avoids creating a new Redis client on every health check request.
   */
  private checkRedis(): Promise<'connected' | 'error'> {
    return new Promise((resolve) => {
      const host = this.config.get<string>('redis.host') ?? 'redis';
      const port = this.config.get<number>('redis.port') ?? 6379;

      const socket = createConnection({ host, port }, () => {
        socket.write('PING\r\n');
      });

      const timer = setTimeout(() => {
        socket.destroy();
        resolve('error');
      }, 3000);

      socket.on('data', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve('connected');
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve('error');
      });
    });
  }
}
