import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, sidebarMobileOpen, setSidebarMobileOpen } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // legacy (mobile menu removed)
  const [isScrolled, setIsScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Close login dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) setLoginOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Header transparency on scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${isScrolled ? 'bg-white/20 backdrop-blur-lg supports-[backdrop-filter]:bg-white/10' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to={user ? "/patient-home" : "/"} onClick={closeMenu} className="flex items-center space-x-3 cursor-pointer select-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isScrolled ? 'bg-green-500/40' : 'bg-green-500'}`}>
              <span className={`font-bold text-sm ${isScrolled ? 'text-white/80' : 'text-white'}`}>M</span>
            </div>
            <span className={`text-xl font-bold ${isScrolled ? 'text-gray-900/80' : 'text-gray-900'}`}>MedGama</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              About MedGama
            </Link>
            <Link to="/for-patients" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              For Patients
            </Link>
            <Link to="/clinics" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              For Clinics
            </Link>
            <Link to="/vasco-ai" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Vasco AI
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {!user ? (
              <>
                <div className="relative" ref={loginRef}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={loginOpen}
                    onClick={() => setLoginOpen((p) => !p)}
                    className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg border border-transparent hover:border-gray-200"
                  >
                    Login
                    <svg className="w-4 h-4 ml-1 inline-block text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                  </button>
                  {loginOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                      <Link to="/login" onClick={()=>setLoginOpen(false)} role="menuitem" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Patient Login</Link>
                      <a href="https://crmtaslak.netlify.app/login" target="_blank" rel="noreferrer" role="menuitem" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Clinic Entrance</a>
                      <a href="https://crmtaslak.netlify.app/login" target="_blank" rel="noreferrer" role="menuitem" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Doctor Login</a>
                    </div>
                  )}
                </div>
                <Link to="/register" className="text-sm bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700">Register</Link>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-700">Hi, {user.name}</div>
              </>
            )}
          </div>

          {/* Mobile: Hamburger (guest -> local menu, user -> sidebar) */}
          <button
            onClick={() => (user ? setSidebarMobileOpen(!sidebarMobileOpen) : toggleMenu())}
            aria-label={user ? (sidebarMobileOpen ? 'Close menu' : 'Open menu') : (isMenuOpen ? 'Close menu' : 'Open menu')}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Menu"
          >
            {(user ? sidebarMobileOpen : isMenuOpen) ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
    {/* Guest mobile menu (local) */}
    {!user && isMenuOpen && (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden" onClick={closeMenu} />
        {/* Panel */}
        <div className="fixed top-20 left-0 right-0 z-50 mx-4 max-w-md md:hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
          <nav className="divide-y divide-gray-100">
            <div className="p-4 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={closeMenu} className="col-span-1 text-center px-3 py-2 rounded-lg border text-sm font-medium text-gray-800 hover:bg-gray-50">Login</Link>
              <Link to="/register" onClick={closeMenu} className="col-span-1 text-center px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">Register</Link>
            </div>
            <div className="p-2">
              <Link to="/about" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">About MedGama</Link>
              <Link to="/for-patients" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">For Patients</Link>
              <Link to="/clinics" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">For Clinics</Link>
              <Link to="/vasco-ai" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">Vasco AI</Link>
              <Link to="/contact" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">Contact</Link>
            </div>
          </nav>
        </div>
      </>
    )}
    {/* Spacer to preserve layout height for fixed header (approx 5rem) */}
    <div className="h-20"></div>
    </>
  );
};

export default Header; 