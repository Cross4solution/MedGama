import React, { useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import countriesEurope from '../data/countriesEurope';
import CountryCombobox from '../components/forms/CountryCombobox';
import { getFlagCode } from '../utils/geo';
import countryCodes from '../data/countryCodes';
import { User, Shield, Bell, Globe, ChevronRight, Eye, EyeOff, HeartPulse, X } from 'lucide-react';
import PatientNotify from '../components/notifications/PatientNotify';

export default function Profile() {
  const { user, country, login } = useAuth();
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

  // Mock preferences (persist localStorage)
  const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem('profile_prefs') || '{}'); } catch { return {}; }
  };
  const savePrefs = (obj) => localStorage.setItem('profile_prefs', JSON.stringify(obj || {}));
  const prefs = useMemo(() => loadPrefs(), []);

  // Security
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  // 2FA kaldırıldı
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showNewPwd2, setShowNewPwd2] = useState(false);

  // Notifications
  const [emailNoti, setEmailNoti] = useState(prefs.emailNoti ?? true);
  const [pushNoti, setPushNoti] = useState(prefs.pushNoti ?? false);

  // Privacy
  const [profilePublic, setProfilePublic] = useState(prefs.profilePublic ?? true);
  const [dataShare, setDataShare] = useState(prefs.dataShare ?? false);

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
  
  React.useEffect(() => {
    try {
      if (user?.role === 'patient' && user?.email) {
        const key = `patient_profile_extra_${user.email}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const obj = JSON.parse(raw);
          // Backward compatibility: convert string to array
          if (obj && typeof obj.medicalHistory === 'string' && obj.medicalHistory) {
            const converted = obj.medicalHistory.split(',').map(s => s.trim()).filter(Boolean);
            setMedicalConditions(converted);
          } else if (obj && Array.isArray(obj.medicalConditions)) {
            setMedicalConditions(obj.medicalConditions);
          }
        }
      }
    } catch {}
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

  const saveMedical = (e) => {
    e?.preventDefault?.();
    try {
      if (user?.role === 'patient' && user?.email) {
        const key = `patient_profile_extra_${user.email}`;
        const raw = localStorage.getItem(key);
        const prev = raw ? JSON.parse(raw) : {};
        const next = { ...prev, medicalConditions };
        localStorage.setItem(key, JSON.stringify(next));
        alert('Medical conditions saved. (Demo)');
      }
    } catch {}
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Please sign in.</p>
      </div>
    );
  }

  const saveAccount = (e) => {
    e.preventDefault();
    const limitedName = (name || '').slice(0, 30).trim();
    const updated = { ...user, name: limitedName || user.name, avatar: avatar.trim() || undefined };
    const codeLower = countryCodes[countryName] || null;
    const codeUpper = codeLower ? codeLower.toUpperCase() : country;
    login(updated, codeUpper);
  };

  const saveSecurity = (e) => {
    e.preventDefault();
    if (newPwd.length < 6) return alert('Yeni şifre en az 6 karakter olmalı.');
    if (newPwd !== newPwd2) return alert('Yeni şifreler eşleşmiyor.');
    const next = { ...loadPrefs() };
    savePrefs(next);
    setOldPwd(''); setNewPwd(''); setNewPwd2('');
    alert('Güvenlik ayarları kaydedildi. (Demo)');
  };

  const saveNotifications = (e) => {
    e.preventDefault();
    const next = { ...loadPrefs(), emailNoti, pushNoti };
    savePrefs(next);
    alert('Bildirim tercihleri kaydedildi. (Demo)');
  };

  const savePrivacy = (e) => {
    e.preventDefault();
    const next = { ...loadPrefs(), profilePublic, dataShare };
    savePrefs(next);
    alert('Gizlilik tercihleri kaydedildi. (Demo)');
  };

  // Connections removed

  const NavItem = ({ id, icon: Icon, title, desc }) => (
    <button
      type="button"
      onClick={() => setActive(id)}
      className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 ${active===id? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
      aria-current={active===id}
    >
      <Icon className={`w-5 h-5 ${active===id? 'text-blue-600' : 'text-gray-500'}`} />
      <span>
        <span className="block text-sm font-medium text-gray-900">{title}</span>
        <span className="block text-xs text-gray-500">{desc}</span>
      </span>
      <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Manage your account, security and preferences.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-8">
        {/* Left nav */}
        <aside className="space-y-2">
          <NavItem id="account" icon={User} title="Account" desc="Profile, country and appearance" />
          <NavItem id="security" icon={Shield} title="Security" desc="Password" />
          <NavItem id="notifications" icon={Bell} title="Notifications" desc="Patient notifications" />
          {user?.role === 'patient' && (
            <NavItem id="medical" icon={HeartPulse} title="Medical History" desc="Diseases & meds" />
          )}
          {/* Connections removed */}
        </aside>

        {/* Right content */}
        <section className="space-y-8">
          {active === 'account' && (
            <form onSubmit={saveAccount} className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
                <div className="flex items-center gap-4">
                  <img
                    src={avatar || user.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        setAvatarFileName(file.name);
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
                        className="px-3 h-10 inline-flex items-center border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50"
                      >
                        Choose file
                      </button>
                      <span className="text-sm text-gray-600 truncate max-w-[240px]">{avatarFileName || 'No file selected'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Choose an image file to set your profile picture. (Stored locally for demo)</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    className="w-full border border-gray-300 rounded-lg px-3 text-sm h-10"
                    placeholder="Your name"
                  />
                  <p className="mt-1 text-xs text-gray-500">{Math.max(0, 30 - (name?.length || 0))} characters left</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
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
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          )}

          {active === 'security' && (
            <form onSubmit={saveSecurity} className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Password</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showOldPwd ? 'text' : 'password'}
                        value={oldPwd}
                        onChange={(e)=>setOldPwd(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={()=>setShowOldPwd(s=>!s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showOldPwd ? 'Hide password' : 'Show password'}
                      >
                        {showOldPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        value={newPwd}
                        onChange={(e)=>setNewPwd(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={()=>setShowNewPwd(s=>!s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                      >
                        {showNewPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repeat New</label>
                    <div className="relative">
                      <input
                        type={showNewPwd2 ? 'text' : 'password'}
                        value={newPwd2}
                        onChange={(e)=>setNewPwd2(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={()=>setShowNewPwd2(s=>!s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showNewPwd2 ? 'Hide password' : 'Show password'}
                      >
                        {showNewPwd2 ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          )}

          {active === 'notifications' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Patient Notifications</h2>
                <PatientNotify />
              </div>
            </div>
          )}

          

          {active === 'medical' && user?.role === 'patient' && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Medical History</h2>
              <p className="text-sm text-gray-600 mb-3">Current Medical Conditions (e.g., Hypertension, Diabetes, Asthma)</p>
              
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
                <button onClick={saveMedical} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save</button>
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
