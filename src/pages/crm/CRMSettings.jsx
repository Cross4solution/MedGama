import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Settings, User, Bell, Shield, Clock, Globe, Palette, Mail,
  Phone, MapPin, Camera, Save, Eye, EyeOff, Lock as LockIcon, Key,
  Monitor, Smartphone, LogOut, Trash2, ChevronRight, Building2,
  Stethoscope, Calendar, CreditCard, Loader2, CheckCircle, Plus, X,
  Image, GripVertical, Upload, Coffee, Link2, MessageCircle,
  Instagram, Facebook, Linkedin, Youtube, Twitter, ExternalLink,
  FileText, ShieldCheck, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import LangFlag from '../../components/ui/LangFlag';
import { useAuth } from '../../context/AuthContext';
import { doctorProfileAPI, authAPI } from '../../lib/api';
import { blockNonNumeric } from '../../utils/numericInput';
import GlobalSuggest from '../../components/forms/GlobalSuggest';
import StatusBadge from '../../components/ui/StatusBadge';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const DEFAULT_HOURS = DAYS.map(day => ({
  day,
  is_closed: ['saturday','sunday'].includes(day),
  open: '09:00',
  close: '18:00',
  breaks: [],
}));

const ALL_TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'gallery', label: 'Gallery', icon: Image },
  { key: 'hours', label: 'Operating Hours', icon: Clock },
  { key: 'services', label: 'Services & Pricing', icon: Stethoscope },
  { key: 'social', label: 'Social & Contact', icon: Link2 },
  { key: 'verification', label: 'Verification', icon: ShieldCheck },
  { key: 'clinic', label: 'Clinic Info', icon: Building2, crmOnly: true },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'billing', label: 'Billing', icon: CreditCard, crmOnly: true },
];

