import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  direction: 'ltr' | 'rtl';
}

export interface TranslationKeys {
  common: Record<string, string>;
  studios: Record<string, string>;
  ai: Record<string, string>;
  marketplace: Record<string, string>;
  errors: Record<string, string>;
}

export interface LocaleContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  location: GeoLocation | null;
  localeConfig: LocaleConfig | null;
  translations: TranslationKeys | null;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (value: number) => string;
  formatDate: (date: Date | string) => string;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }
  return context;
}

export function useGeoLocation() {
  return useQuery<{ location: GeoLocation; localeConfig: LocaleConfig }>({
    queryKey: ['/api/geolocation'],
    queryFn: async () => {
      const res = await fetch('/api/geolocation');
      if (!res.ok) throw new Error('Failed to detect location');
      return res.json();
    },
    staleTime: 300000,
    retry: 1,
  });
}

export function useTranslations(locale: string) {
  return useQuery<TranslationKeys>({
    queryKey: ['/api/i18n/translations', locale],
    queryFn: async () => {
      const res = await fetch(`/api/i18n/translations/${locale}`);
      if (!res.ok) throw new Error('Failed to fetch translations');
      return res.json();
    },
    staleTime: Infinity,
    enabled: !!locale,
  });
}

export function useSupportedLocales() {
  return useQuery<{
    languages: Array<{ code: string; name: string; nativeName: string }>;
    currencies: Array<{ code: string; name: string; symbol: string }>;
  }>({
    queryKey: ['/api/i18n/locales'],
    queryFn: async () => {
      const res = await fetch('/api/i18n/locales');
      if (!res.ok) throw new Error('Failed to fetch locales');
      return res.json();
    },
    staleTime: Infinity,
  });
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<string>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  const geoQuery = useGeoLocation();
  const translationsQuery = useTranslations(locale);

  useEffect(() => {
    const savedLocale = localStorage.getItem('kreaite_locale');
    if (savedLocale) {
      setLocaleState(savedLocale);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && geoQuery.data?.location.language && !localStorage.getItem('kreaite_locale')) {
      setLocaleState(geoQuery.data.location.language);
    }
  }, [geoQuery.data, isInitialized]);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem('kreaite_locale', newLocale);
  };

  const t = (key: string): string => {
    if (!translationsQuery.data) return key;
    
    const keys = key.split('.');
    let result: any = translationsQuery.data;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  };

  const formatCurrency = (amount: number): string => {
    const currency = geoQuery.data?.localeConfig.currency || 'USD';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${geoQuery.data?.localeConfig.currencySymbol || '$'}${amount.toFixed(2)}`;
    }
  };

  const formatNumber = (value: number): string => {
    try {
      return new Intl.NumberFormat(locale).format(value);
    } catch {
      return value.toString();
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  };

  const value: LocaleContextValue = {
    locale,
    setLocale,
    location: geoQuery.data?.location || null,
    localeConfig: geoQuery.data?.localeConfig || null,
    translations: translationsQuery.data || null,
    t,
    formatCurrency,
    formatNumber,
    formatDate,
    isLoading: geoQuery.isLoading || translationsQuery.isLoading,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export { LocaleContext };

export function useT() {
  const { t } = useLocaleContext();
  return t;
}
