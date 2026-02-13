import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PhoneNumberInput from '../components/forms/PhoneNumberInput';
import { listCountriesAll } from '../utils/geo';
import { Calendar } from 'lucide-react';

export default function TelehealthAppointmentPage() {
  const { formatCurrency, country } = useAuth();

  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Ahmet Yılmaz');
  const [selectedDate, setSelectedDate] = useState('2025-01-21'); // ISO (yyyy-mm-dd)
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [patientInfo, setPatientInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
    symptoms: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit');

  // Countries for PhoneNumberInput (loaded async)
  const [allCountries, setAllCountries] = useState([]);
  useEffect(() => {
    listCountriesAll({ excludeIslands: true, excludeNoCities: true }).then(setAllCountries);
  }, []);

  // Refs for date pickers (appointment date and DOB)
  const apptDateRef = useRef(null);
  const dobRef = useRef(null);

  const doctors = useMemo(() => ([
    {
      name: 'Dr. Ahmet Yılmaz',
      specialty: 'Cardiologist',
      experience: '15 years experience',
      rating: 4.8,
      reviews: 342,
      priceUSD: 200,
      image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg',
    },
    {
      name: 'Dr. Elif Demir',
      specialty: 'Internal Medicine Specialist',
      experience: '12 years experience',
      rating: 4.7,
      reviews: 289,
      priceUSD: 180,
      image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg',
    }
  ]), []);

  const timeSlots = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '14:00','14:30','15:00','15:30','16:00','16:30'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      doctor: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
      patient: patientInfo,
      payment: paymentMethod,
      country,
    };
    // TODO: Backend integration
    // console.log('Appointment payload:', payload);
    alert('Your appointment has been created successfully!');
  };

  const doctorPrice = (name) => {
    const d = doctors.find((x) => x.name === name);
    return d ? formatCurrency(d.priceUSD) : formatCurrency(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title removed as requested */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Clinic / Fee */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-4">
                  <img
                    src={doctors[0].image}
                    alt="Clinic image"
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Anadolu Sağlık Merkezi</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <span> Istanbul, Turkey</span>
                      <span className="ml-4">4.8 (342 reviews)</span>
                    </div>
                    <div className="mt-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {doctorPrice(selectedDoctor)} Consultation Fee
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
                  <div className="space-y-3">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.name}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${selectedDoctor === doctor.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setSelectedDoctor(doctor.name)}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="doctor"
                            value={doctor.name}
                            checked={selectedDoctor === doctor.name}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 truncate">{doctor.name}</h4>
                              <span className="text-blue-600 font-semibold">{formatCurrency(doctor.priceUSD)}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{doctor.specialty} • {doctor.experience}</p>
                            <div className="text-sm text-gray-600 mt-1">Rating: {doctor.rating} ({doctor.reviews} reviews)</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

              {/* Submit */}
              <div className="flex justify-end">
                <button type="submit" className="px-5 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">
                  Create Appointment
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Summary */}
          <aside className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Summary</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><span className="text-gray-500">Doctor:</span> {selectedDoctor}</li>
                <li><span className="text-gray-500">Date:</span> {selectedDate}</li>
                <li><span className="text-gray-500">Time:</span> {selectedTime}</li>
                <li><span className="text-gray-500">Fee:</span> {doctorPrice(selectedDoctor)}</li>
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