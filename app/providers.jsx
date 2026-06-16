'use client';

// Tüm client-side context provider'ları tek noktada toplar.
// Next App Router'da Router GEREKMEZ (routing dosya-tabanlı).
// HelmetProvider FAZ 2'de hâlâ GEREKLİ: 60+ ekran <SEOHead> (react-helmet-async)
// kullanıyor; provider olmadan SSR prerender "Cannot read properties of undefined
// (reading 'add')" ile patlıyor. FAZ 3'te SEOHead → Next Metadata API'ye geçince kaldırılacak.
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import '@/i18n'; // react-i18next init (client)
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <FavoritesProvider>
            <NotificationsProvider>
              <CookieConsentProvider>
                {children}
              </CookieConsentProvider>
            </NotificationsProvider>
          </FavoritesProvider>
        </ToastProvider>
      </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
