import React from 'react';
import { Header } from './layout';
import { useAuth } from '../context/AuthContext';

/**
 * PatientLayout: Header + (user varsa) Sidebar + offset'li içerik sarmalayıcı
 * Kullanım:
 * <PatientLayout>
 *   <div className="...">Sayfa içeriği</div>
 * </PatientLayout>
 */
export default function PatientLayout({ children, className = '' }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className={`${user ? 'lg:ml-[var(--sidebar-width)]' : ''} ${className}`}>
        {children}
      </div>
    </div>
  );
}
