import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import SidebarPatient from './components/SidebarPatient';
import { useAuth } from './context/AuthContext';
import CookieBanner from './components/CookieBanner';
import './i18n';
import { Footer, Header } from './components/layout';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import scrollConfig from './config/scroll';
import ScrollToTopButton from './components/common/ScrollToTopButton';
const OnboardingWizard = React.lazy(() => import('./pages/DoctorOnboarding.jsx'));

// Lazy-loaded pages for code splitting
const HomeV2 = React.lazy(() => import('./pages/HomeV2'));
const ExploreTimeline = React.lazy(() => import('./pages/ExploreTimeline'));
const ClinicDetailPage = React.lazy(() => import('./pages/ClinicDetailPage'));
const DoctorChatPage = React.lazy(() => import('./pages/DoctorChatPage'));
const TelehealthAppointmentPage = React.lazy(() => import('./pages/TelehealthAppointmentPage'));
const TelehealthPage = React.lazy(() => import('./pages/TelehealthPage'));
const TermsOfServicePage = React.lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ForPatientsPage = React.lazy(() => import('./pages/ForPatientsPage'));
const ForClinicsPage = React.lazy(() => import('./pages/ForClinicsPage'));
const VascoAIPage = React.lazy(() => import('./pages/VascoAIPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Profile = React.lazy(() => import('./pages/Profile'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const DoctorProfilePage = React.lazy(() => import('./pages/DoctorProfile.jsx'));
const ClinicProfileEdit = React.lazy(() => import('./pages/ClinicProfileEdit.jsx'));
const DoctorsDepartments = React.lazy(() => import('./pages/DoctorsDepartments.jsx'));
const CookiePolicyPage = React.lazy(() => import('./pages/CookiePolicyPage'));
const KVKKPage = React.lazy(() => import('./pages/KVKKPage'));
const DataPrivacyRightsPage = React.lazy(() => import('./pages/DataPrivacyRightsPage'));
const SearchResults = React.lazy(() => import('./pages/SearchResults'));
const DashboardRedirect = React.lazy(() => import('./pages/DashboardRedirect'));
const DoctorDashboard = React.lazy(() => import('./pages/DoctorDashboard'));
const PatientDashboard = React.lazy(() => import('./pages/PatientDashboard'));
const MedicalArchive = React.lazy(() => import('./pages/MedicalArchive'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const ServerErrorPage = React.lazy(() => import('./pages/ServerErrorPage'));
const SavedPosts = React.lazy(() => import('./pages/SavedPosts'));
const SavedClinics = React.lazy(() => import('./pages/SavedClinics'));
const ClinicOnboarding = React.lazy(() => import('./pages/ClinicOnboarding'));
const ClinicDashboard = React.lazy(() => import('./pages/ClinicDashboard'));
const ClinicTeam = React.lazy(() => import('./pages/ClinicTeam'));
const BrowseTreatments = React.lazy(() => import('./pages/BrowseTreatments'));
const BrowseClinics = React.lazy(() => import('./pages/BrowseClinics'));

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
const CRMMedStream = React.lazy(() => import('./pages/crm/CRMMedStream'));
const CRMTelehealth = React.lazy(() => import('./pages/crm/CRMTelehealth'));
const CRMSmartCalendar = React.lazy(() => import('./pages/crm/CRMSmartCalendar'));
const CRMRevenue = React.lazy(() => import('./pages/crm/CRMRevenue'));
const CRMSupport = React.lazy(() => import('./pages/crm/CRMSupport'));
const CRMFaq = React.lazy(() => import('./pages/crm/CRMFaq'));
const CRMStaff = React.lazy(() => import('./pages/crm/CRMStaff'));
const CRMClinicManager = React.lazy(() => import('./pages/crm/CRMClinicManager'));
const CRMReviews = React.lazy(() => import('./pages/crm/CRMReviews'));
const CRMContactInbox = React.lazy(() => import('./pages/crm/CRMContactInbox'));
const CRMPrescriptions = React.lazy(() => import('./pages/crm/CRMPrescriptions'));
const CRMMessages = React.lazy(() => import('./pages/crm/CRMMessages'));
const CRMDocuments = React.lazy(() => import('./pages/crm/CRMDocuments'));
const CRMBranches = React.lazy(() => import('./pages/crm/CRMBranches'));

// Admin Pages
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminVerification = React.lazy(() => import('./pages/admin/AdminVerification'));
const AdminModeration = React.lazy(() => import('./pages/admin/AdminModeration'));
const AdminCatalog = React.lazy(() => import('./pages/admin/AdminCatalog'));
const AdminFeatureToggles = React.lazy(() => import('./pages/admin/AdminFeatureToggles'));
const AdminAuditLogs = React.lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminReviews = React.lazy(() => import('./pages/admin/AdminReviews'));
const AdminSupport = React.lazy(() => import('./pages/admin/AdminSupport'));
const AdminUserManagement = React.lazy(() => import('./pages/admin/AdminUserManagement'));
const AdminVerificationReview = React.lazy(() => import('./pages/admin/AdminVerificationReview'));
const AdminSystemSettings = React.lazy(() => import('./pages/admin/AdminSystemSettings'));
const AdminFinancials = React.lazy(() => import('./pages/admin/AdminFinancials'));
const AdminAnnouncements = React.lazy(() => import('./pages/admin/AdminAnnouncements'));

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
  </div>
);

function AppContent() {
  const location = useLocation();
  const navType = useNavigationType();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Bridge for toast SPA navigation (ToastContext uses this)
  React.useEffect(() => { window.__TOAST_NAVIGATE = navigate; return () => { delete window.__TOAST_NAVIGATE; }; }, [navigate]);

  // Show sidebar for all logged-in users (including patients), but not on CRM or verify-email pages
  const hasSidebar = !!user && !location.pathname.startsWith('/crm') && !location.pathname.startsWith('/admin') && location.pathname !== '/verify-email';

  React.useEffect(() => {
    const path = String(location.pathname || '/');
    const isDoctor = /^\/doctor\//.test(path);
    const isPost = /^\/post\//.test(path);
    const isClinicDetail = /^\/clinic\//.test(path);

    const titleMap = {
      '/': 'MedaGama',
      '/home': 'MedaGama',
      '/home-v2': 'MedaGama',
      '/explore': 'MedStream | MedaGama',
      '/saved': 'Saved Posts | MedaGama',
      '/search': 'Search Doctors | MedaGama',
      '/doctors-departments': 'Doctors & Departments | MedaGama',
      '/clinic': 'Clinics | MedaGama',
      '/clinic-edit': 'Edit Clinic Profile | MedaGama',
      '/doctor-chat': 'Messages | MedaGama',
      '/telehealth': 'Telehealth | MedaGama',
      '/telehealth-appointment': 'Appointments | MedaGama',
      '/terms-of-service': 'Terms of Service | MedaGama',
      '/privacy-policy': 'Privacy Policy | MedaGama',
      '/cookie-policy': 'Cookie Policy | MedaGama',
      '/kvkk': 'KVKK | MedaGama',
      '/terms': 'Terms of Service | MedaGama',
      '/privacy': 'Privacy Policy | MedaGama',
      '/data-rights': 'Data Privacy Rights | MedaGama',
      '/auth': 'Sign In | MedaGama',
      '/login': 'Sign In | MedaGama',
      '/register': 'Create Account | MedaGama',
      '/verify-email': 'Verify Email | MedaGama',
      '/forgot-password': 'Reset Password | MedaGama',
      '/about': 'About | MedaGama',
      '/for-patients': 'For Patients | MedaGama',
      '/for-clinics': 'For Clinics | MedaGama',
      '/vasco-ai': 'Vasco AI | MedaGama',
      '/contact': 'Contact | MedaGama',
      '/notifications': 'Notifications | MedaGama',
      '/profile': 'Profile | MedaGama',
      '/dashboard': 'Dashboard | MedaGama',
      '/crm': 'CRM Dashboard | MedaGama',
      '/crm/appointments': 'CRM Appointments | MedaGama',
      '/crm/patients': 'CRM Patients | MedaGama',
      '/crm/patient-360': 'CRM Patient 360 | MedaGama',
      '/crm/reports': 'CRM Reports | MedaGama',
      '/settings': 'Settings | MedaGama',
      '/crm/settings': 'CRM Settings | MedaGama',
      '/crm/integrations': 'CRM Integrations | MedaGama',
      '/crm/billing': 'CRM Billing | MedaGama',
      '/crm/examination': 'CRM Examination | MedaGama',
      '/crm/medstream': 'MedStream | MedaGama',
      '/crm/telehealth': 'Telehealth | MedaGama',
      '/crm/calendar': 'Smart Calendar | MedaGama',
      '/crm/revenue': 'Revenue & Finance | MedaGama',
      '/crm/support': 'Help & Support | MedaGama',
      '/crm/faq': 'FAQ | MedaGama',
      '/crm/staff': 'Staff Management | MedaGama',
      '/crm/clinic-manager': 'Clinic Management | MedaGama',
      '/crm/prescriptions': 'Prescriptions | MedaGama',
      '/crm/messages': 'Messages | MedaGama',
      '/crm/documents': 'Documents | MedaGama',
      '/crm/help': 'CRM Help | MedaGama',
      '/onboarding': 'Setup Wizard | MedaGama',
      '/clinic/onboarding': 'Clinic Setup | MedaGama',
      '/clinic/dashboard': 'Clinic Dashboard | MedaGama',
      '/clinic/team': 'My Team | MedaGama',
      '/admin': 'Admin Dashboard | MedaGama',
      '/admin/verification': 'Doctor Verification | MedaGama',
      '/admin/moderation': 'Content Moderation | MedaGama',
      '/admin/catalog': 'Catalog Management | MedaGama',
      '/admin/support': 'Support Tickets | MedaGama',
      '/500': 'Server Error | MedaGama',
    };

    const title =
      titleMap[path] ||
      (isDoctor ? 'Doctor Profile | MedaGama' : null) ||
      (isPost ? 'Post | MedaGama' : null) ||
      (isClinicDetail ? 'Clinic | MedaGama' : null) ||
      'MedaGama';

    document.title = title;
  }, [location.pathname]);
  
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
            // Multiple retries to handle lazy-loaded content
            const restore = () => window.scrollTo({ top: y, behavior: 'auto' });
            requestAnimationFrame(restore);
            setTimeout(restore, 100);
            setTimeout(restore, 300);
            setTimeout(restore, 600);
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
  const hideOnAuthPages = ['/login', '/register', '/auth', '/doctor-login', '/clinic-login', '/admin-login', '/verify-email', '/forgot-password', '/dashboard', '/onboarding', '/clinic/onboarding'];
  const isAuthPage = hideOnAuthPages.includes(location.pathname);
  const isCRMPage = location.pathname.startsWith('/crm');
  const isAdminPage = location.pathname.startsWith('/admin');
  const showCookieBanner = !isAuthPage && !isCRMPage && !isAdminPage;
  const showHeader = !isAuthPage && !isCRMPage && !isAdminPage;
  
  // Sayfa türüne göre padding ayarı
  const pagesWithOwnContainer = [
    '/profile', '/notifications', '/doctors-departments', '/search', 
    '/patient-home', '/telehealth', '/telehealth-appointment',
    '/clinic', '/explore', '/post', '/doctor'
  ];
  // Also hide header/footer on clinic onboarding
  const isClinicOnboarding = location.pathname === '/clinic/onboarding';
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
        <Route path="/saved" element={<SavedPosts />} />
        <Route path="/saved-clinics" element={<SavedClinics />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/doctors-departments" element={<DoctorsDepartments />} />
        <Route path="/clinic" element={<ClinicDetailPage />} />
        <Route path="/clinic/:id" element={<ClinicDetailPage />} />
        <Route path="/clinic-edit" element={<ClinicProfileEdit />} />
        <Route path="/doctor-chat" element={<DoctorChatPage />} />
        <Route path="/telehealth" element={<TelehealthPage />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/medical-archive" element={<MedicalArchive />} />
        <Route path="/telehealth-appointment" element={<TelehealthAppointmentPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/kvkk" element={<KVKKPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/data-rights" element={<DataPrivacyRightsPage />} />
        <Route path="/auth" element={<LoginPage role="patient" />} />
        <Route path="/login" element={<LoginPage role="patient" />} />
        <Route path="/register" element={<LoginPage role="patient" />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/for-patients" element={<ForPatientsPage />} />
        <Route path="/for-clinics" element={<ForClinicsPage />} />
        <Route path="/vasco-ai" element={<VascoAIPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Role-specific logins */}
        <Route path="/doctor-login" element={<LoginPage role="doctor" />} />
        <Route path="/clinic-login" element={<LoginPage role="clinic" />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<CRMSettings standalone />} />
        <Route path="/doctor/:id" element={<DoctorProfilePage />} />
        <Route path="/post/:id" element={<PostDetail />} />
        {/* Doctor Dashboard — MedaGama main panel (NOT CRM) */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        {/* Clinic Routes */}
        <Route path="/clinic/onboarding" element={<ClinicOnboarding />} />
        <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
        <Route path="/clinic/team" element={<ClinicTeam />} />
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
        <Route path="/crm/medstream" element={<CRMLayout><CRMMedStream /></CRMLayout>} />
        <Route path="/crm/telehealth" element={<CRMLayout><CRMTelehealth /></CRMLayout>} />
        <Route path="/crm/calendar" element={<CRMLayout><CRMSmartCalendar /></CRMLayout>} />
        <Route path="/crm/revenue" element={<CRMLayout><CRMRevenue /></CRMLayout>} />
        <Route path="/crm/support" element={<CRMLayout><CRMSupport /></CRMLayout>} />
        <Route path="/crm/faq" element={<CRMLayout><CRMFaq /></CRMLayout>} />
        <Route path="/crm/staff" element={<CRMLayout><CRMStaff /></CRMLayout>} />
        <Route path="/crm/clinic-manager" element={<CRMLayout><CRMClinicManager /></CRMLayout>} />
        <Route path="/crm/reviews" element={<CRMLayout><CRMReviews /></CRMLayout>} />
        <Route path="/crm/contact-inbox" element={<CRMLayout><CRMContactInbox /></CRMLayout>} />
        <Route path="/crm/prescriptions" element={<CRMLayout><CRMPrescriptions /></CRMLayout>} />
        <Route path="/crm/messages" element={<CRMLayout><CRMMessages /></CRMLayout>} />
        <Route path="/crm/documents" element={<CRMLayout><CRMDocuments /></CRMLayout>} />
        <Route path="/crm/branches" element={<CRMLayout><CRMBranches /></CRMLayout>} />
        <Route path="/browse/treatments" element={<BrowseTreatments />} />
        <Route path="/browse/clinics" element={<BrowseClinics />} />
        <Route path="/crm/help" element={<CRMLayout><CRMSettings /></CRMLayout>} />
        {/* Admin Routes — nested under AdminLayout (Outlet pattern, zero remount) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="verification/review" element={<AdminVerificationReview />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="catalog" element={<AdminCatalog />} />
          <Route path="settings" element={<AdminSystemSettings />} />
          <Route path="feature-toggles" element={<AdminFeatureToggles />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="financials" element={<AdminFinancials />} />
        </Route>
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </div>
      
      {showFooter && <Footer />}
      {showCookieBanner && <CookieBanner />}
      {!isAuthPage && <ScrollToTopButton />}
      <OnboardingGate />
    </div>
  );
}

function OnboardingGate() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const isClinicOwner = user.role_id === 'clinicOwner';
    const isDoctor = user.role === 'doctor' || user.role_id === 'doctor';
    const needsOnboarding = (isDoctor || isClinicOwner) && user.onboarding_completed === false;

    const isOnboardingPage = location.pathname === '/onboarding' || location.pathname === '/clinic/onboarding';
    const isPublicPage = ['/login', '/register', '/auth', '/doctor-login', '/clinic-login',
      '/verify-email', '/forgot-password', '/terms-of-service', '/privacy-policy',
      '/cookie-policy', '/kvkk', '/data-rights'].includes(location.pathname);

    if (needsOnboarding && !isOnboardingPage && !isPublicPage) {
      if (isClinicOwner) {
        navigate('/clinic/onboarding', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <CookieConsentProvider>
          <AuthProvider>
            <ToastProvider>
              <FavoritesProvider>
                <NotificationsProvider>
                  <AppContent />
                </NotificationsProvider>
              </FavoritesProvider>
            </ToastProvider>
          </AuthProvider>
        </CookieConsentProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;

