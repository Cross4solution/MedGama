import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp, Download, DollarSign, Receipt, Clock, FileText, Lock,
  FileSpreadsheet, Loader2, AlertCircle, Users, CalendarDays, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ProTeaser from '../../components/crm/ProTeaser';
import { doctorBillingAPI, billingAPI } from '../../lib/api';
import { exportPDF, exportExcel } from '../../utils/exportUtils';

// Reports that need data sources not yet exposed by the backend — shown honestly as "yakında".
const UPCOMING_REPORTS = [
  { title: 'Hasta Demografisi', description: 'Yaş, cinsiyet, lokasyon dağılımı', icon: Users },
  { title: 'Randevu Analitiği', description: 'Randevu trendleri, gelmedi oranları, yoğun saatler', icon: CalendarDays },
  { title: 'Tedavi Sonuçları', description: 'Başarı oranları, takip uyumu, memnuniyet skorları', icon: Activity },
  { title: 'Reçete Analizi', description: 'En çok yazılan ilaçlar, yenileme oranları', icon: FileText },
  { title: 'Operasyonel Verimlilik', description: 'Ortalama bekleme süresi, muayene süresi', icon: Clock },
];

const fmtMoney = (v, cur = 'EUR') => {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n.toLocaleString('tr-TR')} ${cur}`;
  }
};

const CRMReports = () => {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();
  const [period, setPeriod] = useState('month');
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // doctorBillingAPI.stats has no CRM gate (all authenticated doctors); revenue-chart is CRM-gated → optional.
      const statsRes = await doctorBillingAPI.stats();
      setStats(statsRes?.data ?? null);

      try {
        const chartRes = await billingAPI.revenueChart({ period });
        const raw = chartRes?.data?.data ?? chartRes?.data ?? [];
        const series = Array.isArray(raw)
          ? raw.map((p) => ({
              label: p.label ?? p.date ?? p.period ?? '',
              revenue: Number(p.revenue ?? p.total ?? p.amount ?? 0),
            }))
          : [];
        setChart(series);
      } catch {
        setChart([]); // CRM gate / not available — chart stays hidden
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
      setError(t('common.loadError', 'Veriler yüklenirken bir hata oluştu.'));
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [period, t]);

  useEffect(() => {
    if (user?.role_id === 'doctor' && !isPro) return;
    fetchData();
  }, [fetchData, user, isPro]);

  const currency = stats?.currency || 'EUR';

  const kpis = stats ? [
    { label: 'Toplam Gelir', value: fmtMoney(stats.total_revenue, currency), icon: DollarSign },
    { label: 'Bu Ay Gelir', value: fmtMoney(stats.monthly_revenue, currency), icon: TrendingUp },
    { label: 'Bugün Gelir', value: fmtMoney(stats.today_revenue, currency), icon: TrendingUp },
    { label: 'Toplam Fatura', value: String(stats.total_invoices ?? 0), icon: Receipt },
    { label: 'Beklenen Gelir', value: fmtMoney(stats.expected_revenue, currency), icon: Clock },
    { label: 'Tahsil Edilecek', value: fmtMoney(stats.receivable_amount, currency), icon: AlertCircle },
  ] : [];

  const buildExportData = () => ({
    summaryCards: kpis.map((k) => ({ label: k.label, value: k.value })),
    tables: [
      {
        title: 'Gelir & Faturalama Özeti',
        headers: ['Metrik', 'Değer'],
        rows: kpis.map((k) => [k.label, k.value]),
      },
      ...(chart.length ? [{
        title: 'Gelir Grafiği',
        headers: ['Dönem', 'Gelir'],
        rows: chart.map((c) => [c.label, fmtMoney(c.revenue, currency)]),
      }] : []),
    ],
  });

  const handleExportPDF = () => {
    setExporting(true); setExportOpen(false);
    try {
      const { summaryCards, tables } = buildExportData();
      exportPDF({ title: 'Raporlar & Analitik', subtitle: `Dönem: ${period} — ${new Date().toLocaleDateString('tr-TR')}`, summary: summaryCards, tables, filename: `raporlar-${period}-${new Date().toISOString().slice(0, 10)}.pdf` });
    } catch (err) { console.error('PDF Export error:', err); } finally { setExporting(false); }
  };

  const handleExportExcel = () => {
    setExporting(true); setExportOpen(false);
    try {
      const { summaryCards, tables } = buildExportData();
      exportExcel({ title: 'Raporlar & Analitik', summary: summaryCards, tables, filename: `raporlar-${period}-${new Date().toISOString().slice(0, 10)}.xlsx` });
    } catch (err) { console.error('Excel Export error:', err); } finally { setExporting(false); }
  };

  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="reports" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.reports.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {['week', 'month', 'quarter', 'year'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{p}</button>
            ))}
          </div>
          <div className="relative" ref={exportRef}>
            <button onClick={() => setExportOpen((p) => !p)} disabled={exporting || !stats}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('common.export', 'Dışa aktar')}</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-200/60 z-30 overflow-hidden">
                <button onClick={handleExportPDF} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4 text-red-500" /><span className="font-medium">PDF olarak</span>
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /><span className="font-medium">Excel olarak</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 mb-2 animate-spin text-teal-500" />
          <p className="text-sm font-medium">{t('common.loading', 'Yükleniyor...')}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <AlertCircle className="w-10 h-10 mb-2 opacity-60" />
          <p className="text-sm font-medium text-red-500">{error}</p>
          <button onClick={fetchData} className="mt-3 text-xs font-semibold text-teal-600 hover:text-teal-700">{t('common.retry', 'Tekrar dene')}</button>
        </div>
      ) : (
        <>
          {/* Real Billing KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200/60 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <k.icon className="w-4 h-4 text-teal-500 mb-1.5" />
                <p className="text-base sm:text-lg font-bold text-gray-900">{k.value}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart (only if CRM revenue-chart endpoint returned data) */}
          {chart.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-900">{t('crm.reports.revenueTrend', 'Gelir Grafiği')}</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip formatter={(v) => fmtMoney(v, currency)} />
                  <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Upcoming reports — honest "yakında" */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">{t('crm.reports.upcoming', 'Yakında Eklenecek Raporlar')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {UPCOMING_REPORTS.map((r) => (
                <div key={r.title} className="relative bg-white rounded-2xl border border-gray-200/60 p-5 opacity-75">
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase">
                    <Lock className="w-2.5 h-2.5" /> Yakında
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 bg-gray-50 mb-3">
                    <r.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{r.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CRMReports;
