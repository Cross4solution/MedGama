'use client';
// CRM yükseltme sayfası.
//
// Kilitli CRM düğmesinin açtığı modal buraya yönlendiriyordu
// (SidebarPatient.jsx) ama sayfa YOKTU: abone olmayan bir hekim ya da klinik
// "Yükselt" düğmesine bastığında 404 alıyordu. Yani ödeme yolunun ucu kırıktı
// ve bunu kimse görmüyordu — kırık iç bağlantı hiçbir yerde uyarı üretmiyor.
//
// `ProTeaser` zaten bu iş için yazılmış ve varsayılanı `page="crm"`; diğer CRM
// ekranları da abone olmayan kullanıcıya onu gösteriyor. Sarmalayıcı yalnız
// ROLE bakıyor, aboneliğe değil — yani yükseltmesi gereken kullanıcı sayfaya
// girebiliyor.
import CRMPage from '@/components/crm/CRMPage';
import ProTeaser from '@/components/crm/ProTeaser';

export default function Page() {
  return (
    <CRMPage>
      <ProTeaser page="crm" />
    </CRMPage>
  );
}
