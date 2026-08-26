import { useEffect, useState } from 'react';
import { adminAPI } from '../lib/api';

/**
 * Doğrulama belgesini kimlikli istekle çeker ve gösterilebilir bir adrese çevirir.
 *
 * Belge ucu `auth:sanctum` arkasında ve jetonu `Authorization` başlığından
 * okuyor. `<img src>` ve `<iframe src>` o başlığı göndermez; ekranlar bunu
 * `?token=...` ekleyerek çözmeye çalışıyordu ama sunucu sorgudaki jetonu
 * okumuyor. Üstelik okunan anahtar (`auth_token`) uygulamanın hiç yazmadığı
 * bir addı, yani değer zaten boştu.
 *
 * Ölçüldü: `<img src>` isteği 401, aynı uç `Authorization` başlığıyla 200.
 * Sonuç, yöneticinin onaylayacağı diplomayı hiç görememesiydi.
 *
 * Blob adresi tarayıcıda üretiliyor; istek kimlikli gittiği için sunucudaki
 * "kim baktı" denetim kaydı da yerinde kalıyor.
 */
export default function useBelgeBlobu(vrId) {
  const [adres, setAdres] = useState(null);
  const [hata, setHata] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    if (!vrId) { setAdres(null); return undefined; }

    let iptal = false;
    let uretilen = null;

    setYukleniyor(true);
    setHata(false);

    adminAPI.verificationDocument(vrId)
      .then((res) => {
        const veri = res?.data ?? res;
        if (iptal || !veri) return;
        uretilen = URL.createObjectURL(veri instanceof Blob ? veri : new Blob([veri]));
        setAdres(uretilen);
      })
      .catch(() => { if (!iptal) setHata(true); })
      .finally(() => { if (!iptal) setYukleniyor(false); });

    return () => {
      iptal = true;
      // Blob adresi serbest bırakılmazsa bellekte kalır; belge dosyaları
      // birkaç megabayt olabiliyor ve yönetici arka arkaya onlarca açıyor.
      if (uretilen) URL.revokeObjectURL(uretilen);
    };
  }, [vrId]);

  return { adres, hata, yukleniyor };
}
