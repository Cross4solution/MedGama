import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Phone, MapPin, Calendar, Heart, AlertCircle, Droplets,
  Shield, FileText, Upload, X, ChevronDown, ChevronRight, Clock,
  Stethoscope, Pill, Scissors, Activity, Camera, Download, Trash2,
  CheckCircle2, PenTool, RotateCcw, Save, Eye, Plus, ArrowLeft,
  ClipboardList, Image, File, FilePlus,
} from 'lucide-react';

// ─── Mock Patient Data ───────────────────────────────────────
const MOCK_PATIENTS = {
  P001: {
    id: 'P001', name: 'Zeynep Kaya', email: 'zeynep@mail.com', phone: '+90 532 111 2233',
    age: 34, gender: 'F', dob: '1992-03-15', bloodType: 'A+',
    country: 'Turkey', city: 'Istanbul', status: 'active',
    insurance: 'Axa Sigorta', registeredAt: '2024-06-10',
    conditions: ['Asthma'], allergies: ['Penicillin'],
    emergencyContact: { name: 'Ahmet Kaya', relation: 'Spouse', phone: '+90 532 999 8877' },
    notes: 'Seasonal asthma — worse in spring. Uses Ventolin inhaler as needed.',
  },
  P002: {
    id: 'P002', name: 'Ali Yilmaz', email: 'ali@mail.com', phone: '+90 533 222 3344',
    age: 45, gender: 'M', dob: '1981-07-22', bloodType: 'O+',
    country: 'Turkey', city: 'Ankara', status: 'active',
    insurance: 'SGK', registeredAt: '2024-09-01',
    conditions: ['Hypertension', 'Post-Op Recovery'], allergies: [],
    emergencyContact: { name: 'Fatma Yilmaz', relation: 'Wife', phone: '+90 533 111 0000' },
    notes: 'Post knee surgery. Regular BP monitoring required.',
  },
  P004: {
    id: 'P004', name: 'Mehmet Ozkan', email: 'mehmet@mail.com', phone: '+90 535 444 5566',
    age: 52, gender: 'M', dob: '1974-11-05', bloodType: 'AB-',
    country: 'Turkey', city: 'Istanbul', status: 'critical',
    insurance: 'SGK', registeredAt: '2023-02-14',
    conditions: ['Diabetes Type 2', 'High Cholesterol', 'Hypertension'], allergies: ['Sulfa Drugs'],
    emergencyContact: { name: 'Ayse Ozkan', relation: 'Wife', phone: '+90 535 000 1122' },
    notes: 'Triple comorbidity. Requires strict diet and medication adherence monitoring.',
  },
};

// Fallback for any patient ID not in the map
const DEFAULT_PATIENT = {
  id: 'P001', name: 'Zeynep Kaya', email: 'zeynep@mail.com', phone: '+90 532 111 2233',
  age: 34, gender: 'F', dob: '1992-03-15', bloodType: 'A+',
  country: 'Turkey', city: 'Istanbul', status: 'active',
  insurance: 'Axa Sigorta', registeredAt: '2024-06-10',
  conditions: ['Asthma'], allergies: ['Penicillin'],
  emergencyContact: { name: 'Ahmet Kaya', relation: 'Spouse', phone: '+90 532 999 8877' },
  notes: 'Seasonal asthma — worse in spring.',
};

