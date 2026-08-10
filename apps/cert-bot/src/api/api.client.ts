import axios from 'axios';
import { config } from '../config';

/**
 * Pre-configured Axios instance for calling the unified API.
 * Automatically injects the X-Service-Token header.
 */
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'x-service-token': config.serviceToken,
  },
});
