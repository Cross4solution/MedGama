import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Newspaper, MessageSquare, CalendarClock, Building2, Bookmark, Settings, LogOut, Bell, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

export default function SidebarPatient() {
  const { user, logout, sidebarMobileOpen, setSidebarMobileOpen } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('mg_sidebar_collapsed');
      return saved === 'true' ? true : false; // default: open
    } catch {
      return false;
    }
  });

  // Mobile drawer state is managed globally in AuthContext

  // Sync CSS var for layout offset so content can follow collapse state
  useEffect(() => {
    const width = collapsed ? '4rem' : '18rem';
    document.documentElement.style.setProperty('--sidebar-width', width);
    try { localStorage.setItem('mg_sidebar_collapsed', String(collapsed)); } catch {}
    return () => {
      // keep latest value; no cleanup needed
    };
  }, [collapsed]);

  // If user logs out, remove offset and stored state
  useEffect(() => {
    if (!user) {
      document.documentElement.style.setProperty('--sidebar-width', '0rem');
      try { localStorage.removeItem('mg_sidebar_collapsed'); } catch {}
    }
  }, [user]);

  if (!user) return null;

  const items = [
    { to: '/patient-home', label: 'Overview', icon: Home },
    { to: '/timeline', label: 'Feed', icon: Newspaper, badge: 5 },
    { to: '/doctor-chat', label: 'Messages', icon: MessageSquare, badge: 2 },
    { to: '/telehealth-appointment', label: 'Appointments', icon: CalendarClock },
    { to: '/clinics', label: 'Clinics', icon: Building2 },
    { to: '/saved', label: 'Saved', icon: Bookmark },
    { to: '/terms-of-service', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`group flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-sm border transition ${
          active ? 'bg-teal-50 border-teal-100 text-teal-700' : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200'
        }`}
      >
        <span className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
          {!collapsed && label}
        </span>
        {!collapsed && badge ? (
          <span className="ml-2 inline-flex items-center justify-center text-[10px] rounded-full px-2 py-0.5 bg-teal-600 text-white">{badge}</span>
        ) : null}
      </Link>
    );
  };

  const initial = (user?.name || 'U')[0]?.toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 ${collapsed ? 'w-16' : 'w-72'} top-20 z-40 h-[calc(100vh-5rem)]`}>
        <div className="h-full">
          <div className="h-full rounded-2xl border bg-white shadow-sm flex flex-col">
            {/* Header / Profile */}
            <div className="p-3 border-b relative">
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                  {initial}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
                    <div className="text-xs text-gray-500 truncate">Patient</div>
                  </div>
                )}
                {!collapsed && (
                  <button className="ml-auto relative text-gray-500 hover:text-gray-700" title="Notifications">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={() => setCollapsed((v) => !v)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border rounded-full p-1 shadow hover:bg-gray-50"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation */}
            <div className="p-3 flex-1 overflow-y-auto">
              {!collapsed && <div className="mb-2 px-2 text-[11px] uppercase tracking-wide text-gray-400">Menu</div>}
              <nav className="space-y-1">
                {items.map((it) => (
                  <NavItem key={it.to} {...it} />
                ))}
              </nav>
            </div>

            {/* Footer actions */}
            <div className="p-3 border-t">
              <button onClick={() => { try { localStorage.removeItem('mg_sidebar_collapsed'); } catch {}; setCollapsed(false); logout(); navigate('/'); }} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-center gap-2'} px-3 py-2 text-sm border rounded-xl hover:bg-gray-50`}>
                <LogOut className="w-4 h-4" />
                {!collapsed && 'Logout'}
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
          <div className="fixed left-0 top-20 bottom-0 w-4/5 max-w-xs z-[60]">
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
                  onClick={() => { setSidebarMobileOpen(false); logout(); navigate('/'); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-xl hover:bg-gray-50"
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
