import React, { useState } from 'react';
import {
  Plug, Settings, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
  ChevronRight, ExternalLink, Key, Shield, Activity, Wifi, WifiOff,
  FileText, CreditCard, Stethoscope, Building2, Pill, Receipt,
  Eye, EyeOff, Save, TestTube, History, X, Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Integration Definitions ─────────────────────────────────
const INTEGRATIONS = [
  {
    id: 'enabiz',
    name: 'E-Nabız',
    provider: 'T.C. Sağlık Bakanlığı',
    description: 'Merkezi Sağlık Veri Sistemi — Hasta kayıtları, teşhis, tedavi, laboratuvar sonuçları ve aşı bilgilerinin Sağlık Bakanlığı ile senkronizasyonu.',
    icon: Activity,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    status: 'connected',
    lastSync: '2026-02-16 14:32',
    syncCount: 1284,
    required: true,
    features: ['Patient health records sync', 'Diagnosis & treatment upload', 'Lab results integration', 'Vaccination records', 'Prescription history'],
    fields: [
      { key: 'facility_code', label: 'Facility Code (Tesis Kodu)', type: 'text', value: 'TSM-34-001', required: true },
      { key: 'doctor_id', label: 'Doctor ID (Hekim TC)', type: 'text', value: '•••••••••42', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', value: 'enb_sk_••••••••••••', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', value: 'enb_ss_••••••••••••', required: true },
      { key: 'environment', label: 'Environment', type: 'select', value: 'production', options: ['test', 'production'], required: true },
    ],
  },
  {
    id: 'medula',
    name: 'Medula (SGK)',
    provider: 'Sosyal Güvenlik Kurumu',
    description: 'SGK Provizyon Sistemi — Hasta provizyon sorgulama, fatura gönderimi, hak ediş takibi ve sigorta kapsamı kontrolü.',
    icon: Shield,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    status: 'connected',
    lastSync: '2026-02-16 14:28',
    syncCount: 856,
    required: true,
    features: ['Insurance eligibility check', 'Provision query (Provizyon)', 'Invoice submission (Fatura)', 'Claim tracking (Hak Ediş)', 'Drug approval (İlaç Onay)'],
    fields: [
      { key: 'username', label: 'Medula Username', type: 'text', value: 'medgama_clinic', required: true },
      { key: 'password', label: 'Medula Password', type: 'password', value: '••••••••', required: true },
      { key: 'facility_code', label: 'SGK Facility Code', type: 'text', value: '34-01-0042', required: true },
      { key: 'branch_code', label: 'Branch Code (Branş Kodu)', type: 'text', value: '4400', required: true },
      { key: 'wsdl_url', label: 'WSDL Endpoint', type: 'text', value: 'https://medula.sgk.gov.tr/...', required: true },
    ],
  },
  {
    id: 'erecete',
    name: 'E-Reçete (İTS)',
    provider: 'İlaç Takip Sistemi',
    description: 'Elektronik Reçete Sistemi — Reçete oluşturma, ilaç etkileşim kontrolü, reçete geçmişi sorgulama ve İTS entegrasyonu.',
    icon: Pill,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    status: 'connected',
    lastSync: '2026-02-16 14:30',
    syncCount: 432,
    required: true,
    features: ['Electronic prescription creation', 'Drug interaction check', 'Prescription history query', 'ITS barcode tracking', 'Controlled substance management'],
    fields: [
      { key: 'doctor_diploma', label: 'Diploma No', type: 'text', value: '12345', required: true },
      { key: 'doctor_tc', label: 'Doctor TC No', type: 'text', value: '•••••••••42', required: true },
      { key: 'api_key', label: 'E-Reçete API Key', type: 'password', value: 'erc_••••••••••••', required: true },
      { key: 'certificate', label: 'Digital Certificate (.pfx)', type: 'file', value: 'dr_ahmet_cert.pfx', required: true },
      { key: 'cert_password', label: 'Certificate Password', type: 'password', value: '••••••••', required: true },
    ],
  },
  {
    id: 'mhrs',
    name: 'MHRS',
    provider: 'Merkezi Hekim Randevu Sistemi',
    description: 'Online randevu yönetimi — MHRS üzerinden gelen randevuların otomatik senkronizasyonu ve müsaitlik bilgisi paylaşımı.',
    icon: Clock,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
    status: 'warning',
    lastSync: '2026-02-16 12:15',
    syncCount: 198,
    required: false,
    statusMessage: 'Sync delayed — last attempt failed. Retrying...',
    features: ['Appointment sync from MHRS', 'Availability publishing', 'Cancellation sync', 'Patient info auto-fill', 'Slot management'],
    fields: [
      { key: 'mhrs_username', label: 'MHRS Username', type: 'text', value: 'dr.ahmet', required: true },
      { key: 'mhrs_password', label: 'MHRS Password', type: 'password', value: '••••••••', required: true },
      { key: 'clinic_id', label: 'MHRS Clinic ID', type: 'text', value: 'MHRS-34-0042', required: true },
      { key: 'sync_interval', label: 'Sync Interval', type: 'select', value: '15min', options: ['5min', '15min', '30min', '1hour'], required: false },
    ],
  },
  {
    id: 'efatura',
    name: 'E-Fatura (GİB)',
    provider: 'Gelir İdaresi Başkanlığı',
    description: 'Elektronik Fatura Sistemi — E-Fatura ve E-Arşiv fatura oluşturma, GİB\'e gönderim ve fatura takibi.',
    icon: Receipt,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    status: 'disconnected',
    lastSync: null,
    syncCount: 0,
    required: true,
    features: ['E-Invoice creation', 'E-Archive invoice', 'GİB submission', 'Invoice tracking', 'Tax calculation'],
    fields: [
      { key: 'tax_id', label: 'Tax ID (Vergi No)', type: 'text', value: '', required: true },
      { key: 'tax_office', label: 'Tax Office (Vergi Dairesi)', type: 'text', value: '', required: true },
      { key: 'gib_username', label: 'GİB Portal Username', type: 'text', value: '', required: true },
      { key: 'gib_password', label: 'GİB Portal Password', type: 'password', value: '', required: true },
      { key: 'integrator', label: 'E-Fatura Integrator', type: 'select', value: '', options: ['Foriba', 'Logo', 'Uyumsoft', 'Paraşüt', 'Bizim Hesap'], required: true },
      { key: 'integrator_key', label: 'Integrator API Key', type: 'password', value: '', required: true },
    ],
  },
];

// ─── Sub-components ──────────────────────────────────────────
const StatusIndicator = ({ status }) => {
  const config = {
    connected: { label: 'Connected', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    warning: { label: 'Warning', icon: AlertTriangle, className: 'text-amber-600 bg-amber-50 border-amber-200' },
    disconnected: { label: 'Disconnected', icon: XCircle, className: 'text-red-600 bg-red-50 border-red-200' },
    syncing: { label: 'Syncing...', icon: RefreshCw, className: 'text-blue-600 bg-blue-50 border-blue-200' },
  };
  const c = config[status] || config.disconnected;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.className}`}>
      <c.icon className={`w-3 h-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
      {c.label}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CRMIntegrations = () => {
  const { t } = useTranslation();
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  const connectedCount = INTEGRATIONS.filter(i => i.status === 'connected').length;
  const warningCount = INTEGRATIONS.filter(i => i.status === 'warning').length;
  const disconnectedCount = INTEGRATIONS.filter(i => i.status === 'disconnected').length;

  const togglePassword = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenDetail = (integration) => {
    setSelectedIntegration(integration);
    setActiveDetailTab('overview');
    setShowPasswords({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage connections to government health systems and services</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Sync All
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-700">{connectedCount}</p>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Connected</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-lg font-bold text-amber-700">{warningCount}</p>
          </div>
          <p className="text-[11px] text-amber-600 font-medium">Warning</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <p className="text-lg font-bold text-red-700">{disconnectedCount}</p>
          </div>
          <p className="text-[11px] text-red-600 font-medium">Disconnected</p>
        </div>
      </div>

      {/* GDPR/KVKK Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-blue-800">Data Processing Notice (KVKK / GDPR)</p>
          <p className="text-[11px] text-blue-600 leading-relaxed mt-0.5">
            All integrations process personal health data in compliance with KVKK (Law No. 6698) and GDPR regulations.
            Data is encrypted in transit (TLS 1.3) and at rest (AES-256). API credentials are stored securely and never exposed in logs.
          </p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
              integration.status === 'disconnected' ? 'border-red-200/60' :
              integration.status === 'warning' ? 'border-amber-200/60' :
              'border-gray-200/60'
            }`}
            onClick={() => handleOpenDetail(integration)}
          >
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                <integration.icon className="w-6 h-6" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{integration.name}</h3>
                  {integration.required && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200 uppercase">Required</span>
                  )}
                  <StatusIndicator status={integration.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{integration.provider}</p>
                {integration.statusMessage && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {integration.statusMessage}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden sm:block text-right flex-shrink-0">
                {integration.lastSync ? (
                  <>
                    <p className="text-xs text-gray-500">Last sync</p>
                    <p className="text-[11px] font-medium text-gray-700">{integration.lastSync}</p>
                    <p className="text-[10px] text-gray-400">{integration.syncCount.toLocaleString()} records</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">Not configured</p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Detail Modal ─── */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedIntegration.color} flex items-center justify-center text-white`}>
                  <selectedIntegration.icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{selectedIntegration.name}</h2>
                  <p className="text-xs text-gray-500">{selectedIntegration.provider}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status={selectedIntegration.status} />
                <button onClick={() => setSelectedIntegration(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'credentials', label: 'Credentials' },
                { key: 'logs', label: 'Sync Logs' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveDetailTab(tab.key)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeDetailTab === tab.key
                      ? 'border-teal-500 text-teal-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="px-6 py-5">
              {/* Overview Tab */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedIntegration.description}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedIntegration.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedIntegration.lastSync && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">Last Sync</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedIntegration.lastSync}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">Total Records</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedIntegration.syncCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">Status</p>
                        <p className={`text-sm font-semibold mt-0.5 capitalize ${
                          selectedIntegration.status === 'connected' ? 'text-emerald-600' :
                          selectedIntegration.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                        }`}>{selectedIntegration.status}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Credentials Tab */}
              {activeDetailTab === 'credentials' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700">Credentials are encrypted and stored securely. Changes require admin authorization.</p>
                  </div>

                  {selectedIntegration.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          defaultValue={field.value}
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          {field.value === '' && <option value="">Select...</option>}
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'file' ? (
                        <div className="flex items-center gap-2">
                          <input type="text" readOnly value={field.value || 'No file selected'} className="flex-1 h-10 px-3 border border-gray-300 rounded-xl text-sm bg-gray-50 text-gray-600" />
                          <button className="px-3 h-10 border border-gray-300 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50">Browse</button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                            defaultValue={field.value}
                            className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder={field.label}
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => togglePassword(field.key)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords[field.key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sync Logs Tab */}
              {activeDetailTab === 'logs' && (
                <div className="space-y-3">
                  {selectedIntegration.status === 'disconnected' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <WifiOff className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm font-medium">No sync history</p>
                      <p className="text-xs mt-1">Connect this integration to start syncing</p>
                    </div>
                  ) : (
                    <>
                      {[
                        { time: '14:32', status: 'success', message: 'Full sync completed — 12 records updated', records: 12 },
                        { time: '14:00', status: 'success', message: 'Incremental sync — 3 new records', records: 3 },
                        { time: '13:30', status: 'success', message: 'Incremental sync — no changes', records: 0 },
                        { time: '13:00', status: selectedIntegration.status === 'warning' ? 'error' : 'success', message: selectedIntegration.status === 'warning' ? 'Connection timeout — retrying...' : 'Incremental sync — 1 record updated', records: selectedIntegration.status === 'warning' ? 0 : 1 },
                        { time: '12:30', status: 'success', message: 'Incremental sync — 5 records updated', records: 5 },
                        { time: '12:00', status: 'success', message: 'Scheduled sync completed', records: 8 },
                      ].map((log, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            log.status === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700">{log.message}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Today at {log.time} · {log.records} records</p>
                          </div>
                        </div>
                      ))}
                      <button className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-2">
                        <History className="w-3.5 h-3.5" /> View Full History
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <div>
                {selectedIntegration.status === 'connected' && (
                  <button className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                    <WifiOff className="w-3.5 h-3.5" /> Disconnect
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedIntegration.status !== 'disconnected' && (
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5">
                    <TestTube className="w-3.5 h-3.5" /> Test Connection
                  </button>
                )}
                {selectedIntegration.status !== 'disconnected' && (
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Sync Now
                  </button>
                )}
                {activeDetailTab === 'credentials' && (
                  <button className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    {selectedIntegration.status === 'disconnected' ? 'Connect' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMIntegrations;
