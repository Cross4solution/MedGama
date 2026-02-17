import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PhoneNumberInput from '../components/forms/PhoneNumberInput';
import { listCountriesAll } from '../utils/geo';
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { doctorAPI, appointmentAPI, calendarSlotAPI } from '../lib/api';

export default function TelehealthAppointmentPage() {
  const { formatCurrency, country, user } = useAuth();
  const navigate = useNavigate();

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [patientInfo, setPatientInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
    symptoms: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Doctors from API
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Available slots from API
  const [availableSlots, setAvailableSlots] = useState([]);

  // Countries for PhoneNumberInput (loaded async)
  const [allCountries, setAllCountries] = useState([]);
  useEffect(() => {
    listCountriesAll({ excludeIslands: true, excludeNoCities: true }).then(setAllCountries);
  }, []);

  // Auto-fill patient info from logged-in user
  useEffect(() => {
    if (user) {
      setPatientInfo(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullname || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.mobile || '',
      }));
    }
  }, [user]);

  // Fetch doctors from API
  useEffect(() => {
    setLoadingDoctors(true);
    doctorAPI.list({ per_page: 50 }).then(res => {
      const list = res?.data || [];
      setDoctors(list.map(d => ({
        id: d.id,
        name: d.fullname,
        avatar: d.avatar || '/images/caroline-lm-uqved8dypum-unsplash_720.jpg',
        specialty: 'Doctor',
        is_verified: d.is_verified,
      })));
      if (list.length > 0 && !selectedDoctor) setSelectedDoctor(list[0].id);
    }).catch(() => {}).finally(() => setLoadingDoctors(false));
  }, []);

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    calendarSlotAPI.list({ doctor_id: selectedDoctor, date: selectedDate, available: 1 }).then(res => {
      const list = res?.data || [];
      setAvailableSlots(list);
    }).catch(() => setAvailableSlots([]));
  }, [selectedDoctor, selectedDate]);

  // Refs for date pickers (appointment date and DOB)
  const apptDateRef = useRef(null);
  const dobRef = useRef(null);

  // Fallback time slots if no API slots
  const defaultTimeSlots = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '14:00','14:30','15:00','15:30','16:00','16:30'
  ];
  const timeSlots = availableSlots.length > 0
    ? availableSlots.map(s => s.start_time?.slice(0, 5) || s.start_time)
    : defaultTimeSlots;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setError('Please login to create an appointment.'); return; }
    if (!selectedDoctor) { setError('Please select a doctor.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const slot = availableSlots.find(s => (s.start_time?.slice(0, 5) || s.start_time) === selectedTime);
      await appointmentAPI.create({
        patient_id: user.id,
        doctor_id: selectedDoctor,
        appointment_type: 'online',
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        slot_id: slot?.id || undefined,
        confirmation_note: patientInfo.symptoms || undefined,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err?.errors?.appointment_date?.[0] || err?.errors?.doctor_id?.[0] || err?.message || 'Failed to create appointment.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctor);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Appointment Created!</h1>
          <p className="text-sm text-gray-500 mb-2">Your appointment has been successfully booked.</p>
          <p className="text-sm text-gray-600 mb-6">
            <strong>{selectedDoctorObj?.name}</strong> — {selectedDate} at {selectedTime}
          </p>
          <p className="text-xs text-gray-400 mb-6">A session link will be sent to your email before the appointment.</p>
          <button onClick={() => navigate('/home-v2')} className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-all">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title removed as requested */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Clinic / Info */}
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <img
                    src={selectedDoctorObj?.avatar || '/images/caroline-lm-uqved8dypum-unsplash_720.jpg'}
                    alt="Doctor"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{selectedDoctorObj?.name || 'Select a Doctor'}</h3>
                    <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-1 sm:gap-0">
                      <span>{selectedDoctorObj?.specialty || 'Online Consultation'}</span>
                    </div>
                    <div className="mt-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Online Telehealth
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Selection</label>
                  {loadingDoctors ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading doctors...
                    </div>
                  ) : doctors.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">No doctors available at the moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {doctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${selectedDoctor === doctor.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                          onClick={() => setSelectedDoctor(doctor.id)}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <input
                              type="radio"
                              name="doctor"
                              value={doctor.id}
                              checked={selectedDoctor === doctor.id}
                              onChange={() => setSelectedDoctor(doctor.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1 flex-shrink-0"
                            />
                            <img
                              src={doctor.avatar}
                              alt={doctor.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{doctor.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{doctor.specialty}</p>
                              {doctor.is_verified && <span className="text-xs text-emerald-600 font-medium">✓ Verified</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <div
                      className="relative date-with-icon cursor-pointer"
                      onClick={() => apptDateRef.current?.showPicker?.()}
                    >
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        ref={apptDateRef}
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full h-11 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm bg-white border-gray-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <div className="relative">
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full h-11 border border-gray-300 rounded-lg px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={patientInfo.fullName}
                      onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <PhoneNumberInput
                      value={patientInfo.phone}
                      countryName={country || ''}
                      onChange={(val) => setPatientInfo({ ...patientInfo, phone: val })}
                      allowedCountryNames={allCountries}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={patientInfo.email}
                      onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <div
                      className="relative date-with-icon cursor-pointer"
                      onClick={() => dobRef.current?.showPicker?.()}
                    >
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        ref={dobRef}
                        type="date"
                        value={patientInfo.birthDate}
                        onChange={(e) => setPatientInfo({ ...patientInfo, birthDate: e.target.value })}
                        className="w-full h-11 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm bg-white border-gray-300"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms and Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Please describe your symptoms and any notes for the doctor..."
                    value={patientInfo.symptoms}
                    onChange={(e) => setPatientInfo({ ...patientInfo, symptoms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'credit', label: 'Credit Card' },
                    { key: 'transfer', label: 'Bank Transfer' },
                    { key: 'onarrival', label: 'Before Session' },
                  ].map((opt) => (
                    <label key={opt.key} className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer ${paymentMethod === opt.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value={opt.key}
                        checked={paymentMethod === opt.key}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !selectedDoctor}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Summary */}
          <aside className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Summary</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><span className="text-gray-500">Doctor:</span> {selectedDoctorObj?.name || '—'}</li>
                <li><span className="text-gray-500">Date:</span> {selectedDate}</li>
                <li><span className="text-gray-500">Time:</span> {selectedTime}</li>
                <li><span className="text-gray-500">Type:</span> Online Telehealth</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-lg p-4 text-sm flex justify-center items-center">
              The session link will be sent to your email before the appointment time. Please ensure your contact details are correct.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}