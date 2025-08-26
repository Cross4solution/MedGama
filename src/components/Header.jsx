import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MediTravel</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/home" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Ana Sayfa
            </Link>
            <Link to="/clinics" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Klinikler
            </Link>
            <Link to="/timeline" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Timeline
            </Link>
            <Link to="/clinic" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Klinik Detay
            </Link>
            <Link to="/doctor-chat" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Doktor Chat
            </Link>
            <Link to="/telehealth-appointment" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Telehealth
            </Link>
            <Link to="/terms-of-service" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Hizmet Sözleşmesi
            </Link>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="relative" ref={loginRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={loginOpen}
                onClick={() => setLoginOpen((p) => !p)}
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg border border-transparent hover:border-gray-200"
              >
                Giriş Yap
                <svg className="w-4 h-4 ml-1 inline-block text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
              </button>
              {loginOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <a href="/login" role="menuitem" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Hasta Girişi</a>
                  <a href="https://crmtaslak.netlify.app/login" target="_blank" rel="noreferrer" role="menuitem" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Klinik Girişi</a>
                  <a href="https://crmtaslak.netlify.app/login" target="_blank" rel="noreferrer" role="menuitem" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Doktor Girişi</a>
                </div>
              )}
            </div>
            <Link to="/register" className="text-sm bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700">Kayıt Ol</Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <nav className="space-y-3">
                <Link 
                  to="/home" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-base transition-colors py-3 border-b border-gray-100"
                >
                  Ana Sayfa
                </Link>
                <Link 
                  to="/clinics" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-base transition-colors py-3 border-b border-gray-100"
                >
                  Klinikler
                </Link>
                <Link 
                  to="/timeline" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-base transition-colors py-3 border-b border-gray-100"
                >
                  Timeline
                </Link>
                <Link 
                  to="/clinic" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-base transition-colors py-3 border-b border-gray-100"
                >
                  Klinik Detay
                </Link>
                <Link 
                  to="/doctor-chat" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-base transition-colors py-3 border-b border-gray-100"
                >
                  Doktor Chat
                </Link>
                <Link 
                  to="/telehealth-appointment" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-base transition-colors py-3 border-b border-gray-100"
                >
                  Telehealth
                </Link>
                <Link 
                  to="/terms-of-service" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-base transition-colors py-3 border-b border-gray-100"
                >
                  Hizmet Sözleşmesi
                </Link>
              </nav>

              {/* Mobile Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link to="/login" onClick={closeMenu} className="block w-full text-center px-4 py-3 border rounded-xl text-gray-700 hover:bg-gray-50">Hasta Girişi</Link>
                <a href="https://crmtaslak.netlify.app/login" target="_blank" rel="noreferrer" onClick={closeMenu} className="block w-full text-center px-4 py-3 border rounded-xl text-gray-700 hover:bg-gray-50">Klinik Girişi</a>
                <a href="https://crmtaslak.netlify.app/login" target="_blank" rel="noreferrer" onClick={closeMenu} className="block w-full text-center px-4 py-3 border rounded-xl text-gray-700 hover:bg-gray-50">Doktor Girişi</a>
                <Link to="/register" onClick={closeMenu} className="block w-full text-center px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700">Kayıt Ol</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 