import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { patientBillingAPI } from '../lib/api';
import {
  Receipt, Loader2, Download, X, Calendar, AlertCircle, ChevronRight,
} from 'lucide-react';

/**
 * Hastanın kendi faturaları.
 *
 * Salt okunur: fatura klinik tarafında kesilir, hasta yalnızca görür ve
 * indirir. "Şimdi öde" düğmesi bilerek yok — platformda tahsilat altyapısı
 * yok, ödeme klinikte alınıyor; çalışmayan bir düğme koymak yerine durum
 * rozeti gösteriliyor.
 */

const paraBicimi = (tutar, kur = 'EUR', dil = 'tr-TR') => {
  const sayi = Number(tutar || 0);
  try {
    return new Intl.NumberFormat(dil, { style: 'currency', currency: kur }).format(sayi);
  } catch {
    return `${sayi.toFixed(2)} ${kur}`;
  }
};

const tarihBicimi = (deger, dil = 'tr-TR') => {
  if (!deger) return '—';
  const d = new Date(deger);
  return Number.isNaN(d.getTime()) ? String(deger) : d.toLocaleDateString(dil, { day: '2-digit', month: 'long', year: 'numeric' });
};

const DurumRozeti = ({ durum, gecikmis, t }) => {
  // Gecikme sunucuda ayrı bir durum değil: vadesi geçmiş ve ödenmemiş fatura
  // hasta için farklı bir şey ifade ediyor, o yüzden ayrı gösteriliyor.
  const anahtar = gecikmis && durum !== 'paid' && durum !== 'cancelled' ? 'overdue' : durum;
  const stiller = {
    paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial:   'bg-blue-50 text-blue-700 border-blue-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    overdue:   'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const yazilar = {
    paid:      t('invoices.status.paid', 'Ödendi'),
    partial:   t('invoices.status.partial', 'Kısmi ödendi'),
    pending:   t('invoices.status.pending', 'Ödeme bekliyor'),
    overdue:   t('invoices.status.overdue', 'Gecikmiş'),
    cancelled: t('invoices.status.cancelled', 'İptal edildi'),
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${stiller[anahtar] || stiller.pending}`}>
      {yazilar[anahtar] || anahtar}
    </span>
  );
};

export default function PatientInvoices() {
  const { t, i18n } = useTranslation();
  const { notify } = useToast();
  const isTr = i18n.language?.startsWith('tr');
  const dil = isTr ? 'tr-TR' : 'en-US';

  const [faturalar, setFaturalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [secili, setSecili] = useState(null);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);
  const [indiriliyor, setIndiriliyor] = useState(null);

  const getir = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const yanit = await patientBillingAPI.invoices({ per_page: 50 });
      setFaturalar(yanit?.data ?? yanit?.data?.data ?? []);
    } catch (e) {
      setHata(e?.data?.message || e?.message || t('invoices.loadFailed', 'Faturalar yüklenemedi.'));
    } finally {
      setYukleniyor(false);
    }
  }, [t]);

  useEffect(() => { getir(); }, [getir]);

  const detayAc = async (fatura) => {
    setSecili(fatura);
    setDetayYukleniyor(true);
    try {
      const tam = await patientBillingAPI.getInvoice(fatura.id);
      setSecili(tam?.data ?? tam);
    } catch {
      // Listedeki özet zaten ekranda; detay gelmezse onunla devam edilir.
    } finally {
      setDetayYukleniyor(false);
    }
  };

  const pdfIndir = async (fatura) => {
    setIndiriliyor(fatura.id);
    try {
      const blob = await patientBillingAPI.invoicePdf(fatura.id);
      const adres = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' }));
      const bag = document.createElement('a');
      bag.href = adres;
      bag.download = `${fatura.invoice_number || 'fatura'}.pdf`;
      document.body.appendChild(bag);
      bag.click();
      document.body.removeChild(bag);
      URL.revokeObjectURL(adres);
    } catch {
      notify?.(t('invoices.downloadFailed', 'Fatura indirilemedi, tekrar deneyin.'), 'error');
    } finally {
      setIndiriliyor(null);
    }
  };

  const gecikmisMi = (f) => !!f.due_date && new Date(f.due_date) < new Date() && f.status !== 'paid' && f.status !== 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">{t('invoices.title', 'Faturalarım')}</h1>

      {yukleniyor && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!yukleniyor && hata && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            {hata}
            <button onClick={getir} className="ml-2 underline font-medium">{t('common.retry', 'Tekrar dene')}</button>
          </div>
        </div>
      )}

      {!yukleniyor && !hata && faturalar.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">{t('invoices.empty', 'Henüz faturanız yok.')}</p>
        </div>
      )}

      {!yukleniyor && !hata && faturalar.length > 0 && (
        <div className="space-y-2.5">
          {faturalar.map((f) => (
            <button
              key={f.id}
              onClick={() => detayAc(f)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Receipt className="w-4.5 h-4.5 text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{f.invoice_number}</span>
                  <DurumRozeti durum={f.status} gecikmis={gecikmisMi(f)} t={t} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {tarihBicimi(f.issue_date, dil)}
                  {f.doctor?.fullname && <span className="truncate">· {f.doctor.fullname}</span>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 tabular-nums">{paraBicimi(f.grand_total, f.currency, dil)}</p>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* ── Detay ── */}
      {secili && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSecili(null)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[88vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900">{secili.invoice_number}</p>
                <div className="mt-1.5">
                  <DurumRozeti durum={secili.status} gecikmis={gecikmisMi(secili)} t={t} />
                </div>
              </div>
              <button onClick={() => setSecili(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">{t('invoices.issueDate', 'Düzenlenme')}</dt>
                  <dd className="font-medium text-gray-900">{tarihBicimi(secili.issue_date, dil)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">{t('invoices.dueDate', 'Son ödeme')}</dt>
                  <dd className="font-medium text-gray-900">{tarihBicimi(secili.due_date, dil)}</dd>
                </div>
                {secili.doctor?.fullname && (
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-500">{t('invoices.doctor', 'Doktor')}</dt>
                    <dd className="font-medium text-gray-900">{secili.doctor.fullname}</dd>
                  </div>
                )}
              </dl>

              {detayYukleniyor && (
                <div className="flex justify-center py-4 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}

              {Array.isArray(secili.items) && secili.items.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {secili.items.map((k, i) => (
                    <div key={k.id || i} className={`flex items-start justify-between gap-4 px-4 py-3 text-sm ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="min-w-0">
                        <p className="text-gray-900">{k.description}</p>
                        {Number(k.quantity) > 1 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {k.quantity} × {paraBicimi(k.unit_price, secili.currency, dil)}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 tabular-nums shrink-0">
                        {paraBicimi(k.total_price, secili.currency, dil)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 text-sm">
                {Number(secili.discount_amount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('invoices.discount', 'İndirim')}</span>
                    <span className="tabular-nums">−{paraBicimi(secili.discount_amount, secili.currency, dil)}</span>
                  </div>
                )}
                {Number(secili.tax_amount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('invoices.tax', 'Vergi')}</span>
                    <span className="tabular-nums">{paraBicimi(secili.tax_amount, secili.currency, dil)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-100">
                  <span>{t('invoices.total', 'Toplam')}</span>
                  <span className="tabular-nums">{paraBicimi(secili.grand_total, secili.currency, dil)}</span>
                </div>
                {Number(secili.paid_amount) > 0 && Number(secili.paid_amount) < Number(secili.grand_total) && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('invoices.paid', 'Ödenen')}</span>
                    <span className="tabular-nums">{paraBicimi(secili.paid_amount, secili.currency, dil)}</span>
                  </div>
                )}
              </div>

              {/* Ödeme klinikte alınıyor; hastanın nereye başvuracağı yazılı olmalı. */}
              {secili.status !== 'paid' && secili.status !== 'cancelled' && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
                  {t('invoices.payAtClinic', 'Ödemeler klinik tarafından alınır. Ödeme için kliniğinizle iletişime geçin.')}
                </p>
              )}

              <button
                onClick={() => pdfIndir(secili)}
                disabled={indiriliyor === secili.id}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
              >
                {indiriliyor === secili.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
                {t('invoices.downloadPdf', 'PDF indir')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
