import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Phone, MapPin, Calendar, AlertCircle,
  FileText, X, ChevronDown, Clock, Loader2,
  Stethoscope, Pill, Activity, Download, Eye, Plus, ArrowLeft,
  Image, File, Tag, Layers, CalendarPlus, Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { patientAPI, clinicVerificationAPI } from '../../lib/api';
import ClinicVerificationModal from '../../components/crm/ClinicVerificationModal';
import ProTeaser from '../../components/crm/ProTeaser';

// ─── Helpers ─────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

// ─── Config ──────────────────────────────────────────────────
const TIMELINE_CFG = {
  appointment: { color: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-200', icon: Calendar, label: 'Appointment' },
  examination: { color: '#8B5CF6', bg: 'bg-violet-50', border: 'border-violet-200', icon: Stethoscope, label: 'Examination' },
  document:    { color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FileText, label: 'Document' },
};
const FILE_CFG = {
  labResult: { icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
  report:    { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  scan:      { icon: Image, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  other:     { icon: File, color: 'text-gray-600', bg: 'bg-gray-50' },
};
const TAG_COLORS = [
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
];
const tagColor = (tag) => {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
};
const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  no_show: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Sub-components ──────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

const TimelineCard = ({ entry, isLast, t }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIMELINE_CFG[entry.type] || TIMELINE_CFG.appointment;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.border} border`}>
          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-5">
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 text-left">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900">{entry.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} border`} style={{ color: cfg.color }}>{cfg.label}</span>
                {entry.status && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[entry.status] || ''}`}>
                    {entry.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{entry.date}{entry.time ? ` ${entry.time}` : ''}</span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1"><Stethoscope className="w-3 h-3" />{entry.doctor}</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {entry.notes && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('common.notes')}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{entry.notes}</p>
                </div>
              )}
              {entry.icd10_code && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">ICD-10</p>
                  <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded border border-violet-200">{entry.icd10_code}</span>
                </div>
              )}
              {entry.prescriptions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('crm.patient360.prescriptions', 'Prescriptions')}</p>
                  <div className="space-y-1">
                    {entry.prescriptions.map((rx, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-blue-50/50 rounded-lg px-3 py-1.5 border border-blue-100">
                        <Pill className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        {typeof rx === 'object' ? (rx.name || JSON.stringify(rx)) : rx}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {entry.vitals && typeof entry.vitals === 'object' && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('crm.patient360.vitals', 'Vitals')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(entry.vitals).map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-lg px-2.5 py-2 text-center">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">{k}</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{typeof v === 'object' ? JSON.stringify(v) : v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {entry.file_url && (
                <a href={entry.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
                  <Download className="w-3.5 h-3.5" /> View File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const CRMPatient360 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isPro } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id');

  const [patient, setPatient] = useState(null);
  const [tags, setTags] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [visitStats, setVisitStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [timelineFilter, setTimelineFilter] = useState('');
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [addTagValue, setAddTagValue] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  // Clinic verification gating
  const isClinicOwner = user?.role_id === 'clinicOwner';
  const [clinicVerificationStatus, setClinicVerificationStatus] = useState(null);
  const [showClinicVerifyModal, setShowClinicVerifyModal] = useState(false);

  useEffect(() => {
    if (!isClinicOwner) return;
    clinicVerificationAPI.status().then(res => {
      const d = res?.data || res;
      setClinicVerificationStatus(d.verification_status || 'unverified');
    }).catch(() => {});
  }, [isClinicOwner]);

  const clinicNeedsVerification = isClinicOwner && clinicVerificationStatus && clinicVerificationStatus !== 'verified';

  // ── Fetch profile (triggers GDPR audit log on backend) ──
  const fetchProfile = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await patientAPI.get(patientId);
      const d = res?.data || res;
      setPatient(d.patient);
      setTags(d.tags || []);
      setCurrentStage(d.current_stage);
      setVisitStats(d.stats);
    } catch (err) {
      console.error('Failed to fetch patient:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchTimeline = useCallback(async () => {
    if (!patientId) return;
    setTimelineLoading(true);
    try {
      const params = {};
      if (timelineFilter) params.type = timelineFilter;
      const res = await patientAPI.timeline(patientId, params);
      setTimeline((res?.data || res).timeline || []);
    } catch (err) { console.error('Timeline error:', err); }
    finally { setTimelineLoading(false); }
  }, [patientId, timelineFilter]);

  const fetchSummary = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await patientAPI.summary(patientId);
      setSummary(res?.data || res);
    } catch (err) { console.error('Summary error:', err); }
  }, [patientId]);

  const fetchDocuments = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await patientAPI.documents(patientId, { per_page: 50 });
      setDocuments((res?.data || res).data || []);
    } catch (err) { console.error('Documents error:', err); }
  }, [patientId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // ── Tag management ──
  const handleAddTag = async () => {
    if (!addTagValue.trim() || !patientId) return;
    setAddingTag(true);
    try {
      await patientAPI.addTag(patientId, addTagValue.trim());
      setAddTagValue('');
      setShowTagInput(false);
      fetchProfile();
    } catch { /* ignore */ }
    setAddingTag(false);
  };

  const handleRemoveTag = async (tagId) => {
    try { await patientAPI.removeTag(tagId); fetchProfile(); } catch { /* ignore */ }
  };

  const handleSetStage = async (stage) => {
    if (!patientId) return;
    try { await patientAPI.setStage(patientId, stage); fetchProfile(); } catch { /* ignore */ }
  };

  // ── Pro gate ──
  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="patient360" />;

  // ── Guards ──
  if (!patientId) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">No patient ID provided</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>;
  if (!patient) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <User className="w-10 h-10 text-gray-300" />
      <p className="text-gray-400">Patient not found</p>
      <button onClick={() => navigate('/crm/patients')} className="text-sm text-teal-600 hover:underline">Back to patients</button>
    </div>
  );

  const age = calcAge(patient.date_of_birth);
  const tabs = [
    { key: 'timeline', label: t('crm.patient360.timeline', 'Timeline'), icon: Clock },
    { key: 'summary', label: t('crm.patient360.medicalSummary', 'Medical Summary'), icon: Activity },
    { key: 'files', label: t('crm.patient360.medicalFiles', 'Documents'), icon: FileText },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/crm/patients')} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.patient360.title', 'Patient 360°')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.patient360.subtitle', 'Complete medical & commercial patient profile')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (user?.role_id === 'doctor' && !user?.is_verified) return;
              if (clinicNeedsVerification) { setShowClinicVerifyModal(true); return; }
              navigate('/crm/appointments');
            }}
            disabled={user?.role_id === 'doctor' && !user?.is_verified}
            title={(user?.role_id === 'doctor' && !user?.is_verified) || clinicNeedsVerification ? t('crm.verificationBanner.restrictedFeature', 'Verification required to use this feature') : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${(user?.role_id === 'doctor' && !user?.is_verified) || clinicNeedsVerification ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('crm.patients.bookAppointment', 'New Appointment')}</span>
          </button>
          <button onClick={() => navigate('/crm/examination', { state: { patientId, patientName: patient?.fullname, clinicId: user?.clinic_id } })} className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-all shadow-sm">
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('crm.patient360.startExamination', 'Start Examination')}</span>
          </button>
          <button onClick={() => navigate('/crm/billing')} className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition-all shadow-sm">
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('crm.billing.createInvoice', 'Invoice')}</span>
          </button>
        </div>
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ═══ LEFT — Patient Info ═══ */}
        <div className="lg:col-span-4 space-y-4">
          {/* Patient Card */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="h-20 relative bg-gradient-to-r from-teal-500 to-emerald-600">
              <div className="absolute -bottom-8 left-5">
                {patient.avatar ? (
                  <img src={patient.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-xl font-bold border-4 border-white text-teal-600">
                    {getInitials(patient.fullname)}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-12 px-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{patient.fullname}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {patient.gender === 'F' ? 'Female' : patient.gender === 'M' ? 'Male' : '—'}
                    {age ? `, ${age}y` : ''}{patient.country ? ` · ${patient.country}` : ''}
                  </p>
                </div>
                {patient.is_verified && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                )}
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tg) => (
                  <span key={tg.id} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColor(tg.tag)}`}>
                    <Tag className="w-2.5 h-2.5" />{tg.tag}
                    <button onClick={() => handleRemoveTag(tg.id)} className="ml-0.5 hover:opacity-60"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
                {showTagInput ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={addTagValue} onChange={(e) => setAddTagValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="Tag..." maxLength={100} autoFocus
                      className="w-24 h-6 px-2 text-[10px] border border-gray-200 rounded-full focus:ring-1 focus:ring-teal-400" />
                    <button onClick={handleAddTag} disabled={addingTag || !addTagValue.trim()} className="text-teal-600 disabled:opacity-40">
                      {addingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    </button>
                    <button onClick={() => { setShowTagInput(false); setAddTagValue(''); }} className="text-gray-400"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowTagInput(true)} className="text-[10px] text-gray-400 hover:text-teal-600 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> tag</button>
                )}
              </div>

              {/* Stage */}
              <div className="mt-2">
                {currentStage ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    <Layers className="w-2.5 h-2.5" />{currentStage.stage}
                    {currentStage.started_at && <span className="text-gray-400 ml-1">since {currentStage.started_at}</span>}
                  </span>
                ) : (
                  <button onClick={() => handleSetStage('Initial Consultation')} className="text-[10px] text-gray-400 hover:text-teal-600 flex items-center gap-0.5">
                    <Plus className="w-2.5 h-2.5" /> Set stage
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Visit Stats */}
          {visitStats && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Appts', value: visitStats.total_appointments, color: 'text-blue-600' },
                { label: 'Completed', value: visitStats.completed_visits, color: 'text-emerald-600' },
                { label: 'Upcoming', value: visitStats.upcoming_appointments, color: 'text-amber-600' },
                { label: 'Examinations', value: visitStats.total_examinations, color: 'text-violet-600' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200/60 shadow-sm px-4 py-3 text-center">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Contact Details */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm px-5 py-4 space-y-1">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">{t('crm.patients.contact')}</h3>
            <InfoRow icon={Mail} label={t('common.email')} value={patient.email} />
            <InfoRow icon={Phone} label={t('common.phone')} value={patient.mobile} />
            <InfoRow icon={MapPin} label={t('crm.patients.location')} value={patient.country} />
            <InfoRow icon={Calendar} label={t('crm.patients.dateOfBirth')} value={patient.date_of_birth} />
            <InfoRow icon={Calendar} label={t('crm.patients.registered')} value={patient.created_at} />
          </div>

          {/* Tags from Medical Summary — Conditions */}
          {summary?.tags?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('crm.patients.medicalConditions', 'Medical Tags')}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.tags.map((tg, i) => (
                  <span key={i} className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">{tg}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT — Tabs ═══ */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
            {/* Tab Nav */}
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.key ? 'border-teal-500 text-teal-700 bg-teal-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                    }`}>
                    <TabIcon className="w-4 h-4" />{tab.label}
                  </button>
                );
              })}
            </div>

            {/* ─── TAB: Timeline ─── */}
            {activeTab === 'timeline' && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-gray-900">{t('crm.patient360.medicalTimeline', 'Medical Timeline')}</h3>
                  <div className="flex items-center gap-2">
                    {['', 'appointment', 'examination', 'document'].map((f) => (
                      <button key={f} onClick={() => setTimelineFilter(f)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-colors ${
                          timelineFilter === f ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        }`}>
                        {f || 'All'}
                      </button>
                    ))}
                  </div>
                </div>
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-teal-500" /></div>
                ) : timeline.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No timeline entries yet</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {timeline.map((entry, i) => (
                      <TimelineCard key={entry.id || i} entry={entry} isLast={i === timeline.length - 1} t={t} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: Medical Summary ─── */}
            {activeTab === 'summary' && (
              <div className="p-5 space-y-5">
                {!summary ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-teal-500" /></div>
                ) : (
                  <>
                    {/* Latest Vitals */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">{t('crm.patient360.latestVitals', 'Latest Vitals')}</h3>
                      {summary.latest_vitals ? (
                        <div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                            {Object.entries(summary.latest_vitals.data || {}).map(([k, v]) => (
                              <div key={k} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">{k}</p>
                                <p className="text-sm font-bold text-gray-800 mt-0.5">{typeof v === 'object' ? JSON.stringify(v) : v}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400">Recorded {summary.latest_vitals.date} by {summary.latest_vitals.doctor}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">No vitals recorded yet</p>
                      )}
                    </div>

                    {/* Recent Diagnoses */}
                    {summary.recent_diagnoses?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">{t('crm.patient360.recentDiagnoses', 'Recent Diagnoses')}</h3>
                        <div className="space-y-2">
                          {summary.recent_diagnoses.map((d, i) => (
                            <div key={i} className="flex items-center gap-3 bg-violet-50/50 rounded-xl px-4 py-2.5 border border-violet-100">
                              <span className="text-xs font-mono font-bold text-violet-700">{d.icd10_code}</span>
                              <span className="text-xs text-gray-600 flex-1">{d.diagnosis_note || '—'}</span>
                              <span className="text-[10px] text-gray-400">{d.created_at?.slice(0, 10)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Prescriptions */}
                    {summary.active_prescriptions?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">{t('crm.patient360.activePrescriptions', 'Active Prescriptions')}</h3>
                        <div className="space-y-2">
                          {summary.active_prescriptions.map((rx, i) => (
                            <div key={i} className="flex items-center gap-2 bg-blue-50/50 rounded-xl px-4 py-2.5 border border-blue-100">
                              <Pill className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-xs text-gray-700 flex-1">
                                {typeof rx.prescription === 'object' ? (rx.prescription.name || JSON.stringify(rx.prescription)) : rx.prescription}
                              </span>
                              <span className="text-[10px] text-gray-400">{rx.date} · {rx.doctor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No data fallback */}
                    {!summary.latest_vitals && !summary.recent_diagnoses?.length && !summary.active_prescriptions?.length && (
                      <div className="text-center py-12">
                        <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No medical data yet</p>
                        <p className="text-xs text-gray-300 mt-1">Medical summary will populate after examinations</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─── TAB: Documents ─── */}
            {activeTab === 'files' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{t('crm.patient360.uploadedFiles', 'Patient Documents')}</h3>
                  <span className="text-[11px] text-gray-400">{documents.length} files</span>
                </div>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No documents yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const cfg = FILE_CFG[doc.record_type] || FILE_CFG.other;
                      const CatIcon = cfg.icon;
                      return (
                        <div key={doc.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 group hover:bg-gray-100 transition-colors">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <CatIcon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{doc.description || doc.record_type}</p>
                            <p className="text-[11px] text-gray-400">
                              {doc.upload_date || doc.created_at?.slice(0, 10)}
                              {doc.doctor && ` · ${doc.doctor.fullname}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.file_url && (
                              <>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600">
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                                <a href={doc.file_url} download className="w-7 h-7 rounded-lg hover:bg-teal-50 flex items-center justify-center text-gray-400 hover:text-teal-600">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Clinic Verification Modal */}
      <ClinicVerificationModal
        isOpen={showClinicVerifyModal}
        onClose={() => setShowClinicVerifyModal(false)}
        onStatusChange={(status) => setClinicVerificationStatus(status)}
      />
    </div>
  );
};

export default CRMPatient360;
