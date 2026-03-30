import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { clinicAPI, catalogAPI } from '../lib/api';
import MapboxSearchInput from '../components/map/MapboxSearchInput';
import {
  Building2, MapPin, Phone, FileText, Camera, Loader2,
  CheckCircle2, ChevronRight, ChevronLeft, Stethoscope,
  UserPlus, Mail, Award, Sparkles, Search, X, Users
} from 'lucide-react';

const STEPS = [
  { key: 'profile', icon: Building2, label: 'Clinic Profile' },
  { key: 'specialties', icon: Stethoscope, label: 'Specialties' },
  { key: 'team', icon: Users, label: 'Team Setup' },
];

export default function ClinicOnboarding() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicId, setClinicId] = useState(null);

  // Step 0: Profile
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [phone, setPhone] = useState('');
  const [biography, setBiography] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Step 1: Specialties
  const [allSpecialties, setAllSpecialties] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [specSearch, setSpecSearch] = useState('');
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  // Step 2: Team
  const [doctors, setDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({ fullname: '', email: '', specialty: '', password: '' });
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [doctorError, setDoctorError] = useState('');

  // Fetch onboarding state
  useEffect(() => {
    clinicAPI.onboardingProfile().then(res => {
      const c = res?.clinic;
      if (c) {
        setClinicId(c.id);
        setName(c.name || c.fullname || '');
        setAddress(c.address || '');
        setLatitude(c.latitude);
        setLongitude(c.longitude);
        setPhone(c.phone || '');
        setBiography(c.biography || '');
        setSelectedSpecialties(c.specialties || []);
        if (c.avatar) setLogoPreview(c.avatar);
        if (c.onboarding_step > 0) setStep(Math.min(c.onboarding_step, 2));
      }
      if (res?.doctors?.length) setDoctors(res.doctors);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Fetch specialties
  useEffect(() => {
    setLoadingSpecs(true);
    catalogAPI.specialties().then(res => {
      const items = res?.specialties || res?.data?.specialties || res?.data || [];
      setAllSpecialties(Array.isArray(items) ? items : []);
    }).catch(() => {}).finally(() => setLoadingSpecs(false));
  }, []);

  const filteredSpecialties = allSpecialties.filter(sp => {
    if (!specSearch) return true;
    const q = specSearch.toLowerCase();
    const name = (sp.name || '').toLowerCase();
    const code = (sp.code || '').toLowerCase();
    const desc = (sp.description || '').toLowerCase();
    // Check translated names and descriptions for colloquial search terms
    const nameTr = Object.values(sp.name_translations || {}).join(' ').toLowerCase();
    const descTr = Object.values(sp.description_translations || {}).join(' ').toLowerCase();
    return name.includes(q) || code.includes(q) || desc.includes(q) || nameTr.includes(q) || descTr.includes(q);
  });

  const toggleSpecialty = (sp) => {
    setSelectedSpecialties(prev => {
      const exists = prev.find(s => s.id === sp.id);
      if (exists) return prev.filter(s => s.id !== sp.id);
      return [...prev, { id: sp.id, name: sp.name, code: sp.code }];
    });
  };

  const saveStep = useCallback(async (nextStep) => {
    // Validation
    if (step === 0 && !name.trim()) {
      alert('Please enter clinic name');
      return;
    }

    setSaving(true);
    try {
      if (step === 0) {
        const payload = { step: 0, name, phone, biography };
        // Only add address and coordinates if they exist
        if (address) payload.address = address;
        if (latitude) payload.latitude = latitude;
        if (longitude) payload.longitude = longitude;
        
        await clinicAPI.updateOnboarding(payload);
        
        // Upload logo if selected
        if (logoFile) {
          const logoRes = await clinicAPI.uploadLogo(logoFile);
          if (logoRes?.avatar) setLogoPreview(logoRes.avatar);
        }
        // Refetch to get clinic id
        const fresh = await clinicAPI.onboardingProfile();
        if (fresh?.clinic?.id) setClinicId(fresh.clinic.id);
      } else if (step === 1) {
        await clinicAPI.updateOnboarding({ step: 1, specialties: selectedSpecialties });
      } else if (step === 2) {
        await clinicAPI.updateOnboarding({ step: 2 });
        updateUser({ onboarding_completed: true });
        navigate('/clinic/dashboard', { replace: true });
        return;
      }
      setStep(nextStep);
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving: ' + (err?.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [step, name, address, latitude, longitude, phone, biography, logoFile, selectedSpecialties, updateUser, navigate]);

  const addDoctor = async () => {
    if (!newDoctor.fullname || !newDoctor.email) {
      setDoctorError('Name and email are required.');
      return;
    }
    if (!clinicId) {
      setDoctorError('Clinic not created yet.');
      return;
    }
    setAddingDoctor(true);
    setDoctorError('');
    try {
      const res = await clinicAPI.createStaff(clinicId, {
        ...newDoctor,
        password: newDoctor.password || 'Temp1234!',
      });
      const doc = res?.doctor;
      if (doc) setDoctors(prev => [...prev, { id: doc.id, fullname: doc.fullname, email: doc.email, is_active: true }]);
      setNewDoctor({ fullname: '', email: '', specialty: '', password: '' });
    } catch (err) {
      setDoctorError(err?.message || err?.response?.data?.message || 'Failed to add doctor.');
    } finally {
      setAddingDoctor(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src="/images/logo/logo.svg" alt="MedaGama" className="h-10 w-auto" />
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.key}>
                {i > 0 && <div className={`h-0.5 w-8 sm:w-12 rounded-full ${done ? 'bg-teal-500' : 'bg-gray-200'}`} />}
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    done ? 'bg-teal-500 text-white shadow-md shadow-teal-200/50' :
                    active ? 'bg-teal-600 text-white shadow-lg shadow-teal-200/50 scale-110' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] font-semibold ${active ? 'text-teal-700' : done ? 'text-teal-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden">

          {/* ─── Step 0: Profile ─── */}
          {step === 0 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('clinicOnboarding.profileTitle', 'Clinic Profile')}</h2>
                  <p className="text-xs text-gray-500">{t('clinicOnboarding.profileSubtitle', 'Basic information about your clinic')}</p>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors shadow-md">
                    <Camera className="w-3.5 h-3.5 text-white" />
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('clinicOnboarding.clinicLogo', 'Clinic Logo')}</p>
                  <p className="text-xs text-gray-400">{t('clinicOnboarding.logoHint', 'JPG, PNG or SVG, max 5MB')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicOnboarding.clinicName', 'Clinic Name')} *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                    placeholder={t('clinicOnboarding.clinicNamePlaceholder', 'e.g., MedaGama Health Center')} />
                </div>
                <MapboxSearchInput
                  value={address}
                  onChange={(selectedAddress, coordinates) => {
                    setAddress(selectedAddress);
                    if (coordinates) {
                      setLatitude(coordinates.lat);
                      setLongitude(coordinates.lng);
                    }
                  }}
                  label={t('clinicOnboarding.address', 'Address')}
                  placeholder={t('clinicOnboarding.addressPlaceholder', 'Search for your clinic address...')}
                  hint={t('clinicOnboarding.addressHint', 'Please enter your full address (e.g., Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul) and select from the list. The map will automatically generate coordinates.')}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicOnboarding.phone', 'Phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                      placeholder="+90 555 123 4567" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicOnboarding.description', 'Short Description')}</label>
                  <textarea value={biography} onChange={e => setBiography(e.target.value)} rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none"
                    placeholder={t('clinicOnboarding.descriptionPlaceholder', 'Tell patients what makes your clinic special...')} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 1: Specialties ─── */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('clinicOnboarding.specialtiesTitle', 'Medical Specialties')}</h2>
                  <p className="text-xs text-gray-500">{t('clinicOnboarding.specialtiesSubtitle', 'Select the departments your clinic offers')}</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={specSearch} onChange={e => setSpecSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                  placeholder={t('clinicOnboarding.searchSpecialties', 'Search specialties...')} />
              </div>

              {/* Selected tags */}
              {selectedSpecialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSpecialties.map(sp => (
                    <span key={sp.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold border border-teal-200/60">
                      {sp.name}
                      <button onClick={() => toggleSpecialty(sp)} className="hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Grid */}
              {loadingSpecs ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
                  {filteredSpecialties.map(sp => {
                    const selected = selectedSpecialties.some(s => s.id === sp.id);
                    return (
                      <button key={sp.id} onClick={() => toggleSpecialty(sp)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                          selected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50/40'
                        }`}>
                        <Stethoscope className={`w-3.5 h-3.5 flex-shrink-0 ${selected ? 'text-white/80' : 'text-gray-400'}`} />
                        <span className="truncate">{sp.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Step 2: Team Setup ─── */}
          {step === 2 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('clinicOnboarding.teamTitle', 'Team Setup')}</h2>
                  <p className="text-xs text-gray-500">{t('clinicOnboarding.teamSubtitle', 'Add at least one doctor to your clinic')}</p>
                </div>
              </div>

              {/* Existing doctors */}
              {doctors.length > 0 && (
                <div className="mb-5 space-y-2">
                  {doctors.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.fullname}</p>
                        <p className="text-xs text-gray-500 truncate">{doc.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                        {doc.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add doctor form */}
              <div className="bg-gray-50/80 rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-semibold text-gray-700">{t('clinicOnboarding.addDoctor', 'Add Doctor')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={newDoctor.fullname} onChange={e => setNewDoctor(p => ({ ...p, fullname: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    placeholder={t('clinicOnboarding.doctorName', 'Full Name')} />
                  <input value={newDoctor.email} onChange={e => setNewDoctor(p => ({ ...p, email: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    placeholder={t('clinicOnboarding.doctorEmail', 'Email Address')} type="email" />
                  <input value={newDoctor.specialty} onChange={e => setNewDoctor(p => ({ ...p, specialty: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    placeholder={t('clinicOnboarding.doctorSpecialty', 'Specialty (optional)')} />
                  <input value={newDoctor.password} onChange={e => setNewDoctor(p => ({ ...p, password: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    placeholder={t('clinicOnboarding.tempPassword', 'Temp Password (min 6)')} type="password" />
                </div>
                {doctorError && <p className="text-xs text-red-500 mt-2">{doctorError}</p>}
                <button onClick={addDoctor} disabled={addingDoctor}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
                  {addingDoctor ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {t('clinicOnboarding.addDoctorBtn', 'Add to Team')}
                </button>
              </div>
            </div>
          )}

          {/* ─── Footer Actions ─── */}
          <div className="border-t border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between bg-gray-50/40">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('common.back', 'Back')}
              </button>
            ) : <div />}

            <button
              onClick={() => step < 2 ? saveStep(step + 1) : saveStep(step)}
              disabled={saving || (step === 0 && !name.trim())}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md shadow-teal-200/50 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === 2 ? (
                <>{t('clinicOnboarding.finish', 'Finish Setup')} <Sparkles className="w-4 h-4" /></>
              ) : (
                <>{t('common.next', 'Next')} <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        {/* Skip */}
        {step === 2 && (
          <div className="text-center mt-4">
            <button onClick={() => saveStep(2)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {t('clinicOnboarding.skipTeam', 'Skip for now, I\'ll add team members later')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
