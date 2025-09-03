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
import TermsOfServicePage from './pages/TermsOfServicePage';
import ClinicsPage from './pages/ClinicsPage';
import AuthPages from './pages/AuthPages';
import AboutPage from './pages/AboutPage';
import ForPatientsPage from './pages/ForPatientsPage';
import ForClinicsPage from './pages/ForClinicsPage';
import VascoAIPage from './pages/VascoAIPage';
import ContactPage from './pages/ContactPage';
import CookieBanner from './components/CookieBanner';
import { AuthProvider } from './context/AuthContext';
import DoctorLogin from './pages/DoctorLogin';
import ClinicLogin from './pages/ClinicLogin';
import Updates from './pages/Updates';
import Notifications from './pages/Notifications';
// (PatientLayout removed)

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Cookie banner'ın gösterileceği sayfalar
  const showCookieBanner = ['/', '/home', '/home-v2', '/patient-home', '/clinics', '/timeline', '/clinic', '/doctor-chat', '/telehealth-appointment', '/terms-of-service', '/login', '/register', '/about', '/for-patients', '/for-clinics', '/vasco-ai', '/contact', '/updates', '/notifications'].includes(location.pathname);
  
  return (
    <div className={user ? "lg:pl-72" : ""}>
      {/* Global patient sidebar (renders once for all pages) */}
      {user && <SidebarPatient />}
      <Routes>
        <Route path="/" element={<HomeV2 />} />
        <Route path="/home" element={<HomeV2 />} />
        <Route path="/home-v2" element={<HomeV2 />} />
        <Route path="/patient-home" element={<PatientHome />} />
        <Route path="/clinics" element={<ClinicsPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/clinic" element={<ClinicDetailPage />} />
        <Route path="/doctor-chat" element={<DoctorChatPage />} />
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
      </Routes>
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

