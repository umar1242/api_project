import axios from 'axios';
import { config } from '../config';

/**
 * Shared Axios client for all Main Bot → API calls.
 * Injects the X-Service-Token header on every request.
 */
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Token': config.serviceToken,
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '(unknown)';
    console.error(`[API] ${status ?? 'ERR'} ${url} — ${error.message}`);
    return Promise.reject(error);
  },
);
