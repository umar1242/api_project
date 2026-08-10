/**
 * Centralized configuration for the Admin Bot.
 * All env vars are read and validated here — the rest of the app uses this module.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  /** Admin Bot Telegram token */
  telegramToken: required('ADMIN_BOT_TOKEN'),

  /** Base URL of the unified API (e.g. http://api:3000) */
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://api:3000',

  /** Shared secret for Bot → API authentication (X-Service-Token header) */
  serviceToken: required('SERVICE_TOKEN'),

  /** Runtime environment */
  nodeEnv: process.env.NODE_ENV ?? 'development',

  /** URL for the Admin Mini App */
  webAppUrl: process.env.ADMIN_WEBAPP_URL ?? 'http://localhost:5173',
} as const;
