/**
 * Centralized configuration for the Main Bot.
 * All required env vars fail fast at startup if missing.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  /** Main Bot Telegram token */
  telegramToken: required('MAIN_BOT_TOKEN'),

  /** Base URL of the unified API */
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://api:3000',

  /** Main Mini App URL (open via WebApp button) */
  miniAppUrl: process.env.MAIN_MINI_APP_URL ?? 'https://your-mini-app-url.example.com',

  /** Shared secret for Bot → API authentication */
  serviceToken: required('SERVICE_TOKEN'),

  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;
