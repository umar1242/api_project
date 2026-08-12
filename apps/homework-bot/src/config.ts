/**
 * Centralized configuration for the Homework Bot.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  /** Homework Bot Telegram token */
  telegramToken: required('HOMEWORK_BOT_TOKEN'),

  /** Base URL of the unified API */
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://api:3000',

  /** Mini App URL for Homework */
  miniAppUrl: required('HOMEWORK_WEBAPP_URL'),

  /** Shared secret for Bot → API authentication */
  serviceToken: required('SERVICE_TOKEN'),

  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;
