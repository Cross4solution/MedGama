import React, { useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import countriesEurope from '../data/countriesEurope';
import CountryCombobox from '../components/forms/CountryCombobox';
import countryCodes from '../data/countryCodes';
import { User, Shield, Bell, Lock, Globe, Link as LinkIcon, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Header } from '../components/layout';
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

  // Connections
  const [googleLinked, setGoogleLinked] = useState(!!prefs.googleLinked);

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

  const toggleGoogle = () => {
    const next = !googleLinked;
    setGoogleLinked(next);
    savePrefs({ ...loadPrefs(), googleLinked: next });
  };

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
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Manage your account, security and preferences.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-8">
        {/* Left nav */}
        <aside className="space-y-2">
          <NavItem id="account" icon={User} title="Account" desc="Profile, country and appearance" />
          <NavItem id="security" icon={Shield} title="Security" desc="Password" />
          <NavItem id="notifications" icon={Bell} title="Notifications" desc="Patient notifications" />
          <NavItem id="privacy" icon={Lock} title="Privacy" desc="Privacy and data" />
          <NavItem id="connections" icon={LinkIcon} title="Connections" desc="Linked accounts" />
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
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save changes</button>
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
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save security</button>
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

          {active === 'privacy' && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Privacy settings are not available at the moment.</p>
            </div>
          )}

          {active === 'connections' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Google</h2>
                  <p className="text-sm text-gray-600">Link or unlink your account with Google.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleGoogle}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${googleLinked? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {googleLinked ? 'Disconnect' : 'Connect'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Demo: No real OAuth flow; only a preference is stored.</p>
            </div>
          )}
        </section>
      </div>
    </div>
    </>
  );
}
