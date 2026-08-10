import axios from 'axios';

import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Token': import.meta.env.VITE_SERVICE_TOKEN ?? '',
  },
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  config.headers['tg-init-data'] = WebApp.initData || '';
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message ?? error.message;
      console.error(`[API] ${status ?? 'Network'} — ${message}`);
    }
    return Promise.reject(error);
  },
);
