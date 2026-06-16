'use client';

// Tüm client-side context provider'ları tek noktada toplar.
// Next App Router'da Router ve HelmetProvider GEREKMEZ:
//  - Routing: Next dosya-tabanlı (next/navigation)
//  - <head>: Next Metadata API
import React from 'react';
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
    </ErrorBoundary>
  );
}
