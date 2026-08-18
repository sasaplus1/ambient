export const LOCALES = ['ja', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** 'auto' follows the browser's language settings. */
export const LOCALE_SETTINGS = ['auto', ...LOCALES] as const;

export type LocaleSetting = (typeof LOCALE_SETTINGS)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocaleSetting(value: unknown): value is LocaleSetting {
  return (
    typeof value === 'string' &&
    (LOCALE_SETTINGS as readonly string[]).includes(value)
  );
}

/**
 * Picks a supported locale from the browser's language settings.
 *
 * navigator.languages is ordered by preference, so the first supported entry
 * wins. Checking only for Japanese would hand Japanese to someone whose
 * preferences read ['en', 'ja'].
 */
export function detectLocale(): Locale {
  const preferred = navigator.languages ?? [navigator.language];

  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];

    if (base && (LOCALES as readonly string[]).includes(base)) {
      return base as Locale;
    }
  }

  return DEFAULT_LOCALE;
}

type Messages = Record<Locale, string>;

const DICTIONARY = {
  'settings.title': { ja: '設定', en: 'Settings' },
  'settings.open': { ja: '設定を開く', en: 'Open settings' },
  'settings.close': { ja: '閉じる', en: 'Close' },
  'settings.back': { ja: '戻る', en: 'Back' },
  'settings.reset': { ja: '初期化', en: 'Reset' },

  'section.display': { ja: '表示', en: 'Display' },
  'section.clock': { ja: '時計', en: 'Clock' },
  'section.date': { ja: '日付', en: 'Date' },
  'section.theme': { ja: 'テーマ', en: 'Theme' },
  'section.language': { ja: '言語', en: 'Language' },
  'section.digitalClock': { ja: 'デジタル時計', en: 'Digital clock' },
  'section.analogClock': { ja: 'アナログ時計', en: 'Analog clock' },

  'clock.details': { ja: '時計の詳細', en: 'Clock details' },
  'clock.detailsRow': { ja: '詳細設定', en: 'More options' },

  'widget.clock': { ja: '時計', en: 'Clock' },
  'widget.date': { ja: '日付', en: 'Date' },

  'date.format': { ja: '表記', en: 'Format' },

  'clock.type': { ja: '種類', en: 'Type' },
  'clock.digital': { ja: 'デジタル', en: 'Digital' },
  'clock.analog': { ja: 'アナログ', en: 'Analog' },

  'clock.hour12': { ja: '12 時間表記', en: '12-hour clock' },
  'clock.showSeconds': { ja: '秒を表示', en: 'Show seconds' },

  'clock.secondHand': { ja: '秒針', en: 'Second hand' },
  'secondHand.none': { ja: 'なし', en: 'None' },
  'secondHand.step': { ja: 'ステップ', en: 'Stepping' },
  'secondHand.sweep': { ja: 'スイープ', en: 'Sweeping' },

  'clock.dial': { ja: '文字盤', en: 'Dial' },
  'numerals.none': { ja: 'なし', en: 'None' },
  'numerals.ticks': { ja: '目盛り', en: 'Ticks' },
  'numerals.arabic': { ja: '数字', en: 'Numbers' },
  'numerals.roman': { ja: 'ローマ数字', en: 'Roman' },

  'theme.palette': { ja: '配色', en: 'Palette' },

  'language.label': { ja: '表示言語', en: 'Interface' },
  'language.auto': { ja: '自動', en: 'Auto' },
  'language.ja': { ja: '日本語', en: '日本語' },
  'language.en': { ja: 'English', en: 'English' },

  'ambient.start': { ja: '常時表示モードを開始', en: 'Start always-on mode' },
  'ambient.stop': { ja: '常時表示モードを終了', en: 'Stop always-on mode' },
} satisfies Record<string, Messages>;

export type MessageKey = keyof typeof DICTIONARY;

export function translate(locale: Locale, key: MessageKey): string {
  return DICTIONARY[key][locale];
}
