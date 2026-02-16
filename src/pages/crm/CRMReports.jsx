import React, { useState } from 'react';
import {
  PieChart, BarChart3, TrendingUp, Download, Calendar, Users, DollarSign,
  CalendarDays, Clock, Activity, FileText, ArrowUpRight, Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const REPORT_CARDS = [
  { title: 'Patient Demographics', description: 'Age, gender, location distribution of your patient base', icon: Users, color: 'bg-violet-50 text-violet-600 border-violet-200', stats: '1,284 patients' },
  { title: 'Appointment Analytics', description: 'Appointment trends, no-show rates, peak hours analysis', icon: CalendarDays, color: 'bg-blue-50 text-blue-600 border-blue-200', stats: '342 this month' },
  { title: 'Revenue Report', description: 'Monthly income breakdown, payment methods, outstanding balances', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', stats: '€21.7k this month' },
  { title: 'Treatment Outcomes', description: 'Success rates, follow-up compliance, patient satisfaction scores', icon: Activity, color: 'bg-pink-50 text-pink-600 border-pink-200', stats: '94% satisfaction' },
  { title: 'Prescription Analysis', description: 'Most prescribed medications, renewal rates, drug interactions', icon: FileText, color: 'bg-amber-50 text-amber-600 border-amber-200', stats: '156 active Rx' },
  { title: 'Operational Efficiency', description: 'Average wait times, consultation duration, staff utilization', icon: Clock, color: 'bg-cyan-50 text-cyan-600 border-cyan-200', stats: '18 min avg wait' },
];

const MONTHLY_OVERVIEW = [
  { label: 'Total Appointments', value: '342', change: '+8%', trend: 'up' },
  { label: 'New Patients', value: '47', change: '+15%', trend: 'up' },
  { label: 'No-Show Rate', value: '4.2%', change: '-1.3%', trend: 'down' },
  { label: 'Avg. Consultation', value: '22 min', change: '+2 min', trend: 'up' },
  { label: 'Patient Satisfaction', value: '4.8/5', change: '+0.1', trend: 'up' },
  { label: 'Revenue per Patient', value: '€168', change: '+€12', trend: 'up' },
];

const TOP_DIAGNOSES = [
  { name: 'Hypertension', count: 48, percent: 18 },
  { name: 'Type 2 Diabetes', count: 35, percent: 13 },
  { name: 'Upper Respiratory Infection', count: 28, percent: 10 },
  { name: 'Anxiety/Depression', count: 24, percent: 9 },
  { name: 'Hypothyroidism', count: 19, percent: 7 },
  { name: 'Migraine', count: 16, percent: 6 },
  { name: 'Asthma', count: 14, percent: 5 },
  { name: 'Other', count: 86, percent: 32 },
];

const CRMReports = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('month');

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
          <button className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" /> {t('common.export')}
          </button>
        </div>
      </div>

      {/* Monthly Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {MONTHLY_OVERVIEW.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200/60 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <p className="text-lg sm:text-xl font-bold text-gray-900">{m.value}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{m.label}</p>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-1 ${m.label === 'No-Show Rate' ? (m.trend === 'down' ? 'text-emerald-600' : 'text-red-500') : (m.trend === 'up' ? 'text-emerald-600' : 'text-red-500')}`}>
              {m.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5 rotate-180" />}
              {m.change}
            </span>
          </div>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">{t('crm.reports.availableReports')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_CARDS.map((r) => (
            <div key={r.title} className={`bg-white rounded-2xl border border-gray-200/60 p-5 hover:shadow-md transition-shadow cursor-pointer group`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${r.color}`}>
                  <r.icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{r.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{r.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-teal-600">{r.stats}</span>
                <button className="text-[11px] font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Diagnoses */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">{t('crm.reports.topDiagnoses')}</h2>
          </div>
          <span className="text-xs text-gray-400">{TOP_DIAGNOSES.reduce((s, d) => s + d.count, 0)} {t('crm.reports.totalCases')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOP_DIAGNOSES.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate">{d.name}</span>
                  <span className="text-[11px] font-semibold text-gray-500">{d.count} ({d.percent}%)</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${d.percent}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRMReports;
