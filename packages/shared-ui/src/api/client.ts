import axios, { AxiosInstance } from 'axios';
import WebAppModule from "@twa-dev/sdk";

const WebApp = (WebAppModule as any).default || WebAppModule;

export const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10_000,
  });

  client.interceptors.request.use((config) => {
    config.headers['tg-init-data'] = WebApp.initData || '';
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message ?? error.message;
        console.error(`[API] ${status ?? 'Network'} — ${message}`);
      }
      return Promise.reject(error);
    }
  );

  return client;
};
