import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, Check, Search } from 'lucide-react';
import { catalogAPI, geoAPI } from '../../lib/api';

/**
 * Profil konum seçici (MedStream konum akışı).
 *  • Şehir: aranabilir dropdown → seçilen ŞEHİR ADI koordinata çevrilir, konum güncellenir
 *  • "Konumumu kullan": GPS → doğrudan KENDİ backend'imize kaydedilir
 *
 * UYUM NOTU: Hastanın GPS koordinatı hiçbir 3. tarafa gönderilmez (yalnız kendi
 * backend'imize gider). Şehir seçiminde dışarı çıkan tek veri, kullanıcının
 * kendi seçtiği genel şehir adıdır (kişisel veri değil).
 */
export default function LocationPicker({ onLocated }) {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    catalogAPI.cities()
      .then((res) => {
        if (!alive) return;
        const list = res?.data?.cities || res?.cities || [];
        setCities(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const nameOf = useCallback((c) => {
    const n = c?.name;
    if (!n) return c?.code || '';
    if (typeof n === 'string') return n;
    return n[i18n.language] || n.en || n.tr || Object.values(n)[0] || c.code || '';
  }, [i18n.language]);

  const selected = useMemo(() => cities.find((c) => c.id === cityId) || null, [cities, cityId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term ? cities.filter((c) => nameOf(c).toLowerCase().includes(term)) : cities;
    return list.slice(0, 50);
  }, [cities, q, nameOf]);

  /** Şehir seçimi → şehir adını koordinata çevir → konumu kaydet. */
  const pickCity = useCallback(async (city) => {
    setCityId(city.id);
    setOpen(false);
    setQ('');
    setError('');
    setDone('');
    setBusy(true);
    const label = nameOf(city);
    try {
      const res = await geoAPI.forward(label);
      const hit = res?.data || res || {};
      if (hit.latitude == null || hit.longitude == null) {
        setError(isTr ? 'Şehir konumu bulunamadı.' : 'Could not locate that city.');
        return;
      }
      await geoAPI.saveLocation({
        latitude: hit.latitude,
        longitude: hit.longitude,
        ...(hit.country ? { country: hit.country } : {}),
        ...(hit.state ? { state: hit.state } : {}),
      });
      setDone(label);
      onLocated?.({ lat: hit.latitude, lon: hit.longitude, city: label });
    } catch {
      setError(isTr ? 'Konum güncellenemedi.' : 'Could not update location.');
    } finally {
      setBusy(false);
    }
  }, [nameOf, isTr, onLocated]);

  /** GPS → yalnız kendi backend'imize kaydedilir (3. taraf yok). */
  const useMyLocation = useCallback(() => {
    setError('');
    setDone('');
    if (!navigator?.geolocation) {
      setError(isTr ? 'Tarayıcı konum desteklemiyor.' : 'Geolocation not supported.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await geoAPI.saveLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setCityId(null);
          setDone(isTr ? 'mevcut konumunuz' : 'your current location');
          onLocated?.({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        } catch {
          setError(isTr ? 'Konum kaydedilemedi.' : 'Could not save location.');
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        setError(isTr ? 'Konum izni verilmedi.' : 'Location permission denied.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [isTr, onLocated]);

  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {isTr ? 'Şehir / Konum' : 'City / Location'}
      </label>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={busy}
            className="w-full border border-gray-300 rounded-lg px-3 text-sm bg-white h-10 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow disabled:opacity-60"
          >
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className={`truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
              {selected ? nameOf(selected) : (isTr ? 'Şehir seçin' : 'Select city')}
            </span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={isTr ? 'Ara…' : 'Search…'}
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-gray-400">{isTr ? 'Sonuç yok' : 'No results'}</p>
                  ) : (
                    filtered.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCity(c)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors ${
                          c.id === cityId ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {nameOf(c)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
          {isTr ? 'Konumumu kullan' : 'Use current location'}
        </button>
      </div>

      {done && (
        <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          {isTr ? `Konum güncellendi: ${done}` : `Location updated: ${done}`}
        </p>
      )}
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
      {!done && !error && (
        <p className="mt-1.5 text-[11px] text-gray-400">
          {isTr
            ? 'Yakınınızdaki klinik ve paylaşımları görmek için konumunuzu güncelleyin.'
            : 'Update your location to see nearby clinics and posts.'}
        </p>
      )}
    </div>
  );
}
