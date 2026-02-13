import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LayoutDashboard, Newspaper, CalendarClock, Building2, Bookmark, Settings, LogOut, Bell, ArrowUpRight, Video, User, Monitor, ChevronRight } from 'lucide-react';

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
    { to: '/doctor-chat', label: 'Messages', icon: ChatRoundIcon },
    { to: '/telehealth', label: 'Telehealth', icon: Monitor },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  // Doctor-specific menu (Profile → Medstream → Notifications → Messages → Schedule → Telehealth → CRM)
  const doctorItems = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/explore', label: 'Medstream', icon: Video },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { to: '/doctor-chat', label: 'Messages', icon: ChatRoundIcon },
    { to: '/telehealth-appointment', label: 'Schedule', icon: CalendarClock },
    { to: '/telehealth', label: 'Telehealth', icon: Monitor },
    { to: '/clinic-login', label: 'CRM', icon: ArrowUpRight },
  ];

  // Clinic-specific menu (Profile → Medstream → Notifications → Messages → Departments and Doctors → CRM)
  const clinicItems = [
    { to: '/clinic-edit', label: 'Profile', icon: User },
    { to: '/explore', label: 'Medstream', icon: Video },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { to: '/doctor-chat', label: 'Messages', icon: ChatRoundIcon },
    { to: '/doctors-departments', label: 'Departments and Doctors', icon: Building2 },
    { to: '/clinic-login', label: 'CRM', icon: ArrowUpRight },
  ];

  const items = role === 'patient' ? patientItems : (role === 'clinic' ? clinicItems : doctorItems);

  const NavItem = ({ to, href, icon: Icon, label, badge, external }) => {
    const active = to ? (pathname === to || (to.includes('?') && pathname === to.split('?')[0])) : false;
    const baseClasses = `group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 text-teal-700 shadow-sm ring-1 ring-teal-100'
        : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
    }`;
    if (external && href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
          <span className="flex items-center gap-2.5">
            <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${active ? 'bg-teal-100/80' : 'bg-gray-100/80 group-hover:bg-gray-200/60'} transition-colors`}>
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
            </span>
            {label}
          </span>
          {badge ? (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold rounded-full px-1.5 bg-teal-600 text-white shadow-sm">{badge}</span>
          ) : null}
        </a>
      );
    }
    return (
      <Link to={to} className={baseClasses}>
        <span className="flex items-center gap-2.5">
          <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${active ? 'bg-teal-100/80' : 'bg-gray-100/80 group-hover:bg-gray-200/60'} transition-colors`}>
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
          </span>
          {label}
        </span>
        {badge ? (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold rounded-full px-1.5 bg-teal-600 text-white shadow-sm">{badge}</span>
        ) : null}
      </Link>
    );
  };
  const initial = (user?.name || 'U')[0]?.toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 w-[13.5rem] top-[4.5rem] z-40 h-[calc(100vh-4.5rem)]`}>
        <div className="h-full pt-0 pb-2 pl-0">
          <div className="h-full rounded-br-2xl border-r border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/40 flex flex-col overflow-hidden">
            {/* Header / Profile */}
            <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-200/50">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900 truncate">{user?.name}</div>
                  <div className="text-[11px] text-gray-500 font-medium truncate">{roleLabel}</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-3">
              <div className="px-3">
                <div className="mb-3 px-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Menu</div>
                <nav className="space-y-1">
                  {items.map((it, idx) => (
                    <NavItem key={`${it.to || it.href || it.label || 'item'}-${idx}`} {...it} />
                  ))}
                </nav>
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-auto px-3 pb-4 pt-3 border-t border-gray-100">
              <button
                onClick={async () => {
                  const confirmed = await logout();
                  if (confirmed) {
                    navigate('/home-v2');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 shadow-md shadow-rose-200/50 hover:shadow-lg hover:shadow-rose-300/50 transition-all duration-200 hover:-translate-y-0.5"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[70] transition-opacity"
            onClick={() => setSidebarMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Panel: full height, below header */}
          <div className="fixed left-0 top-0 bottom-0 w-3/4 max-w-[16rem] z-[80]">
            <div className="h-full bg-white shadow-2xl flex flex-col border-r border-gray-200/60">
              {/* Mobile Header */}
              <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-200/50">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{user?.name}</div>
                    <div className="text-[11px] text-gray-500 font-medium truncate">{roleLabel}</div>
                  </div>
                </div>
              </div>

              {/* Mobile Nav */}
              <div className="px-3 py-3 flex-1 overflow-y-auto">
                <div className="mb-3 px-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Menu</div>
                <nav className="space-y-1">
                  {items.map((it) => {
                    const active = it.to ? pathname === it.to : false;
                    if (it.external && it.href) {
                      return (
                        <a
                          key={it.href}
                          href={it.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setSidebarMobileOpen(false)}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50/80 hover:text-gray-900`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100/80 group-hover:bg-gray-200/60 transition-colors">
                              <it.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                            </span>
                            {it.label}
                          </span>
                          {it.badge ? (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold rounded-full px-1.5 bg-teal-600 text-white shadow-sm">{it.badge}</span>
                          ) : null}
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={() => setSidebarMobileOpen(false)}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${active ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 text-teal-700 shadow-sm ring-1 ring-teal-100' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${active ? 'bg-teal-100/80' : 'bg-gray-100/80 group-hover:bg-gray-200/60'} transition-colors`}>
                            <it.icon className={`w-3.5 h-3.5 ${active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                          </span>
                          {it.label}
                        </span>
                        {it.badge ? (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold rounded-full px-1.5 bg-teal-600 text-white shadow-sm">{it.badge}</span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>

                {/* Divider */}
                <div className="my-4 border-t border-gray-100" />

                {/* Header links section */}
                <div className="mb-2 px-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Links</div>
                <nav className="space-y-0.5">
                  <Link to="/about" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">About MedGama</Link>
                  <Link to="/for-patients" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">For Patients</Link>
                  <Link to="/clinics" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">For Clinics</Link>
                  <Link to="/vasco-ai" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">Vasco AI</Link>
                  <Link to="/contact" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">Contact</Link>
                </nav>
              </div>

              {/* Mobile Footer */}
              <div className="mt-auto px-3 pb-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => { setSidebarMobileOpen(false); logout(); navigate('/home-v2'); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 shadow-md shadow-rose-200/50 transition-all duration-200"
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