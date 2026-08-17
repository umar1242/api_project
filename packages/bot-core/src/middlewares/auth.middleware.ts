import { NextFunction } from 'grammy';
import { AxiosInstance } from 'axios';
import { ExtendedContext, UserRole, ApiUser } from '../types';

// In-memory cache for API users to avoid DDoS on Core API (TTL: 5 minutes)
const userCache = new Map<string, { user: ApiUser; expiresAt: number }>();

export function getCachedUser(telegramId: string): ApiUser | undefined {
  const cached = userCache.get(telegramId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
  userCache.delete(telegramId);
  return undefined;
}

export function setCachedUser(telegramId: string, user: ApiUser): void {
  userCache.set(telegramId, { user, expiresAt: Date.now() + 5 * 60 * 1000 });
}

export function invalidateUserCache(telegramId: string): void {
  userCache.delete(telegramId);
}

/**
 * Middleware that upserts user into Core API upon incoming interaction
 * and caches user data in context and in-memory TTL cache.
 */
export function upsertUserMiddleware(apiClient: AxiosInstance) {
  return async (ctx: ExtendedContext, next: NextFunction) => {
    const from = ctx.from;
    if (!from || from.is_bot) {
      return next();
    }

    const telegramId = from.id.toString();

    // Check cache first
    const cached = getCachedUser(telegramId);
    if (cached) {
      ctx.user = cached;
      return next();
    }

    try {
      const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'User';
      const response = await apiClient.post<ApiUser>('/users/upsert', {
        telegramId,
        fullName,
      });

      if (response.data) {
        ctx.user = response.data;
        setCachedUser(telegramId, response.data);
      }
    } catch (err: any) {
      console.warn(`[bot-core] upsertUser failed for tgId=${from?.id}:`, err.message || err);
    }

    return next();
  };
}

/**
 * Middleware that restricts access only to specified roles (e.g. ADMIN, CURATOR).
 * Also checks if the user is banned.
 */
export function requireRole(allowedRoles: UserRole[], apiClient: AxiosInstance) {
  return async (ctx: ExtendedContext, next: NextFunction) => {
    const from = ctx.from;
    if (!from) {
      return;
    }

    const telegramId = from.id.toString();

    try {
      let user = ctx.user || getCachedUser(telegramId);

      // If user not already loaded in context or cache, fetch from Core API
      if (!user) {
        try {
          const response = await apiClient.get<ApiUser>(`/users/by-telegram/${telegramId}`);
          user = response.data;
          if (user) {
            setCachedUser(telegramId, user);
          }
        } catch {}
      }

      if (user) {
        ctx.user = user;
      }

      if (!user) {
        await ctx.reply('⛔ Доступ запрещён.\n\nВаш аккаунт не найден в системе. Обратитесь к администратору.');
        return;
      }

      if (user.status === 'BANNED' || user.isBanned) {
        const reason = user.bannedReason ? `\nПричина: ${user.bannedReason}` : '';
        await ctx.reply(`🚫 Ваш аккаунт заблокирован.${reason}\nОбратитесь к администратору.`);
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        await ctx.reply(
          `⛔ Недостаточно прав.\n\nЭта функция доступна только для ролей: <b>${allowedRoles.join(', ')}</b>.\nВаша роль: <i>${user.role}</i>.`,
          { parse_mode: 'HTML' }
        );
        return;
      }

      return next();
    } catch (error: any) {
      if (error.response?.status === 404) {
        await ctx.reply('⛔ Доступ запрещён.\n\nВаш аккаунт не зарегистрирован в системе или не имеет прав администратора.');
        return;
      }
      console.error('[bot-core] requireRole error:', error.message || error);
      await ctx.reply('⚠️ Ошибка проверки прав доступа. Пожалуйста, попробуйте позже.');
    }
  };
}
