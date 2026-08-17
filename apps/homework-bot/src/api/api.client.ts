import { createApiClient } from '../../packages/bot-core/src';
import { config } from '../config';

/**
 * Homework Bot API client powered by @bot/core
 */
export const apiClient = createApiClient({
  baseURL: config.apiBaseUrl,
  serviceToken: config.serviceToken,
  timeout: 10000,
});
