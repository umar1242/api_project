import { useTelegramUser as useSharedTelegramUser } from '@shared-ui/core';
import { getUserByTelegramId } from '../api';
import type { UserProfile } from '../types';

export const useTelegramUser = () => useSharedTelegramUser<UserProfile>(getUserByTelegramId);
