import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorProfileAPI } from '../lib/api';
import {
  Stethoscope, GraduationCap, Briefcase, MapPin, Check, ChevronRight, ChevronLeft,
  Plus, X, Loader2, DollarSign
} from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Professional Info', icon: Stethoscope },
  { id: 1, label: 'Education & Experience', icon: GraduationCap },
  { id: 2, label: 'Services & Pricing', icon: Briefcase },
  { id: 3, label: 'Location & Contact', icon: MapPin },
];

export default function DoctorOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Step 0 — Professional Info
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState(['Turkish']);
  const [newLang, setNewLang] = useState('');

  // Step 1 — Education
  const [education, setEducation] = useState([{ degree: '', school: '', year: '' }]);
  const [certifications, setCertifications] = useState([]);

  // Step 2 — Services & Pricing
  const [services, setServices] = useState([{ name: '', description: '' }]);
  const [prices, setPrices] = useState([{ label: '', min: '', max: '', currency: '₺' }]);
  const [onlineConsultation, setOnlineConsultation] = useState(false);

  // Step 3 — Location
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Load existing profile
  useEffect(() => {
    doctorProfileAPI.get().then(res => {
      const p = res?.profile || res?.data?.profile;
      if (p) {
        if (p.onboarding_completed) {
          navigate('/crm', { replace: true });
          return;
        }
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
        if (p.online_consultation) setOnlineConsultation(p.online_consultation);
        if (p.address) setAddress(p.address);
        if (p.phone) setPhone(p.phone);
        if (p.website) setWebsite(p.website);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  const saveStep = async (nextStep) => {
    setSaving(true);
    try {
      const stepData = {};
      if (step === 0) {
        Object.assign(stepData, { title, specialty, experience_years: experienceYears, license_number: licenseNumber, bio, languages });
      } else if (step === 1) {
        Object.assign(stepData, { education: education.filter(e => e.degree || e.school), certifications: certifications.filter(c => c.name) });
      } else if (step === 2) {
        Object.assign(stepData, { services: services.filter(s => s.name), prices: prices.filter(p => p.label), online_consultation: onlineConsultation });
      } else if (step === 3) {
        Object.assign(stepData, { address, phone, website });
      }
      await doctorProfileAPI.updateOnboarding({ step, ...stepData });
      if (nextStep !== undefined) {
        setStep(nextStep);
      }
    } catch (err) {
      console.error('Save step failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      saveStep(step + 1);
    } else {
      // Final step — complete onboarding
      setSaving(true);
      const stepData = { address, phone, website };
      doctorProfileAPI.updateOnboarding({ step: 3, ...stepData }).then(() => {
        navigate('/crm', { replace: true });
      }).catch(() => {}).finally(() => setSaving(false));
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      doctorProfileAPI.updateOnboarding({ step: 3 }).then(() => {
        navigate('/crm', { replace: true });
      }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo/medgama-logo.svg" alt="MedGama" className="h-7" onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h1 className="text-sm font-bold text-gray-900">Complete Your Profile</h1>
              <p className="text-xs text-gray-500">Welcome, {user?.name || 'Doctor'}</p>
            </div>
          </div>
          <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
            Skip for now
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => { if (i < step) setStep(i); }}
                className={`flex flex-col items-center gap-1.5 transition-all ${i <= step ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  i < step ? 'bg-teal-600 text-white shadow-sm' :
                  i === step ? 'bg-teal-50 text-teal-700 ring-2 ring-teal-500' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${i === step ? 'text-teal-700' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${i < step ? 'bg-teal-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 pb-32">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">

          {/* Step 0: Professional Info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Professional Information</h2>
                <p className="text-sm text-gray-500">Tell patients about your medical expertise</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Kardiyoloji Uzmanı" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty *</label>
                  <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g. Cardiology" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience</label>
                  <input value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="e.g. 15+" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
                  <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="Medical license #" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">About / Biography</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell patients about yourself, your approach, and your experience..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none" />
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
                  <input value={newLang} onChange={e => setNewLang(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newLang.trim()) { setLanguages(l => [...l, newLang.trim()]); setNewLang(''); }}} placeholder="Add language" className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" />
                  <button type="button" onClick={() => { if (newLang.trim()) { setLanguages(l => [...l, newLang.trim()]); setNewLang(''); }}} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Education & Experience */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Education & Certifications</h2>
                <p className="text-sm text-gray-500">Your academic background and qualifications</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Education</label>
                  <button type="button" onClick={() => setEducation(e => [...e, { degree: '', school: '', year: '' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-3">
                  {education.map((edu, i) => (
                    <div key={i} className="grid sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                      {education.length > 1 && (
                        <button type="button" onClick={() => setEducation(e => e.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      )}
                      <input value={edu.degree} onChange={e => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} placeholder="Degree (e.g. MD)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={edu.school} onChange={e => { const n = [...education]; n[i].school = e.target.value; setEducation(n); }} placeholder="School / University" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={edu.year} onChange={e => { const n = [...education]; n[i].year = e.target.value; setEducation(n); }} placeholder="Year" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
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
                  <p className="text-xs text-gray-400 italic">No certifications added yet</p>
                ) : (
                  <div className="space-y-3">
                    {certifications.map((cert, i) => (
                      <div key={i} className="grid sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                        <button type="button" onClick={() => setCertifications(c => c.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        <input value={cert.name} onChange={e => { const n = [...certifications]; n[i].name = e.target.value; setCertifications(n); }} placeholder="Certification name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                        <input value={cert.issuer} onChange={e => { const n = [...certifications]; n[i].issuer = e.target.value; setCertifications(n); }} placeholder="Issuing body" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                        <input value={cert.year} onChange={e => { const n = [...certifications]; n[i].year = e.target.value; setCertifications(n); }} placeholder="Year" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Services & Pricing */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Services & Pricing</h2>
                <p className="text-sm text-gray-500">What services do you offer and at what price range?</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Services</label>
                  <button type="button" onClick={() => setServices(s => [...s, { name: '', description: '' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-3">
                  {services.map((svc, i) => (
                    <div key={i} className="grid sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                      {services.length > 1 && (
                        <button type="button" onClick={() => setServices(s => s.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      )}
                      <input value={svc.name} onChange={e => { const n = [...services]; n[i].name = e.target.value; setServices(n); }} placeholder="Service name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={svc.description} onChange={e => { const n = [...services]; n[i].description = e.target.value; setServices(n); }} placeholder="Brief description" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Price Range</label>
                  <button type="button" onClick={() => setPrices(p => [...p, { label: '', min: '', max: '', currency: '₺' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-3">
                  {prices.map((pr, i) => (
                    <div key={i} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                      {prices.length > 1 && (
                        <button type="button" onClick={() => setPrices(p => p.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      )}
                      <input value={pr.label} onChange={e => { const n = [...prices]; n[i].label = e.target.value; setPrices(n); }} placeholder="Service" className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={pr.min} onChange={e => { const n = [...prices]; n[i].min = e.target.value; setPrices(n); }} placeholder="Min ₺" type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={pr.max} onChange={e => { const n = [...prices]; n[i].max = e.target.value; setPrices(n); }} placeholder="Max ₺" type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                    </div>
                  ))}
                </div>
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

          {/* Step 3: Location & Contact */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Location & Contact</h2>
                <p className="text-sm text-gray-500">Help patients find and reach you</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Office Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Step {step + 1} of {STEPS.length}</span>
            <button
              onClick={handleNext}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === 3 ? 'Complete' : 'Next'}
              {step < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
