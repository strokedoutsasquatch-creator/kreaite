export interface GeoLocation {
  country: string;
  countryCode: string;
  currency: string;
  language: string;
  timezone: string;
  region?: string;
  city?: string;
}

export interface LocaleConfig {
  language: string;
  currency: string;
  currencySymbol: string;
  numberFormat: Intl.NumberFormatOptions;
  dateFormat: Intl.DateTimeFormatOptions;
  direction: 'ltr' | 'rtl';
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
  JP: 'JPY', CN: 'CNY', KR: 'KRW', IN: 'INR', SG: 'SGD', HK: 'HKD', TW: 'TWD', TH: 'THB', MY: 'MYR', ID: 'IDR', PH: 'PHP', VN: 'VND',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN',
  ZA: 'ZAR', NG: 'NGN', EG: 'EGP', KE: 'KES',
  RU: 'RUB', UA: 'UAH', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  TR: 'TRY', IL: 'ILS', AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD',
};

const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  US: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en', SG: 'en', IN: 'en', PH: 'en', ZA: 'en', NG: 'en', KE: 'en',
  CA: 'en',
  DE: 'de', AT: 'de', CH: 'de',
  FR: 'fr', BE: 'fr',
  ES: 'es', MX: 'es', AR: 'es', CL: 'es', CO: 'es', PE: 'es',
  IT: 'it',
  NL: 'nl',
  PT: 'pt', BR: 'pt',
  JP: 'ja',
  CN: 'zh', TW: 'zh', HK: 'zh',
  KR: 'ko',
  TH: 'th',
  VN: 'vi',
  ID: 'id',
  MY: 'ms',
  RU: 'ru', UA: 'ru',
  PL: 'pl',
  CZ: 'cs',
  HU: 'hu',
  RO: 'ro',
  SE: 'sv',
  NO: 'no',
  DK: 'da',
  FI: 'fi',
  GR: 'el',
  TR: 'tr',
  IL: 'he',
  AE: 'ar', SA: 'ar', EG: 'ar', QA: 'ar', KW: 'ar',
};

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', KRW: '₩', INR: '₹',
  BRL: 'R$', MXN: '$', CAD: 'C$', AUD: 'A$', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', RUB: '₽', UAH: '₴', TRY: '₺',
  ZAR: 'R', NGN: '₦', EGP: '£', AED: 'د.إ', SAR: '﷼', ILS: '₪',
  SGD: 'S$', HKD: 'HK$', TWD: 'NT$', THB: '฿', MYR: 'RM', IDR: 'Rp', PHP: '₱', VND: '₫',
};

export async function detectLocation(ip: string): Promise<GeoLocation> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return getDefaultLocation();
  }
  
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'KreAIte/1.0' }
    });
    
    if (!response.ok) {
      console.warn('Geolocation API failed, using defaults');
      return getDefaultLocation();
    }
    
    const data = await response.json();
    
    if (data.error) {
      return getDefaultLocation();
    }
    
    return {
      country: data.country_name || 'United States',
      countryCode: data.country_code || 'US',
      currency: data.currency || COUNTRY_TO_CURRENCY[data.country_code] || 'USD',
      language: COUNTRY_TO_LANGUAGE[data.country_code] || 'en',
      timezone: data.timezone || 'America/New_York',
      region: data.region,
      city: data.city,
    };
  } catch (error) {
    console.error('Geolocation detection failed:', error);
    return getDefaultLocation();
  }
}

function getDefaultLocation(): GeoLocation {
  return {
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    language: 'en',
    timezone: 'America/New_York',
  };
}

export function getLocaleConfig(countryCode: string, language?: string): LocaleConfig {
  const lang = language || COUNTRY_TO_LANGUAGE[countryCode] || 'en';
  const currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
  
  return {
    language: lang,
    currency,
    currencySymbol: CURRENCY_SYMBOLS[currency] || currency,
    numberFormat: {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    },
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    direction: RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr',
  };
}

export function formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOLS[currency] || currency}${amount.toFixed(2)}`;
  }
}

export function formatNumber(value: number, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return value.toString();
  }
}

export function formatDate(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  ];
}

export function getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'KRW', name: 'Korean Won', symbol: '₩' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  ];
}

export function getClientIP(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || '127.0.0.1';
}
