/**
 * Centralized configuration for the Material Bot.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  /** Material Bot Telegram token */
  telegramToken: required('MATERIAL_BOT_TOKEN'),

  /** Base URL of the unified API */
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://api:3000',

  /** Mini App URL */
  miniAppUrl: process.env.MINI_APP_URL || '',

  /** Shared secret for Bot → API authentication */
  serviceToken: required('SERVICE_TOKEN'),

  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;
