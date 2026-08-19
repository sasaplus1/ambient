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
  'settings.reset': { ja: '初期化', en: 'Reset' },
  'settings.previewShow': { ja: 'プレビューを開く', en: 'Show preview' },
  'settings.previewHide': { ja: 'プレビューを閉じる', en: 'Hide preview' },

  'section.clock': { ja: '時計', en: 'Clock' },
  'section.date': { ja: '日付', en: 'Date' },
  'section.calendar': { ja: 'カレンダー', en: 'Calendar' },
  'section.weather': { ja: '天気', en: 'Weather' },
  'section.background': { ja: '背景', en: 'Background' },
  'section.debug': { ja: 'デバッグ', en: 'Debug' },
  'section.about': { ja: 'この時計について', en: 'About' },
  'section.theme': { ja: 'テーマ', en: 'Theme' },
  'section.language': { ja: '言語', en: 'Language' },

  'date.format': { ja: '表記', en: 'Format' },

  'calendar.weekStart': { ja: '週の始まり', en: 'Week starts on' },
  'weekStart.sunday': { ja: '日曜', en: 'Sunday' },
  'weekStart.monday': { ja: '月曜', en: 'Monday' },
  'calendar.adjacentDays': { ja: '前後の月', en: 'Adjacent months' },
  'adjacentDays.hidden': { ja: '非表示', en: 'Hidden' },
  'adjacentDays.dimmed': { ja: '薄く表示', en: 'Dimmed' },

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

  'theme.mode': { ja: '決め方', en: 'Chosen by' },
  'themeMode.fixed': { ja: '固定', en: 'Fixed' },
  'themeMode.schedule': { ja: '時刻', en: 'Time of day' },
  'theme.palette': { ja: '配色', en: 'Palette' },

  'theme.previewHour': { ja: 'この時刻で見る', en: 'Preview at' },
  'theme.previewNow': { ja: '現在', en: 'Now' },
  'theme.previewPlay': { ja: '1 日を再生', en: 'Play the day' },
  'theme.previewStop': { ja: '停止', en: 'Stop' },

  'timeBand.morning': { ja: '朝', en: 'Morning' },
  'timeBand.day': { ja: '昼', en: 'Day' },
  'timeBand.evening': { ja: '夕方', en: 'Evening' },
  'timeBand.night': { ja: '夜', en: 'Night' },
  'timeBand.lateNight': { ja: '深夜', en: 'Late night' },

  'language.label': { ja: '表示言語', en: 'Interface' },
  'language.auto': { ja: '自動', en: 'Auto' },
  'language.ja': { ja: '日本語', en: '日本語' },
  'language.en': { ja: 'English', en: 'English' },

  'weather.noLocation': { ja: '地点が未設定です', en: 'No location set' },
  'weather.loading': { ja: '取得中', en: 'Loading' },
  'weather.failed': { ja: '取得できません', en: 'Unavailable' },
  'weather.unit': { ja: '温度の単位', en: 'Temperature' },
  'temperatureUnit.auto': { ja: '自動', en: 'Auto' },
  'temperatureUnit.celsius': { ja: '摂氏', en: 'Celsius' },
  'temperatureUnit.fahrenheit': { ja: '華氏', en: 'Fahrenheit' },
  'temperatureUnit.both': { ja: '両方', en: 'Both' },
  'weather.forecast': { ja: '週間予報', en: 'Forecast' },
  'forecast.today': { ja: '今日', en: 'Today' },
  'weather.location': { ja: '地点', en: 'Location' },
  'weather.useCurrent': { ja: '現在地を使う', en: 'Use my location' },
  'weather.searchLabel': { ja: '地名で検索', en: 'Search by name' },
  'weather.searchPlaceholder': { ja: '例: 横浜', en: 'e.g. Yokohama' },
  'weather.search': { ja: '検索', en: 'Search' },
  'weather.noResults': { ja: '見つかりませんでした', en: 'Nothing found' },
  'weather.locating': { ja: '位置情報を取得中', en: 'Locating' },
  'weather.locateFailed': {
    ja: '位置情報を取得できません。地名で検索してください',
    en: 'Could not get your location. Try searching by name.',
  },
  'weather.clear': { ja: '地点を消す', en: 'Clear location' },

  'condition.clear': { ja: '快晴', en: 'Clear' },
  'condition.mostlyClear': { ja: '晴れ', en: 'Mostly clear' },
  'condition.partlyCloudy': { ja: '晴れ時々曇り', en: 'Partly cloudy' },
  'condition.overcast': { ja: '曇り', en: 'Overcast' },
  'condition.fog': { ja: '霧', en: 'Fog' },
  'condition.drizzle': { ja: '霧雨', en: 'Drizzle' },
  'condition.rain': { ja: '雨', en: 'Rain' },
  'condition.snow': { ja: '雪', en: 'Snow' },
  'condition.showers': { ja: 'にわか雨', en: 'Showers' },
  'condition.thunder': { ja: '雷雨', en: 'Thunderstorm' },

  'background.choose': { ja: '画像を選ぶ', en: 'Choose an image' },
  'background.replace': { ja: '画像を変える', en: 'Replace image' },
  'background.remove': { ja: '画像を消す', en: 'Remove image' },
  'background.failed': { ja: '保存できませんでした', en: 'Could not save it' },
  'background.fit': { ja: '合わせ方', en: 'Fit' },
  'background.dim': { ja: '減光', en: 'Dim' },
  'backgroundFit.cover': { ja: '画面を覆う', en: 'Cover' },
  'backgroundFit.contain': { ja: '全体を入れる', en: 'Contain' },
  'backgroundFit.fill': { ja: '引き伸ばす', en: 'Stretch' },

  'widget.visible': { ja: '表示', en: 'Show' },
  'type.size': { ja: '大きさ', en: 'Size' },
  'type.face': { ja: '書体', en: 'Face' },
  'textScale.s': { ja: '小', en: 'S' },
  'textScale.m': { ja: '中', en: 'M' },
  'textScale.l': { ja: '大', en: 'L' },
  'textScale.xl': { ja: '最大', en: 'XL' },

  'font.sans': { ja: 'ゴシック', en: 'Sans' },
  'font.serif': { ja: '明朝', en: 'Serif' },
  'font.mono': { ja: '等幅', en: 'Mono' },
  'font.condensed': { ja: '長体', en: 'Condensed' },

  'section.burnIn': { ja: '焼き付き対策', en: 'Burn-in protection' },
  'burnIn.pixelShift': { ja: 'ピクセルシフト', en: 'Pixel shift' },
  'burnIn.hint': {
    ja: '表示位置をときどき数ピクセルだけ動かし、有機 EL で時計やカレンダーが焼き付くのを防ぎます。液晶では不要です。',
    en: 'Nudges the display a few pixels now and then, so the clock does not burn into an OLED panel. An LCD does not need it.',
  },
  'burnIn.distance': { ja: '動かす幅', en: 'Distance' },
  'pixelShiftStrength.low': { ja: '小', en: 'Low' },
  'pixelShiftStrength.medium': { ja: '中', en: 'Medium' },
  'pixelShiftStrength.high': { ja: '大', en: 'High' },
  'burnIn.interval': { ja: '動かす間隔', en: 'Interval' },
  'burnIn.minutes': { ja: '分', en: 'min' },

  'debug.overlay': { ja: 'ログを重ねて表示', en: 'Overlay the log' },
  'debug.level': { ja: '表示レベル', en: 'Level' },
  'debug.clear': { ja: 'ログを消す', en: 'Clear log' },
  'logLevel.debug': { ja: 'DEBUG', en: 'DEBUG' },
  'logLevel.info': { ja: 'INFO', en: 'INFO' },
  'logLevel.warn': { ja: 'WARN', en: 'WARN' },
  'logLevel.error': { ja: 'ERROR', en: 'ERROR' },

  'about.repository': { ja: 'リポジトリ', en: 'Repository' },
  'about.site': { ja: '公開先', en: 'Live site' },
  'about.build': { ja: 'ビルド', en: 'Build' },
  'about.weatherData': { ja: '天気データ', en: 'Weather data' },
  'about.weatherLicence': { ja: '天気データの利用条件', en: 'Weather data licence' },
  'about.licence': { ja: 'ライセンス', en: 'Licence' },

  'ambient.start': { ja: '常時表示モードを開始', en: 'Start always-on mode' },
  'ambient.stop': { ja: '常時表示モードを終了', en: 'Stop always-on mode' },
} satisfies Record<string, Messages>;

export type MessageKey = keyof typeof DICTIONARY;

export function translate(locale: Locale, key: MessageKey): string {
  return DICTIONARY[key][locale];
}
