import { useEffect, useRef } from 'react';
import { geoAPI } from '../lib/api';

const MANUAL_FLAG = 'auth_manual_login'; // AuthContext.login() set eder
const ASKED_FLAG = 'geo_asked_this_session';

/**
 * MedStream konum akışı — "hassas konum ne zaman sorulsun?" kararı.
 *
 *  • Elle giriş (kullanıcı/şifre)  → HER ZAMAN sor (yeni yer/cihaz olabilir).
 *  • Cookie/otomatik giriş         → her sefer sorma; yalnız IP ülkesi (eyaletli
 *    ülkelerde eyalet) kayıtlı son konumdan FARKLIYSA sor.
 *  • Misafir                       → sorma (ana sayfa IP-ülkesiyle çalışır).
 *
 * Aynı ülke içi şehir değişimi otomatik algılanmaz (kabul edilen davranış);
 * kullanıcı "Konumumu kullan" butonu veya profildeki seçiciyle günceller.
 *
 * @param {object|null} user  oturum açmış kullanıcı (yoksa null)
 * @param {Function} ask      hassas konumu isteyen fonksiyon (askGeo)
 */
export default function useLocationPrompt(user, ask) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (!user?.id || !ask || ranRef.current) return;
    ranRef.current = true;

    let alive = true;

    const alreadyAsked = () => {
      try { return sessionStorage.getItem(ASKED_FLAG) === '1'; } catch { return false; }
    };
    const markAsked = () => {
      try { sessionStorage.setItem(ASKED_FLAG, '1'); } catch {}
    };

    if (alreadyAsked()) return;

    let manual = false;
    try { manual = sessionStorage.getItem(MANUAL_FLAG) === '1'; } catch {}

    // 1) Elle giriş → her zaman sor
    if (manual) {
      markAsked();
      ask();
      return;
    }

    // 2) Cookie/otomatik giriş → ülke/eyalet değiştiyse sor
    geoAPI.check()
      .then((res) => {
        if (!alive) return;
        // Yanıt interceptor'ı gövdeyi açıyor: `res` doğrudan yanıt nesnesi.
        // `res?.data?.should_ask` hep `undefined` idi, yani konum sorusu hiç
        // sorulmuyordu.
        if (res?.should_ask) {
          markAsked();
          ask();
        }
      })
      .catch(() => { /* geo kontrolü başarısızsa sessizce geç, kullanıcıyı rahatsız etme */ });

    return () => { alive = false; };
  }, [user?.id, ask]);
}
