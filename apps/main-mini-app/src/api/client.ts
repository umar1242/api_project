import axios from 'axios';

/**
 * Axios instance for calls to the unified API core.
 * The base URL is injected from the environment variable VITE_API_URL at build time.
 *
 * In development the Vite proxy forwards /api → http://localhost:3000, so
 * VITE_API_URL can be left empty (Vite serves from the same origin).
 *
 * In production the Mini App HTML is served from a separate nginx container, so
 * VITE_API_URL must point to the API service (e.g. https://api.example.com).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
    // Service token for internal bot-to-API auth (set at runtime via env)
    'X-Service-Token': import.meta.env.VITE_SERVICE_TOKEN ?? '',
  },
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  config.headers['tg-init-data'] = WebApp.initData || '';
  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────
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
