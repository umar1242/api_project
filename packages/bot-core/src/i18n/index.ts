export type Language = 'ru' | 'uz';

export const translations: Record<Language, Record<string, string>> = {
  ru: {
    welcome: '👋 Добро пожаловать!',
    open_app: '📱 Открыть приложение',
    help: '❓ Помощь',
    progress: '🏆 Прогресс',
    coins: '🪙 Монеты',
    schedule: '📅 Расписание',
    homeworks: '📚 Домашки',
    materials: '📖 Материалы',
    search: '🔍 Поиск',
    lang_changed: '🇷🇺 Язык успешно изменён на Русский.',
    select_lang: '🌐 <b>Выберите язык интерфейса / Tilni tanlang:</b>',
    error_occurred: '⚠️ Произошла внутренняя ошибка. Пожалуйста, попробуйте позже.',
    access_denied: '⛔ Доступ ограничен. Обратитесь к администратору.',
  },
  uz: {
    welcome: '👋 Xush kelibsiz!',
    open_app: '📱 Ilovani ochish',
    help: '❓ Yordam',
    progress: '🏆 Natijalar',
    coins: '🪙 Tangalar',
    schedule: '📅 Dars jadvali',
    homeworks: '📚 Uy vazifalari',
    materials: "📖 O'quv materiallari",
    search: '🔍 Qidiruv',
    lang_changed: "🇺🇿 Til muvaffaqiyatli O'zbekchaga o'zgartirildi.",
    select_lang: "🌐 <b>Interfeys tilini tanlang / Выберите язык:</b>",
    error_occurred: "⚠️ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.",
    access_denied: "⛔ Kirish cheklangan. Administratorga murojaat qiling.",
  },
};

/**
 * Returns localized string for the specified key
 */
export function t(lang: Language, key: string, params?: Record<string, string | number>): string {
  let str = translations[lang]?.[key] || translations['ru'][key] || key;

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      str = str.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
    }
  }

  return str;
}
