/**
 * Centralized configuration for the Certification Bot.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  /** Certification Bot Telegram token */
  telegramToken: required('CERT_BOT_TOKEN'),

  /** Base URL of the unified API */
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://api:3000',

  /** Shared secret for Bot → API authentication */
  serviceToken: required('SERVICE_TOKEN'),

  nodeEnv: process.env.NODE_ENV ?? 'development',
  webAppUrl: required('CERT_WEBAPP_URL'),
} as const;
