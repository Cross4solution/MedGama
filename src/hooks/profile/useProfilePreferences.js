import { useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';

export function useProfilePreferences() {
  const { notify } = useToast();

  const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem('profile_prefs') || '{}'); } catch { return {}; }
  };
  const savePrefs = (obj) => localStorage.setItem('profile_prefs', JSON.stringify(obj || {}));
  const prefs = useMemo(() => loadPrefs(), []);

  const [emailNoti, setEmailNoti] = useState(prefs.emailNoti ?? true);
  const [pushNoti, setPushNoti] = useState(prefs.pushNoti ?? false);
  const [profilePublic, setProfilePublic] = useState(prefs.profilePublic ?? true);
  const [dataShare, setDataShare] = useState(prefs.dataShare ?? false);

  const saveNotifications = (e) => {
    e.preventDefault();
    const next = { ...loadPrefs(), emailNoti, pushNoti };
    savePrefs(next);
    notify({ type: 'success', message: 'Bildirim tercihleri kaydedildi. (Demo)' });
  };

  const savePrivacy = (e) => {
    e.preventDefault();
    const next = { ...loadPrefs(), profilePublic, dataShare };
    savePrefs(next);
    notify({ type: 'success', message: 'Gizlilik tercihleri kaydedildi. (Demo)' });
  };

  return {
    emailNoti,
    setEmailNoti,
    pushNoti,
    setPushNoti,
    profilePublic,
    setProfilePublic,
    dataShare,
    setDataShare,
    loadPrefs,
    savePrefs,
    saveNotifications,
    savePrivacy,
  };
}
