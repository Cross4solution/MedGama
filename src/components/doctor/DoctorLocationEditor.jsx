import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import MapboxSearchInput from '../map/MapboxSearchInput';
import { doctorProfileAPI } from '../../lib/api';

/**
 * DoctorLocationEditor — doktorun kendi konumunu kolayca ayarlaması için.
 * Adres ara → öneri seç → pin otomatik düşer; haritadan sürükleyerek ince ayar.
 * Klinik konum editörüyle aynı UX. Kaydedince map_coordinates + lat/lng persist olur.
 */
export default function DoctorLocationEditor({ address = '', lat, lng, onSaved }) {
  const [addr, setAddr] = useState(address || '');
  const [mLat, setMLat] = useState(lat != null && !isNaN(parseFloat(lat)) ? parseFloat(lat) : 41.0082);
  const [mLng, setMLng] = useState(lng != null && !isNaN(parseFloat(lng)) ? parseFloat(lng) : 28.9784);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Haritadan tıklama/sürükleme ile koordinat güncelle
  useEffect(() => {
    const onMsg = (e) => {
      const d = e?.data;
      if (d && d.type === 'doctor-map-select' && typeof d.lat === 'number' && typeof d.lng === 'number') {
        setMLat(d.lat); setMLng(d.lng);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const save = useCallback(async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await doctorProfileAPI.update({
        address: addr,
        full_address_text: addr,
        map_coordinates: { lat: mLat, lng: mLng },
        latitude: mLat,
        longitude: mLng,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.({ address: addr, latitude: mLat, longitude: mLng, map_coordinates: { lat: mLat, lng: mLng } });
    } catch (err) {
      setError(err?.message || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  }, [addr, mLat, mLng, onSaved]);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
<style>html,body,#map{height:100%;margin:0;padding:0;font-family:sans-serif}.mapboxgl-ctrl-logo{display:none!important}
#coords{position:absolute;bottom:12px;left:12px;z-index:10;background:rgba(255,255,255,0.92);backdrop-filter:blur(6px);border-radius:8px;padding:6px 10px;font-size:11px;color:#374151;box-shadow:0 1px 6px rgba(0,0,0,0.12);border:1px solid #e5e7eb}</style></head>
<body><div id="map"></div><div id="coords">Lat: ${mLat.toFixed(5)} · Lng: ${mLng.toFixed(5)}</div>
<script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
<script>
mapboxgl.accessToken='${token}';
var map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/light-v11',center:[${mLng},${mLat}],zoom:14});
map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right');
var el=document.createElement('div');
el.style.cssText='width:28px;height:28px;border-radius:50%;background:#0d9488;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:grab';
var marker=new mapboxgl.Marker({element:el,draggable:true}).setLngLat([${mLng},${mLat}]).addTo(map);
function report(lat,lng){document.getElementById('coords').textContent='Lat: '+lat.toFixed(5)+' · Lng: '+lng.toFixed(5);try{parent.postMessage({type:'doctor-map-select',lat:lat,lng:lng},'*')}catch(e){}}
map.on('click',function(ev){var ll=ev.lngLat;marker.setLngLat([ll.lng,ll.lat]);report(ll.lat,ll.lng)});
marker.on('dragend',function(){var ll=marker.getLngLat();report(ll.lat,ll.lng)});
</script></body></html>`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Set your location</h4>
        <p className="text-xs text-gray-500 mt-0.5">Search an address, then drag the pin to fine-tune.</p>
      </div>

      <MapboxSearchInput
        value={addr}
        label=""
        placeholder="Type your address, district or city…"
        onChange={(a, coords) => {
          setAddr(a);
          if (coords && typeof coords.lat === 'number') { setMLat(coords.lat); setMLng(coords.lng); }
        }}
      />

      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-teal-700">Click or drag marker to set location</span>
          <span className="text-[11px] text-gray-500 font-mono">{mLat.toFixed(5)}, {mLng.toFixed(5)}</span>
        </div>
        <iframe title="doctor-map" srcDoc={html} className="w-full h-[320px] border-0" />
      </div>

      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-xs text-red-600">{error}</span>}
        {saved && <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
        <button type="button" onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-200/50 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? 'Saving…' : 'Save location'}
        </button>
      </div>
    </div>
  );
}
