import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';
import { config } from '../config';

/**
 * /materials and /search handler for Material Bot
 */
export async function searchMaterialsHandler(ctx: CommandContext<Context>): Promise<void> {
  const query = ctx.match?.trim();

  await ctx.reply('⏳ Поиск учебных материалов...');

  try {
    const { data: materialsRes } = await apiClient.get('/materials', {
      params: query ? { search: query } : { take: 10 },
    });

    const materials = Array.isArray(materialsRes) ? materialsRes : (materialsRes?.data || []);

    if (materials.length === 0) {
      await ctx.reply(
        query
          ? `🔍 По запросу «<b>${query}</b>» ничего не найдено.`
          : '📚 В данный момент доступных материалов нет.',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Открыть библиотеку в приложении', web_app: { url: config.miniAppUrl } }],
            ],
          },
        }
      );
      return;
    }

    let text = query
      ? `🔍 <b>Результаты поиска по «${query}»:</b>\n\n`
      : `📚 <b>Последние учебные материалы:</b>\n\n`;

    const buttons: any[] = [];

    for (const m of materials.slice(0, 6)) {
      const typeEmoji = m.type === 'VIDEO' ? '🎥' : m.type === 'ARTICLE' ? '📝' : '📄';
      text += `${typeEmoji} <b>${m.title}</b>\n`;
      if (m.description) text += `<i>${m.description.slice(0, 60)}...</i>\n`;
      text += '\n';

      buttons.push([
        { text: `${typeEmoji} Открыть: ${m.title.slice(0, 25)}`, web_app: { url: `${config.miniAppUrl}/materials/${m.id}` } },
      ]);
    }

    buttons.push([{ text: '📚 Открыть все материалы в приложении', web_app: { url: config.miniAppUrl } }]);

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } catch (err: any) {
    await ctx.reply('⚠️ Не удалось загрузить материалы. Откройте приложение по кнопке ниже:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📚 Открыть библиотеку', web_app: { url: config.miniAppUrl } }],
        ],
      },
    });
  }
}
