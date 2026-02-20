import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorProfileAPI } from '../lib/api';
import {
  Stethoscope, GraduationCap, Briefcase, MapPin, Check, ChevronRight, ChevronLeft,
  Plus, X, Loader2, AlertCircle, PartyPopper
} from 'lucide-react';

const PHONE_CODES = [
  { code: '+90', flag: '🇹🇷', label: 'TR' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+31', flag: '🇳🇱', label: 'NL' },
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
  { code: '+7', flag: '🇷🇺', label: 'RU' },
  { code: '+966', flag: '🇸🇦', label: 'SA' },
  { code: '+971', flag: '🇦🇪', label: 'AE' },
  { code: '+55', flag: '🇧🇷', label: 'BR' },
  { code: '+351', flag: '🇵🇹', label: 'PT' },
];

// Format number with thousand separators (Turkish style: 10.000)
const formatThousands = (val) => {
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
};

// Parse formatted price back to raw number string
const parsePrice = (val) => String(val).replace(/\D/g, '');

// Format phone digits: 5XX XXX XX XX
const formatPhoneDigits = (val) => {
  const d = val.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + ' ' + d.slice(3);
  if (d.length <= 8) return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6);
  return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6, 8) + ' ' + d.slice(8);
};

const STEPS = [
  { id: 0, label: 'Professional Info', icon: Stethoscope },
  { id: 1, label: 'Education', icon: GraduationCap },
  { id: 2, label: 'Services & Pricing', icon: Briefcase },
  { id: 3, label: 'Location', icon: MapPin },
];

/**
 * DoctorOnboardingModal — shown as an unclosable overlay when doctor hasn't completed onboarding.
 * Props: { open, onComplete }
 */
