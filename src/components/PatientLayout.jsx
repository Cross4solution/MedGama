import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * PatientLayout: (user varsa) Sidebar + offset'li içerik sarmalayıcı
 * Header artık App.js'de merkezi olarak yönetiliyor
 * Kullanım:
 * <PatientLayout>
 *   <div className="...">Sayfa içeriği</div>
 * </PatientLayout>
 */
export default function PatientLayout({ children, className = '' }) {
  const { user } = useAuth();
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}
