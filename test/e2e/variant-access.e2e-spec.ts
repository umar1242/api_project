import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../../apps/api/src/app.module';

// Воспроизводит ТОЧНО ту же схему подписи, что использует настоящий Telegram-клиент,
// и которую проверяет TelegramAuthGuard (apps/api/src/common/guards/telegram-auth.guard.ts)
function buildValidInitData(user: object, botToken: string): string {
  const authDate = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams();
  params.set('user', JSON.stringify(user));
  params.set('auth_date', String(authDate));

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

describe('Variant access via Mini App (e2e)', () => {
  let app: INestApplication;
  let createdVariantId: string;
  const serviceToken = process.env.SERVICE_TOKEN as string;
  const certBotToken = process.env.CERT_BOT_TOKEN as string;

  beforeAll(async () => {
    if (!serviceToken || !certBotToken) {
      throw new Error(
        'SERVICE_TOKEN or CERT_BOT_TOKEN missing in env — тест не может проверить реальный сценарий без них.',
      );
    }
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    // Создаём вариант так же, как это делает билдер (без groupId, тип CERTIFICATION)
    const createRes = await request(app.getHttpServer())
      .post('/variants')
      .set('x-service-token', serviceToken)
      .send({
        title: 'E2E Diagnostic Variant',
        type: 'CERTIFICATION',
        tasks: [
          { type: 'MULTIPLE_CHOICE', orderIndex: 1, optionsCount: 4, correctAnswer: 'A' },
        ],
      });

    if (createRes.status !== 201) {
      throw new Error(
        `Не удалось создать тестовый вариант: status=${createRes.status}, body=${JSON.stringify(createRes.body)}`,
      );
    }
    createdVariantId = createRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('реальный студент с валидным Telegram initData ДОЛЖЕН получить вариант (200)', async () => {
    const initData = buildValidInitData(
      { id: 999999001, first_name: 'DiagnosticStudent' },
      certBotToken,
    );

    const res = await request(app.getHttpServer())
      .get(`/variants/${createdVariantId}`)
      .set('tg-init-data', initData);

    console.log('STATUS:', res.status);
    console.log('BODY:', JSON.stringify(res.body, null, 2));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdVariantId);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it('запрос БЕЗ initData должен получить 401 (это ожидаемое поведение, не баг)', async () => {
    const res = await request(app.getHttpServer()).get(`/variants/${createdVariantId}`);
    console.log('STATUS (no auth):', res.status);
    expect(res.status).toBe(401);
  });

  it('запрос с несуществующим ID должен получить 404', async () => {
    const initData = buildValidInitData(
      { id: 999999002, first_name: 'DiagnosticStudent2' },
      certBotToken,
    );
    const res = await request(app.getHttpServer())
      .get('/variants/999999999')
      .set('tg-init-data', initData);
    console.log('STATUS (bad id):', res.status);
    expect(res.status).toBe(404);
  });
});
