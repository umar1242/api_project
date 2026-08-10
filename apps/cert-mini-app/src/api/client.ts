import { createApiClient } from '@shared-ui/core';

export const apiClient = createApiClient(import.meta.env.VITE_API_URL ?? '/api');
