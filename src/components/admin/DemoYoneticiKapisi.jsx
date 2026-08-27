'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../lib/api';

/**
 * Tanıtım kipi: `/admin` açıldığında giriş ekranı yerine salt okunur bir
 * oturum kurar.
 *
 * `PrivateRoute`'un ÜSTÜNDE duruyor, çünkü o bekçi oturumsuz ziyaretçiyi
 * doğrudan `/login`'e yolluyor — panelin kendi giriş ekranına bile
 * varılmıyor. Denemenin ondan önce bitmesi gerekiyor.
 *
 * Uç üretimde varsayılan olarak KAPALI ve 404 dönüyor. O hâlde bu bileşen
 * hiçbir şey yapmaz ve altındaki bekçi eskisi gibi davranır: kip kapalıyken
 * davranış birebir eskisiyle aynı.
 *
 * Verilen oturumun yetkisi salt okunur; ayrıntı ve kapatma yordamı
 * `backend/app/Http/Controllers/Api/DemoYoneticiGirisiController.php`.
 */
export default function DemoYoneticiKapisi({ children }) {
  const { user, hydrated, applyApiAuth } = useAuth() || {};
  const [deneniyor, setDeneniyor] = useState(true);

  useEffect(() => {
    // Oturum durumu okunmadan denemek, var olan bir yöneticinin üzerine
    // demo oturumu açardı.
    if (hydrated === false) return;
    if (user) { setDeneniyor(false); return; }

    let iptal = false;

    (async () => {
      try {
        const yanit = await adminAPI.demoYoneticiGirisi();
        if (!iptal) applyApiAuth?.(yanit?.data || yanit);
      } catch {
        // Kip kapalı (404) ya da sunucuya ulaşılamıyor: normal akış.
      } finally {
        if (!iptal) setDeneniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, [hydrated, user, applyApiAuth]);

  if (deneniyor && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Yükleniyor...
      </div>
    );
  }

  return children;
}
