import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cookie_consent';

const DEFAULT_CONSENT = {
  necessary: true,    // Always true, cannot be disabled
  analytics: false,
  marketing: false,
  functional: false,
};

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(DEFAULT_CONSENT);
  const [consentGiven, setConsentGiven] = useState(false); // Has user made a choice?
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState(null);

  // Load saved consent on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.consent === 'object' && parsed.timestamp) {
          setConsent({ ...DEFAULT_CONSENT, ...parsed.consent, necessary: true });
          setConsentGiven(true);
          setConsentTimestamp(parsed.timestamp);
          setShowBanner(false);
          return;
        }
      }
    } catch {}
    // No valid consent found — show banner
    setShowBanner(true);
  }, []);

  const saveConsent = useCallback((newConsent) => {
    const final = { ...newConsent, necessary: true };
    const timestamp = new Date().toISOString();
    setConsent(final);
    setConsentGiven(true);
    setConsentTimestamp(timestamp);
    setShowBanner(false);
    setShowSettings(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        consent: final,
        timestamp,
        version: '1.0',
      }));
    } catch {}
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({ necessary: true, analytics: true, marketing: true, functional: true });
  }, [saveConsent]);

  const declineAll = useCallback(() => {
    saveConsent({ necessary: true, analytics: false, marketing: false, functional: false });
  }, [saveConsent]);

  const acceptSelected = useCallback((selected) => {
    saveConsent({ ...DEFAULT_CONSENT, ...selected, necessary: true });
  }, [saveConsent]);

  const resetConsent = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setConsent(DEFAULT_CONSENT);
    setConsentGiven(false);
    setConsentTimestamp(null);
    setShowBanner(true);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // Helper: check if a specific category is consented
  const hasConsent = useCallback((category) => {
    if (category === 'necessary') return true;
    return consent[category] === true;
  }, [consent]);

  const value = {
    consent,
    consentGiven,
    consentTimestamp,
    showBanner,
    showSettings,
    acceptAll,
    declineAll,
    acceptSelected,
    resetConsent,
    openSettings,
    closeSettings,
    hasConsent,
    setShowBanner,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}
