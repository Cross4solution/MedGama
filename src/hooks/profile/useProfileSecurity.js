import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

export function useProfileSecurity(loadPrefs, savePrefs) {
  const { notify } = useToast();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showNewPwd2, setShowNewPwd2] = useState(false);

  const saveSecurity = (e) => {
    e.preventDefault();
    if (newPwd.length < 6) return notify({ type: 'error', message: 'Yeni şifre en az 6 karakter olmalı.' });
    if (newPwd !== newPwd2) return notify({ type: 'error', message: 'Yeni şifreler eşleşmiyor.' });
    const next = { ...loadPrefs() };
    savePrefs(next);
    setOldPwd(''); setNewPwd(''); setNewPwd2('');
    notify({ type: 'success', message: 'Güvenlik ayarları kaydedildi. (Demo)' });
  };

  return {
    oldPwd,
    newPwd,
    newPwd2,
    showOldPwd,
    showNewPwd,
    showNewPwd2,
    setOldPwd,
    setNewPwd,
    setNewPwd2,
    setShowOldPwd,
    setShowNewPwd,
    setShowNewPwd2,
    saveSecurity,
  };
}
