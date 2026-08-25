import { redirect } from 'next/navigation';

/**
 * "Yardım" adresi, Ayarlar ekranını çiziyordu.
 *
 * Rota menüde yok — CRM kenar çubuğu Destek (`/crm/support`), SSS (`/crm/faq`)
 * ve Ayarlar (`/crm/settings`) bağlantılarını veriyor. Geriye kalan bu adres
 * `CRMSettings` render ediyor, üstelik sayfa başlığı "CRM Help" diyordu: adı
 * yardım olan bir sayfa ayarları gösteriyor.
 *
 * Silmek yerine yönlendiriliyor — `/crm/integrations` için verilen kararın
 * aynısı: kayıtlı bir bağlantı 404 görmesin. Hedef Destek ekranı, çünkü adın
 * vaat ettiği şey o.
 */
export default async function Page({ params }) {
  const { locale } = await params;

  redirect(`/${locale}/crm/support`);
}
