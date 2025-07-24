import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MediTravelHomepage from './MediTravelHomepage';
import MediTravelTimeline from './MediTravelTimeline';
import ClinicDetailPage from './ClinicDetailPage';

function App() {
  return (
    <Router>
      <div>
        {/* Üstte basit bir menü */}
        <nav className="bg-white shadow-sm border-b mb-6">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-semibold">Ana Sayfa</Link>
            <Link to="/timeline" className="text-gray-600 hover:text-blue-600 font-semibold">Timeline</Link>
            <Link to="/clinic" className="text-gray-600 hover:text-blue-600 font-semibold">Klinik Detay</Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<MediTravelHomepage />} />
          <Route path="/timeline" element={<MediTravelTimeline />} />
          <Route path="/clinic" element={<ClinicDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