// ─── Mock Timeline Data ──────────────────────────────────────
const MOCK_TIMELINE = [
  { id: 1, date: '2026-02-16', type: 'examination', title: 'Routine Check-up', doctor: 'Dr. Ahmet Yilmaz', notes: 'Lung function test normal. Asthma well-controlled. Continue current medication.', prescriptions: ['Ventolin Inhaler — as needed'], vitals: { bp: '120/80', hr: 72, temp: '36.6°C', weight: '62 kg' } },
  { id: 2, date: '2026-01-10', type: 'lab', title: 'Blood Test Results', doctor: 'Dr. Ahmet Yilmaz', notes: 'CBC normal. Vitamin D slightly low (18 ng/mL). Recommended supplementation.', prescriptions: ['Vitamin D3 1000 IU — daily'], vitals: null },
  { id: 3, date: '2025-11-22', type: 'consultation', title: 'Allergy Consultation', doctor: 'Dr. Elif Demir', notes: 'Skin prick test performed. Confirmed dust mite and pollen allergy. Penicillin allergy noted — avoid beta-lactams.', prescriptions: ['Cetirizine 10mg — daily during allergy season'], vitals: { bp: '118/76', hr: 68, temp: '36.5°C', weight: '61 kg' } },
  { id: 4, date: '2025-09-05', type: 'procedure', title: 'Spirometry Test', doctor: 'Dr. Ahmet Yilmaz', notes: 'FEV1/FVC ratio 78%. Mild obstruction consistent with asthma diagnosis. No significant change from previous test.', prescriptions: [], vitals: { bp: '122/78', hr: 74, temp: '36.7°C', weight: '62 kg' } },
  { id: 5, date: '2025-06-18', type: 'examination', title: 'Annual Physical', doctor: 'Dr. Ahmet Yilmaz', notes: 'General health good. BMI 22.3. Recommended flu vaccine before winter. Asthma action plan reviewed.', prescriptions: ['Fluticasone Inhaler — 2 puffs morning/evening'], vitals: { bp: '116/74', hr: 70, temp: '36.4°C', weight: '61 kg' } },
  { id: 6, date: '2025-03-12', type: 'emergency', title: 'Acute Asthma Attack', doctor: 'Dr. Can Yildiz (ER)', notes: 'Presented with severe wheezing and dyspnea. Nebulizer treatment administered. Stabilized within 2 hours. Discharged with oral prednisolone course.', prescriptions: ['Prednisolone 40mg — 5 days tapering', 'Salbutamol Nebules — PRN'], vitals: { bp: '138/88', hr: 98, temp: '37.1°C', weight: '61 kg' } },
  { id: 7, date: '2024-12-01', type: 'followUp', title: 'Post-ER Follow-up', doctor: 'Dr. Ahmet Yilmaz', notes: 'Recovery from March asthma attack complete. Lung function improved. Added Montelukast to prevent future episodes.', prescriptions: ['Montelukast 10mg — nightly'], vitals: { bp: '120/78', hr: 72, temp: '36.5°C', weight: '62 kg' } },
  { id: 8, date: '2024-06-10', type: 'examination', title: 'Initial Registration Exam', doctor: 'Dr. Ahmet Yilmaz', notes: 'New patient registration. Full medical history taken. Asthma since childhood. Penicillin allergy documented. Baseline labs ordered.', prescriptions: ['Ventolin Inhaler — as needed'], vitals: { bp: '118/76', hr: 70, temp: '36.6°C', weight: '60 kg' } },
];

// ─── Mock Medical Files ──────────────────────────────────────
const MOCK_FILES = [
  { id: 1, name: 'CBC_Report_Feb2026.pdf', type: 'pdf', size: '245 KB', date: '2026-02-16', category: 'lab' },
  { id: 2, name: 'Spirometry_Results.pdf', type: 'pdf', size: '1.2 MB', date: '2025-09-05', category: 'test' },
  { id: 3, name: 'Chest_Xray_2025.jpg', type: 'image', size: '3.4 MB', date: '2025-06-18', category: 'imaging' },
  { id: 4, name: 'Allergy_Test_Report.pdf', type: 'pdf', size: '890 KB', date: '2025-11-22', category: 'lab' },
  { id: 5, name: 'Insurance_Card.jpg', type: 'image', size: '520 KB', date: '2024-06-10', category: 'document' },
];

// ─── Timeline Type Config ────────────────────────────────────
const TIMELINE_TYPE_CONFIG = {
  examination:  { color: '#3B82F6', bg: 'bg-blue-50',    border: 'border-blue-200',   icon: Stethoscope, label: 'Examination' },
  lab:          { color: '#8B5CF6', bg: 'bg-violet-50',  border: 'border-violet-200', icon: Activity,    label: 'Lab Results' },
  consultation: { color: '#F59E0B', bg: 'bg-amber-50',   border: 'border-amber-200',  icon: ClipboardList, label: 'Consultation' },
  procedure:    { color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Scissors,   label: 'Procedure' },
  emergency:    { color: '#EF4444', bg: 'bg-red-50',     border: 'border-red-200',    icon: AlertCircle, label: 'Emergency' },
  followUp:     { color: '#0D9488', bg: 'bg-teal-50',    border: 'border-teal-200',   icon: RotateCcw,   label: 'Follow-up' },
};

