import { redirect } from 'next/navigation';

/**
 * CRM'de MedStream yok: CRM klinik yönetimi, MedStream herkese açık sosyal
 * akış. Buradaki kopya ana sitedekinin eksiğiydi — videoyu oynatamıyordu bile.
 *
 * Sayfa silinmek yerine yönlendiriyor: menüden kaldırıldı ama kayıtlı
 * bağlantılar ve tarayıcı geçmişi 404 görmesin.
 */
export default async function Page({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/medstream`);
}
