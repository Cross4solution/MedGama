'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contentTranslationAPI } from '../lib/api';
import { useAuth } from './AuthContext';

/**
 * İçerik çevirisi — "her şey benim dilimde görünsün" tercihi.
 *
 * Platformdaki metinler ikiye ayrılıyor:
 *  • Sabit arayüz (menü, düğme) → dil dosyalarından, her zaman kullanıcının dilinde
 *  • Kullanıcı içeriği (gönderi, yorum, mesaj) → yazıldığı dilde durur
 *
 * Bu bağlam ikincisi içindir. Tercih açıkken ekrandaki içerikler kullanıcının
 * diline çevrilir; kapalıyken özgün hâlinde kalır ve kullanıcı tek tek "çevir"
 * diyebilir.
 *
 * Çeviriler burada toplanıp TEK istekte gönderilir: bir akış sayfasında kayıt
 * başına ayrı istek atmak onlarca çağrı demek olurdu.
 */
const Ctx = createContext(null);

export function ContentTranslationProvider({ children }) {
  const { user, hydrated } = useAuth();
  const { i18n } = useTranslation();
  const [durum, setDurum] = useState(null);      // {available, enabled, language, messages_allowed}
  const [ceviriler, setCeviriler] = useState({}); // key → {text, translated}

  // Aynı metni iki kez istemeyi önler (bir gönderi listede birden fazla yerde olabilir).
  const istenenler = useRef(new Set());
  const kuyruk = useRef([]);
  // Bütçe yüzünden atlanan kayıtların deneme sayısı (sonsuz döngü koruması).
  const denemeler = useRef(new Map());
  const zamanlayici = useRef(null);

  // Durumun en son hangi kullanıcı için sorulduğu.
  const sorulanKullanici = useRef(Symbol('henüz sorulmadı'));

  useEffect(() => {
    // Oturum bilgisi yerleşene kadar bekle.
    //
    // Açılışta kullanıcı birkaç ara durumdan geçiyor (bilinmiyor → misafir →
    // giriş yapılmışsa kullanıcı). Efekt yalnızca user.id'ye bağlıyken bu
    // geçişlerin her biri yeni bir istek üretiyordu: tek sayfa açılışında
    // aynı uca beş çağrı gidiyordu.
    if (!hydrated) return;

    const kimlik = user?.id ?? null;
    if (sorulanKullanici.current === kimlik) return; // aynı kullanıcı, tekrar sorma
    sorulanKullanici.current = kimlik;

    let iptal = false;
    contentTranslationAPI.status()
      .then((r) => { if (!iptal) setDurum(r?.data || r); })
      .catch(() => { if (!iptal) setDurum({ available: false, enabled: false }); });
    return () => { iptal = true; };
  }, [hydrated, user?.id]);

  /**
   * Durumu sunucudan yeniden okur.
   *
   * Gerekli, çünkü yukarıdaki efekt kullanıcı başına YALNIZCA BİR KEZ
   * çalışıyor (aynı uca beş çağrı gitmesini önlemek için). Kullanıcı
   * profilden "gönderileri dilimde göster" anahtarını açtığında sunucuya
   * kaydediliyor ama buradaki kopya eski kalıyordu: akış çevrilmemiş
   * görünüyor, ayarın hiçbir etkisi yokmuş gibi duruyordu. Ancak sayfa
   * tamamen yenilenince düzeliyordu.
   */
  const yenile = useCallback(async () => {
    try {
      const r = await contentTranslationAPI.status();
      setDurum(r?.data || r);
    } catch {
      // Sessiz: ayar zaten kaydedildi, yalnızca yerel kopya tazelenemedi.
    }
  }, []);

  const acik = Boolean(durum?.available && durum?.enabled);

  /**
   * Çevirinin HEDEF dili — kullanıcının o an OKUDUĞU dil.
   *
   * Eskiden sunucudaki `preferred_language` kopyası kullanılıyordu. Başlıktaki
   * dil seçici o sütunu yazmıyor (yalnız profil ve CRM ayarları yazıyor), yani
   * Almancaya geçen bir kullanıcının sunucudaki dili `tr` kalıyordu. Hedef `tr`
   * olunca Türkçe gönderi Türkçeye "çevriliyor" ve metin AYNEN dönüyordu:
   * arayüz Almanca, gönderiler Türkçe. Ölçüldü —
   *   hedef tr → "Robotik kalp cerrahisinde yeni bir çağ başlıyor" (değişmedi)
   *   hedef de → "Eine neue Ära in der robotergestützten Herzchirurgie beginnt"
   * Hata sessizdi: istek başarılı, çeviri "yapıldı", sonuç aynı metin.
   */
  const hedefDil = ((i18n?.language || durum?.language || 'en').split('-')[0]);

  // Dil değişince eldeki çeviriler başka bir dile ait: temizlenmezse kullanıcı
  // Fransızcaya geçtiğinde ekranda Almanca metin kalır.
  useEffect(() => {
    setCeviriler({});
    istenenler.current = new Set();
    kuyruk.current = [];
    denemeler.current = new Map();
  }, [hedefDil]);

  /**
   * Kuyruğu boşaltır. Kısa bir gecikmeyle çalışır ki aynı anda görünen
   * kayıtlar tek istekte toplansın.
   */
  const kuyrugaEkle = useCallback((kayit) => {
    if (!acik) return;

    // `null` = "yeni kayıt yok, yalnızca bekleyen kuyruğu boşalt".
    if (kayit) {
      if (istenenler.current.has(kayit.key)) return;
      istenenler.current.add(kayit.key);
      kuyruk.current.push(kayit);
    }

    if (zamanlayici.current) return;
    zamanlayici.current = setTimeout(async () => {
      const gonderilecek = kuyruk.current.splice(0, 50);
      zamanlayici.current = null;
      if (!gonderilecek.length) return;

      try {
        const r = await contentTranslationAPI.batch(gonderilecek, hedefDil);
        const gelen = (r?.data || r)?.items || {};

        // Sunucunun SÜRE BÜTÇESİ dolduğunda kalan kayıtlar çevrilmeden,
        // `reason: "budget"` ile dönüyor. Onları önbelleğe yazmak, bir daha
        // hiç istenmemeleri demek olurdu: kullanıcı sayfayı yenileyene kadar
        // yarı çevrilmiş bir akışla kalırdı. Yazmıyoruz ve işaretini
        // kaldırıyoruz ki sonraki turda yeniden sıraya girsinler.
        const saklanacak = {};
        const yenidenDenenecek = [];

        for (const kayit of gonderilecek) {
          const sonuc = gelen[kayit.key];
          if (!sonuc) continue;

          if (sonuc.reason === 'budget') {
            yenidenDenenecek.push(kayit);
            continue;
          }

          saklanacak[kayit.key] = sonuc;
        }

        if (Object.keys(saklanacak).length) {
          setCeviriler((onceki) => ({ ...onceki, ...saklanacak }));
        }

        // Sonsuz döngü olmasın: sunucu sürekli yavaşsa birkaç denemeden
        // sonra bırakılıyor ve içerik özgün dilinde kalıyor.
        for (const kayit of yenidenDenenecek) {
          const deneme = (denemeler.current.get(kayit.key) || 0) + 1;
          denemeler.current.set(kayit.key, deneme);

          if (deneme < 3) {
            istenenler.current.delete(kayit.key);
          }
        }
      } catch {
        // Çeviri bir kolaylık; başarısızlığı içeriği gizlemeye dönüşmemeli.
        gonderilecek.forEach((k) => istenenler.current.delete(k.key));
      }

      // Bir turda en fazla 50 kayıt gidiyor; artanlar için yeni tur planla.
      // Yoksa 50'den fazla kayıtta kalanlar kuyrukta sonsuza kadar beklerdi.
      if (kuyruk.current.length && !zamanlayici.current) {
        kuyrugaEkleRef.current?.(null);
      }
    }, 120);
  }, [acik, hedefDil]);

  // Kendini yeniden tetikleyebilmesi için (yukarıdaki artan-kuyruk turu).
  const kuyrugaEkleRef = useRef(null);
  kuyrugaEkleRef.current = kuyrugaEkle;

  /**
   * Bir metnin gösterilecek hâli.
   * @returns {{text: string, translated: boolean}}
   */
  const metin = useCallback((key, ozgunMetin, kind = 'post', lang = null) => {
    if (!acik || !ozgunMetin) return { text: ozgunMetin, translated: false };

    // Özel mesajlar yalnızca çeviri kendi sunucumuzda yapılıyorsa çevrilir.
    if (kind === 'message' && !durum?.messages_allowed) {
      return { text: ozgunMetin, translated: false };
    }

    const hazir = ceviriler[key];
    if (hazir) return { text: hazir.text, translated: !!hazir.translated };

    kuyrugaEkle({ key, text: ozgunMetin, kind, lang });
    return { text: ozgunMetin, translated: false };
  }, [acik, ceviriler, durum?.messages_allowed, kuyrugaEkle]);

  const deger = useMemo(() => ({
    acik,
    durum,
    metin,
    yenile,
    dil: hedefDil,
    mesajlarCevrilebilir: Boolean(durum?.messages_allowed),
  }), [acik, durum, hedefDil, metin, yenile]);

  return <Ctx.Provider value={deger}>{children}</Ctx.Provider>;
}

export function useContentTranslation() {
  return useContext(Ctx) || {
    acik: false,
    durum: null,
    metin: (_k, m) => ({ text: m, translated: false }),
    yenile: () => {},
    dil: 'en',
    mesajlarCevrilebilir: false,
  };
}
