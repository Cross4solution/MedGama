import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Home, LayoutDashboard, Newspaper, CalendarClock, Building2, Bookmark, Settings, LogOut, Bell, Video, User, Monitor, ChevronRight, ArrowUpRight } from 'lucide-react';

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
  const { t } = useTranslation();
  // Mobile drawer state is managed globally in AuthContext

  if (!user) return null;

  const role = user?.role || 'patient';
  const roleLabel = role === 'doctor' ? t('common.doctor') : role === 'clinic' ? t('common.clinic') : role === 'admin' ? 'Admin' : t('common.patient');

  const patientItems = [
    { to: '/home-v2', label: t('sidebar.home') || 'Home', icon: Home },
    { to: '/explore', label: t('sidebar.medstream'), icon: Video },
    { to: '/saved', label: t('sidebar.savedPosts', 'Saved Posts'), icon: Bookmark },
    { to: '/telehealth-appointment', label: t('sidebar.appointments'), icon: CalendarClock },
    { to: '/doctor-chat', label: t('sidebar.messages'), icon: ChatRoundIcon },
    { to: '/telehealth', label: t('sidebar.telehealth'), icon: Monitor },
    { to: '/notifications', label: t('sidebar.notifications'), icon: Bell, badge: 3 },
    { to: '/profile', label: t('sidebar.profile'), icon: User },
  ];

  // Requested order: Medstream -> Appointments -> Messages -> Telehealth -> Notifications -> Profile
  const doctorItems = [
    { to: '/home-v2', label: t('sidebar.home') || 'Home', icon: Home },
    { to: '/explore', label: t('sidebar.medstream'), icon: Video },
    { to: '/saved', label: t('sidebar.savedPosts', 'Saved Posts'), icon: Bookmark },
    { to: '/telehealth-appointment', label: t('sidebar.appointments'), icon: CalendarClock },
    { to: '/doctor-chat', label: t('sidebar.messages'), icon: ChatRoundIcon },
    { to: '/telehealth', label: t('sidebar.telehealth'), icon: Monitor },
    { to: '/notifications', label: t('sidebar.notifications'), icon: Bell, badge: 3 },
    { to: '/profile', label: t('sidebar.profile'), icon: User },
  ];

  const clinicItems = [
    { to: '/home-v2', label: t('sidebar.home') || 'Home', icon: Home },
    { to: '/explore', label: t('sidebar.medstream'), icon: Video },
    { to: '/saved', label: t('sidebar.savedPosts', 'Saved Posts'), icon: Bookmark },
    { to: '/telehealth-appointment', label: t('sidebar.appointments'), icon: CalendarClock },
    { to: '/doctor-chat', label: t('sidebar.messages'), icon: ChatRoundIcon },
    { to: '/telehealth', label: t('sidebar.telehealth'), icon: Monitor },
    { to: '/notifications', label: t('sidebar.notifications'), icon: Bell, badge: 3 },
    { to: '/clinic-edit', label: t('sidebar.profile'), icon: User },
  ];

  const items = role === 'patient' ? patientItems : (role === 'clinic' ? clinicItems : doctorItems);
  const showCRM = role === 'doctor' || role === 'clinic' || role === 'clinicOwner';

  const NavItem = ({ to = undefined, href = undefined, icon: Icon, label, badge = undefined, external = false }) => {
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
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 w-[12rem] top-[4.5rem] z-40 h-[calc(100vh-4.5rem)]`}>
        <div className="h-full pt-0 pb-2 pl-0">
          <div className="h-full rounded-br-2xl border-r border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/40 flex flex-col overflow-hidden">
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-3">
              <div className="px-3">
                <div className="mb-3 px-1 text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('common.menu') || 'Menu'}</div>
                <nav className="space-y-1">
                  {items.map((it, idx) => (
                    <NavItem key={`${it.to || it.href || it.label || 'item'}-${idx}`} {...it} />
                  ))}
                </nav>
                {showCRM && (
                  <a
                    href="/crm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100/80 group-hover:bg-gray-200/60 transition-colors">
                        <LayoutDashboard className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                      </span>
                      CRM
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                )}
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
                <LogOut className="w-4 h-4" /> {t('common.logout')}
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
              {/* Mobile Nav */}
              <div className="px-3 py-3 flex-1 overflow-y-auto">
                <div className="mb-2 px-1 text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('common.menu') || 'Menu'}</div>
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

                {showCRM && (
                  <a
                    href="/crm"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSidebarMobileOpen(false)}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100/80 group-hover:bg-gray-200/60 transition-colors">
                        <LayoutDashboard className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                      </span>
                      CRM
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                )}

                {/* Divider */}
                <div className="my-4 border-t border-gray-100" />

                {/* Header links section */}
                <div className="mb-2 px-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('common.links') || 'Links'}</div>
                <nav className="space-y-0.5">
                  <Link to="/about" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">{t('about.title')}</Link>
                  <Link to="/for-patients" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">{t('forPatients.title')}</Link>
                  <Link to="/clinics" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">{t('forClinics.title')}</Link>
                  <Link to="/vasco-ai" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">Vasco AI</Link>
                  <Link to="/contact" onClick={() => setSidebarMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-700 transition-all">{t('nav.contact')}</Link>
                </nav>
              </div>

              {/* Mobile Footer */}
              <div className="mt-auto px-3 pb-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => { setSidebarMobileOpen(false); logout(); navigate('/home-v2'); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 shadow-md shadow-rose-200/50 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" /> {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}