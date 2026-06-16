import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/lib/locales';

export default async function Page({ params }) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  redirect(`/${loc}/medstream`);
}
