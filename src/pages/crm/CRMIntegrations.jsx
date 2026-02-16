import React, { useState } from 'react';
import {
  Plug, Settings, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
  ChevronRight, ExternalLink, Key, Shield, Activity, Wifi, WifiOff,
  FileText, CreditCard, Stethoscope, Building2, Pill, Receipt,
  Eye, EyeOff, Save, TestTube, History, X, Info, Lock,
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.integrations.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.integrations.subtitle')}</p>
        </div>
        <button disabled className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed opacity-60">
          <RefreshCw className="w-4 h-4" />
          {t('crm.integrations.syncAll')}
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-700">{connectedCount}</p>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">{t('crm.integrations.connected')}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-lg font-bold text-amber-700">{warningCount}</p>
          </div>
          <p className="text-[11px] text-amber-600 font-medium">{t('crm.integrations.warning')}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <p className="text-lg font-bold text-red-700">{disconnectedCount}</p>
          </div>
          <p className="text-[11px] text-red-600 font-medium">{t('crm.integrations.disconnected')}</p>
        </div>
      </div>

      {/* Phase 2 Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Coming Soon — Phase 2</p>
          <p className="text-[11px] text-amber-600 leading-relaxed mt-0.5">
            Integration connections will be available in the next release. Configuration panels are shown for preview purposes only.
          </p>
        </div>
      </div>

      {/* GDPR/KVKK Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-blue-800">{t('crm.integrations.dataProcessingNotice')}</p>
          <p className="text-[11px] text-blue-600 leading-relaxed mt-0.5">
            {t('crm.integrations.dataNotice')}
          </p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.id}
            className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow opacity-75 ${
              'border-gray-200/60'
            }`}
          >
            <div className="absolute top-3 right-12 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase z-10">
              <Lock className="w-2.5 h-2.5" /> Coming Soon
            </div>
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
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200 uppercase">{t('crm.integrations.required')}</span>
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
                    <p className="text-xs text-gray-500">{t('crm.integrations.lastSync')}</p>
                    <p className="text-[11px] font-medium text-gray-700">{integration.lastSync}</p>
                    <p className="text-[10px] text-gray-400">{integration.syncCount.toLocaleString()} records</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">{t('crm.integrations.notConfigured')}</p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRMIntegrations;
