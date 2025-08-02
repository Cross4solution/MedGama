import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MediTravelHomepage from './MediTravelHomepage';
import MediTravelTimeline from './MediTravelTimeline';
import ClinicDetailPage from './ClinicDetailPage';
import DoctorChatPage from './DoctorChatPage';
import TelehealthAppointmentPage from './TelehealthAppointmentPage';
import TermsOfServicePage from './TermsOfServicePage';
import MediTravelClinics from './MediTravelClinics';
import AuthPages from './AuthPages';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<AuthPages />} />
          <Route path="/home" element={<MediTravelHomepage />} />
          <Route path="/clinics" element={<MediTravelClinics />} />
          <Route path="/timeline" element={<MediTravelTimeline />} />
          <Route path="/clinic" element={<ClinicDetailPage />} />
          <Route path="/doctor-chat" element={<DoctorChatPage />} />
          <Route path="/telehealth-appointment" element={<TelehealthAppointmentPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/auth" element={<AuthPages />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
