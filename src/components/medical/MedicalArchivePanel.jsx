import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { appointmentAPI } from '../../lib/api';
import {
  ShieldCheck, ShieldAlert, Lock, Unlock, FileText, Download,
  Loader2, Pill, AlertTriangle, Syringe, StickyNote, ChevronDown, ChevronUp,
} from 'lucide-react';

/**
 * Hibrit Medical Archive paneli (C).
 * mode="patient"  → hasta bu randevu için tam arşivi paylaşır / geri alır.
 * mode="provider" → doktor/klinik özeti daima, tam detayı yalnız aktif rızayla görür.
 */
export default function MedicalArchivePanel({ appointmentId, mode = 'provider' }) {
  const { i18n } = useTranslation();
  const { notify } = useToast();
  const isTr = i18n.language?.startsWith('tr');

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [acting, setActing] = useState(false);
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

  const share = async () => {
    setActing(true);
    try {
      await appointmentAPI.shareMedical(appointmentId);
      await load();
      notify({ type: 'success', message: isTr ? 'Arşiv bu randevu için paylaşıldı.' : 'Archive shared for this appointment.' });
    } catch {
      notify({ type: 'error', message: isTr ? 'Paylaşım başarısız.' : 'Sharing failed.' });
    } finally {
      setActing(false);
    }
  };

  const revoke = async () => {
    setActing(true);
    try {
      await appointmentAPI.revokeMedical(appointmentId);
      await load();
      notify({ type: 'success', message: isTr ? 'Paylaşım geri alındı.' : 'Sharing revoked.' });
    } catch {
      notify({ type: 'error', message: isTr ? 'Geri alma başarısız.' : 'Revoke failed.' });
    } finally {
      setActing(false);
    }
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

  const summary = ctx?.summary;
  const full = ctx?.full;
  const hasConsent = !!ctx?.has_full_consent;
  const hasSummary = summary && ((summary.conditions?.length || 0) + (summary.medications?.length || 0)) > 0;

  return (
    <div className="mt-3 border border-teal-100 rounded-xl bg-teal-50/30 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-teal-50/60 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-teal-800">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          {mode === 'patient'
            ? (isTr ? 'Tıbbi Arşiv Paylaşımı' : 'Medical Archive Sharing')
            : (isTr ? 'Hasta Tıbbi Bilgileri' : 'Patient Medical Info')}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-teal-600" /> : <ChevronDown className="w-4 h-4 text-teal-600" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
              <Loader2 className="w-4 h-4 animate-spin" /> {isTr ? 'Yükleniyor...' : 'Loading...'}
            </div>
          ) : !ctx ? null : (
            <>
              {/* ── Özet (daima görünür) ── */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {isTr ? 'Özet (otomatik)' : 'Summary (automatic)'}
                </p>
                {!hasSummary ? (
                  <p className="text-xs text-gray-400 italic">{isTr ? 'Kayıtlı özet bilgi yok.' : 'No summary info on record.'}</p>
                ) : (
                  <div className="space-y-1.5">
                    {summary.conditions?.length > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span><b className="text-gray-700">{isTr ? 'Durumlar/Alerjiler:' : 'Conditions/Allergies:'}</b> {summary.conditions.join(', ')}</span>
                      </div>
                    )}
                    {summary.medications?.length > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <Pill className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                        <span><b className="text-gray-700">{isTr ? 'İlaçlar:' : 'Medications:'}</b> {summary.medications.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Rıza durumu ── */}
              <div className={`flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 ${hasConsent ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {hasConsent ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {hasConsent
                  ? (isTr ? 'Tam arşiv bu randevu için paylaşıldı.' : 'Full archive shared for this appointment.')
                  : (isTr ? 'Tam arşiv paylaşılmadı — yalnız özet görünür.' : 'Full archive not shared — summary only.')}
              </div>

              {/* ── Hasta kontrolleri ── */}
              {mode === 'patient' && (
                hasConsent ? (
                  <button
                    onClick={revoke}
                    disabled={acting}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    {isTr ? 'Paylaşımı Geri Al' : 'Revoke Sharing'}
                  </button>
                ) : (
                  <button
                    onClick={share}
                    disabled={acting}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-all disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {isTr ? 'Bu Randevu İçin Arşivimi Paylaş' : 'Share My Archive For This Appointment'}
                  </button>
                )
              )}
              {mode === 'patient' && !hasConsent && (
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isTr
                    ? 'Aşılar, notlar ve belgeleriniz yalnız siz onay verdiğinizde görünür. İstediğiniz an geri alabilirsiniz; her erişim kaydedilir.'
                    : 'Vaccinations, notes and documents are shown only with your consent. You can revoke anytime; every access is logged.'}
                </p>
              )}

              {/* ── Tam detay (rıza varsa) ── */}
              {full && (
                <div className="space-y-2.5 border-t border-teal-100 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    {isTr ? 'Tam Detay' : 'Full Detail'}
                  </p>
                  {full.vaccinations?.length > 0 && (
                    <div className="flex items-start gap-2 text-xs">
                      <Syringe className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                      <span><b className="text-gray-700">{isTr ? 'Aşılar:' : 'Vaccinations:'}</b> {full.vaccinations.join(', ')}</span>
                    </div>
                  )}
                  {full.notes && (
                    <div className="flex items-start gap-2 text-xs">
                      <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span><b className="text-gray-700">{isTr ? 'Notlar:' : 'Notes:'}</b> {full.notes}</span>
                    </div>
                  )}
                  {full.documents?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-gray-500">{isTr ? 'Belgeler' : 'Documents'}</p>
                      {full.documents.map((doc) => (
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
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
