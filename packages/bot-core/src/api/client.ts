import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  serviceToken?: string;
  timeout?: number;
  retries?: number;
}

export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const { baseURL, serviceToken, timeout = 10000, retries = 2 } = options;

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...(serviceToken ? { 'X-Service-Token': serviceToken } : {}),
    },
  });

  // Request interceptor for logging/tracing
  client.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor with automatic retry on 5xx / network errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { _retryCount?: number };

      if (!config || !config.url) {
        return Promise.reject(error);
      }

      // Initialize retry count
      config._retryCount = config._retryCount || 0;

      const isNetworkOr5xx =
        !error.response ||
        (error.response.status >= 500 && error.response.status <= 599);

      if (isNetworkOr5xx && config._retryCount < retries) {
        config._retryCount += 1;
        const delay = Math.pow(2, config._retryCount) * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return client(config);
      }

      return Promise.reject(error);
    },
  );

  return client;
}
