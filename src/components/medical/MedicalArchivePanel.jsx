import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { appointmentAPI } from '../../lib/api';
import {
  ShieldCheck, FileText, Download, Loader2, Pill, AlertTriangle,
  Syringe, StickyNote, ChevronDown, ChevronUp,
} from 'lucide-react';

/**
 * Medical Archive paneli (B — otomatik paylaşım).
 * Doktor/klinik randevu kartında hastanın KOMPLE anamnezini görür:
 * durumlar/alerjiler, ilaçlar, aşılar, notlar + belgeler. Ayrı onay yok.
 * Erişim backend'de audit-log'a yazılır.
 */
export default function MedicalArchivePanel({ appointmentId }) {
  const { i18n } = useTranslation();
  const { notify } = useToast();
  const isTr = i18n.language?.startsWith('tr');

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.medicalContext(appointmentId);
      setCtx(res?.data || null);
    } catch {
      notify({ type: 'error', message: isTr ? 'Tıbbi bilgiler yüklenemedi.' : 'Failed to load medical info.' });
    } finally {
      setLoading(false);
    }
  }, [appointmentId, isTr, notify]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !ctx) load();
  };

  const download = async (doc) => {
    setDownloadingId(doc.id);
    try {
      const res = await appointmentAPI.downloadSharedDoc(appointmentId, doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      notify({ type: 'error', message: isTr ? 'Belge indirilemedi.' : 'Failed to download document.' });
    } finally {
      setDownloadingId(null);
    }
  };

  const conditions = ctx?.conditions || [];
  const medications = ctx?.medications || [];
  const vaccinations = ctx?.vaccinations || [];
  const notes = ctx?.notes || '';
  const documents = ctx?.documents || [];
  const isEmpty = ctx && !conditions.length && !medications.length && !vaccinations.length && !notes && !documents.length;

  return (
    <div className="mt-3 border border-teal-100 rounded-xl bg-teal-50/30 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-teal-50/60 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-teal-800">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          {isTr ? 'Hasta Tıbbi Bilgileri (Anamnez)' : 'Patient Medical Info (Anamnesis)'}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-teal-600" /> : <ChevronDown className="w-4 h-4 text-teal-600" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2.5">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
              <Loader2 className="w-4 h-4 animate-spin" /> {isTr ? 'Yükleniyor...' : 'Loading...'}
            </div>
          ) : !ctx ? null : isEmpty ? (
            <p className="text-xs text-gray-400 italic py-1">{isTr ? 'Hastanın kayıtlı tıbbi bilgisi yok.' : 'No medical info on record.'}</p>
          ) : (
            <>
              {conditions.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><b className="text-gray-700">{isTr ? 'Durumlar/Alerjiler:' : 'Conditions/Allergies:'}</b> {conditions.join(', ')}</span>
                </div>
              )}
              {medications.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <Pill className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <span><b className="text-gray-700">{isTr ? 'İlaçlar:' : 'Medications:'}</b> {medications.join(', ')}</span>
                </div>
              )}
              {vaccinations.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <Syringe className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <span><b className="text-gray-700">{isTr ? 'Aşılar:' : 'Vaccinations:'}</b> {vaccinations.join(', ')}</span>
                </div>
              )}
              {notes && (
                <div className="flex items-start gap-2 text-xs">
                  <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><b className="text-gray-700">{isTr ? 'Notlar:' : 'Notes:'}</b> {notes}</span>
                </div>
              )}
              {documents.length > 0 && (
                <div className="space-y-1.5 border-t border-teal-100 pt-2.5">
                  <p className="text-[11px] font-semibold text-gray-500">{isTr ? 'Belgeler' : 'Documents'}</p>
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-2 min-w-0 text-xs text-gray-700">
                        <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </span>
                      <button
                        onClick={() => download(doc)}
                        disabled={downloadingId === doc.id}
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 text-xs font-semibold disabled:opacity-50 flex-shrink-0"
                      >
                        {downloadingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {isTr ? 'İndir' : 'Download'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
