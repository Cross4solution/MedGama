import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import countriesEurope from '../data/countriesEurope';
import countryCodes from '../data/countryCodes';
import { User, Shield, Bell, Lock, Globe, Link as LinkIcon, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';

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
  const [twoFA, setTwoFA] = useState(!!prefs.twoFA);
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
        <p className="mt-2 text-gray-600">Lütfen giriş yapın.</p>
      </div>
    );
  }

  const saveAccount = (e) => {
    e.preventDefault();
    const updated = { ...user, name: name.trim() || user.name, avatar: avatar.trim() || undefined };
    const codeLower = countryCodes[countryName] || null;
    const codeUpper = codeLower ? codeLower.toUpperCase() : country;
    login(updated, codeUpper);
  };

  const saveSecurity = (e) => {
    e.preventDefault();
    if (newPwd.length < 6) return alert('Yeni şifre en az 6 karakter olmalı.');
    if (newPwd !== newPwd2) return alert('Yeni şifreler eşleşmiyor.');
    const next = { ...loadPrefs(), twoFA };
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
          <p className="text-sm text-gray-600">Hesabını, güvenliği ve tercihlerini yönet.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        {/* Left nav */}
        <aside className="space-y-2">
          <NavItem id="account" icon={User} title="Account" desc="Profil, ülke ve görünüm" />
          <NavItem id="security" icon={Shield} title="Security" desc="Şifre ve 2FA" />
          <NavItem id="notifications" icon={Bell} title="Notifications" desc="E-posta ve push" />
          <NavItem id="privacy" icon={Lock} title="Privacy" desc="Gizlilik ve veri" />
          <NavItem id="connections" icon={LinkIcon} title="Connections" desc="Bağlı hesaplar" />
        </aside>

        {/* Right content */}
        <section className="space-y-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Görseli URL ile güncelleyebilirsin. (Demo)</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={countryName}
                    onChange={(e)=> setCountryName(e.target.value)}
                  >
                    {countriesEurope.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Two‑Factor Authentication</h2>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={twoFA} onChange={(e)=>setTwoFA(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Enable 2FA</span>
                </label>
                <p className="text-xs text-gray-500 mt-2">Demo: Gerçek SMS/Authenticator entegrasyonu yok.</p>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save security</button>
              </div>
            </form>
          )}

          {active === 'notifications' && (
            <form onSubmit={saveNotifications} className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Email</h2>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={emailNoti} onChange={(e)=>setEmailNoti(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Receive email updates</span>
                </label>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Push</h2>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={pushNoti} onChange={(e)=>setPushNoti(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Receive push notifications</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save notifications</button>
              </div>
            </form>
          )}

          {active === 'privacy' && (
            <form onSubmit={savePrivacy} className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Profile Visibility</h2>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={profilePublic} onChange={(e)=>setProfilePublic(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Public profile</span>
                </label>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Data Sharing</h2>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={dataShare} onChange={(e)=>setDataShare(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Allow anonymized analytics</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save privacy</button>
              </div>
            </form>
          )}

          {active === 'connections' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Google</h2>
                  <p className="text-sm text-gray-600">Hesabını Google ile bağla veya bağlantıyı kes.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleGoogle}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${googleLinked? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {googleLinked ? 'Disconnect' : 'Connect'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Demo: Gerçek OAuth akışı yok; sadece tercih kaydedilir.</p>
            </div>
          )}
        </section>
      </div>
    </div>
    </>
  );
}
