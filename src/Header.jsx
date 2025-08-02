import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b relative">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-lg font-bold text-gray-900">MediTravel</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/home" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Ana Sayfa
            </Link>
            <Link to="/clinics" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Klinikler
            </Link>
            <Link to="/timeline" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Timeline
            </Link>
            <Link to="/clinic" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Klinik Detay
            </Link>
            <Link to="/doctor-chat" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Doktor Chat
            </Link>
            <Link to="/telehealth-appointment" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Telehealth
            </Link>
            <Link to="/terms-of-service" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Hizmet Sözleşmesi
            </Link>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              to="/" 
              className="px-3 py-1 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              Giriş Yap
            </Link>
            <Link 
              to="/" 
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium text-sm"
            >
              Üye Ol
            </Link>
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
                  className="block text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors py-2 border-b border-gray-100"
                >
                  Ana Sayfa
                </Link>
                <Link 
                  to="/clinics" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors py-2 border-b border-gray-100"
                >
                  Klinikler
                </Link>
                <Link 
                  to="/timeline" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors py-2 border-b border-gray-100"
                >
                  Timeline
                </Link>
                <Link 
                  to="/clinic" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors py-2 border-b border-gray-100"
                >
                  Klinik Detay
                </Link>
                <Link 
                  to="/doctor-chat" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors py-2 border-b border-gray-100"
                >
                  Doktor Chat
                </Link>
                <Link 
                  to="/telehealth-appointment" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors py-2 border-b border-gray-100"
                >
                  Telehealth
                </Link>
                <Link 
                  to="/terms-of-service" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors py-2 border-b border-gray-100"
                >
                  Hizmet Sözleşmesi
                </Link>
              </nav>

              {/* Mobile Action Buttons */}
              <div className="pt-4 space-y-3 border-t border-gray-200">
                <Link 
                  to="/" 
                  onClick={closeMenu}
                  className="block w-full text-center px-4 py-2 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm"
                >
                  Giriş Yap
                </Link>
                <Link 
                  to="/" 
                  onClick={closeMenu}
                  className="block w-full text-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium text-sm"
                >
                  Üye Ol
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 