const CRMSettings = ({ standalone = false }) => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const hasCrm = !!(user?.is_crm_active);
  const TABS = ALL_TABS.map(tab => ({
    ...tab,
    locked: tab.crmOnly && !hasCrm && standalone,
  }));

  // Read ?tab= from URL to auto-switch (e.g. from verification banner)
  const urlTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(urlTab && ALL_TABS.some(t => t.key === urlTab) ? urlTab : 'profile');
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

  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const fileInputRef = useRef(null);

  // Operating hours state
  const [operatingHours, setOperatingHours] = useState(DEFAULT_HOURS);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);

  // Enhanced services state
  const [enhancedServices, setEnhancedServices] = useState([]);
  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesSaved, setServicesSaved] = useState(false);

  // Social & contact state
  const [socialInfo, setSocialInfo] = useState({
    phone: '', whatsapp: '', website: '', address: '',
    map_coordinates: { lat: '', lng: '' },
    social_links: { instagram: '', facebook: '', twitter: '', linkedin: '', youtube: '', tiktok: '' },
  });
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);

  // Verification state
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationUploading, setVerificationUploading] = useState(false);
  const [verificationForm, setVerificationForm] = useState({ document_type: 'diploma', document_label: '', notes: '' });
  const verificationFileRef = useRef(null);

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
          setGallery(dp.gallery || []);
          setOperatingHours(dp.operating_hours?.length === 7 ? dp.operating_hours : DEFAULT_HOURS);
          setEnhancedServices(dp.services || []);
          setSocialInfo({
            phone: dp.phone || '',
            whatsapp: dp.whatsapp || '',
            website: dp.website || '',
            address: dp.address || '',
            map_coordinates: dp.map_coordinates || { lat: '', lng: '' },
            social_links: { instagram: '', facebook: '', twitter: '', linkedin: '', youtube: '', tiktok: '', ...(dp.social_links || {}) },
          });
        }
      }).catch(() => {}).finally(() => setProfileLoading(false));
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  // Load verification requests when tab is active + poll every 15s for real-time admin decisions
  const fetchVerificationRequests = useCallback(async () => {
    setVerificationLoading(true);
    try {
      const res = await doctorProfileAPI.getVerificationRequests();
      const docs = res?.verification_requests || res?.data?.verification_requests || [];
      setVerificationRequests(docs);
      // Sync verified status to user context when admin approves
      const hasApproved = Array.isArray(docs) && docs.some(d => d.status === 'approved');
      if (hasApproved && !user?.is_verified) {
        updateUser?.({ is_verified: true });
      }
    } catch { setVerificationRequests([]); }
    setVerificationLoading(false);
  }, [user?.is_verified, updateUser]);

  useEffect(() => {
    if (activeTab === 'verification') {
      fetchVerificationRequests();
      const poll = setInterval(fetchVerificationRequests, 15000);
      return () => clearInterval(poll);
    }
  }, [activeTab, fetchVerificationRequests]);

  const handleVerificationUpload = async () => {
    const file = verificationFileRef.current?.files?.[0];
    if (!file) return;
    setVerificationUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('document_type', verificationForm.document_type);
      if (verificationForm.document_label) fd.append('document_label', verificationForm.document_label);
      if (verificationForm.notes) fd.append('notes', verificationForm.notes);
      await doctorProfileAPI.submitVerification(fd);
      setVerificationForm({ document_type: 'diploma', document_label: '', notes: '' });
      if (verificationFileRef.current) verificationFileRef.current.value = '';
      fetchVerificationRequests();
    } catch (err) { console.error('Verification upload failed:', err); }
    setVerificationUploading(false);
  };

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

  // ── Gallery handlers ──
  const handleGalleryUpload = async (files) => {
    if (!files?.length) return;
    setGalleryUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('images[]', f));
      const res = await doctorProfileAPI.uploadGallery(formData);
      setGallery(res?.gallery || res?.data?.gallery || gallery);
    } catch (err) { console.error('Gallery upload failed:', err); }
    finally { setGalleryUploading(false); }
  };

  const handleGalleryDelete = async (url) => {
    try {
      const res = await doctorProfileAPI.deleteGalleryImage(url);
      setGallery(res?.gallery || res?.data?.gallery || gallery.filter(g => g !== url));
    } catch (err) { console.error('Gallery delete failed:', err); }
  };

  const handleGalleryDragEnd = async (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const items = [...gallery];
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    setGallery(items);
    try { await doctorProfileAPI.reorderGallery(items); } catch {}
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files?.length) handleGalleryUpload(files);
  }, [gallery]);

  // ── Operating hours handlers ──
  const updateHourField = (idx, field, value) => {
    setOperatingHours(h => h.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addBreak = (idx) => {
    setOperatingHours(h => h.map((item, i) => i === idx ? { ...item, breaks: [...(item.breaks || []), { start: '12:00', end: '13:00' }] } : item));
  };

  const removeBreak = (dayIdx, breakIdx) => {
    setOperatingHours(h => h.map((item, i) => i === dayIdx ? { ...item, breaks: item.breaks.filter((_, bi) => bi !== breakIdx) } : item));
  };

  const updateBreak = (dayIdx, breakIdx, field, value) => {
    setOperatingHours(h => h.map((item, i) => i === dayIdx ? { ...item, breaks: item.breaks.map((b, bi) => bi === breakIdx ? { ...b, [field]: value } : b) } : item));
  };

  const saveOperatingHours = async () => {
    setHoursSaving(true); setHoursSaved(false);
    try {
      await doctorProfileAPI.updateOperatingHours(operatingHours);
      setHoursSaved(true); setTimeout(() => setHoursSaved(false), 3000);
    } catch (err) { console.error('Save hours failed:', err); }
    finally { setHoursSaving(false); }
  };

  // ── Enhanced services handlers ──
  const addService = () => setEnhancedServices(s => [...s, { name: '', description: '', duration_minutes: 30, price: '', currency: '₺' }]);
  const removeService = (idx) => setEnhancedServices(s => s.filter((_, i) => i !== idx));
  const updateService = (idx, field, value) => setEnhancedServices(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const saveServices = async () => {
    setServicesSaving(true); setServicesSaved(false);
    try {
      await doctorProfileAPI.updateServices(enhancedServices.filter(s => s.name));
      setServicesSaved(true); setTimeout(() => setServicesSaved(false), 3000);
    } catch (err) { console.error('Save services failed:', err); }
    finally { setServicesSaving(false); }
  };

  // ── Social & contact handlers ──
  const updateSocialField = (field, value) => setSocialInfo(s => ({ ...s, [field]: value }));
  const updateSocialLink = (key, value) => setSocialInfo(s => ({ ...s, social_links: { ...s.social_links, [key]: value } }));
  const updateMapCoord = (key, value) => setSocialInfo(s => ({ ...s, map_coordinates: { ...s.map_coordinates, [key]: value } }));

  const saveSocial = async () => {
    setSocialSaving(true); setSocialSaved(false);
    try {
      await doctorProfileAPI.updateSocial(socialInfo);
      setSocialSaved(true); setTimeout(() => setSocialSaved(false), 3000);
    } catch (err) { console.error('Save social failed:', err); }
    finally { setSocialSaving(false); }
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

  const content = (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {standalone && (
          <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.settings.title', 'Settings')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.settings.subtitle', 'Manage your account, clinic and preferences')}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  data-tab={tab.key}
                  onClick={() => { if (!tab.locked) setActiveTab(tab.key); }}
                  disabled={tab.locked}
                  className={`flex items-center gap-2.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors w-full text-left ${
                    tab.locked
                      ? 'text-gray-400 cursor-not-allowed opacity-60'
                      : activeTab === tab.key
                        ? 'bg-teal-50 text-teal-700 border-l-2 border-l-teal-500 lg:border-l-2'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 flex-shrink-0 ${tab.locked ? 'text-gray-300' : activeTab === tab.key ? 'text-teal-600' : 'text-gray-400'}`} />
                  {tab.label}
                  {tab.locked && <LockIcon className="w-3 h-3 ml-auto text-gray-400" />}
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
                    {/* Spoken Languages — GlobalSuggest */}
                    <div>
                      <GlobalSuggest
                        type="language"
                        label={t('crm.settings.spokenLanguages', 'Spoken Languages')}
                        value={doctorLanguages.map(l => typeof l === 'string' ? { name: l } : l)}
                        onChange={(newVal) => setDoctorLanguages(newVal)}
                        multi={true}
                        allowCustom={true}
                        maxTags={15}
                        placeholder={t('onboarding.searchLanguages', 'Search languages...')}
                      />
                    </div>
                    {/* Language Preference — dedicated section */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-400" /> {t('crm.settings.preferredLanguage', 'Preferred Language')}
                      </label>
                      <p className="text-[11px] text-gray-400 mb-3">{t('crm.settings.languageHint', 'This setting syncs across all your devices.')}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {LANGUAGES.slice(0, 10).map((lang, idx) => {
                          const isActive = profile.language === lang.code;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={async () => {
                                setProfile(p => ({...p, language: lang.code}));
                                i18n.changeLanguage(lang.code);
                                document.documentElement.dir = lang.dir === 'rtl' ? 'rtl' : 'ltr';
                                try { localStorage.setItem('preferred_language', lang.code); } catch {}
                                try { localStorage.setItem('preferred_language_manual', '1'); } catch {}
                                try { await authAPI.updateProfile({ preferred_language: lang.code }); } catch {}
                              }}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                isActive
                                  ? 'bg-teal-50 border-teal-300 text-teal-700 ring-1 ring-teal-200 shadow-sm'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                              }`}
                            >
                              <LangFlag lang={lang} size={20} />
                              <span className="truncate">{lang.label}</span>
                              {isActive && <CheckCircle className="w-3.5 h-3.5 ml-auto text-teal-600 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      {/* Remaining languages in a smaller row */}
                      {LANGUAGES.length > 10 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {LANGUAGES.slice(10).map(lang => {
                            const isActive = profile.language === lang.code;
                            return (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={async () => {
                                  setProfile(p => ({...p, language: lang.code}));
                                  i18n.changeLanguage(lang.code);
                                  document.documentElement.dir = lang.dir === 'rtl' ? 'rtl' : 'ltr';
                                  try { localStorage.setItem('preferred_language', lang.code); } catch {}
                                  try { localStorage.setItem('preferred_language_manual', '1'); } catch {}
                                  try { await authAPI.updateProfile({ preferred_language: lang.code }); } catch {}
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  isActive
                                    ? 'bg-teal-50 border-teal-300 text-teal-700'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <LangFlag lang={lang} size={16} />
                                <span>{lang.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">
                  {profileSaved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {t('crm.settings.profileSaved', 'Profile updated successfully')}</span>}
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
                      <input value={pr.min} onChange={e => { const n = [...doctorPrices]; n[i].min = e.target.value; setDoctorPrices(n); }} placeholder="Min ₺" type="number" onKeyDown={blockNonNumeric} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                      <input value={pr.max} onChange={e => { const n = [...doctorPrices]; n[i].max = e.target.value; setDoctorPrices(n); }} placeholder="Max ₺" type="number" onKeyDown={blockNonNumeric} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
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

          {/* ═══════════ Gallery Tab ═══════════ */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{t('crm.settings.galleryTitle', 'Gallery Manager')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{t('crm.settings.galleryDesc', 'Upload and manage photos for your profile and clinic. Drag to reorder.')}</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-teal-400 bg-teal-50/50' : 'border-gray-300 hover:border-teal-300 hover:bg-gray-50'}`}
                  >
                    <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
                    {galleryUploading ? (
                      <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">{t('crm.settings.dropPhotos', 'Drop photos here or click to upload')}</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 5MB each, up to 10 files</p>
                      </>
                    )}
                  </div>

                  {/* Gallery grid */}
                  {gallery.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {gallery.map((url, idx) => (
                        <div
                          key={url}
                          draggable
                          onDragStart={() => setDragIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragIdx !== null) { handleGalleryDragEnd(dragIdx, idx); setDragIdx(null); } }}
                          className={`relative group rounded-xl overflow-hidden border-2 aspect-square ${dragIdx === idx ? 'border-teal-400 opacity-50' : 'border-gray-200'}`}
                        >
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button onClick={() => handleGalleryDelete(url)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                            <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
                          {idx === 0 && (
                            <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-teal-600 px-2 py-0.5 rounded-full">Cover</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {gallery.length === 0 && !galleryUploading && (
                    <div className="text-center py-6">
                      <Image className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">{t('crm.settings.noPhotos', 'No photos uploaded yet')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ Operating Hours Tab ═══════════ */}
          {activeTab === 'hours' && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">{t('crm.settings.hoursTitle', 'Operating Hours')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t('crm.settings.hoursDesc', 'Set your weekly schedule. These hours sync with the booking widget.')}</p>
              </div>
              <div className="px-6 py-5 space-y-3">
                {operatingHours.map((day, idx) => (
                  <div key={day.day} className={`p-3 rounded-xl border transition-all ${day.is_closed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      {/* Day name + toggle */}
                      <div className="w-24 flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-800 capitalize">{t(`crm.settings.day_${day.day}`, day.day)}</span>
                      </div>
                      <button type="button" onClick={() => updateHourField(idx, 'is_closed', !day.is_closed)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${!day.is_closed ? 'bg-teal-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${!day.is_closed ? 'translate-x-4.5' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-medium ${day.is_closed ? 'text-red-500' : 'text-emerald-600'}`}>
                        {day.is_closed ? t('crm.settings.closed', 'Closed') : t('crm.settings.open', 'Open')}
                      </span>

                      {!day.is_closed && (
                        <>
                          <input type="time" value={day.open} onChange={(e) => updateHourField(idx, 'open', e.target.value)}
                            className="h-8 px-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-transparent" />
                          <span className="text-xs text-gray-400">—</span>
                          <input type="time" value={day.close} onChange={(e) => updateHourField(idx, 'close', e.target.value)}
                            className="h-8 px-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-transparent" />
                          <button type="button" onClick={() => addBreak(idx)} className="text-[10px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-0.5 ml-auto">
                            <Coffee className="w-3 h-3" /> {t('crm.settings.addBreak', '+ Break')}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Breaks */}
                    {!day.is_closed && day.breaks?.length > 0 && (
                      <div className="ml-28 mt-2 space-y-1.5">
                        {day.breaks.map((brk, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-2 text-xs">
                            <Coffee className="w-3 h-3 text-amber-500" />
                            <span className="text-gray-500">{t('crm.settings.breakLabel', 'Break')}:</span>
                            <input type="time" value={brk.start} onChange={(e) => updateBreak(idx, bIdx, 'start', e.target.value)}
                              className="h-7 px-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500" />
                            <span className="text-gray-400">—</span>
                            <input type="time" value={brk.end} onChange={(e) => updateBreak(idx, bIdx, 'end', e.target.value)}
                              className="h-7 px-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500" />
                            <button type="button" onClick={() => removeBreak(idx, bIdx)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-2 p-3 bg-teal-50/50 rounded-xl border border-teal-200/50">
                  <p className="text-[11px] text-teal-700">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {t('crm.settings.hoursNote', 'Operating hours are synced with your booking widget. Patients can only book appointments during open hours.')}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">
                {hoursSaved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved</span>}
                <button onClick={saveOperatingHours} disabled={hoursSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50">
                  {hoursSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('crm.settings.saveHours', 'Save Hours')}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ Services & Pricing Tab ═══════════ */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{t('crm.settings.servicesTitle', 'Services & Pricing')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{t('crm.settings.servicesDesc', 'Manage your services with estimated duration and pricing')}</p>
                </div>
                <button type="button" onClick={addService} className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('crm.settings.addService', 'Add Service')}</button>
              </div>
              <div className="px-6 py-5 space-y-3">
                {enhancedServices.length === 0 && (
                  <div className="text-center py-8">
                    <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">{t('crm.settings.noServices', 'No services added yet. Click "Add Service" to get started.')}</p>
                  </div>
                )}
                {enhancedServices.map((svc, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                    <button type="button" onClick={() => removeService(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">{t('crm.settings.serviceName', 'Service Name')}</label>
                        <input value={svc.name} onChange={(e) => updateService(i, 'name', e.target.value)} placeholder="e.g. Dental Whitening"
                          className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">{t('crm.settings.serviceDesc', 'Description')}</label>
                        <input value={svc.description || ''} onChange={(e) => updateService(i, 'description', e.target.value)} placeholder="Brief description"
                          className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">{t('crm.settings.duration', 'Est. Duration (min)')}</label>
                        <select value={svc.duration_minutes || 30} onChange={(e) => updateService(i, 'duration_minutes', parseInt(e.target.value))}
                          className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-teal-400">
                          {[15,20,30,45,60,90,120,180,240].map(m => <option key={m} value={m}>{m} min</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">{t('crm.settings.price', 'Price')}</label>
                          <input value={svc.price || ''} onChange={(e) => updateService(i, 'price', e.target.value)} placeholder="0.00" type="number" min="0"
                            onKeyDown={blockNonNumeric}
                            className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div className="w-20">
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">{t('crm.settings.currency', 'Currency')}</label>
                          <select value={svc.currency || '₺'} onChange={(e) => updateService(i, 'currency', e.target.value)}
                            className="w-full h-9 px-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-teal-400">
                            <option value="₺">₺ TRY</option>
                            <option value="€">€ EUR</option>
                            <option value="$">$ USD</option>
                            <option value="£">£ GBP</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">
                {servicesSaved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved</span>}
                <button onClick={saveServices} disabled={servicesSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50">
                  {servicesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('crm.settings.saveServices', 'Save Services')}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ Social & Contact Tab ═══════════ */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{t('crm.settings.contactTitle', 'Contact Information')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{t('crm.settings.contactDesc', 'Phone, WhatsApp and address details visible to patients')}</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {t('crm.settings.phoneLabel', 'Phone')}</label>
                      <input type="tel" value={socialInfo.phone} onChange={(e) => updateSocialField('phone', e.target.value)} placeholder="+90 555 000 0000"
                        className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp</label>
                      <input type="tel" value={socialInfo.whatsapp} onChange={(e) => updateSocialField('whatsapp', e.target.value)} placeholder="+90 555 000 0000"
                        className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" /> {t('crm.settings.websiteLabel', 'Website')}</label>
                    <input type="url" value={socialInfo.website} onChange={(e) => updateSocialField('website', e.target.value)} placeholder="https://www.example.com"
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {t('crm.settings.addressLabel', 'Full Address')}</label>
                    <textarea rows={2} value={socialInfo.address} onChange={(e) => updateSocialField('address', e.target.value)} placeholder="Street, building, district, city, country"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.settings.latitude', 'Latitude')}</label>
                      <input type="number" step="any" value={socialInfo.map_coordinates?.lat || ''} onChange={(e) => updateMapCoord('lat', e.target.value)} placeholder="41.0082"
                        onKeyDown={blockNonNumeric}
                        className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.settings.longitude', 'Longitude')}</label>
                      <input type="number" step="any" value={socialInfo.map_coordinates?.lng || ''} onChange={(e) => updateMapCoord('lng', e.target.value)} placeholder="28.9784"
                        onKeyDown={blockNonNumeric}
                        className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{t('crm.settings.socialTitle', 'Social Media')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{t('crm.settings.socialDesc', 'Link your social media profiles')}</p>
                </div>
                <div className="px-6 py-5 space-y-3">
                  {[
                    { key: 'instagram', icon: Instagram, color: 'text-pink-500', placeholder: 'https://instagram.com/yourprofile' },
                    { key: 'facebook', icon: Facebook, color: 'text-blue-600', placeholder: 'https://facebook.com/yourpage' },
                    { key: 'twitter', icon: Twitter, color: 'text-sky-500', placeholder: 'https://twitter.com/yourhandle' },
                    { key: 'linkedin', icon: Linkedin, color: 'text-blue-700', placeholder: 'https://linkedin.com/in/yourprofile' },
                    { key: 'youtube', icon: Youtube, color: 'text-red-600', placeholder: 'https://youtube.com/@yourchannel' },
                    { key: 'tiktok', icon: ExternalLink, color: 'text-gray-800', placeholder: 'https://tiktok.com/@yourhandle' },
                  ].map(({ key, icon: Icon, color, placeholder }) => (
                    <div key={key} className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                      <input value={socialInfo.social_links?.[key] || ''} onChange={(e) => updateSocialLink(key, e.target.value)} placeholder={placeholder}
                        className="flex-1 h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <div className="flex items-center gap-3">
                  {socialSaved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved</span>}
                  <button onClick={saveSocial} disabled={socialSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50">
                    {socialSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('crm.settings.saveSocial', 'Save Contact Info')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <div className="space-y-5">
              {/* Current verification status */}
              <div className={`rounded-2xl border shadow-sm overflow-hidden ${user?.is_verified ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="px-6 py-4 flex items-center gap-3">
                  {user?.is_verified ? (
                    <>
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h2 className="text-sm font-bold text-emerald-800">{t('crm.settings.verifiedTitle', 'Verified Professional')}</h2>
                        <p className="text-xs text-emerald-600 mt-0.5">{t('crm.settings.verifiedDesc', 'Your profile displays a verified badge visible to all patients.')}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                      <div>
                        <h2 className="text-sm font-bold text-amber-800">{t('crm.settings.notVerifiedTitle', 'Not Yet Verified')}</h2>
                        <p className="text-xs text-amber-600 mt-0.5">{t('crm.settings.notVerifiedDesc', 'Upload your professional documents below to get verified.')}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Upload new document */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{t('crm.settings.uploadDocument', 'Upload Verification Document')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{t('crm.settings.uploadDocumentDesc', 'Upload diploma, specialty certificate, clinic license or ID card (PDF, JPG, PNG — max 10MB)')}</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('crm.settings.documentType', 'Document Type')}</label>
                      <select
                        value={verificationForm.document_type}
                        onChange={e => setVerificationForm(f => ({ ...f, document_type: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                      >
                        <option value="diploma">{t('crm.settings.docDiploma', 'Diploma')}</option>
                        <option value="specialty_certificate">{t('crm.settings.docSpecialtyCert', 'Specialty Certificate')}</option>
                        <option value="clinic_license">{t('crm.settings.docClinicLicense', 'Clinic License')}</option>
                        <option value="id_card">{t('crm.settings.docIdCard', 'ID Card')}</option>
                        <option value="other">{t('crm.settings.docOther', 'Other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('crm.settings.documentLabel', 'Label (optional)')}</label>
                      <input
                        type="text"
                        value={verificationForm.document_label}
                        onChange={e => setVerificationForm(f => ({ ...f, document_label: e.target.value }))}
                        placeholder={t('crm.settings.documentLabelPlaceholder', 'e.g. Cardiology Board Certificate')}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('crm.settings.notesToAdmin', 'Notes to Admin (optional)')}</label>
                    <textarea
                      value={verificationForm.notes}
                      onChange={e => setVerificationForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder={t('crm.settings.notesPlaceholder', 'Any additional information for the reviewer...')}
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('crm.settings.selectFile', 'Select File')}</label>
                    <input
                      ref={verificationFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleVerificationUpload}
                      disabled={verificationUploading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      {verificationUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {t('crm.settings.submitForReview', 'Submit for Review')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Previous submissions */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{t('crm.settings.submittedDocuments', 'Submitted Documents')}</h2>
                </div>
                {verificationLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>
                ) : verificationRequests.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-gray-400">{t('crm.settings.noDocuments', 'No documents submitted yet.')}</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {verificationRequests.map(vr => (
                      <div key={vr.id} className="px-6 py-3.5 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{vr.document_label || vr.file_name}</p>
                          <p className="text-[11px] text-gray-400">
                            {vr.document_type?.replace(/_/g, ' ')} · {vr.created_at ? new Date(vr.created_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <StatusBadge status={vr.status} dot className="shrink-0" />
                        {vr.status === 'rejected' && vr.rejection_reason && (
                          <p className="text-[10px] text-red-500 max-w-[160px] truncate" title={vr.rejection_reason}>{vr.rejection_reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                  { title: 'Push Notifications', items: [
                    { key: 'pushAppointments', label: 'Upcoming appointments' },
                    { key: 'pushMessages', label: 'New messages' },
                    { key: 'pushUrgent', label: 'Urgent alerts & critical results' },
                  ]},
                  { title: 'Appointment Reminders', items: [
                    { key: 'emailAppointments', label: 'Appointment confirmations & reminders' },
                    { key: 'emailMessages', label: 'New patient messages' },
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

  if (standalone) {
    return (
      <div className="min-h-screen bg-gray-50/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default CRMSettings;
