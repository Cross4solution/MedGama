import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function useProfileMedical() {
  const { user } = useAuth();
  const { notify } = useToast();

  const [medicalConditions, setMedicalConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');
  const [showConditionSuggestions, setShowConditionSuggestions] = useState(false);
  const conditionInputRef = useRef(null);

  const commonConditions = [
    'Hypertension', 'Diabetes Type 2', 'Diabetes Type 1', 'Asthma',
    'Arthritis', 'Depression', 'Anxiety', 'Migraine', 'COPD',
    'Heart Disease', 'High Cholesterol', 'Thyroid Disorder',
    'Penicillin Allergy', 'Pollen Allergy', 'Food Allergy'
  ];

  const filteredConditions = useMemo(() => (
    conditionInput.trim()
      ? commonConditions.filter(c =>
          c.toLowerCase().includes(conditionInput.toLowerCase()) &&
          !medicalConditions.includes(c)
        )
      : []
  ), [conditionInput, medicalConditions]);

  useEffect(() => {
    try {
      if (user?.role === 'patient' && user?.email) {
        const key = `patient_profile_extra_${user.email}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const obj = JSON.parse(raw);
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
      const text = conditionInput.replace(/,$/, '');
      if (filteredConditions.length > 0 && text.trim()) {
        const exactMatch = filteredConditions.find(c => c.toLowerCase() === text.toLowerCase());
        addCondition(exactMatch || text);
      } else if (text) {
        addCondition(text);
      }
    } else if (e.key === 'Backspace' && !conditionInput && medicalConditions.length > 0) {
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
        notify({ type: 'success', message: 'Medical conditions saved. (Demo)' });
      }
    } catch {
      notify({ type: 'error', message: 'Medical conditions could not be saved.' });
    }
  };

  return {
    user,
    medicalConditions,
    conditionInput,
    showConditionSuggestions,
    conditionInputRef,
    filteredConditions,
    setConditionInput,
    setShowConditionSuggestions,
    addCondition,
    removeCondition,
    handleConditionKeyDown,
    clearAllConditions,
    saveMedical,
  };
}
