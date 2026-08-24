import { useEffect, useRef } from 'react';

/**
 * Bir modalın klavye ve odak davranışı.
 *
 * Ölçüldü: yüzeydeki 61 modalın yalnız 5'i Escape'i dinliyordu, 3'ü odağı
 * yönetiyordu. Faresiz kullanıcı için sonuç şu: modal açılıyor, odak arkadaki
 * sayfada kalıyor, sekme tuşu modalın ALTINDAKİ bağlantılar arasında dolaşıyor
 * ve modal kapatılamıyor — çünkü kapatma düğmesine ulaşmak için önce arkadaki
 * onlarca öğeyi geçmek gerekiyor.
 *
 * Dört şey birlikte gerekiyor, biri eksik olunca diğerleri de işe yaramıyor:
 *
 *   • Escape kapatır.
 *   • Açılışta odak modalın içine girer.
 *   • Sekme modalın içinde döner (arkadaki sayfaya kaçmaz).
 *   • Kapanışta odak modalı AÇAN öğeye geri döner — yoksa kullanıcı listenin
 *     başına savrulur ve kaldığı yeri kaybeder.
 *
 * Gövde kaydırma kilidi de burada, çünkü aynı yaşam döngüsüne bağlı.
 *
 * @param {boolean} acik
 * @param {() => void} kapat
 * @returns {import('react').RefObject<HTMLElement>} modalın kök öğesine bağlanacak ref
 */
export default function useModalDavranisi(acik, kapat) {
  const kokRef = useRef(null);
  const oncekiOdakRef = useRef(null);

  // Kapatma işlevi çoğu çağrı yerinde her renderda yeniden kuruluyor. Etkiye
  // doğrudan bağlansaydı her renderda sökülüp yeniden kurulur, odak da her
  // seferinde ilk alana atlardı — kullanıcı bir alana yazarken imleç kaçardı.
  const kapatRef = useRef(kapat);
  kapatRef.current = kapat;

  useEffect(() => {
    if (!acik) return undefined;

    // Modalı açan öğe: kapanışta odak buraya dönecek.
    oncekiOdakRef.current = document.activeElement;

    const govdeTasma = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /** Modalın içindeki, sırayla odaklanabilir öğeler. */
    const odaklanabilirler = () => {
      const kok = kokRef.current;
      if (!kok) return [];

      return [...kok.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),'
        + ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((el) => el.offsetParent !== null);
    };

    // Odağı içeri al. Kök henüz boyanmamış olabilir, bir kare bekliyoruz.
    const kare = requestAnimationFrame(() => {
      const sira = odaklanabilirler();

      if (sira.length > 0) sira[0].focus();
      else kokRef.current?.focus();
    });

    const tusta = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        kapatRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const sira = odaklanabilirler();
      if (sira.length === 0) return;

      const ilk = sira[0];
      const son = sira[sira.length - 1];

      // Uçlarda sarmala: sekme modalın dışına çıkmasın.
      if (e.shiftKey && document.activeElement === ilk) {
        e.preventDefault();
        son.focus();
      } else if (!e.shiftKey && document.activeElement === son) {
        e.preventDefault();
        ilk.focus();
      }
    };

    document.addEventListener('keydown', tusta, true);

    return () => {
      cancelAnimationFrame(kare);
      document.removeEventListener('keydown', tusta, true);
      document.body.style.overflow = govdeTasma;

      // Odağı açan öğeye geri ver. Öğe bu arada ekrandan kalkmış olabilir.
      const onceki = oncekiOdakRef.current;
      if (onceki && typeof onceki.focus === 'function' && document.contains(onceki)) {
        onceki.focus();
      }
    };
  }, [acik]);

  return kokRef;
}