export default function DoctorOnboardingModal({ open, onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Step 0
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState(['Turkish']);
  const [newLang, setNewLang] = useState('');

  // Step 1
  const [education, setEducation] = useState([{ degree: '', school: '', year: '' }]);
  const [certifications, setCertifications] = useState([]);

  // Step 2
  const [services, setServices] = useState([{ name: '', description: '' }]);
  const [prices, setPrices] = useState([{ label: '', min: '', max: '', currency: '₺' }]);
  const [consultationDuration, setConsultationDuration] = useState('30');
  const [onlineConsultation, setOnlineConsultation] = useState(false);

  // Step 3
  const [address, setAddress] = useState('');
  const [phoneCode, setPhoneCode] = useState('+90');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [website, setWebsite] = useState('');

  // Welcome modal
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  // Derived full phone
  const phone = phoneDigits ? `${phoneCode} ${formatPhoneDigits(phoneDigits)}` : '';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    doctorProfileAPI.get().then(res => {
      const p = res?.profile || res?.data?.profile;
      if (p) {
        if (p.onboarding_completed) { onComplete?.(); return; }
        setStep(p.onboarding_step || 0);
        if (p.title) setTitle(p.title);
        if (p.specialty) setSpecialty(p.specialty);
        if (p.experience_years) setExperienceYears(p.experience_years);
        if (p.license_number) setLicenseNumber(p.license_number);
        if (p.bio) setBio(p.bio);
        if (p.languages?.length) setLanguages(p.languages);
        if (p.education?.length) setEducation(p.education);
        if (p.certifications?.length) setCertifications(p.certifications);
        if (p.services?.length) setServices(p.services);
        if (p.prices?.length) setPrices(p.prices);
        if (p.consultation_duration) setConsultationDuration(String(p.consultation_duration));
        if (p.online_consultation) setOnlineConsultation(p.online_consultation);
        if (p.address) setAddress(p.address);
        if (p.phone) {
          // Parse existing phone into code + digits
          const match = p.phone.match(/^(\+\d{1,3})\s*(.*)$/);
          if (match) {
            setPhoneCode(match[1]);
            setPhoneDigits(match[2].replace(/\D/g, ''));
          } else {
            setPhoneDigits(p.phone.replace(/\D/g, ''));
          }
        }
        if (p.website) setWebsite(p.website);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  const validateStep0 = () => {
    const e = {};
    if (!title.trim()) e.title = 'Professional title is required';
    if (!specialty.trim()) e.specialty = 'Specialty is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveStep = async (nextStep) => {
    if (step === 0 && !validateStep0()) return;
    setSaving(true);
    try {
      const stepData = {};
      if (step === 0) Object.assign(stepData, { title, specialty, experience_years: experienceYears, license_number: licenseNumber, bio, languages });
      else if (step === 1) Object.assign(stepData, { education: education.filter(e => e.degree || e.school), certifications: certifications.filter(c => c.name) });
      else if (step === 2) Object.assign(stepData, { services: services.filter(s => s.name), prices: prices.filter(p => p.label), consultation_duration: Number(consultationDuration) || 30, online_consultation: onlineConsultation });
      else if (step === 3) Object.assign(stepData, { address, phone, website });
      await doctorProfileAPI.updateOnboarding({ step, ...stepData });
      if (nextStep !== undefined) setStep(nextStep);
    } catch (err) { console.error('Save step failed:', err); }
    finally { setSaving(false); }
  };

  const handleNext = () => {
    if (step < 3) { saveStep(step + 1); }
    else {
      if (step === 0 && !validateStep0()) return;
      setSaving(true);
      doctorProfileAPI.updateOnboarding({ step: 3, address, phone, website })
        .then(() => setShowWelcome(true))
        .catch(() => {})
        .finally(() => setSaving(false));
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    onComplete?.();
    navigate('/dashboard');
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  if (!open) return null;

  const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all";
  const inputErrCls = "w-full border border-red-400 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all";
  const smallInputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop — no click to close */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-bold text-gray-900">Complete Your Profile</h1>
              <p className="text-xs text-gray-500 mt-0.5">Welcome, {user?.name || 'Doctor'}! Fill in the required fields to get started.</p>
            </div>
          </div>
          {/* Progress Steps */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex items-center gap-1.5 transition-all ${i <= step ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                    i < step ? 'bg-teal-600 text-white' :
                    i === step ? 'bg-white text-teal-700 ring-2 ring-teal-500 shadow-sm' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:block ${i === step ? 'text-teal-700' : 'text-gray-500'}`}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 rounded-full ${i < step ? 'bg-teal-500' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-teal-600 animate-spin" /></div>
          ) : (
            <>
              {/* Step 0 */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Title <span className="text-red-500">*</span></label>
                      <input value={title} onChange={e => { setTitle(e.target.value); setErrors(er => ({...er, title: undefined})); }} placeholder="e.g. Kardiyoloji Uzmanı" className={errors.title ? inputErrCls : inputCls} />
                      {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty <span className="text-red-500">*</span></label>
                      <input value={specialty} onChange={e => { setSpecialty(e.target.value); setErrors(er => ({...er, specialty: undefined})); }} placeholder="e.g. Cardiology" className={errors.specialty ? inputErrCls : inputCls} />
                      {errors.specialty && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.specialty}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience</label>
                      <input value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="e.g. 15+" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
                      <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="Medical license #" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">About / Biography</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell patients about yourself..." className={inputCls + ' resize-none'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Languages</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {languages.map((lang, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                          {lang}
                          <button type="button" onClick={() => setLanguages(l => l.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newLang} onChange={e => setNewLang(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newLang.trim()) { e.preventDefault(); setLanguages(l => [...l, newLang.trim()]); setNewLang(''); }}} placeholder="Add language" className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <button type="button" onClick={() => { if (newLang.trim()) { setLanguages(l => [...l, newLang.trim()]); setNewLang(''); }}} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">Education</label>
                      <button type="button" onClick={() => setEducation(e => [...e, { degree: '', school: '', year: '' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {education.map((edu, i) => (
                        <div key={i} className="grid sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                          {education.length > 1 && <button type="button" onClick={() => setEducation(e => e.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                          <input value={edu.degree} onChange={e => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} placeholder="Degree" className={smallInputCls} />
                          <input value={edu.school} onChange={e => { const n = [...education]; n[i].school = e.target.value; setEducation(n); }} placeholder="School" className={smallInputCls} />
                          <input value={edu.year} onChange={e => { const raw = e.target.value.replace(/\D/g, '').slice(0, 4); const n = [...education]; n[i].year = raw; setEducation(n); }} placeholder="Year" inputMode="numeric" maxLength={4} className={smallInputCls} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">Certifications</label>
                      <button type="button" onClick={() => setCertifications(c => [...c, { name: '', issuer: '', year: '' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    {certifications.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No certifications added yet — optional</p>
                    ) : (
                      <div className="space-y-2">
                        {certifications.map((cert, i) => (
                          <div key={i} className="grid sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                            <button type="button" onClick={() => setCertifications(c => c.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                            <input value={cert.name} onChange={e => { const n = [...certifications]; n[i].name = e.target.value; setCertifications(n); }} placeholder="Name" className={smallInputCls} />
                            <input value={cert.issuer} onChange={e => { const n = [...certifications]; n[i].issuer = e.target.value; setCertifications(n); }} placeholder="Issuer" className={smallInputCls} />
                            <input value={cert.year} onChange={e => { const raw = e.target.value.replace(/\D/g, '').slice(0, 4); const n = [...certifications]; n[i].year = raw; setCertifications(n); }} placeholder="Year" inputMode="numeric" maxLength={4} className={smallInputCls} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">Services</label>
                      <button type="button" onClick={() => setServices(s => [...s, { name: '', description: '' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {services.map((svc, i) => (
                        <div key={i} className="grid sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                          {services.length > 1 && <button type="button" onClick={() => setServices(s => s.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                          <input value={svc.name} onChange={e => { const n = [...services]; n[i].name = e.target.value; setServices(n); }} placeholder="Service name" className={smallInputCls} />
                          <input value={svc.description} onChange={e => { const n = [...services]; n[i].description = e.target.value; setServices(n); }} placeholder="Description" className={smallInputCls} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">Price Range</label>
                      <button type="button" onClick={() => setPrices(p => [...p, { label: '', min: '', max: '', currency: '₺' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {prices.map((pr, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                          {prices.length > 1 && <button type="button" onClick={() => setPrices(p => p.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                          <input value={pr.label} onChange={e => { const n = [...prices]; n[i].label = e.target.value; setPrices(n); }} placeholder="Service" className={'col-span-2 ' + smallInputCls} />
                          <input value={formatThousands(pr.min)} onChange={e => { const n = [...prices]; n[i].min = parsePrice(e.target.value); setPrices(n); }} placeholder="Min ₺" inputMode="numeric" className={smallInputCls} />
                          <input value={formatThousands(pr.max)} onChange={e => { const n = [...prices]; n[i].max = parsePrice(e.target.value); setPrices(n); }} placeholder="Max ₺" inputMode="numeric" className={smallInputCls} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Duration</label>
                    <select
                      value={consultationDuration}
                      onChange={e => setConsultationDuration(e.target.value)}
                      className="w-full sm:w-48 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white"
                    >
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Appointment slots will be generated based on this duration</p>
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-teal-50/50 rounded-xl border border-teal-100 cursor-pointer">
                    <input type="checkbox" checked={onlineConsultation} onChange={e => setOnlineConsultation(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Online Consultation Available</span>
                      <p className="text-xs text-gray-500">Patients can book video consultations</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Office Address</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul" className={inputCls} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <div className="flex gap-0">
                        <select
                          value={phoneCode}
                          onChange={e => setPhoneCode(e.target.value)}
                          className="border border-gray-300 border-r-0 rounded-l-xl px-2 py-2.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-w-[90px]"
                        >
                          {PHONE_CODES.map(pc => (
                            <option key={pc.code} value={pc.code}>{pc.flag} {pc.code}</option>
                          ))}
                        </select>
                        <input
                          value={formatPhoneDigits(phoneDigits)}
                          onChange={e => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="5XX XXX XX XX"
                          inputMode="numeric"
                          maxLength={13}
                          className="flex-1 border border-gray-300 rounded-r-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                      <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className={inputCls} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">{step + 1} / {STEPS.length}</span>
            <button
              onClick={handleNext}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === 3 ? 'Complete Profile' : 'Next'}
              {step < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-8 pt-10 pb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to MedGama!</h2>
              <p className="text-teal-100 text-sm">Your profile is now complete</p>
            </div>
            <div className="px-8 py-6 text-center">
              <p className="text-gray-600 text-sm leading-relaxed mb-1">
                Congratulations, <strong>{user?.name || 'Doctor'}</strong>! Your professional profile has been set up successfully.
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Patients can now find you and book appointments. You can update your profile anytime from your dashboard.
              </p>
              <button
                onClick={handleWelcomeClose}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
