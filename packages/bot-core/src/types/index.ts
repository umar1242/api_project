import { Context } from 'grammy';

export type UserRole = 'ADMIN' | 'CURATOR' | 'STUDENT' | 'TEACHER';

export interface ApiUser {
  id: string;
  telegramId: string;
  fullName: string;
  role: UserRole;
  status?: string;
  isBanned?: boolean;
  bannedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface BotConfig {
  telegramToken: string;
  apiBaseUrl: string;
  serviceToken?: string;
  miniAppUrl?: string;
  webAppUrl?: string;
  redisUrl?: string;
  nodeEnv?: string;
}

export interface BotCommandItem {
  command: string;
  description: string;
}

export interface ExtendedContext extends Context {
  user?: ApiUser;
}
