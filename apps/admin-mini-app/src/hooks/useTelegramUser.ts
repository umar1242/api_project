import { useState, useEffect, useCallback } from 'react';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { getUserByTelegramId } from '../api';
import type { UserProfile } from '../types';

interface UseTelegramUserResult {
  user: UserProfile | null;
  telegramId: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Reads the Telegram Web App initData to get the current user's telegramId,
 * then fetches the user profile from our API.
 *
 * Falls back to null if called outside Telegram (e.g. in development).
 */
export function useTelegramUser(): UseTelegramUserResult {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const telegramId = WebApp.initDataUnsafe?.user?.id ?? null;

  const fetchUser = useCallback(async () => {
    if (!telegramId) {
      setIsLoading(false);
      setError('Could not identify Telegram user. Please open this app from the bot.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const profile = await getUserByTelegramId(telegramId);
      setUser(profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return { user, telegramId, isLoading, error, refetch: fetchUser };
}
