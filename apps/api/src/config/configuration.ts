export const configuration = () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'redis',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    url: process.env.REDIS_URL,
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },

  auth: {
    serviceToken: process.env.SERVICE_TOKEN,
  },
});

export type AppConfig = ReturnType<typeof configuration>;
