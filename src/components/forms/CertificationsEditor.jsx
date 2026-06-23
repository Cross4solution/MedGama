'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorProfileAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

// Reusable certifications/accreditations editor (name + year + optional image).
// value: [{ name, year, image }]; onChange(nextArray).
export default function CertificationsEditor({ value = [], onChange }) {
  const { t } = useTranslation();
  const [uploadingIdx, setUploadingIdx] = useState(-1);
  const certs = Array.isArray(value) ? value : [];

  const update = (i, patch) => onChange(certs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...certs, { name: '', year: '', image: '' }]);
  const remove = (i) => onChange(certs.filter((_, idx) => idx !== i));

  const uploadImage = async (i, file) => {
    if (!file) return;
    setUploadingIdx(i);
    try {
      const res = await doctorProfileAPI.uploadCertificationImage(file);
      const url = res?.url || res?.data?.url;
      if (url) update(i, { image: url });
    } catch (e) { /* ignore — keep row editable */ }
    finally { setUploadingIdx(-1); }
  };

  return (
    <div className="space-y-3">
      {certs.map((c, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50">
          <label className="relative w-16 h-16 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 hover:border-teal-400 transition-colors">
            {c.image ? (
              <img src={resolveStorageUrl(c.image)} alt="" className="w-full h-full object-cover" />
            ) : uploadingIdx === i ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
            ) : (
              <Upload className="w-4 h-4 text-gray-400" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(i, e.target.files?.[0])} />
          </label>
          <div className="flex-1 grid grid-cols-3 gap-2">
            <input
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
              placeholder={t('crm.settings.certName', 'Sertifika adı')}
              value={c.name || ''}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
              placeholder={t('crm.settings.certYear', 'Yıl')}
              value={c.year || ''}
              onChange={(e) => update(i, { year: e.target.value })}
            />
          </div>
          <button type="button" onClick={() => remove(i)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700">
        <Plus className="w-4 h-4" /> {t('crm.settings.addCertification', 'Sertifika ekle')}
      </button>
    </div>
  );
}
