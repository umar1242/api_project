import { Bot } from 'grammy';
import { BotCommandItem } from '../types';

/**
 * Registers Telegram bot command suggestions (/setMyCommands)
 */
export async function setupBotCommands(
  bot: Bot<any>,
  commands: BotCommandItem[],
  options?: { languageCode?: string; scope?: any }
): Promise<void> {
  try {
    await bot.api.setMyCommands(commands, {
      language_code: options?.languageCode as any,
      scope: options?.scope,
    });
    console.log(`[bot-core] Registered ${commands.length} commands for @${bot.botInfo?.username || 'bot'}`);
  } catch (error: any) {
    console.warn(`[bot-core] Failed to setMyCommands:`, error.message || error);
  }
}
