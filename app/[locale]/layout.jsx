// Locale segment layout — her dil için ([tr]/[en]/[de]/[ar]/[ru]) ortak kabuk.
// Routing dosya-tabanlı; burada locale doğrulanır, i18n senkronlanır ve SiteChrome sarılır.
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import SiteChrome from '../SiteChrome';
import LocaleBridge from './LocaleBridge';
import SozlukPaketi from './SozlukPaketi';
import { LOCALES, isLocale } from '@/lib/locales';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // x-brand set by middleware on the medstream.co domain → standalone feed shell.
  const brand = (await headers()).get('x-brand') || 'medagama';

  return (
    <>
      {/* Sözlük ÖNCE: LocaleBridge dili değiştirdiğinde kaynak hazır olmalı. */}
      <SozlukPaketi locale={locale} />
      <LocaleBridge locale={locale} />
      <SiteChrome brand={brand}>{children}</SiteChrome>
    </>
  );
}
