import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import ClinicsPage from './pages/ClinicsPage';
import AuthPages from './pages/AuthPages';
import AboutPage from './pages/AboutPage';
import ForPatientsPage from './pages/ForPatientsPage';
import ForClinicsPage from './pages/ForClinicsPage';
import VascoAIPage from './pages/VascoAIPage';
import ContactPage from './pages/ContactPage';
import CookieBanner from './components/CookieBanner';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import DoctorLogin from './pages/DoctorLogin';
import ClinicLogin from './pages/ClinicLogin';
import Updates from './pages/Updates';
import Notifications from './pages/Notifications';
// (PatientLayout removed)
import Profile from './pages/Profile';
import ExploreTimeline from './pages/ExploreTimeline';

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  const hasSidebar = user && user.role !== 'patient';
  
  // Opsiyonel tekerlek kaydırma override'ı: varsayılan olarak KAPALI
  // Etkinleştirmek için konsolda: window.__SCROLL_OVERRIDE = true; window.__SCROLL_FACTOR = 2.0
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__SCROLL_OVERRIDE !== true) return; // default off

    if (typeof window.__SCROLL_FACTOR !== 'number') {
      window.__SCROLL_FACTOR = 2.0;
    }

    const isScrollable = (el) => {
      if (!el || el === document.documentElement || el === document.body) return false;
      const style = window.getComputedStyle(el);
      const canScroll = /(auto|scroll)/.test(style.overflowY);
      return canScroll && el.scrollHeight > el.clientHeight;
    };

    const handler = (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      for (const node of path) {
        if (node instanceof HTMLElement && isScrollable(node)) {
          return; // iç scroll'a dokunma
        }
      }
      e.preventDefault();
      const baseDelta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const factor = (typeof window !== 'undefined' && typeof window.__SCROLL_FACTOR === 'number')
        ? window.__SCROLL_FACTOR
        : 2.0;
      const scroller = document.scrollingElement || document.documentElement;
      scroller.scrollBy({ top: baseDelta * factor, behavior: 'auto' }); // smooth yerine auto

      if (typeof window !== 'undefined' && window.__SCROLL_DEBUG) {
        console.info('[ScrollDebug] deltaMode:', e.deltaMode, 'baseDelta:', baseDelta, 'factor:', factor);
      }
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, []);
  
  // Cookie banner: auth sayfalarında gösterme
  const hideCookieOn = ['/login', '/register', '/auth', '/doctor-login', '/clinic-login', '/admin-login'];
  const showCookieBanner = !hideCookieOn.includes(location.pathname);
  
  // Footer sadece ana site sayfalarında görünsün
  const footerOnlyOn = ['/', '/home', '/home-v2'];
  const showFooter = footerOnlyOn.includes(location.pathname);
  
  return (
    <div className={hasSidebar ? "lg:pl-72" : ""}>
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
        <Route path="/doctor-chat" element={<DoctorChatPage />} />
        <Route path="/telehealth" element={<TelehealthPage />} />
        <Route path="/telehealth-appointment" element={<TelehealthAppointmentPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
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
        <Route path="/updates" element={<Updates />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
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

