import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import countriesEurope from '../../data/countriesEurope';
import CountryCombobox from '../../components/forms/CountryCombobox';
import { getFlagCode } from '../../utils/geo';
import countryCodes from '../../data/countryCodes';
import countryDialCodes from '../../data/countryDialCodes';

export function useProfileAccount() {
  const { user, country, updateProfile, fetchCurrentUser, token } = useAuth();
  const { notify } = useToast();

  const [name, setName] = useState(user?.fname || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [fname, setFname] = useState(user?.fname || '');
  const [lname, setLname] = useState(user?.lname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneCc, setPhoneCc] = useState(user?.phone_cc || '');
  const [profilePassword, setProfilePassword] = useState('');
  const phoneCcRef = useRef(null);
  const [phoneCcOpen, setPhoneCcOpen] = useState(false);
  const [phoneCcQuery, setPhoneCcQuery] = useState('');
  const initialCountryName = useMemo(() => {
    if (!country) return '';
    const lower = country.toLowerCase();
    const entry = Object.entries(countryCodes).find(([, code]) => code === lower);
    return entry ? entry[0] : '';
  }, [country]);
  const [countryName, setCountryName] = useState(initialCountryName);
  const fileInputRef = useRef(null);
  const [avatarFileName, setAvatarFileName] = useState('');

  // Profil sayfası açıldığında ve token hazır olduğunda backend'den en güncel user'ı çek
  useEffect(() => {
    if (token) {
      fetchCurrentUser?.();
    }
  }, [token, fetchCurrentUser]);

  // Backend'ten gelen user güncellendiğinde form state'lerini senkronize et
  useEffect(() => {
    if (!user) return;
    setName(user.fname || '');
    setAvatar(user.avatar || '');
    setFname(user.fname || '');
    setLname(user.lname || '');
    setPhone(user.phone || '');
    setPhoneCc(user.phone_cc || '');
    const lower = (country || '').toLowerCase();
    if (lower) {
      const entry = Object.entries(countryCodes).find(([, code]) => code === lower);
      setCountryName(entry ? entry[0] : '');
    }
  }, [user, country]);

  useEffect(() => {
    if (!phoneCcOpen) return;
    const onClick = (e) => {
      if (phoneCcRef.current && !phoneCcRef.current.contains(e.target)) {
        setPhoneCcOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [phoneCcOpen]);

  const resolvePhoneCcIso = (code) => {
    const cc = String(code || '').trim();
    if (!cc.startsWith('+')) return null;
    try {
      const entry = Object.entries(countryDialCodes || {}).find(([, dial]) => dial === cc);
      if (!entry) return null;
      const [name] = entry;
      const iso = getFlagCode(name) || countryCodes[name] || null;
      return iso || null;
    } catch {
      return null;
    }
  };

  const phoneCodeOptions = useMemo(() => {
    const codeToNames = new Map();
    Object.entries(countryDialCodes || {}).forEach(([name, code]) => {
      const arr = codeToNames.get(code) || [];
      arr.push(name);
      codeToNames.set(code, arr);
    });
    const arr = [];
    codeToNames.forEach((names, code) => {
      const rep = (names && names[0]) || '';
      const iso = getFlagCode(rep) || countryCodes[rep] || null;
      arr.push({ code, name: rep, iso });
    });
    return arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, []);

  const handleDisplayNameChange = (value) => {
    setName(value);
    setFname(value);
  };

  const handleAvatarFileChange = (file) => {
    if (!file) return;
    setAvatarFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(String(ev.target?.result || ''));
    reader.readAsDataURL(file);
  };

  const handlePhoneChange = (value) => setPhone(value);

  const handlePhoneCcToggle = () => setPhoneCcOpen((o) => !o);

  const handlePhoneCcSelect = (code) => {
    setPhoneCc(code);
    setPhoneCcOpen(false);
  };

  const handlePhoneCcQueryChange = (value) => setPhoneCcQuery(value);

  const saveAccount = async (e) => {
    e.preventDefault();

    if (!fname.trim()) {
      notify({ type: 'error', message: 'First name (fname) zorunludur.' });
      return;
    }

    if (!profilePassword || profilePassword.length < 8) {
      notify({ type: 'error', message: 'Şifre en az 8 karakter olmalıdır.' });
      return;
    }

    const rawPhoneCc = (phoneCc || '').trim();
    const normalizedPhoneCc = rawPhoneCc ? rawPhoneCc.replace(/\s+/g, '') : '';
    if (normalizedPhoneCc && !/^\+\d{1,4}$/.test(normalizedPhoneCc)) {
      notify({ type: 'error', message: 'Ülke kodu formatı geçersiz. Örnek: +90, +1' });
      return;
    }

    const digitsPhone = (phone || '').replace(/\D/g, '');
    if (digitsPhone && (digitsPhone.length < 7 || digitsPhone.length > 15)) {
      notify({ type: 'error', message: 'Telefon numarası 7 ile 15 hane arasında olmalıdır.' });
      return;
    }

    const payload = {
      fname: fname.trim().slice(0, 255),
      lname: lname ? lname.trim().slice(0, 255) : null,
      password: profilePassword,
      phone: digitsPhone || null,
      phone_cc: normalizedPhoneCc || null,
    };

    try {
      const res = await updateProfile(payload);
      notify({ type: 'success', message: res?.message || 'Profile updated.' });
      setProfilePassword('');
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Profil güncellenirken bir hata oluştu.';
      notify({ type: 'error', message: msg });
    }
  };

  return {
    user,
    countriesEurope,
    CountryCombobox,
    name,
    avatar,
    avatarFileName,
    fname,
    lname,
    phone,
    phoneCc,
    profilePassword,
    countryName,
    phoneCcOpen,
    phoneCcQuery,
    fileInputRef,
    phoneCcRef,
    phoneCodeOptions,
    resolvePhoneCcIso,
    setCountryName,
    setFname,
    setLname,
    setProfilePassword,
    handleDisplayNameChange,
    handleAvatarFileChange,
    handlePhoneChange,
    handlePhoneCcToggle,
    handlePhoneCcSelect,
    handlePhoneCcQueryChange,
    saveAccount,
  };
}
