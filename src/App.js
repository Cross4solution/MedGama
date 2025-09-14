import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigationType } from 'react-router-dom';
import SidebarPatient from './components/SidebarPatient';
import { useAuth } from './context/AuthContext';
import HomeV2 from './pages/HomeV2';
import PatientHome from './pages/PatientHome';
import TimelinePage from './pages/TimelinePage';
import ClinicDetailPage from './pages/ClinicDetailPage';
import DoctorChatPage from './pages/DoctorChatPage';
import TelehealthAppointmentPage from './pages/TelehealthAppointmentPage';
import TelehealthPage from './pages/TelehealthPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ClinicsPage from './pages/ClinicsPage';
import AuthPages from './pages/AuthPages';
import AboutPage from './pages/AboutPage';
import ForPatientsPage from './pages/ForPatientsPage';
import ForClinicsPage from './pages/ForClinicsPage';
import VascoAIPage from './pages/VascoAIPage';
import ContactPage from './pages/ContactPage';
import CookieBanner from './components/CookieBanner';
import { Footer } from './components/layout';
import { AuthProvider } from './context/AuthContext';
import DoctorLogin from './pages/DoctorLogin';
import ClinicLogin from './pages/ClinicLogin';
import Notifications from './pages/Notifications';
// (PatientLayout removed)
import Profile from './pages/Profile';
import ExploreTimeline from './pages/ExploreTimeline';
import PostDetail from './pages/PostDetail';
import DoctorProfilePage from './pages/DoctorProfile.jsx';
import PatientProfilePage from './pages/PatientProfile.jsx';
import scrollConfig from './config/scroll';

function AppContent() {
  const location = useLocation();
  const navType = useNavigationType();
  const { user } = useAuth();
  const hasSidebar = user && user.role !== 'patient';
  
  // Opsiyonel tekerlek kaydırma override'ı: varsayılan AÇIK (azıcık yavaş ve akıcı)
  // Scroll override: tek kaynaktan (config/scroll.js)
  React.useEffect(() => {
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
    document.addEventListener('wheel', handler, { passive: false });
    return () => {
      window.removeEventListener('wheel', handler);
      document.removeEventListener('wheel', handler);
    };
  }, []);
  
  // Route değişiminde sayfayı en üste al (ancak /post/* ve geriye dönüşlerde (POP) koru)
  React.useEffect(() => {
    const isPostDetail = String(location.pathname || '').startsWith('/post/');
    if (navType === 'POP') {
      // Geri dönüşte, daha önce kaydedilmiş konum varsa ona dön
      try {
        const val = sessionStorage.getItem('returnScroll');
        if (val != null) {
          const y = Number(val);
          if (!Number.isNaN(y)) {
            window.scrollTo({ top: y, behavior: 'auto' });
          }
          sessionStorage.removeItem('returnScroll');
        }
      } catch {}
      return;
    }
    if (isPostDetail) return; // post detayına giderken mevcut konumu koru
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);
  
  // Cookie banner: auth sayfalarında gösterme
  const hideCookieOn = ['/login', '/register', '/auth', '/doctor-login', '/clinic-login', '/admin-login'];
  const showCookieBanner = !hideCookieOn.includes(location.pathname);
  
  // Footer sadece ana site sayfalarında görünsün
  const footerOnlyOn = ['/', '/home', '/home-v2'];
  const showFooter = footerOnlyOn.includes(location.pathname);
  
  return (
    <div className={hasSidebar ? "lg:pl-52" : ""}>
      {/* Show sidebar only for non-patient roles */}
      {hasSidebar && <SidebarPatient />}
      <Routes>
        <Route path="/" element={<HomeV2 />} />
        <Route path="/home" element={<HomeV2 />} />
        <Route path="/home-v2" element={<HomeV2 />} />
        <Route path="/explore" element={<ExploreTimeline />} />
        <Route path="/patient-home" element={<PatientHome />} />
        <Route path="/clinics" element={<ClinicsPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/clinic" element={<ClinicDetailPage />} />
        <Route path="/clinic/:id" element={<ClinicDetailPage />} />
        <Route path="/doctor-chat" element={<DoctorChatPage />} />
        <Route path="/telehealth" element={<TelehealthPage />} />
        <Route path="/telehealth-appointment" element={<TelehealthAppointmentPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/auth" element={<AuthPages />} />
        <Route path="/login" element={<AuthPages />} />
        <Route path="/register" element={<AuthPages />} />
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
        <Route path="/patient/:id" element={<PatientProfilePage />} />
        <Route path="/post/:id" element={<PostDetail />} />
      </Routes>
      {showFooter && <Footer />}
      {showCookieBanner && <CookieBanner />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

