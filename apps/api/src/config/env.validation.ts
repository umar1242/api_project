import * as Joi from 'joi';
import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

/**
 * Validates environment variables at application startup.
 *
 * Hard-required (app cannot function without these):
 *   DATABASE_URL, REDIS_URL, SERVICE_TOKEN
 *
 * Soft-required (warn in dev, required in prod):
 *   TELEGRAM_BOT_TOKEN — only needed for Mini App initData validation (Stage 2+)
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  // ── Hard required ────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required()
    .description('Full Prisma connection string (postgresql://user:pass@host:port/db)'),

  REDIS_URL: Joi.string().required().description('Redis connection URL'),
  REDIS_HOST: Joi.string().default('redis'),
  REDIS_PORT: Joi.number().default(6379),

  SERVICE_TOKEN: Joi.string()
    .min(8)
    .required()
    .description('Shared secret for bot-to-API authentication'),

  // ── Soft required (optional — warn if missing) ────────────────────────────
  // Needed only for Telegram Mini App initData validation (Stage 2+)
  TELEGRAM_BOT_TOKEN: Joi.string()
    .optional()
    .description('Used to verify Mini App initData signatures'),
}).options({ allowUnknown: true });

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = envSchema.validate(config, {
    abortEarly: false,
  });

  if (error) {
    throw new Error(
      `Environment validation failed:\n${error.details
        .map((d) => `  - ${d.message}`)
        .join('\n')}`,
    );
  }

  // Soft warnings for non-blocking missing vars
  if (!config['TELEGRAM_BOT_TOKEN']) {
    logger.warn(
      'TELEGRAM_BOT_TOKEN is not set — Telegram Mini App auth will not work (needed from Stage 2)',
    );
  }

  return value as Record<string, unknown>;
}
