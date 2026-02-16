import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Stethoscope, Search, Plus, X, Trash2, ChevronDown, ChevronUp,
  Upload, FileImage, File, Eye, Clock, User, Calendar, Pill,
  ClipboardList, Save, Printer, AlertTriangle, CheckCircle2,
  Heart, Activity, Thermometer, GripHorizontal, ImageIcon,
  ChevronLeft, ChevronRight, ZoomIn,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── ICD-10 Code Database (common codes) ───
const ICD10_DATABASE = [
  { code: 'A09', desc_en: 'Infectious gastroenteritis and colitis', desc_tr: 'Enfeksiyöz gastroenterit ve kolit', category: 'Infectious' },
  { code: 'B34.9', desc_en: 'Viral infection, unspecified', desc_tr: 'Viral enfeksiyon, tanımlanmamış', category: 'Infectious' },
  { code: 'E11', desc_en: 'Type 2 diabetes mellitus', desc_tr: 'Tip 2 diabetes mellitus', category: 'Endocrine' },
  { code: 'E11.9', desc_en: 'Type 2 diabetes mellitus without complications', desc_tr: 'Komplikasyonsuz tip 2 diabetes mellitus', category: 'Endocrine' },
  { code: 'E03.9', desc_en: 'Hypothyroidism, unspecified', desc_tr: 'Hipotiroidizm, tanımlanmamış', category: 'Endocrine' },
  { code: 'E05.9', desc_en: 'Thyrotoxicosis, unspecified', desc_tr: 'Tirotoksikoz, tanımlanmamış', category: 'Endocrine' },
  { code: 'E78.5', desc_en: 'Hyperlipidemia, unspecified', desc_tr: 'Hiperlipidemi, tanımlanmamış', category: 'Endocrine' },
  { code: 'F32.9', desc_en: 'Major depressive disorder, single episode', desc_tr: 'Majör depresif bozukluk, tek epizod', category: 'Mental' },
  { code: 'F41.1', desc_en: 'Generalized anxiety disorder', desc_tr: 'Yaygın anksiyete bozukluğu', category: 'Mental' },
  { code: 'G43.9', desc_en: 'Migraine, unspecified', desc_tr: 'Migren, tanımlanmamış', category: 'Nervous' },
  { code: 'H10.9', desc_en: 'Conjunctivitis, unspecified', desc_tr: 'Konjonktivit, tanımlanmamış', category: 'Eye' },
  { code: 'I10', desc_en: 'Essential (primary) hypertension', desc_tr: 'Esansiyel (primer) hipertansiyon', category: 'Circulatory' },
  { code: 'I25.1', desc_en: 'Atherosclerotic heart disease', desc_tr: 'Aterosklerotik kalp hastalığı', category: 'Circulatory' },
  { code: 'I48.91', desc_en: 'Atrial fibrillation, unspecified', desc_tr: 'Atriyal fibrilasyon, tanımlanmamış', category: 'Circulatory' },
  { code: 'I50.9', desc_en: 'Heart failure, unspecified', desc_tr: 'Kalp yetmezliği, tanımlanmamış', category: 'Circulatory' },
  { code: 'J06.9', desc_en: 'Acute upper respiratory infection', desc_tr: 'Akut üst solunum yolu enfeksiyonu', category: 'Respiratory' },
  { code: 'J18.9', desc_en: 'Pneumonia, unspecified organism', desc_tr: 'Pnömoni, tanımlanmamış organizma', category: 'Respiratory' },
  { code: 'J20.9', desc_en: 'Acute bronchitis, unspecified', desc_tr: 'Akut bronşit, tanımlanmamış', category: 'Respiratory' },
  { code: 'J30.1', desc_en: 'Allergic rhinitis due to pollen', desc_tr: 'Polene bağlı alerjik rinit', category: 'Respiratory' },
  { code: 'J45.9', desc_en: 'Asthma, unspecified', desc_tr: 'Astım, tanımlanmamış', category: 'Respiratory' },
  { code: 'K21.0', desc_en: 'Gastro-esophageal reflux disease with esophagitis', desc_tr: 'Özofajitli gastroözofageal reflü hastalığı', category: 'Digestive' },
  { code: 'K29.7', desc_en: 'Gastritis, unspecified', desc_tr: 'Gastrit, tanımlanmamış', category: 'Digestive' },
  { code: 'K58.9', desc_en: 'Irritable bowel syndrome', desc_tr: 'İrritabl bağırsak sendromu', category: 'Digestive' },
  { code: 'K80.2', desc_en: 'Calculus of gallbladder without obstruction', desc_tr: 'Tıkanıklıksız safra kesesi taşı', category: 'Digestive' },
  { code: 'L20.9', desc_en: 'Atopic dermatitis, unspecified', desc_tr: 'Atopik dermatit, tanımlanmamış', category: 'Skin' },
  { code: 'L50.9', desc_en: 'Urticaria, unspecified', desc_tr: 'Ürtiker, tanımlanmamış', category: 'Skin' },
  { code: 'M54.5', desc_en: 'Low back pain', desc_tr: 'Bel ağrısı', category: 'Musculoskeletal' },
  { code: 'M79.3', desc_en: 'Panniculitis, unspecified', desc_tr: 'Pannikülit, tanımlanmamış', category: 'Musculoskeletal' },
  { code: 'N39.0', desc_en: 'Urinary tract infection, site not specified', desc_tr: 'İdrar yolu enfeksiyonu, yeri belirtilmemiş', category: 'Genitourinary' },
  { code: 'R05', desc_en: 'Cough', desc_tr: 'Öksürük', category: 'Symptoms' },
  { code: 'R10.9', desc_en: 'Unspecified abdominal pain', desc_tr: 'Tanımlanmamış karın ağrısı', category: 'Symptoms' },
  { code: 'R50.9', desc_en: 'Fever, unspecified', desc_tr: 'Ateş, tanımlanmamış', category: 'Symptoms' },
  { code: 'R51', desc_en: 'Headache', desc_tr: 'Baş ağrısı', category: 'Symptoms' },
  { code: 'Z00.0', desc_en: 'Encounter for general adult medical examination', desc_tr: 'Genel yetişkin tıbbi muayene', category: 'Factors' },
  { code: 'Z23', desc_en: 'Encounter for immunization', desc_tr: 'Aşılama için başvuru', category: 'Factors' },
];

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

