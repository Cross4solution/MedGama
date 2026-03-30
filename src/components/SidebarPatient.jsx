import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationsContext';
import { Home, LayoutDashboard, Newspaper, CalendarClock, Building2, Bookmark, Settings, LogOut, Bell, Video, User, Monitor, ChevronRight, Heart, FolderHeart, Activity, Lock, X, Sparkles } from 'lucide-react';

// Custom chat icon using public SVG (accepts className via props)
const ChatRoundIcon = (props) => (
  <img
    src="/images/icon/chat-round-line-svgrepo-com.svg"
    alt="Messages"
    {...props}
  />
);

export default function SidebarPatient() {
  const { user, logout, sidebarMobileOpen, setSidebarMobileOpen, isPro } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { unreadCount: notifCount } = useNotifications();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!user) return null;

  const role = user?.role || 'patient';
  const roleLabel = role === 'doctor' ? t('common.doctor') : role === 'clinic' ? t('common.clinic') : role === 'admin' ? 'Admin' : t('common.patient');

  const patientItems = [
    { to: '/home-v2', label: t('sidebar.home') || 'Home', icon: Home },
    { to: '/patient-dashboard', label: t('sidebar.dashboard', 'Dashboard'), icon: Activity },
    { to: '/medstream', label: t('sidebar.medstream'), icon: Video },
    { to: '/saved', label: t('sidebar.savedPosts', 'Saved Posts'), icon: Bookmark },
    { to: '/saved-clinics', label: t('sidebar.favoriteClinics', 'Favorite Clinics'), icon: Heart },
    { to: '/patient/appointments', label: t('sidebar.myAppointments', 'My Appointments'), icon: CalendarClock },
    { to: '/doctor-chat', label: t('sidebar.messages'), icon: ChatRoundIcon },
    { to: '/telehealth', label: t('sidebar.telehealth'), icon: Monitor },
    { to: '/medical-archive', label: t('sidebar.medicalArchive', 'Medical Archive'), icon: FolderHeart },
    { to: '/notifications', label: t('sidebar.notifications'), icon: Bell, badge: notifCount || undefined },
    { to: '/profile', label: t('sidebar.profile'), icon: User },
  ];

  // Requested order: Dashboard -> Medstream -> Appointments -> Messages -> Telehealth -> Notifications -> Profile
  const doctorItems = [
    { to: '/home-v2', label: t('sidebar.home') || 'Home', icon: Home },
    { to: '/doctor/dashboard', label: t('sidebar.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/medstream', label: t('sidebar.medstream'), icon: Video },
    { to: '/saved', label: t('sidebar.savedPosts', 'Saved Posts'), icon: Bookmark },
    { to: '/saved-clinics', label: t('sidebar.favoriteClinics', 'Favorite Clinics'), icon: Heart },
    { to: '/telehealth-appointment', label: t('sidebar.appointments'), icon: CalendarClock },
    { to: '/doctor-chat', label: t('sidebar.messages'), icon: ChatRoundIcon },
    { to: '/telehealth', label: t('sidebar.telehealth'), icon: Monitor },
    { to: '/notifications', label: t('sidebar.notifications'), icon: Bell, badge: notifCount || undefined },
    { to: '/profile', label: t('sidebar.profile'), icon: User },
  ];

  const clinicItems = [
    { to: '/home-v2', label: t('sidebar.home') || 'Home', icon: Home },
    { to: '/clinic/dashboard', label: t('sidebar.clinicDashboard', 'Clinic Dashboard'), icon: LayoutDashboard },
    { to: '/clinic/team', label: t('sidebar.myTeam', 'My Team'), icon: Building2 },
    { to: '/medstream', label: t('sidebar.medstream'), icon: Video },
    { to: '/telehealth-appointment', label: t('sidebar.appointments'), icon: CalendarClock },
    { to: '/doctor-chat', label: t('sidebar.messages'), icon: ChatRoundIcon },
    { to: '/notifications', label: t('sidebar.notifications'), icon: Bell, badge: notifCount || undefined },
    { to: '/clinic-edit', label: t('sidebar.clinicProfile', 'Clinic Profile'), icon: User },
  ];

  const isClinic  = role === 'clinic' || role === 'clinicOwner';
  const isHosp    = role === 'hospital';
  const isProfessional = role === 'doctor' || isClinic;  // roles that can purchase CRM
  const items = role === 'patient' ? patientItems : (isClinic ? clinicItems : doctorItems);

  // CRM bridge visibility:
  // • Hospital → always show (hospital is inherently a CRM plan; no paywall)
  // • Doctor/Clinic + isPro → active bridge
  // • Doctor/Clinic + !isPro → locked bridge (shows upgrade modal)

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
  // ── CRM Section component (reused in desktop + mobile) ──────────────────
  const CrmSection = ({ onNavigate }) => {
    if (isHosp) {
      // Hospital: always active, placed prominently (caller renders at top)
      return (
        <Link
          to="/crm"
          onClick={onNavigate}
          className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 hover:shadow-md"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
            </span>
            {t('sidebar.managementPanel', 'Yönetim Paneli')}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      );
    }
    if (!isProfessional) return null;
    if (isPro) {
      // Doctor/Clinic with active CRM subscription
      return (
        <>
          <div className="my-3 border-t border-gray-100" />
          <Link
            to="/crm"
            onClick={onNavigate}
            className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 hover:shadow-md"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                <LayoutDashboard className="w-3.5 h-3.5 text-white" />
              </span>
              {t('sidebar.managementPanel', 'Yönetim Paneli')}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </>
      );
    }
    // Doctor/Clinic without CRM subscription — locked with upgrade teaser
    return (
      <>
        <div className="my-3 border-t border-gray-100" />
        <button
          type="button"
          onClick={() => setShowUpgradeModal(true)}
          className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 bg-gray-50 text-gray-400 border border-dashed border-gray-200 hover:bg-gray-100 hover:border-gray-300"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 transition-colors">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
            </span>
            {t('sidebar.managementPanel', 'Yönetim Paneli')}
          </span>
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
            {t('common.upgrade', 'Yükselt')}
          </span>
        </button>
      </>
    );
  };

  return (
    <>
      {/* Upgrade Modal — shown when !isPro professional clicks locked CRM button */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              {t('crm.upgradeTitle', 'CRM Paketine Geçin')}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
              {t('crm.upgradeDesc', 'Randevu yönetimi, hasta takibi, gelir raporları ve daha fazlası için CRM paketini aktif edin.')}
            </p>
            <div className="space-y-2 mb-5">
              {['Randevu & Hasta Yönetimi', 'Gelir ve Analitik Raporları', 'MedStream Profesyonel Paylaşım', 'Fatura & Muhasebe'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  </span>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowUpgradeModal(false); navigate('/crm/upgrade'); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold text-sm hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md"
            >
              {t('crm.upgradeBtn', 'CRM\'e Geç →')}
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('common.cancel', 'İptal')}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 w-[12rem] top-[3.5rem] z-40 h-[calc(100vh-3.5rem)]`}>
        <div className="h-full">
          <div className="h-full border-r border-gray-200/60 bg-white flex flex-col overflow-hidden">
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto pb-3 pt-6">
              <div className="px-3">
                {/* Hospital: CRM bridge at TOP — before other nav items */}
                {isHosp && (
                  <div className="mb-3">
                    <CrmSection onNavigate={undefined} />
                    <div className="mt-3 border-t border-gray-100" />
                  </div>
                )}
                <nav className="space-y-1">
                  {items.map((it, idx) => (
                    <NavItem key={`${it.to || it.href || it.label || 'item'}-${idx}`} {...it} />
                  ))}
                </nav>
                {/* Doctor/Clinic: CRM bridge at BOTTOM */}
                {!isHosp && <CrmSection onNavigate={undefined} />}
              </div>
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
              <div className="px-3 py-6 flex-1 overflow-y-auto">
                {/* Hospital: CRM bridge at TOP in mobile too */}
                {isHosp && (
                  <div className="mb-3">
                    <CrmSection onNavigate={() => setSidebarMobileOpen(false)} />
                    <div className="mt-3 border-t border-gray-100" />
                  </div>
                )}
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

                {/* Doctor/Clinic: CRM bridge at BOTTOM (hospital is at top, rendered above) */}
                {!isHosp && <CrmSection onNavigate={() => setSidebarMobileOpen(false)} />}

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



            </div>
          </div>
        </div>
      )}
    </>
  );
}