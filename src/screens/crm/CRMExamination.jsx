import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Stethoscope, Search, Plus, X, Trash2, ChevronDown, ChevronUp,
  Upload, FileImage, File, Eye, Clock, User, Calendar, Pill,
  ClipboardList, ClipboardCheck, Save, Printer, AlertTriangle, CheckCircle2,
  Heart, Activity, Thermometer, GripHorizontal, ImageIcon,
  ChevronLeft, ChevronRight, ZoomIn, Download, Loader2,
  ShieldAlert, TrendingUp, TrendingDown, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { examinationAPI, catalogAPI } from '../../lib/api';
import GlobalSuggest from '../../components/forms/GlobalSuggest';
import { useAuth } from '../../context/AuthContext';
import ProTeaser from '../../components/crm/ProTeaser';

// ─── Medication Templates ───
const MEDICATION_TEMPLATES = [
  { name: 'Amoxicillin 500mg', dosage: '3x daily', duration: '7 days', route: 'Oral' },
  { name: 'Ibuprofen 400mg', dosage: '3x daily after meals', duration: '5 days', route: 'Oral' },
  { name: 'Omeprazole 20mg', dosage: '1x daily before breakfast', duration: '14 days', route: 'Oral' },
  { name: 'Metformin 1000mg', dosage: '2x daily with meals', duration: '90 days', route: 'Oral' },
  { name: 'Amlodipine 5mg', dosage: '1x daily', duration: '30 days', route: 'Oral' },
  { name: 'Atorvastatin 20mg', dosage: '1x daily at bedtime', duration: '90 days', route: 'Oral' },
  { name: 'Cetirizine 10mg', dosage: '1x daily', duration: '14 days', route: 'Oral' },
  { name: 'Paracetamol 500mg', dosage: 'Every 6 hours as needed', duration: '5 days', route: 'Oral' },
  { name: 'Salbutamol 100mcg', dosage: '2 puffs as needed', duration: '30 days', route: 'Inhalation' },
  { name: 'Fluticasone Nasal Spray', dosage: '2 puffs/nostril daily', duration: '30 days', route: 'Nasal' },
  { name: 'Prednisolone 5mg', dosage: 'As directed', duration: '5 days', route: 'Oral' },
  { name: 'Sertraline 50mg', dosage: '1x daily', duration: '30 days', route: 'Oral' },
];

