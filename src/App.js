import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TimelinePage from './pages/TimelinePage';
import ClinicDetailPage from './pages/ClinicDetailPage';
import DoctorChatPage from './pages/DoctorChatPage';
import TelehealthAppointmentPage from './pages/TelehealthAppointmentPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ClinicsPage from './pages/ClinicsPage';
import AuthPages from './pages/AuthPages';
import CookieBanner from './components/CookieBanner';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<AuthPages />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/clinics" element={<ClinicsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/clinic" element={<ClinicDetailPage />} />
          <Route path="/doctor-chat" element={<DoctorChatPage />} />
          <Route path="/telehealth-appointment" element={<TelehealthAppointmentPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/auth" element={<AuthPages />} />
        </Routes>
        <CookieBanner />
      </div>
    </Router>
  );
}

export default App;
