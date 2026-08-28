'use client';
import dynamic from 'next/dynamic';
import CRMPage from '@/components/crm/CRMPage';

const Yukleniyor = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
  </div>
);

// Ağır kütüphane (grafik/takvim) taşıyor; ilk yükleme paketinden çıkarıldı.
// Ölçüm: bu ekranlar 566-571 KB ile açılıyordu.
const CRMSmartCalendar = dynamic(() => import('@/screens/crm/CRMSmartCalendar'), { ssr: false, loading: Yukleniyor });

export default function Page() { return <CRMPage><CRMSmartCalendar /></CRMPage>; }
