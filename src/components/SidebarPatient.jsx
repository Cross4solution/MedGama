import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, CalendarClock, Building2, Bell, ArrowUpRight, Monitor, Heart, LogOut } from 'lucide-react';
import { endpoints } from '../lib/api';
import Modal from './common/Modal';
import { useToast } from '../context/ToastContext';

// Custom chat icon using public SVG (accepts className via props)
const ChatRoundIcon = (props) => (
  <img
    src="/images/icon/chat-round-line-svgrepo-com.svg"
    alt="Messages"
    {...props}
  />
);

// Custom Medstream icon using public SVG (accepts className via props)
const MedstreamIcon = (props) => (
  <img
    src="/images/icon/medstream.svg"
    alt="Medstream"
    {...props}
  />
);

export default function SidebarPatient() {
  const { user, token, logout, sidebarMobileOpen, setSidebarMobileOpen } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();
  // Mobile drawer state is managed globally in AuthContext

  const [unreadCount, setUnreadCount] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    if (!supportOpen) return;
    setSupportSubject('');
    setSupportMessage('');
  }, [supportOpen]);

  const loadUnreadCount = async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await endpoints.doctorNotifications();
      const paginator = res?.data?.notifications ?? res?.notifications ?? null;
      const list = Array.isArray(paginator?.data) ? paginator.data : [];
      const unread = list.filter((n) => !n.read_at).length;
      setUnreadCount(unread);
    } catch {
      // Sessizce yut: badge zorunlu değil
    }
  };

  useEffect(() => {
    loadUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pathname]);

  useEffect(() => {
    const handler = () => {
      loadUnreadCount();
    };
    window.addEventListener('medgama:notifications-updated', handler);
    return () => window.removeEventListener('medgama:notifications-updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Periyodik olarak unread sayısını yenile (yakın gerçek zamanlı etki için)
  useEffect(() => {
    if (!token) return undefined;
    const interval = window.setInterval(() => {
      loadUnreadCount();
    }, 30000); // 30 saniyede bir kontrol
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!user) return null;

  const role = user?.role || 'patient';

  const displayName = (user?.name || `${user?.fname || ''} ${user?.lname || ''}`.trim() || user?.email || 'User').trim();
  const displaySubtitle = role === 'doctor'
    ? (user?.title || user?.specialty || 'Doctor')
    : role === 'clinic'
      ? (user?.title || user?.location || 'Clinic')
      : 'Patient';

  const initials = (() => {
    const parts = displayName.split(' ').filter(Boolean);
    const a = parts[0]?.[0] || 'U';
    const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '';
    return (a + b).toUpperCase();
  })();

  const patientItems = [
    // Requested minimal menu for patient
    { to: '/home-v2', label: 'Home', icon: Home },
    { to: '/explore', label: 'Medstream', icon: MedstreamIcon },
    { to: '/favorite-clinics', label: 'Favorite Clinics', icon: Heart },
    { to: '/messages', label: 'Messages', icon: ChatRoundIcon },
    { to: '/telehealth', label: 'Telehealth', icon: Monitor },
  ];

  // Doctor-specific menu (Profile → Medstream → Notifications → Messages → Schedule → Telehealth → CRM)
  const doctorItems = [
    { to: '/explore', label: 'Medstream', icon: MedstreamIcon },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount || undefined },
    { to: '/messages', label: 'Messages', icon: ChatRoundIcon },
    { to: '/telehealth-appointment', label: 'Schedule', icon: CalendarClock },
    { to: '/telehealth', label: 'Telehealth', icon: Monitor },
    { href: (process.env.REACT_APP_CRM_URL || 'https://crmtaslak.netlify.app/login'), label: 'CRM', icon: ArrowUpRight, external: true },
  ];

  // Clinic-specific menu (Profile → Medstream → Notifications → Messages → Departments and Doctors → CRM)
  const clinicItems = [
    { to: '/explore', label: 'Medstream', icon: MedstreamIcon },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount || undefined },
    { to: '/messages', label: 'Messages', icon: ChatRoundIcon },
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
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 w-52 top-16 bottom-0 z-40`}>
        <div className="h-full pl-0">
          <div className="h-full rounded-r-2xl border border-l-0 bg-white shadow-sm flex flex-col">
            {/* Header / Profile */}
            <div className="p-3 border-b relative">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
                <div className="text-xs text-gray-500 truncate">{displaySubtitle}</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-3">
                <div className="mb-2 px-2 text-[11px] uppercase tracking-wide text-gray-400">Menu</div>
                <nav className="space-y-1">
                  {items.map((it, idx) => (
                    <NavItem key={`${it.to || it.href || it.label || 'item'}-${idx}`} {...it} />
                  ))}
                </nav>
              </div>
            </div>

            {/* Divider with more space */}
            <div className="h-px bg-gray-200 my-8 mx-3"></div>
            
            {/* Footer actions with more space */}
            <div className="px-3 pb-3">
              <button
                onClick={async () => {
                  const confirmed = await logout();
                  if (confirmed) {
                    try { window.location.assign('/home-v2'); } catch { navigate('/home-v2'); }
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 -scale-x-100" /> Log out
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
            <div className="h-full border-r bg-white shadow-xl flex flex-col rounded-r-2xl pb-4">
              {/* Mobile Header */}
              <div className="p-3 border-b">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
                  <div className="text-xs text-gray-500 truncate">{displaySubtitle}</div>
                </div>
              </div>

              {/* Mobile Nav */}
              <div className="p-3 flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  {items.map((it, idx) => (
                    it.external && it.href ? (
                      <a
                        key={`${it.href || it.label || 'item'}-${idx}`}
                        href={it.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setSidebarMobileOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-sm border transition border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200"
                      >
                        <span className="flex items-center gap-2">
                          <it.icon className="w-4 h-4 text-gray-500" />
                          {it.label}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    ) : (
                      <Link
                        key={`${it.to || it.label || 'item'}-${idx}`}
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
                    )
                  ))}
                </nav>

                {/* Divider */}
                <div className="my-3 border-t" />

                {/* Header links section */}
                <nav className="space-y-1">
                  <Link to="/about" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">About Medagama</Link>
                  <Link to="/for-patients" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">For Patients</Link>
                  <Link to="/clinics" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">For Clinics</Link>
                  <Link to="/vasco-ai" onClick={() => setSidebarMobileOpen(false)} className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent">Vasco AI</Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarMobileOpen(false);
                      setSupportOpen(true);
                    }}
                    className="w-full text-left block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent"
                  >
                    Support
                  </button>
                </nav>
              </div>

              {/* Mobile Footer with divider */}
              <div className="h-px bg-gray-200 my-8 mx-3"></div>
              
              <div className="px-3 pb-3">
                <button
                  onClick={async () => {
                    setSidebarMobileOpen(false);
                    const confirmed = await logout();
                    if (confirmed) {
                      navigate('/home-v2');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 -scale-x-100" /> Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        title={<span className="inline-flex items-center gap-2">Support</span>}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
              onClick={() => setSupportOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-[#1C6A83] text-white text-sm hover:bg-[#0F4A5C]"
              onClick={() => {
                if (!supportSubject.trim() || !supportMessage.trim()) {
                  notify({ type: 'error', message: 'Please fill subject and message.' });
                  return;
                }
                notify({ type: 'success', message: 'Support message sent.' });
                setSupportOpen(false);
              }}
            >
              Send
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
            <input
              value={supportSubject}
              onChange={(e) => setSupportSubject(e.target.value)}
              className="w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-4 focus:ring-[#1C6A83]/15 focus:border-[#1C6A83]/40"
              placeholder="Type a subject…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={5}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-y focus:outline-none focus:ring-4 focus:ring-[#1C6A83]/15 focus:border-[#1C6A83]/40"
              placeholder="Write your message…"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}