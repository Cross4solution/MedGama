import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Stethoscope, Hospital, Home, Info, HeartPulse, Building2, Cpu, MessageSquare, LayoutDashboard, Newspaper, CalendarClock, Bookmark, Settings, ArrowUpRight, Video, Monitor, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, sidebarMobileOpen, setSidebarMobileOpen, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // legacy (mobile menu removed)
  const [isScrolled, setIsScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
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
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
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
    <header className={`fixed top-0 left-0 right-0 z-50 border-b bg-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
          {/* Logo */}
          <Link to="/home-v2" onClick={closeMenu} className="flex items-center space-x-3 cursor-pointer select-none ml-9">
            <img
              src="/images/logo/crm-logo.jpg"
              alt="MedGama Logo"
              className="h-10 md:h-12 w-auto object-contain rounded"
              loading="eager"
              decoding="async"
            />
            <span className={`text-xl font-bold text-gray-900`}>MedGama</span>
          </Link>

          {/* Logoya daha da yakın menü */}
          <nav className="hidden md:flex items-center space-x-8 ml-auto mr-28">
            <Link to="/home-v2" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Homepage
            </Link>
            <Link to="/clinics" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Clinics
            </Link>
            <Link to="/vasco-ai" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              Vasco AI
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors">
              About MedGama
            </Link>
          </nav>

          {/* Right cluster: actions (desktop) + mobile trigger */}
          <div className="flex items-center justify-end gap-2">
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
                      <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 p-2 space-y-2">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={()=>{ setLoginOpen(false); navigate('/login'); }}
                          className="w-full inline-flex items-center gap-3 px-4 py-3 text-sm rounded-xl bg-green-50 text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-200 border border-green-200 shadow-sm"
                        >
                          <User className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Patient Login</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={()=>{ setLoginOpen(false); navigate('/doctor-login'); }}
                          className="w-full inline-flex items-center gap-3 px-4 py-3 text-sm rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 border border-blue-200 shadow-sm"
                        >
                          <Stethoscope className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Doctor Login</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={()=>{ setLoginOpen(false); navigate('/clinic-login'); }}
                          className="w-full inline-flex items-center gap-3 px-4 py-3 text-sm rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200 border border-purple-200 shadow-sm"
                        >
                          <Hospital className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">Clinic Login</span>
                        </button>
                        {/* CRM Login (external) */}
                        <a
                          role="menuitem"
                          href={(process.env.REACT_APP_CRM_URL || 'https://crmtaslak.netlify.app/login')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-between px-4 py-3 text-sm rounded-xl bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-900 shadow-sm"
                        >
                          <span className="inline-flex items-center gap-3">
                            <LayoutDashboard className="w-4 h-4 text-white" />
                            <span className="font-medium">CRM Login</span>
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-200" />
                        </a>
                      </div>
                    )}
                  </div>
                  <Link to="/register" className="text-sm bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700">Register</Link>
                </>
              ) : (
                <>
                  {/* Patient messages shortcut */}
                  {user?.role === 'patient' && (
                    <button
                      type="button"
                      title="Messages"
                      onClick={() => navigate('/doctor-chat')}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                  <div className="relative" ref={profileRef}>
                  {user?.role === 'patient' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setProfileOpen((p)=>!p)}
                        aria-haspopup="menu"
                        aria-expanded={profileOpen}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200"
                        title={user.name}
                      >
                        <img
                          src={user.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                        <span className="text-sm text-gray-800 font-medium max-w-[160px] truncate">{user.name}</span>
                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                      </button>
                      {profileOpen && (
                        <div role="menu" className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                          <Link to="/profile" onClick={()=>setProfileOpen(false)} role="menuitem" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
                            <span>Profile</span>
                          </Link>
                          <button onClick={()=>{ setProfileOpen(false); setConfirmLogoutOpen(true); }} role="menuitem" className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    // doctor/clinic: no dropdown, just static avatar + name
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent" title={user.name}>
                      <img
                        src={user.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <span className="text-sm text-gray-800 font-medium max-w-[160px] truncate">{user.name}</span>
                    </div>
                  )}
                  </div>
                </>
              )}
            </div>
            {/* Mobile trigger */}
            {/* Mobile: patient shortcuts */}
            {user?.role === 'patient' && (
              <button
                type="button"
                title="Messages"
                onClick={() => navigate('/doctor-chat')}
                className="md:hidden p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
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
      </div>
    </header>
    {/* Logout confirm modal */}
    {confirmLogoutOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={()=>setConfirmLogoutOpen(false)} />
        <div role="dialog" aria-modal="true" className="relative bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm w-[90%] p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Çıkış yapılsın mı?</h3>
          <p className="text-sm text-gray-600 mb-4">Hesabınızdan çıkış yapmak üzeresiniz. Emin misiniz?</p>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setConfirmLogoutOpen(false)} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">İptal</button>
            <button onClick={()=>{ setConfirmLogoutOpen(false); logout(); navigate('/home-v2'); }} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">Evet, çıkış yap</button>
          </div>
        </div>
      </div>
    )}
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
              <Link to="/home-v2" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Home className="w-4 h-4" />
                <span>Homepage</span>
              </Link>
              <Link to="/clinics" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Building2 className="w-4 h-4" />
                <span>Clinics</span>
              </Link>
              <Link to="/vasco-ai" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Cpu className="w-4 h-4" />
                <span>Vasco AI</span>
              </Link>
              <Link to="/about" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Info className="w-4 h-4" />
                <span>About MedGama</span>
              </Link>
              {/* Contact removed */}
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
          {(() => {
            const role = (user?.role || 'patient');
            const patientItems = [
              { to: '/profile', label: 'Profile', icon: User },
            ];
            const doctorItems = [
              { to: '/profile', label: 'Profile', icon: User },
              { to: '/patient-home', label: 'Medstream', icon: Video },
              { to: '/notifications', label: 'Notifications', icon: Bell },
              { to: '/home-v2', label: 'Homepage', icon: Home },
              { to: '/doctor-chat', label: 'Messages', icon: MessageSquare },
              { to: '/telehealth-appointment', label: 'Appointments', icon: CalendarClock },
              { to: '/telehealth', label: 'Telehealth', icon: Monitor },
            ];
            const clinicItems = [
              { to: '/clinic', label: 'Profile', icon: User },
              { to: '/patient-home', label: 'Medstream', icon: Video },
              { to: '/notifications', label: 'Notifications', icon: Bell },
              { to: '/home-v2', label: 'Homepage', icon: Home },
              { to: '/doctor-chat', label: 'Messages', icon: MessageSquare },
              { to: '/clinics', label: 'Doctors & Departments', icon: Building2 },
              { href: (process.env.REACT_APP_CRM_URL || 'https://crmtaslak.netlify.app/login'), label: 'CRM', icon: ArrowUpRight, external: true },
            ];
            const items = role === 'clinic' ? clinicItems : (role === 'doctor' ? doctorItems : patientItems);
            return (
              <nav className="divide-y divide-gray-100">
                <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                  <img src={user.avatar || '/images/portrait-candid-male-doctor_720.jpg'} alt={user.name} className="w-10 h-10 rounded-full object-cover border" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{String(role).charAt(0).toUpperCase() + String(role).slice(1)}</p>
                  </div>
                </div>
                <div className="p-2">
                  {items.map((it, idx) => (
                    it.external ? (
                      <a key={`ext-${idx}`} href={it.href} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="flex items-center justify-between px-3 py-2 rounded-xl text-sm border transition border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200">
                        <span className="flex items-center gap-2"><it.icon className="w-4 h-4 text-gray-500" />{it.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    ) : (
                      <Link key={`int-${idx}`} to={it.to} onClick={closeMenu} className="flex items-center justify-between px-3 py-2 rounded-xl text-sm border transition border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200">
                        <span className="flex items-center gap-2"><it.icon className="w-4 h-4 text-gray-500" />{it.label}</span>
                      </Link>
                    )
                  ))}
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
            );
          })()}
        </div>
      </>
    )}
    {/* Spacer to preserve layout height for fixed header (approx 5rem) */}
    <div className="h-20"></div>
    </>
  );
};

export default Header;