// ═══════════════════════════════════════════════════
// Vitals Alert Banner Component
// ═══════════════════════════════════════════════════
const VitalsAlertBanner = ({ vitalsAlert, t }) => {
  if (!vitalsAlert || !vitalsAlert.is_alert) return null;

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-800">Vital Bulguları Uyarısı</p>
          <p className="text-xs text-red-600">{vitalsAlert.alerts.length} değer normal aralık dışında</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {vitalsAlert.alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
              alert.status === 'high'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            {alert.status === 'high' ? (
              <TrendingUp className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className={`text-xs font-bold ${alert.status === 'high' ? 'text-red-700' : 'text-blue-700'}`}>
                {alert.label}: {alert.value}{alert.unit}
              </p>
              <p className="text-[10px] text-gray-500">
                Normal: {alert.normal} {alert.unit}
              </p>
            </div>
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 ${
              alert.status === 'high'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {alert.status === 'high' ? 'YÜKSEK' : 'DÜŞÜK'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// ─── Treatment Tag Search Component (Symptoms & Treatments) ───
const TreatmentTagSearch = ({ selectedDiagnoses, onAdd, onRemove, t }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const handleSearch = useCallback((term) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await catalogAPI.search('treatment_tag', term);
        setResults(res.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSelect = (item) => {
    const name = typeof item.name === 'object'
      ? (item.name.en || item.name.tr || Object.values(item.name)[0])
      : item.name;
    if (!selectedDiagnoses.find((d) => d.code === item.code)) {
      onAdd({ code: item.code, desc: name, category: item.category });
    }
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {t('crm.examination.diagnosis', 'Diagnosis')} (Symptoms & Treatments)
      </label>

      {/* Selected diagnoses */}
      {selectedDiagnoses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDiagnoses.map((d) => (
            <span
              key={d.code}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium"
            >
              <span className="font-bold">{d.code}</span>
              <span className="text-teal-600">—</span>
              <span>{d.desc}</span>
              <button
                onClick={() => onRemove(d.code)}
                className="ml-1 w-4 h-4 rounded-full hover:bg-teal-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              handleSearch(e.target.value);
            }}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={t('crm.examination.searchTreatmentTag', 'Search Symptoms or Treatments...')}
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-teal-500 animate-spin flex-shrink-0" />}
          {query && !isSearching && (
            <button onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {results.map((item) => {
              const isSelected = selectedDiagnoses.some((d) => d.code === item.code);
              const nameEn = typeof item.name === 'object' ? (item.name.en || '') : item.name;
              const nameTr = typeof item.name === 'object' ? (item.name.tr || '') : '';
              return (
                <button
                  key={item.code}
                  onClick={() => handleSelect(item)}
                  disabled={isSelected}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                    isSelected ? 'bg-teal-50/50 opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 flex-shrink-0 mt-0.5">
                    {item.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{nameEn}</p>
                    {nameTr && <p className="text-[11px] text-gray-400 truncate">{nameTr}</p>}
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isOpen && query.length >= 2 && results.length === 0 && !isSearching && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center">
            <p className="text-sm text-gray-500">{t('common.noResults')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('crm.examination.tryDifferentSearch')}</p>
          </div>
        )}
      </div>

      {/* Click-away handler */}
      {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Prescription Builder Component
// ═══════════════════════════════════════════════════
const PrescriptionBuilder = ({ medications, setMedications, t }) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return MEDICATION_TEMPLATES;
    const q = templateSearch.toLowerCase();
    return MEDICATION_TEMPLATES.filter((m) => m.name.toLowerCase().includes(q));
  }, [templateSearch]);

  const addMedication = (template = null) => {
    const newMed = template
      ? { ...template, id: Date.now() }
      : { id: Date.now(), name: '', dosage: '', duration: '', route: 'Oral' };
    setMedications([...medications, newMed]);
    setShowTemplates(false);
    setTemplateSearch('');
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const removeMedication = (id) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {t('crm.examination.prescriptionBuilder')}
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {t('crm.examination.templates')}
          </button>
          <button
            onClick={() => addMedication()}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('crm.examination.addMedication')}
          </button>
        </div>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder={t('crm.examination.searchMedication')}
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1"
            />
            <button onClick={() => { setShowTemplates(false); setTemplateSearch(''); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {filteredTemplates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => addMedication(tpl)}
                className="text-left px-3 py-2 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <p className="text-xs font-semibold text-gray-900 group-hover:text-teal-700">{tpl.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{tpl.dosage} · {tpl.duration}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Medication Rows */}
      {medications.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
          <Pill className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{t('crm.examination.noMedications')}</p>
          <p className="text-xs text-gray-300 mt-1">{t('crm.examination.addFromTemplates')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map((med, idx) => (
            <div key={med.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 group relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {t('crm.examination.medication')} #{idx + 1}
                </span>
                <button
                  onClick={() => removeMedication(med.id)}
                  className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <GlobalSuggest
                type="medication"
                value={med.name || ''}
                onChange={(val) => {
                  // val can be comma-separated string or array; extract first name
                  const name = Array.isArray(val) ? (val[0]?.name || '') : (val || '').split(',')[0]?.trim() || '';
                  updateMedication(med.id, 'name', name);
                }}
                multi={false}
                allowCustom={true}
                placeholder={t('crm.examination.medicationNamePlaceholder')}
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                  placeholder={t('crm.examination.dosagePlaceholder')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                />
                <input
                  type="text"
                  value={med.duration}
                  onChange={(e) => updateMedication(med.id, 'duration', e.target.value)}
                  placeholder={t('crm.examination.durationPlaceholder')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                />
                <select
                  value={med.route}
                  onChange={(e) => updateMedication(med.id, 'route', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  <option value="Oral">Oral</option>
                  <option value="IV">IV</option>
                  <option value="IM">IM</option>
                  <option value="SC">SC</option>
                  <option value="Topical">Topical</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Nasal">Nasal</option>
                  <option value="Rectal">Rectal</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Before/After Slider Component
// ═══════════════════════════════════════════════════
const BeforeAfterSlider = ({ beforeImage, afterImage, t }) => {
  const containerRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => { if (isDragging) handleMove(e.clientX); };
  const handleTouchMove = (e) => { handleMove(e.touches[0].clientX); };

  if (!beforeImage || !afterImage) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
        <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">{t('crm.examination.uploadBothImages')}</p>
        <p className="text-xs text-gray-300 mt-1">{t('crm.examination.beforeAfterHint')}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-col-resize select-none border border-gray-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* After image (full) */}
      <img src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before image (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${containerRef.current?.offsetWidth || 400}px` }} />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPos}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-gray-300">
          <GripHorizontal className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
        {t('crm.examination.before')}
      </div>
      <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
        {t('crm.examination.after')}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// File Upload Component
// ═══════════════════════════════════════════════════
const FileUploadZone = ({ files, setFiles, t }) => {
  const fileInputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles).map((f) => ({
      id: Date.now() + Math.random(),
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setFiles((prev) => [...prev, ...fileArray]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {t('crm.examination.attachments')}
      </label>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
      >
        <Upload className="w-8 h-8 text-gray-300 group-hover:text-teal-400 mx-auto mb-2 transition-colors" />
        <p className="text-sm text-gray-500 group-hover:text-teal-600">{t('crm.examination.dropFiles')}</p>
        <p className="text-xs text-gray-400 mt-1">{t('crm.examination.fileTypesHint')}</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((f) => (
            <div key={f.id} className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden group">
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="w-full h-24 object-cover" />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-gray-100">
                  <File className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-medium text-gray-700 truncate">{f.name}</p>
                <p className="text-[9px] text-gray-400">{formatSize(f.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Printable Examination Report (hidden on screen, visible on print)
// ═══════════════════════════════════════════════════
const PrintableReport = ({ exam, t }) => {
  if (!exam) return null;

  const patient = exam.patient || {};
  const doctor = exam.doctor || {};
  const vitals = exam.vitals || {};
  const prescriptions = exam.prescriptions || [];
  const diagnoses = exam.diagnoses || [];
  const icd10 = exam.icd10_code;
  const reportDate = exam.created_at ? new Date(exam.created_at) : new Date();

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const vitalsEntries = [
    { label: t('crm.examination.print.systolic', 'Systolic'), value: vitals.systolic, unit: 'mmHg' },
    { label: t('crm.examination.print.diastolic', 'Diastolic'), value: vitals.diastolic, unit: 'mmHg' },
    { label: t('crm.examination.print.pulse', 'Pulse'), value: vitals.pulse, unit: 'bpm' },
    { label: t('crm.examination.print.temperature', 'Temperature'), value: vitals.temperature, unit: '°C' },
    { label: 'SpO₂', value: vitals.spo2, unit: '%' },
    { label: t('crm.examination.print.weight', 'Weight'), value: vitals.weight, unit: 'kg' },
    { label: t('crm.examination.print.height', 'Height'), value: vitals.height, unit: 'cm' },
  ].filter(v => v.value);

  return (
    <div className="print-exam-report" style={{ display: 'none' }}>
      {/* ── Report Header (Letterhead) ── */}
      <div className="print-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10pt' }}>
          <img
            src="/images/logo.svg"
            alt="MedGama"
            className="print-header-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: '14pt', fontWeight: 700, color: '#111' }}>
              {exam.clinic?.name || 'MedGama'}
            </div>
            <div style={{ fontSize: '9pt', color: '#666' }}>
              {t('crm.examination.print.examReport', 'Examination Report')}
            </div>
          </div>
        </div>
        <div className="print-header-right">
          <div style={{ fontWeight: 600 }}>
            {t('crm.examination.print.date', 'Date')}: {reportDate.toLocaleDateString()}
          </div>
          <div>
            {t('crm.examination.print.time', 'Time')}: {reportDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ marginTop: '2pt', fontFamily: 'monospace', fontSize: '8pt', color: '#999' }}>
            ID: {exam.id}
          </div>
        </div>
      </div>

      {/* ── Patient Information ── */}
      <div className="print-section">
        <div className="print-section-title">
          {t('crm.examination.print.patientInfo', 'Patient Information')}
        </div>
        <table className="print-table">
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, width: '25%' }}>{t('crm.examination.print.fullname', 'Full Name')}</td>
              <td>{patient.fullname || '—'}</td>
              <td style={{ fontWeight: 600, width: '15%' }}>{t('crm.examination.print.age', 'Age')}</td>
              <td style={{ width: '15%' }}>{age !== null ? `${age} ${t('crm.examination.print.yearsOld', 'y/o')}` : '—'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>{t('crm.examination.print.email', 'Email')}</td>
              <td>{patient.email || '—'}</td>
              <td style={{ fontWeight: 600 }}>{t('crm.examination.print.phone', 'Phone')}</td>
              <td>{patient.mobile || patient.phone || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Vitals ── */}
      {vitalsEntries.length > 0 && (
        <div className="print-section">
          <div className="print-section-title">
            {t('crm.examination.print.vitals', 'Vital Signs')}
          </div>
          <div className="print-vitals-grid">
            {vitalsEntries.map(v => (
              <div key={v.label} className="print-vital-box">
                <div className="print-vital-value">{v.value}</div>
                <div className="print-vital-label">{v.label} ({v.unit})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Diagnoses (ICD-10) ── */}
      {(icd10 || diagnoses.length > 0) && (
        <div className="print-section">
          <div className="print-section-title">
            {t('crm.examination.print.diagnoses', 'Diagnoses')} (Symptoms & Treatments)
          </div>
          {diagnoses.map((d, i) => (
            <span key={i} className="print-icd-badge">{d.desc || d.name}</span>
          ))}
          {exam.diagnosis_note && (
            <div className="print-note" style={{ marginTop: '6pt' }}>
              {exam.diagnosis_note}
            </div>
          )}
        </div>
      )}

      {/* ── Examination Notes ── */}
      {exam.examination_note && (
        <div className="print-section">
          <div className="print-section-title">
            {t('crm.examination.print.examNotes', 'Examination Notes')}
          </div>
          <div className="print-note">{exam.examination_note}</div>
        </div>
      )}

      {/* ── Prescriptions ── */}
      {prescriptions.length > 0 && (
        <div className="print-section">
          <div className="print-section-title">
            {t('crm.examination.print.prescriptions', 'Prescriptions')}
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('crm.examination.print.medication', 'Medication')}</th>
                <th>{t('crm.examination.print.dosage', 'Dosage')}</th>
                <th>{t('crm.examination.print.duration', 'Duration')}</th>
                <th>{t('crm.examination.print.route', 'Route')}</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{rx.drug_name}</td>
                  <td>{rx.dosage || '—'}</td>
                  <td>{rx.duration || '—'}</td>
                  <td>{rx.route || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Treatment Plan ── */}
      {exam.treatment_plan && (
        <div className="print-section">
          <div className="print-section-title">
            {t('crm.examination.print.treatmentPlan', 'Treatment Plan & Recommendations')}
          </div>
          <div className="print-note">{exam.treatment_plan}</div>
        </div>
      )}

      {/* ── Doctor Signature ── */}
      <div className="print-signature">
        <div className="print-signature-box">
          <div style={{ marginBottom: '4pt', fontWeight: 600, color: '#111' }}>
            {doctor.fullname || t('crm.examination.print.attendingPhysician', 'Attending Physician')}
          </div>
          {doctor.title && <div>{doctor.title}</div>}
          <div>{t('crm.examination.print.signature', 'Signature / Stamp')}</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="print-footer">
        {t('crm.examination.print.footer', 'This report was generated by MedGama Healthcare Platform. For questions contact support@medgama.com')}
        <br />
        {t('crm.examination.print.confidential', 'CONFIDENTIAL — This document contains protected health information.')}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Main CRMExamination Component
// ═══════════════════════════════════════════════════
const CRMExamination = () => {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();
  const location = useLocation();

  // ─── Context from Patient360 navigation ───
  const navState = location.state || {};

  // ─── Tab State ───
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'

  // ─── New Examination Form State ───
  const [patientId, setPatientId] = useState(navState.patientId || '');
  const [patientName, setPatientName] = useState(navState.patientName || '');
  const [clinicId, setClinicId] = useState(navState.clinicId || '');
  const [appointmentId, setAppointmentId] = useState(navState.appointmentId || '');
  const [diagnoses, setDiagnoses] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState({
    systolic: '', diastolic: '', pulse: '', temperature: '', spo2: '', weight: '', height: '',
  });
  const [diagnosisNote, setDiagnosisNote] = useState('');
  const [examinationNote, setExaminationNote] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [files, setFiles] = useState([]);
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lastSavedExam, setLastSavedExam] = useState(null);
  const [vitalsAlert, setVitalsAlert] = useState(null);

  // ─── History State ───
  const [examinations, setExaminations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // ─── Load examinations on history tab ───
  useEffect(() => {
    if (activeTab === 'history') {
      loadExaminations();
    }
  }, [activeTab]);

  const loadExaminations = async () => {
    setHistoryLoading(true);
    try {
      const res = await examinationAPI.list({ per_page: 50 });
      setExaminations(res?.data || []);
    } catch {
      setExaminations([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── View single exam detail ───
  const handleViewExam = async (exam) => {
    setSelectedExam(exam);
    setDetailLoading(true);
    try {
      const res = await examinationAPI.get(exam.id);
      setSelectedExamDetail(res?.examination || res);
    } catch {
      setSelectedExamDetail(exam);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Build vitals payload for API ───
  const buildVitalsPayload = () => {
    const v = {};
    if (vitals.systolic) v.systolic = parseFloat(vitals.systolic);
    if (vitals.diastolic) v.diastolic = parseFloat(vitals.diastolic);
    if (vitals.pulse) v.pulse = parseFloat(vitals.pulse);
    if (vitals.temperature) v.temperature = parseFloat(vitals.temperature);
    if (vitals.spo2) v.spo2 = parseFloat(vitals.spo2);
    if (vitals.weight) v.weight = parseFloat(vitals.weight);
    if (vitals.height) v.height = parseFloat(vitals.height);
    return Object.keys(v).length > 0 ? v : null;
  };

  // ─── Build prescriptions payload ───
  const buildPrescriptionsPayload = () => {
    if (medications.length === 0) return null;
    return medications.map((m) => ({
      drug_name: m.name,
      dosage: m.dosage,
      duration: m.duration || undefined,
      route: m.route || undefined,
    }));
  };

  // ─── Save Examination ───
  const handleSave = async () => {
    if (!patientId) {
      setSaveError('Lütfen hasta ID giriniz.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = {
        patient_id: patientId,
        clinic_id: clinicId || undefined,
        appointment_id: appointmentId || undefined,
        icd10_code: diagnoses[0]?.code || undefined,
        diagnosis_note: diagnosisNote || undefined,
        vitals: buildVitalsPayload(),
        examination_note: examinationNote || undefined,
        treatment_plan: treatmentPlan || undefined,
        prescriptions: buildPrescriptionsPayload(),
      };

      const res = await examinationAPI.create(payload);
      const exam = res?.examination || res;
      setLastSavedExam(exam);
      setVitalsAlert(exam?.vitals_alert || null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      setSaveError(err?.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── PDF Download ───
  const handleDownloadPdf = async (examId) => {
    setPdfLoading(true);
    try {
      const blob = await examinationAPI.prescriptionPdf(examId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recete-${examId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('PDF indirme sırasında hata oluştu.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ─── Print Examination Summary ───
  const handlePrintExam = useCallback((exam) => {
    if (!exam) return;
    document.body.classList.add('print-exam-active');
    // Small delay to ensure the class is applied and print-exam-report is rendered
    requestAnimationFrame(() => {
      window.print();
      // Clean up after print dialog closes
      const cleanup = () => {
        document.body.classList.remove('print-exam-active');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      // Fallback: remove class after 2s if afterprint doesn't fire
      setTimeout(() => document.body.classList.remove('print-exam-active'), 2000);
    });
  }, []);

  // ─── Reset Form ───
  const handleReset = () => {
    setPatientId('');
    setPatientName('');
    setClinicId('');
    setAppointmentId('');
    setDiagnoses([]);
    setMedications([]);
    setVitals({ systolic: '', diastolic: '', pulse: '', temperature: '', spo2: '', weight: '', height: '' });
    setDiagnosisNote('');
    setExaminationNote('');
    setTreatmentPlan('');
    setFiles([]);
    setBeforeImage(null);
    setAfterImage(null);
    setShowBeforeAfter(false);
    setLastSavedExam(null);
    setVitalsAlert(null);
    setSaveError('');
  };

  const handleBeforeImage = (e) => {
    const file = e.target.files?.[0];
    if (file) setBeforeImage(URL.createObjectURL(file));
  };

  const handleAfterImage = (e) => {
    const file = e.target.files?.[0];
    if (file) setAfterImage(URL.createObjectURL(file));
  };

  // ─── History filter ───
  const filteredHistory = useMemo(() => {
    if (!historySearch) return examinations;
    const q = historySearch.toLowerCase();
    return examinations.filter(
      (e) =>
        (e.patient?.fullname || '').toLowerCase().includes(q) ||
        (e.icd10_code || '').toLowerCase().includes(q) ||
        (e.diagnosis_note || '').toLowerCase().includes(q)
    );
  }, [historySearch, examinations]);

  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="examination" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            {t('crm.examination.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.examination.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'new'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            {t('crm.examination.newExamination')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            {t('crm.examination.history')}
          </button>
        </div>
      </div>

      {/* ═══ NEW EXAMINATION TAB ═══ */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Main Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Vitals Alert Banner (after save) */}
            <VitalsAlertBanner vitalsAlert={vitalsAlert} t={t} />

            {/* Save Success Banner */}
            {saveSuccess && lastSavedExam && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Muayene kaydı başarıyla oluşturuldu</p>
                    <p className="text-xs text-emerald-600">ID: {lastSavedExam.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadPdf(lastSavedExam.id)}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-60"
                >
                  {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Reçete PDF
                </button>
              </div>
            )}

            {/* Patient & Appointment IDs */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-500" />
                {t('crm.examination.patientInfo')}
              </h2>

              {/* Patient name banner (when navigated from Patient360) */}
              {patientName && (
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-violet-900 truncate">{patientName}</p>
                    <p className="text-[10px] text-violet-500 font-mono">{patientId}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Hasta ID *</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => { setPatientId(e.target.value); if (!e.target.value) setPatientName(''); }}
                    placeholder="Hasta UUID"
                    readOnly={!!navState.patientId}
                    className={`w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${navState.patientId ? 'bg-gray-50 text-gray-500' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Klinik ID</label>
                  <input
                    type="text"
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    placeholder="Opsiyonel"
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Randevu ID</label>
                  <input
                    type="text"
                    value={appointmentId}
                    onChange={(e) => setAppointmentId(e.target.value)}
                    placeholder="Opsiyonel"
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Vitals — optimized grid */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" />
                {t('crm.examination.vitals')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'systolic', label: 'Sistolik', placeholder: '120', icon: Heart, unit: 'mmHg', color: 'border-red-200 focus:ring-red-400' },
                  { key: 'diastolic', label: 'Diyastolik', placeholder: '80', icon: Heart, unit: 'mmHg', color: 'border-red-200 focus:ring-red-400' },
                  { key: 'pulse', label: t('crm.examination.heartRate'), placeholder: '72', icon: Activity, unit: 'bpm', color: 'border-pink-200 focus:ring-pink-400' },
                  { key: 'temperature', label: t('crm.examination.temperature'), placeholder: '36.6', icon: Thermometer, unit: '°C', color: 'border-orange-200 focus:ring-orange-400' },
                  { key: 'spo2', label: 'SpO₂', placeholder: '98', icon: Activity, unit: '%', color: 'border-blue-200 focus:ring-blue-400' },
                  { key: 'weight', label: t('crm.examination.weight'), placeholder: '70', icon: User, unit: 'kg', color: 'border-gray-200 focus:ring-teal-400' },
                  { key: 'height', label: t('crm.examination.height'), placeholder: '175', icon: User, unit: 'cm', color: 'border-gray-200 focus:ring-teal-400' },
                ].map((v) => (
                  <div key={v.key} className="relative">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1 tracking-wide">{v.label}</label>
                    <div className="relative">
                      <v.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="number"
                        step="any"
                        value={vitals[v.key]}
                        onChange={(e) => setVitals({ ...vitals, [v.key]: e.target.value })}
                        placeholder={v.placeholder}
                        className={`w-full h-10 pl-9 pr-12 border rounded-xl text-sm font-medium ${v.color} bg-white transition-all`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">{v.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnosis Note & Examination Note */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-500" />
                {t('crm.examination.examNotes')}
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tanı Notu</label>
                <textarea
                  rows={3}
                  value={diagnosisNote}
                  onChange={(e) => setDiagnosisNote(e.target.value)}
                  placeholder="Tanıya ilişkin notlar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Muayene Notu</label>
                <textarea
                  rows={4}
                  value={examinationNote}
                  onChange={(e) => setExaminationNote(e.target.value)}
                  placeholder="Fizik muayene bulguları, şikayet, plan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Tedavi Planı / Treatment Plan
                </label>
                <textarea
                  rows={3}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Önerilen tedavi yaklaşımı, kontrol tarihi, yaşam tarzı önerileri..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* ICD-10 Diagnosis */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
              <TreatmentTagSearch
                selectedDiagnoses={diagnoses}
                onAdd={(d) => setDiagnoses([...diagnoses, d])}
                onRemove={(code) => setDiagnoses(diagnoses.filter((d) => d.code !== code))}
                t={t}
              />
            </div>

            {/* Prescription Builder */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
              <PrescriptionBuilder medications={medications} setMedications={setMedications} t={t} />
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Before/After Slider */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-500" />
                  {t('crm.examination.beforeAfter')}
                </h2>
                <button
                  onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {showBeforeAfter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showBeforeAfter && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">{t('crm.examination.before')}</label>
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                        {beforeImage ? (
                          <img src={beforeImage} alt="Before" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 mt-1">{t('common.upload')}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleBeforeImage} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">{t('crm.examination.after')}</label>
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                        {afterImage ? (
                          <img src={afterImage} alt="After" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 mt-1">{t('common.upload')}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleAfterImage} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <BeforeAfterSlider beforeImage={beforeImage} afterImage={afterImage} t={t} />
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
              <FileUploadZone files={files} setFiles={setFiles} t={t} />
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-3">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700">{saveError}</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? t('common.loading') : saveSuccess ? t('crm.examination.saved') : t('crm.examination.saveExamination')}
              </button>

              <div className="grid grid-cols-2 gap-3">
                {lastSavedExam && (
                  <>
                    <button
                      onClick={() => handlePrintExam(lastSavedExam)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {t('crm.examination.print.printSummary', 'Print Summary')}
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(lastSavedExam.id)}
                      disabled={pdfLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-60"
                    >
                      {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Reçete PDF
                    </button>
                  </>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('crm.examination.clearForm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report for newly saved exam — hidden on screen */}
      {lastSavedExam && <PrintableReport exam={lastSavedExam} t={t} />}

      {/* ═══ HISTORY TAB ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={t('crm.examination.searchHistory')}
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1"
              />
              <button
                onClick={loadExaminations}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Yenile
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm font-medium">Yükleniyor...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Stethoscope className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">{t('common.noResults')}</p>
                </div>
              ) : (
                filteredHistory.map((exam) => {
                  const patientName = exam.patient?.fullname || 'Hasta';
                  const initials = patientName.split(' ').map((n) => n[0]).join('').slice(0, 2);
                  const hasAlert = exam.vitals_alert?.is_alert;
                  const vitalsData = exam.vitals || {};

                  return (
                    <div
                      key={exam.id}
                      onClick={() => handleViewExam(exam)}
                      className={`px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group ${hasAlert ? 'border-l-4 border-l-red-400' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${
                            hasAlert
                              ? 'bg-gradient-to-br from-red-400 to-orange-500'
                              : 'bg-gradient-to-br from-teal-400 to-emerald-500'
                          }`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900">{patientName}</p>
                              <span className="text-[11px] text-gray-400">{new Date(exam.created_at).toLocaleDateString('tr-TR')}</span>
                              {hasAlert && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md">
                                  <AlertTriangle className="w-2.5 h-2.5" /> ALERT
                                </span>
                              )}
                            </div>
                            {exam.icd10_code && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg border border-teal-200 mt-1">
                                <span className="font-bold">{exam.icd10_code}</span>
                              </span>
                            )}
                            {exam.prescriptions && exam.prescriptions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {exam.prescriptions.slice(0, 3).map((m, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                                    <Pill className="w-2.5 h-2.5" /> {m.drug_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            {vitalsData.systolic && (
                              <p className="text-[10px] text-gray-400">BP: <span className="font-medium text-gray-600">{vitalsData.systolic}/{vitalsData.diastolic}</span></p>
                            )}
                            {vitalsData.pulse && (
                              <p className="text-[10px] text-gray-400">HR: <span className="font-medium text-gray-600">{vitalsData.pulse}</span></p>
                            )}
                          </div>
                          <Eye className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Exam Detail Modal */}
          {selectedExam && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">{t('crm.examination.examDetails')}</h2>
                  <button
                    onClick={() => { setSelectedExam(null); setSelectedExamDetail(null); }}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {detailLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  </div>
                ) : selectedExamDetail && (
                  <div className="px-6 py-5 space-y-4">
                    {/* Patient info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-gray-900">{selectedExamDetail.patient?.fullname || 'Hasta'}</p>
                        <p className="text-xs text-gray-500">{new Date(selectedExamDetail.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                      {selectedExamDetail.icd10_code && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200">
                          {selectedExamDetail.icd10_code}
                        </span>
                      )}
                    </div>

                    {/* Vitals Alert */}
                    <VitalsAlertBanner vitalsAlert={selectedExamDetail.vitals_alert} t={t} />

                    {/* Vitals Grid */}
                    {selectedExamDetail.vitals && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('crm.examination.vitals')}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Sistolik', value: selectedExamDetail.vitals.systolic, unit: 'mmHg' },
                            { label: 'Diyastolik', value: selectedExamDetail.vitals.diastolic, unit: 'mmHg' },
                            { label: 'Nabız', value: selectedExamDetail.vitals.pulse, unit: 'bpm' },
                            { label: 'Ateş', value: selectedExamDetail.vitals.temperature, unit: '°C' },
                            { label: 'SpO₂', value: selectedExamDetail.vitals.spo2, unit: '%' },
                          ].filter(v => v.value).map((v) => (
                            <div key={v.label} className="bg-gray-50 rounded-lg px-3 py-2 text-center border border-gray-100">
                              <p className="text-xs font-bold text-gray-900">{v.value}</p>
                              <p className="text-[9px] text-gray-400">{v.label} ({v.unit})</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diagnosis note */}
                    {selectedExamDetail.diagnosis_note && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tanı Notu</p>
                        <p className="text-sm text-gray-600 bg-teal-50 rounded-xl px-3 py-2 border border-teal-100">{selectedExamDetail.diagnosis_note}</p>
                      </div>
                    )}

                    {/* Medications */}
                    {selectedExamDetail.prescriptions && selectedExamDetail.prescriptions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('crm.examination.medications')}</p>
                        <div className="space-y-2">
                          {selectedExamDetail.prescriptions.map((m, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5 text-teal-500" />{m.drug_name}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[11px] text-gray-500">Doz: <strong className="text-gray-700">{m.dosage}</strong></span>
                                {m.duration && <span className="text-[11px] text-gray-500">Süre: <strong className="text-gray-700">{m.duration}</strong></span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Treatment plan */}
                    {selectedExamDetail.treatment_plan && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <ClipboardCheck className="w-3 h-3 text-emerald-500" /> Tedavi Planı
                        </p>
                        <p className="text-sm text-gray-600 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100 whitespace-pre-wrap">{selectedExamDetail.treatment_plan}</p>
                      </div>
                    )}

                    {/* Examination note */}
                    {selectedExamDetail.examination_note && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Muayene Notu</p>
                        <p className="text-sm text-gray-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100 whitespace-pre-wrap">{selectedExamDetail.examination_note}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
                  <button
                    onClick={() => handlePrintExam(selectedExamDetail)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {t('crm.examination.print.printSummary', 'Print Summary')}
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(selectedExam.id)}
                    disabled={pdfLoading}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Reçete PDF İndir
                  </button>
                  <button
                    onClick={() => { setSelectedExam(null); setSelectedExamDetail(null); }}
                    className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>

              {/* Printable Report — hidden on screen, visible on print */}
              <PrintableReport exam={selectedExamDetail} t={t} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CRMExamination;
