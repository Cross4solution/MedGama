// Locale segment layout — her dil için ([tr]/[en]/[de]/[ar]/[ru]) ortak kabuk.
// Routing dosya-tabanlı; burada locale doğrulanır, i18n senkronlanır ve SiteChrome sarılır.
import { notFound } from 'next/navigation';
import SiteChrome from '../SiteChrome';
import LocaleBridge from './LocaleBridge';
import { LOCALES, isLocale } from '@/lib/locales';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <LocaleBridge locale={locale} />
      <SiteChrome>{children}</SiteChrome>
    </>
  );
}
