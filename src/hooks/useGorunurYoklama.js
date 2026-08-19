'use client';
import { useEffect, useRef } from 'react';

/**
 * Sekme görünürken düzenli aralıkla çalışan yoklama.
 *
 * Neden görünürlüğe bağlı: klinikler CRM'i gün boyu arka planda açık
 * bırakıyor. Sekme görünmezken de yoklamak, kimsenin bakmadığı ekranlar için
 * sunucuya sürekli istek göndermek demek. Ölçümde boşta duran tek bir CRM
 * oturumu saniyede 0,06 istek üretiyordu; 500 klinikte bu, hiç kimse hiçbir
 * şey yapmasa bile saniyede 30 istek eder.
 *
 * Sekme geri görünür olduğunda hemen bir kez çalışır: kullanıcı döndüğünde
 * bayat sayı görmesin.
 *
 * @param {() => void} is        çalıştırılacak iş (genellikle bir sayaç isteği)
 * @param {number}     aralikMs  görünürken bekleme süresi
 * @param {boolean}    etkin     kapalıyken hiç zamanlayıcı kurulmaz
 */
export function useGorunurYoklama(is, aralikMs, etkin = true) {
  // İş her render'da yeniden üretilse bile zamanlayıcıyı kurmamak için
  // referansta tutuluyor; aksi hâlde aralık sürekli sıfırlanırdı.
  const isRef = useRef(is);
  isRef.current = is;

  useEffect(() => {
    if (!etkin || typeof document === 'undefined') return;

    const gorunurse = () => {
      if (document.visibilityState === 'visible') isRef.current?.();
    };

    gorunurse();
    const zamanlayici = setInterval(gorunurse, aralikMs);
    document.addEventListener('visibilitychange', gorunurse);

    return () => {
      clearInterval(zamanlayici);
      document.removeEventListener('visibilitychange', gorunurse);
    };
  }, [etkin, aralikMs]);
}

export default useGorunurYoklama;
