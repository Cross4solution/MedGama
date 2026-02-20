import React, { useState, useEffect } from 'react';
import {
  Settings, User, Bell, Shield, Clock, Globe, Palette, Mail,
  Phone, MapPin, Camera, Save, Eye, EyeOff, Lock, Key,
  Monitor, Smartphone, LogOut, Trash2, ChevronRight, Building2,
  Stethoscope, Calendar, CreditCard, Loader2, CheckCircle, Plus, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { doctorProfileAPI } from '../../lib/api';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'clinic', label: 'Clinic Info', icon: Building2 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'schedule', label: 'Schedule', icon: Clock },
  { key: 'billing', label: 'Billing', icon: CreditCard },
];

const CRMSettings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    specialty: '', title: '', bio: '', experienceYears: '', licenseNumber: '',
    language: 'en',
  });
  const [doctorServices, setDoctorServices] = useState([]);
  const [doctorPrices, setDoctorPrices] = useState([]);
  const [doctorEducation, setDoctorEducation] = useState([]);
  const [doctorLanguages, setDoctorLanguages] = useState([]);
  const [onlineConsultation, setOnlineConsultation] = useState(false);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [doctorWebsite, setDoctorWebsite] = useState('');

  // Load doctor profile from API
  useEffect(() => {
    const names = (user?.name || '').split(' ');
    setProfile(p => ({ ...p, firstName: names[0] || '', lastName: names.slice(1).join(' ') || '', email: user?.email || '' }));
    if (user?.role === 'doctor' || user?.role_id === 'doctor') {
      doctorProfileAPI.get().then(res => {
        const dp = res?.profile || res?.data?.profile;
        if (dp) {
          setProfile(p => ({
            ...p,
            specialty: dp.specialty || '',
            title: dp.title || '',
            bio: dp.bio || '',
            experienceYears: dp.experience_years || '',
            licenseNumber: dp.license_number || '',
            phone: dp.phone || p.phone,
          }));
          setDoctorServices(dp.services || []);
          setDoctorPrices(dp.prices || []);
          setDoctorEducation(dp.education || []);
          setDoctorLanguages(dp.languages || []);
          setOnlineConsultation(!!dp.online_consultation);
          setDoctorAddress(dp.address || '');
          setDoctorWebsite(dp.website || '');
        }
      }).catch(() => {}).finally(() => setProfileLoading(false));
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await doctorProfileAPI.update({
        title: profile.title,
        specialty: profile.specialty,
        bio: profile.bio,
        experience_years: profile.experienceYears,
        license_number: profile.licenseNumber,
        phone: profile.phone,
        services: doctorServices.filter(s => s.name),
        prices: doctorPrices.filter(p => p.label),
        education: doctorEducation.filter(e => e.degree || e.school),
        languages: doctorLanguages,
        online_consultation: onlineConsultation,
        address: doctorAddress,
        website: doctorWebsite,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error('Save profile failed:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const [clinic, setClinic] = useState({
    name: 'MedaGama Health Center', address: 'Levent Mah. Buyukdere Cad. No:185', city: 'Istanbul', country: 'Turkey',
    phone: '+90 212 300 4000', email: 'info@medagama-clinic.com', website: 'www.medagama.com',
    workingHours: 'Mon-Fri 08:00-18:00, Sat 09:00-14:00',
  });

  const [notifications, setNotifications] = useState({
    emailAppointments: true, emailMessages: true, emailReports: false,
    pushAppointments: true, pushMessages: true, pushUrgent: true,
    smsReminders: true, smsMarketing: false,
  });

  const [schedule, setSchedule] = useState({
    slotDuration: '30', breakTime: '15', startTime: '08:00', endTime: '18:00',
    workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    autoConfirm: false, bufferTime: '5',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account, clinic and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors w-full text-left ${
                    activeTab === tab.key
                      ? 'bg-teal-50 text-teal-700 border-l-2 border-l-teal-500 lg:border-l-2'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.key ? 'text-teal-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Personal Info */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Update your personal details and professional profile</p>
                </div>
                {profileLoading ? (
                  <div className="px-6 py-10 flex justify-center"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
                ) : (
                  <div className="px-6 py-5 space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                        {(profile.firstName || '?')[0]}{(profile.lastName || '?')[0]}
                      </div>
                      <div>
                        <button className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Change Photo</button>
                        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG. Max 5MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">First Name</label>
                        <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Last Name</label>
                        <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                        <input type="email" value={profile.email} disabled
                          className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
                        <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Professional Title</label>
                        <input type="text" value={profile.title} onChange={(e) => setProfile({...profile, title: e.target.value})} placeholder="e.g. Kardiyoloji Uzmanı"
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Specialty</label>
                        <input type="text" value={profile.specialty} onChange={(e) => setProfile({...profile, specialty: e.target.value})} placeholder="e.g. Cardiology"
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Experience</label>
                        <input type="text" value={profile.experienceYears} onChange={(e) => setProfile({...profile, experienceYears: e.target.value})} placeholder="e.g. 15+"
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">License Number</label>
                        <input type="text" value={profile.licenseNumber} onChange={(e) => setProfile({...profile, licenseNumber: e.target.value})}
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Bio / About</label>
                      <textarea rows={4} value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} placeholder="Tell patients about yourself..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Address</label>
                      <input type="text" value={doctorAddress} onChange={(e) => setDoctorAddress(e.target.value)} placeholder="Office address"
                        className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Website</label>
                        <input type="text" value={doctorWebsite} onChange={(e) => setDoctorWebsite(e.target.value)} placeholder="https://..."
                          className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <label className="flex items-center gap-3 self-end pb-1.5 cursor-pointer">
                        <input type="checkbox" checked={onlineConsultation} onChange={e => setOnlineConsultation(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                        <span className="text-sm text-gray-700 font-medium">Online Consultation Available</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-400" /> Preferred Language
                      </label>
                      <select value={profile.language} onChange={(e) => {
                        setProfile({...profile, language: e.target.value});
                        i18n.changeLanguage(e.target.value);
                        try { localStorage.setItem('preferred_language', e.target.value); } catch {}
                        try { localStorage.setItem('preferred_language_manual', '1'); } catch {}
                        document.documentElement.dir = LANGUAGES.find(l => l.code === e.target.value)?.dir || 'ltr';
                      }}
                        className="w-full sm:w-64 h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">
                  {profileSaved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved</span>}
                  <button onClick={saveProfile} disabled={profileSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50">
                    {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </div>

              {/* Services */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Services</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Services you offer to patients</p>
                  </div>
                  <button type="button" onClick={() => setDoctorServices(s => [...s, { name: '', description: '' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="px-6 py-4 space-y-2">
                  {doctorServices.length === 0 && <p className="text-xs text-gray-400 italic">No services added yet</p>}
                  {doctorServices.map((svc, i) => (
                    <div key={i} className="grid sm:grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 relative">
                      <button type="button" onClick={() => setDoctorServices(s => s.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      <input value={svc.name} onChange={e => { const n = [...doctorServices]; n[i].name = e.target.value; setDoctorServices(n); }} placeholder="Service name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={svc.description} onChange={e => { const n = [...doctorServices]; n[i].description = e.target.value; setDoctorServices(n); }} placeholder="Description" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Prices */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Pricing</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Price ranges for your services</p>
                  </div>
                  <button type="button" onClick={() => setDoctorPrices(p => [...p, { label: '', min: '', max: '', currency: '₺' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="px-6 py-4 space-y-2">
                  {doctorPrices.length === 0 && <p className="text-xs text-gray-400 italic">No prices added yet</p>}
                  {doctorPrices.map((pr, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 relative">
                      <button type="button" onClick={() => setDoctorPrices(p => p.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      <input value={pr.label} onChange={e => { const n = [...doctorPrices]; n[i].label = e.target.value; setDoctorPrices(n); }} placeholder="Service" className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={pr.min} onChange={e => { const n = [...doctorPrices]; n[i].min = e.target.value; setDoctorPrices(n); }} placeholder="Min ₺" type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={pr.max} onChange={e => { const n = [...doctorPrices]; n[i].max = e.target.value; setDoctorPrices(n); }} placeholder="Max ₺" type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Education</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Your academic background</p>
                  </div>
                  <button type="button" onClick={() => setDoctorEducation(e => [...e, { degree: '', school: '', year: '' }])} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="px-6 py-4 space-y-2">
                  {doctorEducation.length === 0 && <p className="text-xs text-gray-400 italic">No education added yet</p>}
                  {doctorEducation.map((edu, i) => (
                    <div key={i} className="grid sm:grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 relative">
                      <button type="button" onClick={() => setDoctorEducation(e => e.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      <input value={edu.degree} onChange={e => { const n = [...doctorEducation]; n[i].degree = e.target.value; setDoctorEducation(n); }} placeholder="Degree" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={edu.school} onChange={e => { const n = [...doctorEducation]; n[i].school = e.target.value; setDoctorEducation(n); }} placeholder="School" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={edu.year} onChange={e => { const n = [...doctorEducation]; n[i].year = e.target.value; setDoctorEducation(n); }} placeholder="Year" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clinic Tab */}
          {activeTab === 'clinic' && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Clinic Information</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update your clinic details</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Clinic Name</label>
                  <input type="text" value={clinic.name} onChange={(e) => setClinic({...clinic, name: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Address</label>
                  <input type="text" value={clinic.address} onChange={(e) => setClinic({...clinic, address: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">City</label>
                    <input type="text" value={clinic.city} onChange={(e) => setClinic({...clinic, city: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Country</label>
                    <input type="text" value={clinic.country} onChange={(e) => setClinic({...clinic, country: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" value={clinic.phone} onChange={(e) => setClinic({...clinic, phone: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                    <input type="email" value={clinic.email} onChange={(e) => setClinic({...clinic, email: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Working Hours</label>
                  <input type="text" value={clinic.workingHours} onChange={(e) => setClinic({...clinic, workingHours: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-xs text-gray-400 mt-0.5">Choose how you want to be notified</p>
              </div>
              <div className="px-6 py-5 space-y-6">
                {[
                  { title: 'Email Notifications', items: [
                    { key: 'emailAppointments', label: 'Appointment confirmations & reminders' },
                    { key: 'emailMessages', label: 'New patient messages' },
                    { key: 'emailReports', label: 'Weekly reports & analytics' },
                  ]},
                  { title: 'Push Notifications', items: [
                    { key: 'pushAppointments', label: 'Upcoming appointments' },
                    { key: 'pushMessages', label: 'New messages' },
                    { key: 'pushUrgent', label: 'Urgent alerts & critical results' },
                  ]},
                  { title: 'SMS Notifications', items: [
                    { key: 'smsReminders', label: 'Appointment reminders to patients' },
                    { key: 'smsMarketing', label: 'Marketing & promotional messages' },
                  ]},
                ].map((section) => (
                  <div key={section.title}>
                    <h3 className="text-xs font-bold text-gray-700 mb-3">{section.title}</h3>
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm text-gray-600 group-hover:text-gray-800">{item.label}</span>
                          <button
                            type="button"
                            onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[item.key] ? 'bg-teal-500' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} className="w-full sm:w-96 h-10 px-3 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
                      <input type="password" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                      <input type="password" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                  <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
                    <Key className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Two-Factor Authentication</h2>
                <p className="text-xs text-gray-500 mb-4">Add an extra layer of security to your account</p>
                <button className="px-4 py-2.5 border border-teal-300 text-teal-700 bg-teal-50 rounded-xl text-sm font-semibold hover:bg-teal-100 transition-colors">Enable 2FA</button>
              </div>

              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-red-700 mb-1">Danger Zone</h2>
                <p className="text-xs text-gray-500 mb-4">Irreversible actions</p>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out All Devices
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Schedule Settings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Configure your appointment schedule</p>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Time</label>
                    <input type="time" value={schedule.startTime} onChange={(e) => setSchedule({...schedule, startTime: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">End Time</label>
                    <input type="time" value={schedule.endTime} onChange={(e) => setSchedule({...schedule, endTime: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Slot Duration</label>
                    <select value={schedule.slotDuration} onChange={(e) => setSchedule({...schedule, slotDuration: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                      <option value="15">15 min</option>
                      <option value="20">20 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Buffer Time</label>
                    <select value={schedule.bufferTime} onChange={(e) => setSchedule({...schedule, bufferTime: e.target.value})}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                      <option value="0">None</option>
                      <option value="5">5 min</option>
                      <option value="10">10 min</option>
                      <option value="15">15 min</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => {
                      const active = schedule.workDays.includes(day);
                      return (
                        <button key={day} type="button"
                          onClick={() => setSchedule({...schedule, workDays: active ? schedule.workDays.filter(d => d !== day) : [...schedule.workDays, day]})}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${active ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto-confirm appointments</p>
                    <p className="text-xs text-gray-400">Automatically confirm new appointment requests</p>
                  </div>
                  <button type="button" onClick={() => setSchedule({...schedule, autoConfirm: !schedule.autoConfirm})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedule.autoConfirm ? 'bg-teal-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${schedule.autoConfirm ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
                  <Save className="w-4 h-4" /> Save Schedule
                </button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Current Plan</h2>
                <div className="flex items-center justify-between mt-3 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                  <div>
                    <p className="text-base font-bold text-teal-800">Professional Plan</p>
                    <p className="text-xs text-teal-600 mt-0.5">Unlimited patients · All features · Priority support</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-teal-800">€99<span className="text-xs font-normal text-teal-600">/mo</span></p>
                    <p className="text-[10px] text-teal-500">Next billing: Mar 1, 2026</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Payment Method</h2>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                    <p className="text-[11px] text-gray-400">Expires 12/2027</p>
                  </div>
                  <button className="ml-auto text-xs font-medium text-teal-600 hover:text-teal-700">Change</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Billing History</h2>
                <div className="space-y-2">
                  {[
                    { date: 'Feb 1, 2026', amount: '€99.00', status: 'Paid' },
                    { date: 'Jan 1, 2026', amount: '€99.00', status: 'Paid' },
                    { date: 'Dec 1, 2025', amount: '€99.00', status: 'Paid' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-gray-700">{b.date}</p>
                        <p className="text-[10px] text-gray-400">Professional Plan</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-900">{b.amount}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMSettings;