// ─── File Category Config ────────────────────────────────────
const FILE_CATEGORY_CONFIG = {
  lab:      { icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
  test:     { icon: FileText, color: 'text-blue-600',   bg: 'bg-blue-50' },
  imaging:  { icon: Image,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
  document: { icon: File,     color: 'text-gray-600',   bg: 'bg-gray-50' },
};

// ─── Sub-components ──────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, valueClass = '' }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium text-gray-800 mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  </div>
);

const TimelineCard = ({ entry, isLast, t }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIMELINE_TYPE_CONFIG[entry.type] || TIMELINE_TYPE_CONFIG.examination;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.border} border`}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2 mb-0" />}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900">{entry.title}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} border`}
                  style={{ color: cfg.color }}
                >
                  {t(`crm.patient360.type_${entry.type}`, cfg.label)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{entry.date}
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" />{entry.doctor}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {/* Notes */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('common.notes')}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{entry.notes}</p>
              </div>

              {/* Prescriptions */}
              {entry.prescriptions && entry.prescriptions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('crm.patient360.prescriptions', 'Prescriptions')}</p>
                  <div className="space-y-1">
                    {entry.prescriptions.map((rx, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-blue-50/50 rounded-lg px-3 py-1.5 border border-blue-100">
                        <Pill className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        {rx}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vitals */}
              {entry.vitals && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('crm.patient360.vitals', 'Vitals')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'BP', value: entry.vitals.bp },
                      { label: 'HR', value: `${entry.vitals.hr} bpm` },
                      { label: 'Temp', value: entry.vitals.temp },
                      { label: 'Weight', value: entry.vitals.weight },
                    ].map((v) => (
                      <div key={v.label} className="bg-gray-50 rounded-lg px-2.5 py-2 text-center">
                        <p className="text-[10px] font-semibold text-gray-400">{v.label}</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{v.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CRMPatient360 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id') || 'P001';
  const patient = MOCK_PATIENTS[patientId] || DEFAULT_PATIENT;

  const [activeTab, setActiveTab] = useState('timeline');
  const [files, setFiles] = useState(MOCK_FILES);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // E-Consent state
  const [consentSigned, setConsentSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [consentFormData, setConsentFormData] = useState({
    procedureName: '',
    procedureDesc: '',
    risks: '',
    agreedTerms: false,
  });
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctxRef.current = ctx;
  }, [activeTab]);

  // Canvas drawing handlers
  const startDrawing = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing || !ctxRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (ctxRef.current) ctxRef.current.closePath();
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    setConsentSigned(false);
  }, []);

  const handleSignConsent = () => {
    setConsentSigned(true);
  };

  // File drag & drop
  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles = droppedFiles.map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: f.type.startsWith('image/') ? 'image' : 'pdf',
      size: `${(f.size / 1024).toFixed(0)} KB`,
      date: new Date().toISOString().slice(0, 10),
      category: f.type.startsWith('image/') ? 'imaging' : 'lab',
    }));
    setFiles((prev) => [...newFiles, ...prev]);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: f.type.startsWith('image/') ? 'image' : 'pdf',
      size: `${(f.size / 1024).toFixed(0)} KB`,
      date: new Date().toISOString().slice(0, 10),
      category: f.type.startsWith('image/') ? 'imaging' : 'lab',
    }));
    setFiles((prev) => [...newFiles, ...prev]);
  }, []);

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const tabs = [
    { key: 'timeline', label: t('crm.patient360.timeline', 'Timeline'), icon: Clock },
    { key: 'files', label: t('crm.patient360.medicalFiles', 'Medical Files'), icon: FileText },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/crm/patients')}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.patient360.title', 'Patient 360')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.patient360.subtitle', 'Complete medical & commercial patient profile')}</p>
        </div>
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ═══ LEFT COLUMN — Fixed Patient Info ═══ */}
        <div className="lg:col-span-4 space-y-4">

          {/* Patient Card */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            {/* Header gradient */}
            <div className={`h-20 relative ${patient.status === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-teal-500 to-emerald-600'}`}>
              <div className="absolute -bottom-8 left-5">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-xl font-bold border-4 border-white"
                  style={{ color: patient.status === 'critical' ? '#EF4444' : '#0D9488' }}>
                  {patient.name.split(' ').map((n) => n[0]).join('')}
                </div>
              </div>
            </div>

            <div className="pt-12 px-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">ID: #{patient.id} · {patient.gender === 'F' ? t('crm.patients.female', 'Female') : t('crm.patients.male', 'Male')}, {patient.age}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                  patient.status === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                  patient.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {patient.status}
                </span>
              </div>

              {patient.notes && (
                <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{patient.notes}</p>
              )}
            </div>
          </div>

          {/* Vital Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm px-4 py-3 text-center">
              <Droplets className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase">{t('crm.patients.bloodType')}</p>
              <p className="text-lg font-bold text-red-600 mt-0.5">{patient.bloodType}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm px-4 py-3 text-center">
              <Shield className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase">{t('crm.patients.insurance')}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{patient.insurance || '—'}</p>
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('crm.patients.allergies')}</h3>
            </div>
            {patient.allergies.length === 0 ? (
              <p className="text-xs text-gray-400">{t('crm.patients.noKnownAllergies')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {patient.allergies.map((a) => (
                  <span key={a} className="text-xs font-semibold bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{a}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('crm.patients.medicalConditions')}</h3>
            </div>
            {patient.conditions.length === 0 ? (
              <p className="text-xs text-gray-400">{t('crm.patients.noKnownConditions')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {patient.conditions.map((c) => (
                  <span key={c} className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm px-5 py-4 space-y-1">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">{t('crm.patients.contact')}</h3>
            <InfoRow icon={Mail} label={t('common.email')} value={patient.email} />
            <InfoRow icon={Phone} label={t('common.phone')} value={patient.phone} />
            <InfoRow icon={MapPin} label={t('crm.patients.location')} value={`${patient.city}, ${patient.country}`} />
            <InfoRow icon={Calendar} label={t('crm.patients.dateOfBirth')} value={patient.dob} />
            <InfoRow icon={Calendar} label={t('crm.patients.registered')} value={patient.registeredAt} />
          </div>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('crm.patient360.emergencyContact', 'Emergency Contact')}</h3>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-gray-800">{patient.emergencyContact.name}</p>
                <p className="text-xs text-gray-500">{patient.emergencyContact.relation} · {patient.emergencyContact.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT COLUMN — Timeline / Files / E-Consent ═══ */}
        <div className="lg:col-span-8 space-y-4">

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? 'border-teal-500 text-teal-700 bg-teal-50/30'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ─── TAB: Timeline ─── */}
            {activeTab === 'timeline' && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-gray-900">{t('crm.patient360.medicalTimeline', 'Medical Timeline')}</h3>
                  <span className="text-[11px] text-gray-400">{MOCK_TIMELINE.length} {t('crm.patient360.records', 'records')}</span>
                </div>
                <div className="space-y-0">
                  {MOCK_TIMELINE.map((entry, i) => (
                    <TimelineCard key={entry.id} entry={entry} isLast={i === MOCK_TIMELINE.length - 1} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB: Medical Files ─── */}
            {activeTab === 'files' && (
              <div className="p-5 space-y-4">
                {/* Upload Area — Coming Soon */}
                <div className="border-2 border-dashed rounded-2xl px-6 py-6 text-center border-gray-200 bg-gray-50/30 opacity-60">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-100">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">{t('crm.patient360.dragDropFiles', 'Drag & drop files here')}</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">Coming Soon — Phase 2</p>
                </div>

                {/* File List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">{t('crm.patient360.uploadedFiles', 'Uploaded Files')}</h3>
                    <span className="text-[11px] text-gray-400">{files.length} {t('crm.patient360.files', 'files')}</span>
                  </div>
                  <div className="space-y-2">
                    {files.map((file) => {
                      const catCfg = FILE_CATEGORY_CONFIG[file.category] || FILE_CATEGORY_CONFIG.document;
                      const CatIcon = catCfg.icon;
                      return (
                        <div key={file.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 group hover:bg-gray-100 transition-colors">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${catCfg.bg}`}>
                            <CatIcon className={`w-4 h-4 ${catCfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-[11px] text-gray-400">{file.size} · {file.date}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600" title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="w-7 h-7 rounded-lg hover:bg-teal-50 flex items-center justify-center text-gray-400 hover:text-teal-600" title="Download">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMPatient360;
