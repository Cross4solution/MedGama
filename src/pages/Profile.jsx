import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/api';
import countriesEurope from '../data/countriesEurope';
import CountryCombobox from '../components/forms/CountryCombobox';
import { getFlagCode } from '../utils/geo';
import countryCodes from '../data/countryCodes';
import { User, Shield, Bell, ChevronRight, Eye, EyeOff, HeartPulse, Settings, Camera, Upload, Download, Trash2, Cookie, ExternalLink, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import { useCookieConsent } from '../context/CookieConsentContext';
import { Link } from 'react-router-dom';
function NotificationPrefsPanel({ saving, setSaving, showToast, t }) {
  const [prefs, setPrefs] = React.useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    appointment_reminders: true,
    marketing_messages: false,
  });
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    authAPI.getNotificationPrefs().then(res => {
      const p = res?.preferences || res?.data?.preferences;
      if (p && typeof p === 'object') setPrefs(prev => ({ ...prev, ...p }));
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const savePrefs = async () => {
    setSaving(true);
    try {
      await authAPI.updateNotificationPrefs(prefs);
      showToast(t('profile.savePreferences') + ' ✓');
    } catch {
      showToast('Failed to save preferences', 'error');
    }
    setSaving(false);
  };

  const toggleItems = [
    { key: 'email_notifications', label: t('profile.emailNotifications'), desc: 'Receive updates via email' },
    { key: 'sms_notifications', label: t('profile.smsNotifications'), desc: 'Receive SMS alerts' },
    { key: 'push_notifications', label: t('profile.pushNotifications'), desc: 'Browser push notifications' },
    { key: 'appointment_reminders', label: t('profile.appointmentReminders'), desc: 'Reminders before appointments' },
    { key: 'marketing_messages', label: t('profile.marketingMessages'), desc: 'Promotional offers & news' },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
          {t('profile.notificationPreferences')}
        </h2>
        {!loaded ? (
          <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {toggleItems.map(item => (
              <div key={item.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!prefs[item.key]}
                  onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${prefs[item.key] ? 'bg-teal-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${prefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button onClick={savePrefs} disabled={saving} className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md shadow-teal-200/50 hover:shadow-lg transition-all duration-200 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'}`}>{saving ? 'Saving...' : t('profile.savePreferences')}</button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, country, updateUser, logout } = useAuth();
  const { openSettings: openCookieSettings, consent, consentTimestamp, resetConsent } = useCookieConsent();
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState('account');

  // Account state
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const initialCountryName = useMemo(() => {
    if (!country) return '';
    const lower = country.toLowerCase();
    const entry = Object.entries(countryCodes).find(([, code]) => code === lower);
    return entry ? entry[0] : '';
  }, [country]);
  const [countryName, setCountryName] = useState(initialCountryName);
  const fileInputRef = useRef(null);
  const [avatarFileName, setAvatarFileName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState(() => i18n.language || 'en');

  const handleLanguageChange = (lang) => {
    setPreferredLanguage(lang);
    i18n.changeLanguage(lang);
    try { localStorage.setItem('preferred_language', lang); } catch {}
    document.documentElement.dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
  };

  // Mock preferences (persist localStorage)
  const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem('profile_prefs') || '{}'); } catch { return {}; }
  };
  const savePrefs = (obj) => localStorage.setItem('profile_prefs', JSON.stringify(obj || {}));
  // Security
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  // 2FA kaldırıldı
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showNewPwd2, setShowNewPwd2] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const avatarFileRef = useRef(null); // actual File object for upload

  const showToast = (message, type = 'success') => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 5000);
  };

  // Notifications & Privacy prefs available via loadPrefs() when needed

  // Connections removed

  // Patient medical history (frontend-only persistence) - now as tags
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');
  const [showConditionSuggestions, setShowConditionSuggestions] = useState(false);
  const conditionInputRef = useRef(null);
  
  // Common medical conditions suggestions
  const commonConditions = [
    'Hypertension', 'Diabetes Type 2', 'Diabetes Type 1', 'Asthma', 
    'Arthritis', 'Depression', 'Anxiety', 'Migraine', 'COPD',
    'Heart Disease', 'High Cholesterol', 'Thyroid Disorder',
    'Penicillin Allergy', 'Pollen Allergy', 'Food Allergy'
  ];

  const filteredConditions = conditionInput.trim() 
    ? commonConditions.filter(c => 
        c.toLowerCase().includes(conditionInput.toLowerCase()) && 
        !medicalConditions.includes(c)
      )
    : [];
  
  useEffect(() => {
    let cancelled = false;
    const loadMedical = async () => {
      // Try API first
      if (user?.role === 'patient') {
        try {
          const res = await authAPI.getMedicalHistory();
          const conditions = res?.conditions || res?.data?.conditions;
          if (!cancelled && Array.isArray(conditions) && conditions.length > 0) {
            setMedicalConditions(conditions);
            return;
          }
        } catch {}
      }
      // Fallback to localStorage
      try {
        if (user?.email) {
          const key = `patient_profile_extra_${user.email}`;
          const raw = localStorage.getItem(key);
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj && typeof obj.medicalHistory === 'string' && obj.medicalHistory) {
              const converted = obj.medicalHistory.split(',').map(s => s.trim()).filter(Boolean);
              if (!cancelled) setMedicalConditions(converted);
            } else if (obj && Array.isArray(obj.medicalConditions)) {
              if (!cancelled) setMedicalConditions(obj.medicalConditions);
            }
          }
        }
      } catch {}
    };
    loadMedical();
    return () => { cancelled = true; };
  }, [user?.email, user?.role]);

  const addCondition = (text) => {
    const trimmed = text.trim();
    if (trimmed && !medicalConditions.includes(trimmed)) {
      setMedicalConditions([...medicalConditions, trimmed]);
    }
    setConditionInput('');
    setShowConditionSuggestions(false);
  };

  const removeCondition = (index) => {
    setMedicalConditions(medicalConditions.filter((_, i) => i !== index));
  };

  const handleConditionKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const text = conditionInput.replace(/,$/, ''); // Remove trailing comma
      if (filteredConditions.length > 0 && text.trim()) {
        // If there are suggestions and input matches the first one, use it
        const exactMatch = filteredConditions.find(c => c.toLowerCase() === text.toLowerCase());
        addCondition(exactMatch || text);
      } else if (text) {
        addCondition(text);
      }
    } else if (e.key === 'Backspace' && !conditionInput && medicalConditions.length > 0) {
      // Remove last tag on backspace if input is empty
      removeCondition(medicalConditions.length - 1);
    }
  };

  const clearAllConditions = () => {
    setMedicalConditions([]);
  };

  const saveMedical = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      await authAPI.updateMedicalHistory({ conditions: medicalConditions });
      showToast('Medical conditions saved');
    } catch (err) {
      console.warn('[Profile] Medical history API failed, saving locally:', err?.message);
      showToast('Saved locally (server unavailable)', 'error');
    }
    // Always persist locally as fallback
    try {
      if (user?.email) {
        const key = `patient_profile_extra_${user.email}`;
        const raw = localStorage.getItem(key);
        const prev = raw ? JSON.parse(raw) : {};
        const next = { ...prev, medicalConditions };
        localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {}
    setSaving(false);
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900">{t('profile.title')}</h1>
        <p className="mt-2 text-gray-600">{t('profile.pleaseSignIn')}</p>
      </div>
    );
  }

  const saveAccount = async (e) => {
    e.preventDefault();
    const limitedName = (name || '').slice(0, 30).trim();
    const codeLower = countryCodes[countryName] || null;
    const codeUpper = codeLower ? codeLower.toUpperCase() : country;
    try { localStorage.setItem('preferred_language', preferredLanguage); } catch {}
    setSaving(true);
    let avatarUrl = avatar;
    try {
      // Upload avatar file if changed
      if (avatarFileRef.current) {
        try {
          const res = await authAPI.uploadAvatar(avatarFileRef.current);
          avatarUrl = res?.avatar_url || res?.url || avatarUrl;
          avatarFileRef.current = null;
        } catch (err) {
          console.warn('[Profile] Avatar upload failed, using local preview:', err?.message);
        }
      }
      // Update profile fields
      await authAPI.updateProfile({
        fullname: limitedName || user.name,
        country: codeUpper,
        preferred_language: preferredLanguage,
      });
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err?.message || 'Failed to update profile', 'error');
    }
    updateUser({ name: limitedName || user.name, avatar: avatarUrl || user.avatar, preferredLanguage }, codeUpper);
    setSaving(false);
  };

  const saveSecurity = async (e) => {
    e.preventDefault();
    if (!oldPwd) { showToast('Please enter your current password.', 'error'); return; }
    if (newPwd.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (newPwd !== newPwd2) { showToast('New passwords do not match.', 'error'); return; }
    setSaving(true);
    try {
      // Try dedicated password endpoint first
      await authAPI.changePassword({ current_password: oldPwd, password: newPwd, password_confirmation: newPwd2 });
      showToast('Password updated successfully ✓');
      setOldPwd(''); setNewPwd(''); setNewPwd2('');
    } catch (err) {
      // If dedicated endpoint doesn't exist (404), fallback to updateProfile
      if (err?.status === 404) {
        try {
          await authAPI.updateProfile({ current_password: oldPwd, password: newPwd, password_confirmation: newPwd2 });
          showToast('Password updated successfully ✓');
          setOldPwd(''); setNewPwd(''); setNewPwd2('');
        } catch (err2) {
          const msg = err2?.data?.message || err2?.message || 'Failed to update password.';
          showToast(msg, 'error');
        }
      } else {
        const msg = err?.data?.message || err?.message || 'Failed to update password.';
        showToast(msg, 'error');
      }
    }
    setSaving(false);
  };


  // Connections removed

  const NavItem = ({ id, icon: Icon, title, desc }) => {
    const isActive = active === id;
    return (
      <button
        type="button"
        onClick={() => setActive(id)}
        className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
          isActive
            ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 text-teal-700 shadow-sm ring-1 ring-teal-100'
            : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
        }`}
        aria-current={isActive}
      >
        <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-teal-100/80' : 'bg-gray-100/80'} transition-colors`}>
          <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-gray-500'}`} />
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-[13px] font-semibold ${isActive ? 'text-teal-800' : 'text-gray-900'}`}>{title}</span>
          <span className="block text-[11px] text-gray-400 font-medium">{desc}</span>
        </span>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-gray-300'}`} />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/60 to-white">
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(t => ({ ...t, show: false }))} className="text-current opacity-50 hover:opacity-100 text-xs ml-1">✕</button>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200/50">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{t('profile.settings')}</h1>
            <p className="text-[11px] text-gray-400 font-medium">{t('profile.settingsDesc')}</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        {/* Left nav */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('profile.settings')}</div>
            </div>
            <div className="p-2 space-y-0.5">
              <NavItem id="account" icon={User} title={t('profile.account')} desc={t('profile.accountDesc')} />
              <NavItem id="security" icon={Shield} title={t('profile.security')} desc={t('profile.securityDesc')} />
              <NavItem id="notifications" icon={Bell} title={t('profile.notifications')} desc={t('profile.notificationsDesc')} />
              {user?.role === 'patient' && (
                <NavItem id="medical" icon={HeartPulse} title={t('profile.medicalHistory')} desc={t('profile.medicalHistoryDesc')} />
              )}
              <NavItem id="privacy" icon={Cookie} title={t('profile.privacyData')} desc={t('profile.privacyDataDesc')} />
            </div>
          </div>
        </aside>

        {/* Right content */}
        <section className="space-y-8">
          {active === 'account' && (
            <form onSubmit={saveAccount} className="space-y-5">
              <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
                  {t('profile.profileSection')}
                </h2>
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <img
                      src={avatar || user.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                      alt={user.name}
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-white shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('profile.profilePhoto')}</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        setAvatarFileName(file.name);
                        avatarFileRef.current = file;
                        const reader = new FileReader();
                        reader.onload = (ev) => setAvatar(String(ev.target?.result || ''));
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {t('profile.chooseFile')}
                      </button>
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">{avatarFileName || t('profile.noFileSelected')}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">{t('profile.chooseImageDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('common.name')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    className="w-full border border-gray-200 rounded-xl px-3 text-sm h-10 hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none"
                    placeholder="Your name"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">{Math.max(0, 30 - (name?.length || 0))} {t('profile.charactersLeft')}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('crm.patients.country')}</label>
                  <CountryCombobox
                    options={countriesEurope}
                    value={countryName}
                    onChange={setCountryName}
                    placeholder="Select Country"
                    triggerClassName="w-full border border-gray-300 rounded-lg px-3 text-sm bg-white h-10 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20 transition-shadow"
                    getFlagUrl={(name) => {
                      try {
                        const code = getFlagCode(name);
                        return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                      } catch { return null; }
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> {t('profile.preferredLanguage')}</span>
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full md:w-64 border border-gray-200 rounded-xl px-3 text-sm h-10 bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">{t('profile.languageDesc')}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md shadow-teal-200/50 hover:shadow-lg transition-all duration-200 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'}`}>{saving ? 'Saving...' : t('common.save')}</button>
              </div>
            </form>
          )}

          {active === 'security' && (
            <form onSubmit={saveSecurity} className="space-y-5">
              <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-purple-500 to-violet-500" />
                  {t('common.password')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('profile.currentPassword')}</label>
                    <div className="relative">
                      <input
                        type={showOldPwd ? 'text' : 'password'}
                        value={oldPwd}
                        onChange={(e)=>setOldPwd(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={()=>setShowOldPwd(s=>!s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showOldPwd ? 'Hide password' : 'Show password'}
                      >
                        {showOldPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('profile.newPassword')}</label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        value={newPwd}
                        onChange={(e)=>setNewPwd(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={()=>setShowNewPwd(s=>!s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                      >
                        {showNewPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('profile.repeatNew')}</label>
                    <div className="relative">
                      <input
                        type={showNewPwd2 ? 'text' : 'password'}
                        value={newPwd2}
                        onChange={(e)=>setNewPwd2(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={()=>setShowNewPwd2(s=>!s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showNewPwd2 ? 'Hide password' : 'Show password'}
                      >
                        {showNewPwd2 ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md shadow-teal-200/50 hover:shadow-lg transition-all duration-200 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'}`}>{saving ? 'Saving...' : t('common.save')}</button>
              </div>
            </form>
          )}

          {active === 'notifications' && (
            <NotificationPrefsPanel saving={saving} setSaving={setSaving} showToast={showToast} t={t} />
          )}

          

          {active === 'medical' && user?.role === 'patient' && (
            <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                {t('profile.medicalHistory')}
              </h2>
              <p className="text-sm text-gray-600 mb-3">{t('profile.medicalConditionsDesc')}</p>
              
              {/* Inline tags + input wrapper */}
              <div className="relative">
                <div className="border border-gray-300 rounded-lg px-2 py-1 text-base md:text-sm flex items-center flex-wrap gap-2 bg-white min-h-[42px]">
                  {/* Tags */}
                  {medicalConditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-800 border border-teal-200"
                    >
                      {condition}
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="ml-0.5 text-teal-700 hover:text-teal-900"
                        aria-label={`Remove ${condition}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  
                  {/* Inline input */}
                  <input
                    ref={conditionInputRef}
                    placeholder={medicalConditions.length === 0 ? "Type condition and press Enter..." : ""}
                    className="flex-1 min-w-[8ch] border-0 outline-none px-1 py-1 text-base md:text-sm bg-transparent"
                    type="text"
                    value={conditionInput}
                    onChange={(e) => {
                      setConditionInput(e.target.value);
                      setShowConditionSuggestions(e.target.value.trim().length > 0);
                    }}
                    onKeyDown={handleConditionKeyDown}
                    onFocus={() => conditionInput.trim() && setShowConditionSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowConditionSuggestions(false), 200)}
                  />
                  
                  {/* Clear all button */}
                  {medicalConditions.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllConditions}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                      aria-label="Clear all"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showConditionSuggestions && filteredConditions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto text-sm">
                    {filteredConditions.map((condition, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => addCondition(condition)}
                          className="w-full text-left px-3 py-2 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                        >
                          {condition}
                          <span className="ml-2 text-xs text-gray-500">(condition)</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-1.5">Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">,</kbd> to add</p>
              
              <div className="flex justify-end mt-4">
                <button onClick={saveMedical} disabled={saving} className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md shadow-teal-200/50 hover:shadow-lg transition-all duration-200 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'}`}>{saving ? 'Saving...' : t('common.save')}</button>
              </div>
            </div>
          )}

          {active === 'privacy' && (
            <div className="space-y-5">
              {/* Cookie Consent Management */}
              <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
                  {t('profile.cookiePreferences')}
                </h2>
                <p className="text-xs text-gray-500 mb-3">{t('profile.cookiePreferencesDesc')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { key: 'necessary', label: t('cookie.necessary'), always: true },
                    { key: 'functional', label: t('cookie.functional') },
                    { key: 'analytics', label: t('cookie.analytics') },
                    { key: 'marketing', label: t('cookie.marketing') },
                  ].map((cat) => (
                    <div key={cat.key} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${cat.always || consent[cat.key] ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-700">{cat.label}</span>
                      <span className={`text-[10px] font-medium ${cat.always || consent[cat.key] ? 'text-green-600' : 'text-gray-400'}`}>
                        {cat.always ? 'Always' : consent[cat.key] ? 'On' : 'Off'}
                      </span>
                    </div>
                  ))}
                </div>
                {consentTimestamp && (
                  <p className="text-[10px] text-gray-400 mb-3">Last updated: {new Date(consentTimestamp).toLocaleString()}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={openCookieSettings} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all">
                    <Settings className="w-3.5 h-3.5" /> {t('profile.manageCookies')}
                  </button>
                  <button onClick={resetConsent} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all">
                    {t('profile.resetPreferences')}
                  </button>
                </div>
              </div>

              {/* Data Export */}
              <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                  {t('profile.yourData')}
                </h2>
                <p className="text-xs text-gray-500 mb-3">{t('profile.yourDataDesc')}</p>
                <button
                  onClick={async () => {
                    setSaving(true);
                    let exportData = {
                      exportDate: new Date().toISOString(),
                      gdprExport: true,
                      userData: { name: user?.name, email: user?.email, role: user?.role, id: user?.id },
                      cookieConsent: consent,
                      consentTimestamp,
                    };
                    // Try to fetch full export from backend
                    try {
                      const res = await fetch((process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8001/api') + '/auth/profile/data-export', {
                        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_state') || '{}').token}` },
                      });
                      if (res.ok) {
                        const serverExport = await res.json();
                        exportData = { ...exportData, ...serverExport };
                      }
                    } catch {}
                    // Merge local data
                    try {
                      const prefs = localStorage.getItem('profile_prefs');
                      if (prefs) exportData.preferences = JSON.parse(prefs);
                      if (user?.email) {
                        const med = localStorage.getItem(`patient_profile_extra_${user.email}`);
                        if (med) exportData.localMedicalData = JSON.parse(med);
                      }
                    } catch {}
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `medgama-data-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setSaving(false);
                    showToast('Data exported successfully');
                  }}
                  disabled={saving}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Download className="w-3.5 h-3.5" /> {saving ? 'Exporting...' : t('profile.downloadMyData')}
                </button>
              </div>

              {/* More Rights */}
              <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-purple-500 to-violet-500" />
                  {t('profile.privacyRights')}
                </h2>
                <p className="text-xs text-gray-500 mb-3">{t('profile.privacyRightsDesc')}</p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/data-rights" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all">
                    <Shield className="w-3.5 h-3.5" /> {t('profile.allPrivacyRights')} <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link to="/privacy-policy" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all">
                    {t('footer.privacyPolicy')} <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link to="/cookie-policy" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all">
                    {t('footer.cookiePolicy')} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Delete Account */}
              <div className="rounded-2xl border border-rose-200/60 bg-rose-50/30 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-rose-900 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-rose-500 to-red-500" />
                  {t('profile.deleteAccountData')}
                </h2>
                <p className="text-xs text-rose-700/70 mb-3">{t('profile.deleteAccountDesc')}</p>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete your account and all data? This action cannot be undone.')) {
                      try {
                        await authAPI.deleteAccount({ confirm: true });
                      } catch (err) {
                        console.warn('[Profile] Delete account API failed:', err?.message);
                      }
                      try {
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (key && key !== 'cookie_consent') keysToRemove.push(key);
                        }
                        keysToRemove.forEach((k) => localStorage.removeItem(k));
                        sessionStorage.clear();
                      } catch {}
                      logout({ skipConfirmation: true });
                      window.location.href = '/';
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-300 bg-rose-100 text-rose-700 hover:bg-rose-200 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t('profile.deleteMyAccount')}
                </button>
              </div>
            </div>
          )}

          {/* Connections section removed */}
        </section>
      </div>
    </div>
    </div>
  );
}