// ─── Mock Past Examinations ───
const MOCK_EXAMINATIONS = [
  { id: 1, date: '2026-02-16', patient: 'Zeynep Kaya', age: 34, diagnosis: [{ code: 'J30.1', desc: 'Allergic rhinitis due to pollen' }], medications: [{ name: 'Cetirizine 10mg', dosage: '1x daily', duration: '14 days' }], vitals: { bp: '120/80', hr: 72, temp: 36.6, spo2: 98 }, status: 'completed', notes: 'Seasonal allergy symptoms. Follow-up in 2 weeks.' },
  { id: 2, date: '2026-02-16', patient: 'Ali Yilmaz', age: 45, diagnosis: [{ code: 'M54.5', desc: 'Low back pain' }], medications: [{ name: 'Ibuprofen 400mg', dosage: '3x daily', duration: '7 days' }, { name: 'Omeprazole 20mg', dosage: '1x daily', duration: '7 days' }], vitals: { bp: '130/85', hr: 78, temp: 36.8, spo2: 97 }, status: 'completed', notes: 'Lumbar strain. Physical therapy recommended.' },
  { id: 3, date: '2026-02-15', patient: 'Fatma Koc', age: 61, diagnosis: [{ code: 'E11', desc: 'Type 2 diabetes mellitus' }, { code: 'I10', desc: 'Essential hypertension' }], medications: [{ name: 'Metformin 1000mg', dosage: '2x daily', duration: '90 days' }, { name: 'Amlodipine 5mg', dosage: '1x daily', duration: '30 days' }], vitals: { bp: '145/90', hr: 82, temp: 36.5, spo2: 96 }, status: 'completed', notes: 'HbA1c: 7.2%. BP needs monitoring.' },
  { id: 4, date: '2026-02-14', patient: 'Mehmet Ozkan', age: 52, diagnosis: [{ code: 'J06.9', desc: 'Acute upper respiratory infection' }], medications: [{ name: 'Paracetamol 500mg', dosage: 'Every 6 hours', duration: '5 days' }], vitals: { bp: '125/80', hr: 88, temp: 38.2, spo2: 97 }, status: 'completed', notes: 'Viral URI. Rest and fluids.' },
  { id: 5, date: '2026-02-13', patient: 'Ayse Demir', age: 38, diagnosis: [{ code: 'G43.9', desc: 'Migraine, unspecified' }], medications: [{ name: 'Sumatriptan 50mg', dosage: 'As needed', duration: '30 days' }], vitals: { bp: '115/75', hr: 68, temp: 36.4, spo2: 99 }, status: 'completed', notes: 'Headache diary recommended.' },
];

