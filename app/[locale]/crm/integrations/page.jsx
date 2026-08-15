import { redirect } from 'next/navigation';

/**
 * Entegrasyonlar ekranı kaldırıldı.
 *
 * Listelediği beş kalemin (E-Nabız, Medula, E-Reçete, MHRS, E-Fatura) hiçbiri
 * yazılmamıştı; ekran hiçbir uca bağlı değildi ve bağlantı durumu sayaçları
 * sabit değerleri sayıyordu. Çalışan tek özellik takvim senkronuydu, o da
 * Ayarlar ekranında duruyor.
 *
 * Sayfa silinmek yerine oraya yönlendiriyor: menüden kaldırıldı ama kayıtlı
 * bağlantılar 404 görmesin.
 */
export default async function Page({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/crm/settings`);
}
