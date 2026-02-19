import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import SidebarPatient from './components/SidebarPatient';
import { useAuth } from './context/AuthContext';
import CookieBanner from './components/CookieBanner';
import './i18n';
import { Footer, Header } from './components/layout';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import scrollConfig from './config/scroll';
import ScrollToTopButton from './components/common/ScrollToTopButton';

// Lazy-loaded pages for code splitting
const HomeV2 = React.lazy(() => import('./pages/HomeV2'));
const ExploreTimeline = React.lazy(() => import('./pages/ExploreTimeline'));
const ClinicDetailPage = React.lazy(() => import('./pages/ClinicDetailPage'));
const DoctorChatPage = React.lazy(() => import('./pages/DoctorChatPage'));
const TelehealthAppointmentPage = React.lazy(() => import('./pages/TelehealthAppointmentPage'));
const TelehealthPage = React.lazy(() => import('./pages/TelehealthPage'));
const TermsOfServicePage = React.lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const AuthPages = React.lazy(() => import('./pages/AuthPages'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ForPatientsPage = React.lazy(() => import('./pages/ForPatientsPage'));
const ForClinicsPage = React.lazy(() => import('./pages/ForClinicsPage'));
const VascoAIPage = React.lazy(() => import('./pages/VascoAIPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const DoctorLogin = React.lazy(() => import('./pages/DoctorLogin'));
const ClinicLogin = React.lazy(() => import('./pages/ClinicLogin'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Profile = React.lazy(() => import('./pages/Profile'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const DoctorProfilePage = React.lazy(() => import('./pages/DoctorProfile.jsx'));
import DoctorOnboardingModal from './pages/DoctorOnboarding.jsx';
const ClinicProfileEdit = React.lazy(() => import('./pages/ClinicProfileEdit.jsx'));
const DoctorsDepartments = React.lazy(() => import('./pages/DoctorsDepartments.jsx'));
const CookiePolicyPage = React.lazy(() => import('./pages/CookiePolicyPage'));
const DataPrivacyRightsPage = React.lazy(() => import('./pages/DataPrivacyRightsPage'));

// CRM Pages
const CRMLayout = React.lazy(() => import('./components/crm/CRMLayout'));
const CRMDashboard = React.lazy(() => import('./pages/crm/CRMDashboard'));
const CRMAppointments = React.lazy(() => import('./pages/crm/CRMAppointments'));
const CRMPatients = React.lazy(() => import('./pages/crm/CRMPatients'));
const CRMReports = React.lazy(() => import('./pages/crm/CRMReports'));
const CRMSettings = React.lazy(() => import('./pages/crm/CRMSettings'));
const CRMIntegrations = React.lazy(() => import('./pages/crm/CRMIntegrations'));
const CRMPatient360 = React.lazy(() => import('./pages/crm/CRMPatient360'));
const CRMBilling = React.lazy(() => import('./pages/crm/CRMBilling'));
const CRMExamination = React.lazy(() => import('./pages/crm/CRMExamination'));

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
  </div>
);

function AppContent() {
  const location = useLocation();
  const navType = useNavigationType();
  const { user } = useAuth();
  // Show sidebar for all logged-in users (including patients), but not on CRM or verify-email pages
  const hasSidebar = !!user && !location.pathname.startsWith('/crm') && location.pathname !== '/verify-email';
  
  // Opsiyonel tekerlek kaydırma override'ı: varsayılan AÇIK (azıcık yavaş ve akıcı)
  // Scroll override: tek kaynaktan (config/scroll.js)
  React.useEffect(() => {
    // Do not override scroll on doctor chat page; allow internal containers to manage it
    if (String(location.pathname || '').startsWith('/doctor-chat')) return;
    if (typeof window === 'undefined') return;
    if (!scrollConfig?.enabled) return;

    const isScrollable = (el) => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(el);
      const canScrollY = /(auto|scroll)/.test(style.overflowY);
      return canScrollY && el.scrollHeight > el.clientHeight;
    };

    const scroller = document.scrollingElement || document.documentElement;

    const handler = (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      let targetEl = null;
      for (const node of path) { if (isScrollable(node)) { targetEl = node; break; } }
      if (!targetEl) targetEl = scroller;
      e.preventDefault();

      let delta = 0;
      if (scrollConfig.mode === 'viewport') {
        const frac = Math.max(0.05, Math.min(1, Number(scrollConfig.viewportFraction) || 0.25));
        const dir = Math.sign(e.deltaY || 1);
        delta = dir * Math.max(1, Math.round((targetEl.clientHeight || window.innerHeight) * frac));
      } else {
        const unit = Number(scrollConfig.lineUnit) || 16;
        let base = e.deltaMode === 1 ? (e.deltaY * unit) : (e.deltaMode === 2 ? (e.deltaY * window.innerHeight) : e.deltaY);
        const minS = Number(scrollConfig.minStep) || 24;
        const maxS = Number(scrollConfig.maxStep) || 160;
        if (Math.abs(base) < minS) base = Math.sign(base || 1) * minS;
        if (base > maxS) base = maxS; if (base < -maxS) base = -maxS;
        delta = base;
      }

      const behavior = (scrollConfig.behavior === 'auto' ? 'auto' : 'smooth');
      targetEl.scrollBy({ top: delta, behavior });
    };

    window.addEventListener('wheel', handler, { passive: false });
    return () => {
      window.removeEventListener('wheel', handler);
    };
  }, [location.pathname]);
  
  // Route değişiminde sayfayı en üste al (ancak /post/* ve geriye dönüşlerde (POP) koru)
  React.useEffect(() => {
    const isPostDetail = String(location.pathname || '').startsWith('/post/');
    if (navType === 'POP') {
      // Geri dönüşte, daha önce kaydedilmiş konum varsa ona dön
      try {
        const val = sessionStorage.getItem('returnScroll');
        if (val != null) {
          const y = Number(val);
          sessionStorage.removeItem('returnScroll');
          if (!Number.isNaN(y) && y > 0) {
            // Delay restore so DOM has time to render content
            requestAnimationFrame(() => {
              window.scrollTo({ top: y, behavior: 'auto' });
              // Double-check after a short delay (lazy-loaded content)
              setTimeout(() => window.scrollTo({ top: y, behavior: 'auto' }), 150);
            });
          }
        }
      } catch {}
      return;
    }
    if (isPostDetail) return; // post detayına giderken mevcut konumu koru
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);
  
  // Auth ve CRM sayfalarında header ve cookie banner'ı gizle
  const hideOnAuthPages = ['/login', '/register', '/auth', '/doctor-login', '/clinic-login', '/admin-login', '/verify-email', '/forgot-password'];
  const isAuthPage = hideOnAuthPages.includes(location.pathname);
  const isCRMPage = location.pathname.startsWith('/crm');
  const showCookieBanner = !isAuthPage && !isCRMPage;
  const showHeader = !isAuthPage && !isCRMPage;
  
  // Sayfa türüne göre padding ayarı
  const pagesWithOwnContainer = [
    '/profile', '/notifications', '/doctors-departments', 
    '/patient-home', '/telehealth', '/telehealth-appointment',
    '/clinic', '/explore', '/post', '/doctor'
  ];
  const hasOwnContainer = pagesWithOwnContainer.some(page => 
    location.pathname.startsWith(page)
  );
  
  // Footer sadece ana site sayfalarında görünsün
  const footerOnlyOn = ['/', '/home', '/home-v2'];
  const showFooter = footerOnlyOn.includes(location.pathname);
  
  const isDoctorChat = String(location.pathname || '').startsWith('/doctor-chat');
  return (
    <div className={hasSidebar ? "lg:pl-[12rem]" : ""}>
      {/* Global Header - auth sayfalarında gizle */}
      {showHeader && <Header />}
      
      {/* Sidebar for logged-in users (patient/doctor/clinic) */}
      {hasSidebar && <SidebarPatient />}
      
      {/* Main content with proper spacing for header (no extra padding on doctor chat) */}
      <div className={showHeader ? (hasOwnContainer || isDoctorChat ? "pt-14" : "pt-12") : ""}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/" element={<HomeV2 />} />
        <Route path="/home" element={<HomeV2 />} />
        <Route path="/home-v2" element={<HomeV2 />} />
        <Route path="/explore" element={<ExploreTimeline />} />
        <Route path="/doctors-departments" element={<DoctorsDepartments />} />
        <Route path="/clinic" element={<ClinicDetailPage />} />
        <Route path="/clinic/:id" element={<ClinicDetailPage />} />
        <Route path="/clinic-edit" element={<ClinicProfileEdit />} />
        <Route path="/doctor-chat" element={<DoctorChatPage />} />
        <Route path="/telehealth" element={<TelehealthPage />} />
        <Route path="/telehealth-appointment" element={<TelehealthAppointmentPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/data-rights" element={<DataPrivacyRightsPage />} />
        <Route path="/auth" element={<AuthPages />} />
        <Route path="/login" element={<AuthPages />} />
        <Route path="/register" element={<AuthPages />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/for-patients" element={<ForPatientsPage />} />
        <Route path="/for-clinics" element={<ForClinicsPage />} />
        <Route path="/vasco-ai" element={<VascoAIPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Role-specific logins */}
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/clinic-login" element={<ClinicLogin />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/doctor/:id" element={<DoctorProfilePage />} />
        <Route path="/post/:id" element={<PostDetail />} />
        {/* CRM Routes */}
        <Route path="/crm" element={<CRMLayout><CRMDashboard /></CRMLayout>} />
        <Route path="/crm/appointments" element={<CRMLayout><CRMAppointments /></CRMLayout>} />
        <Route path="/crm/patients" element={<CRMLayout><CRMPatients /></CRMLayout>} />
        <Route path="/crm/patient-360" element={<CRMLayout><CRMPatient360 /></CRMLayout>} />
        <Route path="/crm/reports" element={<CRMLayout><CRMReports /></CRMLayout>} />
        <Route path="/crm/settings" element={<CRMLayout><CRMSettings /></CRMLayout>} />
        <Route path="/crm/integrations" element={<CRMLayout><CRMIntegrations /></CRMLayout>} />
        <Route path="/crm/billing" element={<CRMLayout><CRMBilling /></CRMLayout>} />
        <Route path="/crm/examination" element={<CRMLayout><CRMExamination /></CRMLayout>} />
        <Route path="/crm/help" element={<CRMLayout><CRMSettings /></CRMLayout>} />
        </Routes>
        </Suspense>
      </div>
      
      {showFooter && <Footer />}
      {showCookieBanner && <CookieBanner />}
      {!isAuthPage && <ScrollToTopButton />}
      <DoctorOnboardingGate />
    </div>
  );
}

function DoctorOnboardingGate() {
  const { user, updateUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) { setShowOnboarding(false); return; }
    const isDoctor = user?.role === 'doctor' || user?.role_id === 'doctor';
    if (isDoctor && user?.onboarding_completed === false) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  const handleComplete = useCallback(() => {
    setShowOnboarding(false);
    updateUser({ onboarding_completed: true });
  }, [updateUser]);

  return <DoctorOnboardingModal open={showOnboarding} onComplete={handleComplete} />;
}

function App() {
  return (
    <Router>
      <CookieConsentProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </CookieConsentProvider>
    </Router>
  );
}

export default App;