// ─── Mock Patients ───
const MOCK_PATIENTS = [
  { id: 1, name: 'Zeynep Kaya', age: 34, gender: 'F', bloodType: 'A+' },
  { id: 2, name: 'Ali Yilmaz', age: 45, gender: 'M', bloodType: 'O+' },
  { id: 3, name: 'Fatma Koc', age: 61, gender: 'F', bloodType: 'B+' },
  { id: 4, name: 'Mehmet Ozkan', age: 52, gender: 'M', bloodType: 'AB+' },
  { id: 5, name: 'Ayse Demir', age: 38, gender: 'F', bloodType: 'A-' },
  { id: 6, name: 'Elif Arslan', age: 42, gender: 'F', bloodType: 'O-' },
  { id: 7, name: 'Deniz Korkmaz', age: 33, gender: 'M', bloodType: 'B-' },
];

// ═══════════════════════════════════════════════════
// ICD-10 Smart Search Component
// ═══════════════════════════════════════════════════
const ICD10Search = ({ selectedDiagnoses, onAdd, onRemove, t }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return ICD10_DATABASE.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.desc_en.toLowerCase().includes(q) ||
        item.desc_tr.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const handleSelect = (item) => {
    if (!selectedDiagnoses.find((d) => d.code === item.code)) {
      onAdd({ code: item.code, desc: item.desc_en });
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {t('crm.examination.diagnosis')} (ICD-10)
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
            }}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={t('crm.examination.searchICD10')}
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
          />
          {query && (
            <button onClick={() => { setQuery(''); setIsOpen(false); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {results.map((item) => {
              const isSelected = selectedDiagnoses.some((d) => d.code === item.code);
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
                    <p className="text-sm font-medium text-gray-900 truncate">{item.desc_en}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.desc_tr}</p>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isOpen && query.length >= 2 && results.length === 0 && (
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
              <input
                type="text"
                value={med.name}
                onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                placeholder={t('crm.examination.medicationNamePlaceholder')}
                className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
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
// Main CRMExamination Component
// ═══════════════════════════════════════════════════
const CRMExamination = () => {
  const { t } = useTranslation();

  // ─── Tab State ───
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'

  // ─── New Examination Form State ───
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [diagnoses, setDiagnoses] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '', spo2: '', weight: '', height: '' });
  const [examNotes, setExamNotes] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [plan, setPlan] = useState('');
  const [files, setFiles] = useState([]);
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── History State ───
  const [historySearch, setHistorySearch] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);

  // ─── Patient Search ───
  const filteredPatients = useMemo(() => {
    if (!patientSearch) return MOCK_PATIENTS;
    const q = patientSearch.toLowerCase();
    return MOCK_PATIENTS.filter((p) => p.name.toLowerCase().includes(q));
  }, [patientSearch]);

  // ─── History Filter ───
  const filteredHistory = useMemo(() => {
    if (!historySearch) return MOCK_EXAMINATIONS;
    const q = historySearch.toLowerCase();
    return MOCK_EXAMINATIONS.filter(
      (e) =>
        e.patient.toLowerCase().includes(q) ||
        e.diagnosis.some((d) => d.desc.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
    );
  }, [historySearch]);

  // ─── Handlers ───
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  };

  const handleBeforeImage = (e) => {
    const file = e.target.files?.[0];
    if (file) setBeforeImage(URL.createObjectURL(file));
  };

  const handleAfterImage = (e) => {
    const file = e.target.files?.[0];
    if (file) setAfterImage(URL.createObjectURL(file));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  const handleReset = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setDiagnoses([]);
    setMedications([]);
    setVitals({ bp: '', hr: '', temp: '', spo2: '', weight: '', height: '' });
    setExamNotes('');
    setChiefComplaint('');
    setPhysicalExam('');
    setPlan('');
    setFiles([]);
    setBeforeImage(null);
    setAfterImage(null);
    setShowBeforeAfter(false);
  };

  // ─── Stats ───
  const stats = useMemo(() => ({
    today: MOCK_EXAMINATIONS.filter((e) => e.date === '2026-02-16').length,
    total: MOCK_EXAMINATIONS.length,
    thisWeek: MOCK_EXAMINATIONS.filter((e) => e.date >= '2026-02-10').length,
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.examination.title')}</h1>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('crm.examination.todayExams'), value: stats.today, bg: 'bg-teal-50 border-teal-200', color: 'text-teal-700', icon: Stethoscope },
          { label: t('crm.examination.thisWeek'), value: stats.thisWeek, bg: 'bg-blue-50 border-blue-200', color: 'text-blue-700', icon: Calendar },
          { label: t('crm.examination.totalExams'), value: stats.total, bg: 'bg-gray-50 border-gray-200', color: 'text-gray-900', icon: ClipboardList },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${s.bg}`}>
            <s.icon className={`w-5 h-5 ${s.color} opacity-60`} />
            <div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ NEW EXAMINATION TAB ═══ */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-500" />
                {t('crm.examination.patientInfo')}
              </h2>

              <div className="relative">
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                      if (!e.target.value) setSelectedPatient(null);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder={t('crm.examination.searchPatient')}
                    className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
                  />
                </div>

                {showPatientDropdown && filteredPatients.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPatientDropdown(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {p.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.name}</p>
                            <p className="text-[11px] text-gray-400">{p.age} · {p.gender} · {p.bloodType}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {selectedPatient && (
                <div className="bg-teal-50/50 rounded-xl border border-teal-200 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {selectedPatient.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.name}</p>
                    <p className="text-xs text-gray-500">
                      {t('crm.examination.age')}: {selectedPatient.age} · {t('crm.examination.gender')}: {selectedPatient.gender} · {t('crm.examination.bloodType')}: {selectedPatient.bloodType}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Vitals */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" />
                {t('crm.examination.vitals')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'bp', label: t('crm.examination.bloodPressure'), placeholder: '120/80', icon: Heart, unit: 'mmHg' },
                  { key: 'hr', label: t('crm.examination.heartRate'), placeholder: '72', icon: Activity, unit: 'bpm' },
                  { key: 'temp', label: t('crm.examination.temperature'), placeholder: '36.6', icon: Thermometer, unit: '°C' },
                  { key: 'spo2', label: 'SpO₂', placeholder: '98', icon: Activity, unit: '%' },
                  { key: 'weight', label: t('crm.examination.weight'), placeholder: '70', icon: User, unit: 'kg' },
                  { key: 'height', label: t('crm.examination.height'), placeholder: '175', icon: User, unit: 'cm' },
                ].map((v) => (
                  <div key={v.key}>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">{v.label}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={vitals[v.key]}
                        onChange={(e) => setVitals({ ...vitals, [v.key]: e.target.value })}
                        placeholder={v.placeholder}
                        className="w-full h-10 px-3 pr-12 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">{v.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chief Complaint & Exam Notes */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-500" />
                {t('crm.examination.examNotes')}
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.examination.chiefComplaint')}</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder={t('crm.examination.chiefComplaintPlaceholder')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.examination.physicalExam')}</label>
                <textarea
                  rows={3}
                  value={physicalExam}
                  onChange={(e) => setPhysicalExam(e.target.value)}
                  placeholder={t('crm.examination.physicalExamPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.examination.additionalNotes')}</label>
                <textarea
                  rows={3}
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  placeholder={t('crm.examination.additionalNotesPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.examination.plan')}</label>
                <textarea
                  rows={2}
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder={t('crm.examination.planPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* ICD-10 Diagnosis */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
              <ICD10Search
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
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? t('common.loading') : saveSuccess ? t('crm.examination.saved') : t('crm.examination.saveExamination')}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors">
                  <Printer className="w-3.5 h-3.5" />
                  {t('common.print')}
                </button>
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
            </div>

            <div className="divide-y divide-gray-50">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Stethoscope className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">{t('common.noResults')}</p>
                </div>
              ) : (
                filteredHistory.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExam(exam)}
                    className="px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {exam.patient.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{exam.patient}</p>
                            <span className="text-[11px] text-gray-400">{exam.date}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {exam.diagnosis.map((d) => (
                              <span
                                key={d.code}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg border border-teal-200"
                              >
                                <span className="font-bold">{d.code}</span> {d.desc}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {exam.medications.map((m, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200"
                              >
                                <Pill className="w-2.5 h-2.5" /> {m.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-gray-400">{t('crm.examination.bloodPressure')}: <span className="font-medium text-gray-600">{exam.vitals.bp}</span></p>
                          <p className="text-[10px] text-gray-400">HR: <span className="font-medium text-gray-600">{exam.vitals.hr}</span></p>
                        </div>
                        <Eye className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Exam Detail Modal */}
          {selectedExam && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">{t('crm.examination.examDetails')}</h2>
                  <button
                    onClick={() => setSelectedExam(null)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-900">{selectedExam.patient}</p>
                      <p className="text-xs text-gray-500">{t('crm.examination.age')} {selectedExam.age} · {selectedExam.date}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize bg-emerald-50 text-emerald-700 border-emerald-200">
                      {selectedExam.status}
                    </span>
                  </div>

                  {/* Vitals */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('crm.examination.vitals')}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'BP', value: selectedExam.vitals.bp, unit: 'mmHg' },
                        { label: 'HR', value: selectedExam.vitals.hr, unit: 'bpm' },
                        { label: 'Temp', value: selectedExam.vitals.temp, unit: '°C' },
                        { label: 'SpO₂', value: selectedExam.vitals.spo2, unit: '%' },
                      ].map((v) => (
                        <div key={v.label} className="bg-gray-50 rounded-lg px-3 py-2 text-center border border-gray-100">
                          <p className="text-xs font-bold text-gray-900">{v.value}</p>
                          <p className="text-[9px] text-gray-400">{v.label} ({v.unit})</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diagnoses */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('crm.examination.diagnosis')}</p>
                    <div className="space-y-1.5">
                      {selectedExam.diagnosis.map((d) => (
                        <div key={d.code} className="bg-teal-50 rounded-lg px-3 py-2 border border-teal-100">
                          <span className="text-xs font-bold text-teal-700">{d.code}</span>
                          <span className="text-xs text-teal-600 ml-2">{d.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medications */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('crm.examination.medications')}</p>
                    <div className="space-y-2">
                      {selectedExam.medications.map((m, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-teal-500" />{m.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-gray-500">{t('crm.prescriptions.dosage')}: <strong className="text-gray-700">{m.dosage}</strong></span>
                            <span className="text-[11px] text-gray-500">{t('crm.prescriptions.duration')}: <strong className="text-gray-700">{m.duration}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedExam.notes && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('common.notes')}</p>
                      <p className="text-sm text-gray-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">{selectedExam.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5" /> {t('common.print')}
                  </button>
                  <button
                    onClick={() => setSelectedExam(null)}
                    className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CRMExamination;
