import i18n from '../i18n';

const LOCALE_MAP: Record<string, { locale: string; currency: string }> = {
  es: { locale: 'es-AR', currency: 'ARS' },
  en: { locale: 'en-US', currency: 'USD' },
};

function getLocaleConfig(lang?: string) {
  const key = lang ?? i18n.language ?? 'es';
  return LOCALE_MAP[key] ?? LOCALE_MAP.es;
}

export function formatCurrency(amount: number, lang?: string): string {
  const { locale, currency } = getLocaleConfig(lang);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number, lang?: string): string {
  const { locale } = getLocaleConfig(lang);
  return new Intl.NumberFormat(locale).format(n);
}
