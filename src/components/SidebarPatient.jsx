import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LayoutDashboard, Newspaper, CalendarClock, Building2, Bookmark, Settings, LogOut, Bell, ArrowUpRight, Video, User, Monitor } from 'lucide-react';

// Custom chat icon using public SVG (accepts className via props)
const ChatRoundIcon = (props) => (
  <img
    src="/images/icon/chat-round-line-svgrepo-com.svg"
    alt="Messages"
    {...props}
  />
);

export default function SidebarPatient() {
  const { user, logout, sidebarMobileOpen, setSidebarMobileOpen } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Mobile drawer state is managed globally in AuthContext

  if (!user) return null;

  const role = user?.role || 'patient';
  const roleLabel = role === 'doctor' ? 'Doctor' : role === 'clinic' ? 'Clinic' : role === 'admin' ? 'Admin' : 'Patient';

  const patientItems = [
    // Requested minimal menu for patient
    { to: '/home-v2', label: 'Home', icon: Home },
    { to: '/explore', label: 'MedStream', icon: Video },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/doctor-chat', label: 'Messages', icon: ChatRoundIcon },
    { to: '/telehealth', label: 'Telehealth', icon: Monitor },
    { to: '/profile', label: 'Settings', icon: Settings },
  ];

  // Doctor-specific menu (Profile → Medstream → Notifications → Messages → Schedule → Telehealth → CRM)
  const doctorItems = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/explore', label: 'Medstream', icon: Video },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { to: '/doctor-chat', label: 'Messages', icon: ChatRoundIcon },
    { to: '/telehealth-appointment', label: 'Schedule', icon: CalendarClock },
    { to: '/telehealth', label: 'Telehealth', icon: Monitor },
    { href: (process.env.REACT_APP_CRM_URL || 'https://crmtaslak.netlify.app/login'), label: 'CRM', icon: ArrowUpRight, external: true },
  ];

  // Clinic-specific menu (Profile → Medstream → Notifications → Messages → Departments and Doctors → CRM)
  const clinicItems = [
    { to: '/clinic-edit', label: 'Profile', icon: User },
    { to: '/explore', label: 'Medstream', icon: Video },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { to: '/doctor-chat', label: 'Messages', icon: ChatRoundIcon },
    { to: '/doctors-departments', label: 'Departments and Doctors', icon: Building2 },
    { href: (process.env.REACT_APP_CRM_URL || 'https://crmtaslak.netlify.app/login'), label: 'CRM', icon: ArrowUpRight, external: true },
  ];

  const items = role === 'patient' ? patientItems : (role === 'clinic' ? clinicItems : doctorItems);

  const NavItem = ({ to, href, icon: Icon, label, badge, external }) => {
    const active = to ? (pathname === to || (to.includes('?') && pathname === to.split('?')[0])) : false;
    const baseClasses = `group flex items-center justify-between px-3 py-2 rounded-xl text-sm border transition ${
      active ? 'bg-teal-50 border-teal-100 text-teal-700' : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200'
    }`;
    if (external && href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
          <span className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
            {label}
          </span>
          {badge ? (
            <span className="ml-2 inline-flex items-center justify-center text-[10px] rounded-full px-2 py-0.5 bg-teal-600 text-white">{badge}</span>
          ) : null}
        </a>
      );
    }
    return (
      <Link to={to} className={baseClasses}>
        <span className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
          {label}
        </span>
        {badge ? (
          <span className="ml-2 inline-flex items-center justify-center text-[10px] rounded-full px-2 py-0.5 bg-teal-600 text-white">{badge}</span>
        ) : null}
      </Link>
    );
  };

  const initial = (user?.name || 'U')[0]?.toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 w-52 top-20 z-40 h-[calc(100vh-5rem)]`}>
        <div className="h-full">
          <div className="h-full rounded-b-2xl border border-t-0 -mt-px bg-white shadow-sm flex flex-col">
            {/* Header / Profile */}
            <div className="p-3 border-b relative">
              <div className={`flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
                  <div className="text-xs text-gray-500 truncate">{roleLabel}</div>
                </div>
                <button
                  className="ml-auto relative text-gray-500 hover:text-gray-700"
                  title="Notifications"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-3 flex-1 overflow-y-auto">
              <div className="mb-2 px-2 text-[11px] uppercase tracking-wide text-gray-400">Menu</div>
              <nav className="space-y-1">
                {items.map((it, idx) => (
                  <NavItem key={`${it.to || it.href || it.label || 'item'}-${idx}`} {...it} />
                ))}
              </nav>
            </div>

            {/* Footer actions */}
            <div className="p-3 border-t">
              <button
                onClick={() => { logout(); navigate('/home-v2'); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarMobileOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50"
            onClick={() => setSidebarMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Panel: starts below header height (top-20) */}
          <div className="fixed left-0 top-20 bottom-0 w-3/4 max-w-[13rem] z-[60]">
            <div className="h-full border-r bg-white shadow-xl flex flex-col rounded-tr-2xl">
              {/* Mobile Header */}
              <div className="p-3 border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
                  <div className="text-xs text-gray-500 truncate">Patient</div>
                </div>
              </div>

              {/* Mobile Nav */}
              <div className="p-3 flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  {items.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setSidebarMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border transition ${pathname === it.to ? 'bg-teal-50 border-teal-100 text-teal-700' : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200'}`}
                    >
                      <span className="flex items-center gap-2">
                        <it.icon className={`w-4 h-4 ${pathname === it.to ? 'text-teal-600' : 'text-gray-500'}`} />
                        {it.label}
                      </span>
                      {it.badge ? (
                        <span className="ml-2 inline-flex items-center justify-center text-[10px] rounded-full px-2 py-0.5 bg-teal-600 text-white">{it.badge}</span>
                      ) : null}
                    </Link>
                  ))}
                </nav>

                {/* Divider */}
                <div className="my-3 border-t" />

                {/* Header links section */}
                <nav className="space-y-1">
                  <Link to="/about" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">About MedGama</Link>
                  <Link to="/for-patients" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">For Patients</Link>
                  <Link to="/clinics" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">For Clinics</Link>
                  <Link to="/vasco-ai" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">Vasco AI</Link>
                  <Link to="/contact" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">Contact</Link>
                </nav>
              </div>

              {/* Mobile Footer */}
              <div className="p-3 border-t">
                <button
                  onClick={() => { setSidebarMobileOpen(false); logout(); navigate('/home-v2'); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
