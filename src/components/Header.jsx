import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, Stethoscope, Hospital, Home, Info, HeartPulse, Building2, Cpu, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, sidebarMobileOpen, setSidebarMobileOpen, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // legacy (mobile menu removed)
  const [isScrolled, setIsScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);
  // Removed profile dropdown (only avatar + username shown)

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
          <Link to="/" onClick={closeMenu} className="flex items-center space-x-3 cursor-pointer select-none">
            <img
              src="/images/logo/crm-logo.jpg"
              alt="MedGama Logo"
              className="h-10 md:h-12 w-auto object-contain rounded"
              loading="eager"
              decoding="async"
            />
            <span className={`text-xl font-bold ${isScrolled ? 'text-gray-900/80' : 'text-gray-900'}`}>MedGama</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 md:ml-10 lg:ml-16">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Homepage</span>
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>About MedGama</span>
            </Link>
            <Link to="/for-patients" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors flex items-center gap-2">
              <HeartPulse className="w-4 h-4" />
              <span>For Patients</span>
            </Link>
            <Link to="/clinics" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>For Clinics</span>
            </Link>
            <Link to="/vasco-ai" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Vasco AI</span>
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Contact</span>
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
                      <Link to="/login" onClick={()=>setLoginOpen(false)} role="menuitem" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>Patient Login</span>
                      </Link>
                      <Link to="/doctor-login" onClick={()=>setLoginOpen(false)} role="menuitem" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Stethoscope className="w-4 h-4 text-gray-500" />
                        <span>Doctor Login</span>
                      </Link>
                      <Link to="/clinic-login" onClick={()=>setLoginOpen(false)} role="menuitem" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Hospital className="w-4 h-4 text-gray-500" />
                        <span>Clinic Login</span>
                      </Link>
                    </div>
                  )}
                </div>
                <Link to="/register" className="text-sm bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700">Register</Link>
              </>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5" title={user.name}>
                <img
                  src={user.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border"
                />
                <span className="text-sm text-gray-800 font-medium max-w-[160px] truncate">{user.name}</span>
                {user?.role === 'patient' && (
                  <button
                    onClick={logout}
                    className="ml-1 text-xs px-2 py-1 rounded border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    title="Logout"
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile trigger: guest -> hamburger; logged-in -> avatar button that opens local menu */}
          {user ? (
            <button
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Close profile menu' : 'Open profile menu'}
              className="md:hidden p-1 rounded-full border border-gray-200 overflow-hidden"
              title={user.name}
            >
              <img
                src={user.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            </button>
          ) : (
            <button
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
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
              <Link to="/login" onClick={closeMenu} className="col-span-2 px-3 py-2 rounded-lg border text-sm font-semibold text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                <span>Patient Login</span>
              </Link>
              <Link to="/doctor-login" onClick={closeMenu} className="col-span-1 px-3 py-2 rounded-lg border text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                <Stethoscope className="w-4 h-4" />
                <span>Doctor</span>
              </Link>
              <Link to="/clinic-login" onClick={closeMenu} className="col-span-1 px-3 py-2 rounded-lg border text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                <Hospital className="w-4 h-4" />
                <span>Clinic</span>
              </Link>
              <Link to="/register" onClick={closeMenu} className="col-span-2 text-center px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">Register</Link>
            </div>
            <div className="p-2">
              <Link to="/" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Home className="w-4 h-4" />
                <span>Homepage</span>
              </Link>
              <Link to="/about" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Info className="w-4 h-4" />
                <span>About MedGama</span>
              </Link>
              <Link to="/for-patients" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <HeartPulse className="w-4 h-4" />
                <span>For Patients</span>
              </Link>
              <Link to="/clinics" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Building2 className="w-4 h-4" />
                <span>For Clinics</span>
              </Link>
              <Link to="/vasco-ai" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Cpu className="w-4 h-4" />
                <span>Vasco AI</span>
              </Link>
              <Link to="/contact" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Phone className="w-4 h-4" />
                <span>Contact</span>
              </Link>
            </div>
          </nav>
        </div>
      </>
    )}
    {/* Authenticated mobile menu (local) for any logged-in user */}
    {user && isMenuOpen && (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden" onClick={closeMenu} />
        {/* Panel */}
        <div className="fixed top-20 left-0 right-0 z-50 mx-4 max-w-md md:hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <img src={user.avatar || '/images/portrait-candid-male-doctor_720.jpg'} alt={user.name} className="w-10 h-10 rounded-full object-cover border" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{(user.role || 'user').toString().charAt(0).toUpperCase() + (user.role || 'user').toString().slice(1)}</p>
            </div>
          </div>
          <nav className="divide-y divide-gray-100">
            <div className="p-2">
              <Link to="/" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Home className="w-4 h-4" />
                <span>Homepage</span>
              </Link>
              <Link to="/about" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Info className="w-4 h-4" />
                <span>About MedGama</span>
              </Link>
              <Link to="/for-patients" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <HeartPulse className="w-4 h-4" />
                <span>For Patients</span>
              </Link>
              <Link to="/clinics" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Building2 className="w-4 h-4" />
                <span>For Clinics</span>
              </Link>
              <Link to="/vasco-ai" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Cpu className="w-4 h-4" />
                <span>Vasco AI</span>
              </Link>
              <Link to="/contact" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Phone className="w-4 h-4" />
                <span>Contact</span>
              </Link>
            </div>
            <div className="p-2">
              <button
                onClick={() => { closeMenu(); logout(); }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
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