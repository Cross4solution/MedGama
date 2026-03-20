import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Settings2,
  ScrollText,
  Menu,
  X,
  LogOut,
  Shield,
  Home,
  ExternalLink,
  Star,
  LifeBuoy,
  Users,
  Stethoscope,
  UserPlus,
  Building2,
  ChevronDown,
  Bell,
  CreditCard,
  Zap,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

// ── Navigation sections ──
const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', end: true },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Verification Hub', icon: ShieldCheck, path: '/admin/verification' },
      {
        label: 'User Management', icon: Users, path: '/admin/users',
        children: [
          { label: 'All Users', icon: Users, path: '/admin/users' },
          { label: 'Doctors', icon: Stethoscope, path: '/admin/users?tab=doctor' },
          { label: 'Patients', icon: UserPlus, path: '/admin/users?tab=patient' },
          { label: 'Clinics', icon: Building2, path: '/admin/users?tab=clinicOwner' },
        ],
      },
      { label: 'Financials', icon: CreditCard, path: '/admin/financials' },
    ],
  },
  {
    title: 'Moderation',
    items: [
      { label: 'Review Moderation', icon: Star, path: '/admin/reviews' },
      { label: 'Content Moderation', icon: AlertTriangle, path: '/admin/moderation' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Catalog Management', icon: BookOpen, path: '/admin/catalog' },
      { label: 'Feature Toggles', icon: Zap, path: '/admin/feature-toggles' },
      { label: 'System Settings', icon: Settings2, path: '/admin/settings' },
      { label: 'Audit Logs', icon: ScrollText, path: '/admin/audit-logs' },
      { label: 'Support Tickets', icon: LifeBuoy, path: '/admin/support' },
    ],
  },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(location.pathname.startsWith('/admin/users'));
  const { user, logout } = useAuth();

  // ── Admin alerts state ──
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const alertsRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const [dashRes, vStats] = await Promise.all([
        adminAPI.dashboard().then(r => r?.data?.data || r?.data || r).catch(() => null),
        adminAPI.verificationStats().then(r => r?.data || r).catch(() => null),
      ]);
      const items = [];
      const pending = vStats?.pending || dashRes?.users?.unverified_doctors || 0;
      if (pending > 0) items.push({ id: 'vr', label: `${pending} doctor(s) awaiting verification`, severity: 'warning', path: '/admin/verification' });
      const reports = dashRes?.medstream?.pending_reports || 0;
      if (reports > 0) items.push({ id: 'rp', label: `${reports} flagged content report(s)`, severity: 'critical', path: '/admin/moderation' });
      if (items.length === 0) items.push({ id: 'ok', label: 'No urgent alerts', severity: 'info' });
      setAlerts(items);
    } catch {
      setAlerts([{ id: 'err', label: 'Failed to load alerts', severity: 'info' }]);
    }
  }, []);

  useEffect(() => { fetchAlerts(); const t = setInterval(fetchAlerts, 60000); return () => clearInterval(t); }, [fetchAlerts]);

  // Close alerts on outside click
  useEffect(() => {
    const fn = (e) => { if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const urgentCount = alerts.filter(a => a.severity === 'warning' || a.severity === 'critical').length;

  const handleLogout = () => { logout?.(); navigate('/'); };

  // ── NavLink class builder ──
  const navCls = (isActive) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
      isActive ? 'bg-purple-500/15 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;
  const iconBoxCls = (isActive) =>
    `w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'bg-white/5 group-hover:bg-white/10'}`;
  const iconCls = (isActive) =>
    `w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`;

  // ── Sidebar nav item renderer ──
  const NavItem = ({ item }) => {
    const hasChildren = item.children?.length > 0;
    const childActive = hasChildren && location.pathname.startsWith('/admin/users');

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className={`w-full ${navCls(childActive)}`}
          >
            <div className={iconBoxCls(childActive)}>
              <item.icon className={iconCls(childActive)} />
            </div>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''} ${childActive ? 'text-purple-400' : 'text-gray-600'}`} />
          </button>
          {userMenuOpen && (
            <div className="ml-6 mt-1 space-y-0.5 border-l border-gray-800/60 pl-3">
              {item.children.map((child) => {
                const cActive = location.pathname + location.search === child.path ||
                  (child.path === '/admin/users' && location.pathname === '/admin/users' && !location.search);
                return (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      cActive
                        ? 'text-purple-300 bg-purple-500/10'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <child.icon className={`w-3.5 h-3.5 ${cActive ? 'text-purple-400' : 'text-gray-600'}`} />
                    {child.label}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={item.path}
        end={item.end}
        onClick={() => setSidebarOpen(false)}
        className={({ isActive }) => navCls(isActive)}
      >
        {({ isActive }) => (
          <>
            <div className={iconBoxCls(isActive)}>
              <item.icon className={iconCls(isActive)} />
            </div>
            <span className="flex-1">{item.label}</span>
          </>
        )}
      </NavLink>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
      {/* Logo */}
      <NavLink to="/admin" end className="flex items-center gap-3 px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">MedaGama</span>
          <span className="block text-[10px] text-purple-300/60 font-semibold tracking-widest uppercase">Admin Panel</span>
        </div>
      </NavLink>

      {/* Navigation — flex-1 but no overflow scroll; items fit naturally */}
      <nav className="flex-1 px-3 pt-3 pb-1 space-y-4 min-h-0">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-500/70 uppercase tracking-widest">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => <NavItem key={item.path} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section — pushed down with mt-auto */}
      <div className="mt-auto flex-shrink-0">
        {/* Main Site link */}
        <div className="px-3 pb-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
              <Home className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
            </div>
            <span className="flex-1">Main Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
          </NavLink>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar — fixed, full height, w-64 (256px) */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content — margin-left exactly matches sidebar */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 lg:px-6 h-14 flex items-center flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5 w-56">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search admin..." className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" readOnly />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Admin alerts bell */}
              <div ref={alertsRef} className="relative">
                <button
                  onClick={() => setAlertsOpen(v => !v)}
                  className="relative w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {urgentCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 animate-pulse">
                      {urgentCount}
                    </span>
                  )}
                </button>
                {alertsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/60 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">Admin Alerts</p>
                      {urgentCount > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{urgentCount} urgent</span>}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      {alerts.map(a => (
                        <div
                          key={a.id}
                          onClick={() => { if (a.path) { navigate(a.path); setAlertsOpen(false); } }}
                          className={`px-4 py-3 flex items-start gap-3 text-sm ${a.path ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-400'}`} />
                          <p className="text-gray-700 text-xs leading-relaxed">{a.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Profile avatar + badge */}
              <div className="flex items-center gap-2">
                <img
                  src={resolveStorageUrl(user?.avatar)}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
                />
                <span className="hidden sm:inline text-xs font-semibold text-gray-700 truncate max-w-[100px]">
                  {user?.fullname || user?.name || 'Admin'}
                </span>
              </div>
              <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-semibold border border-purple-200">
                SuperAdmin
              </span>
            </div>
          </div>
        </header>

        {/* Page content — fills remaining width, no max-w constraint */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
