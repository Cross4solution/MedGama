import React, { useState } from 'react';
import Header from '../components/Header';

const TelehealthAppointmentPage = () => {
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Ahmet Yılmaz');
  const [selectedDate, setSelectedDate] = useState('01/21/2025');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [patientInfo, setPatientInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
    symptoms: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit');

  const doctors = [
    {
      name: 'Dr. Ahmet Yılmaz',
      specialty: 'Kardiyoloji Uzmanı',
      experience: '15 yıl tecrübe',
      rating: 4.8,
      reviews: 342,
      price: 200
    },
    {
      name: 'Dr. Elif Demir',
      specialty: 'Dahiliye Uzmanı',
      experience: '12 yıl tecrübe',
      rating: 4.7,
      reviews: 289,
      price: 180
    }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Randevu bilgileri:', {
      doctor: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
      patient: patientInfo,
      payment: paymentMethod
    });
    alert('Randevunuz başarıyla oluşturuldu!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">Ana Sayfa</a>
            <span className="mx-2">›</span>
            <a href="#" className="hover:text-gray-700">Anadolu Sağlık Merkezi</a>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Telehealth Randevu</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Telehealth Randevu Al</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Evinizin konforunda uzman doktorlarımızla online görüşme yapın. Güvenli ve 
            GDPR uyumlu video görüşme teknolojisi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hospital Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <img 
                    src="https://placehold.co/60x60" 
                    alt="Anadolu Sağlık Merkezi" 
                    className="w-15 h-15 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Anadolu Sağlık Merkezi</h3>
                    <div className="flex items-center">
                      <span className="text-gray-600">📍 İstanbul, Türkiye</span>
                      <span className="ml-4 text-gray-600">⭐ 4.8 (342)</span>
                    </div>
                    <div className="mt-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        ₺200 Konsültasyon Ücreti
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Selection */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Randevu Bilgileri</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doktor Seçimi</label>
                  <div className="space-y-3">
                    {doctors.map((doctor) => (
                      <div 
                        key={doctor.name}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedDoctor === doctor.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDoctor(doctor.name)}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="doctor"
                            value={doctor.name}
                            checked={selectedDoctor === doctor.name}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <img 
                            src="https://placehold.co/50x50" 
                            alt={doctor.name} 
                            className="w-12 h-12 rounded-full mx-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                              <span className="text-blue-600 font-semibold">₺{doctor.price}</span>
                            </div>
                            <p className="text-sm text-gray-600">{doctor.specialty} • {doctor.experience}</p>
                            <div className="flex items-center mt-1">
                              <div className="flex text-yellow-400 text-sm">
                                {'★'.repeat(Math.floor(doctor.rating))}
                              </div>
                              <span className="text-sm text-gray-600 ml-1">
                                ({doctor.rating}) {doctor.reviews} değerlendirme
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date and Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Seçimi</label>
                    <div className="relative group">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={selectedDate.split('/').reverse().join('-')}
                        onChange={(e) => setSelectedDate(e.target.value.split('-').reverse().join('/'))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-sm font-medium bg-white hover:bg-gray-50 hover:border-gray-400"
                      />
                      {/* Subtle shadow on focus */}
                      <div className="absolute inset-0 rounded-xl shadow-sm group-hover:shadow-md group-focus-within:shadow-lg transition-shadow duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Saat Seçimi</label>
                    <div className="relative group">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-sm font-medium appearance-none cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400"
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time} className="py-2">{time}</option>
                        ))}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg 
                          className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {/* Subtle shadow on focus */}
                      <div className="absolute inset-0 rounded-xl shadow-sm group-hover:shadow-md group-focus-within:shadow-lg transition-shadow duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hasta Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                    <input
                      type="text"
                      placeholder="Adınız ve soyadınız"
                      value={patientInfo.fullName}
                      onChange={(e) => setPatientInfo({...patientInfo, fullName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      placeholder="+90 555 123 4567"
                      value={patientInfo.phone}
                      onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      placeholder="ornek@email.com"
                      value={patientInfo.email}
                      onChange={(e) => setPatientInfo({...patientInfo, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
                    <input
                      type="date"
                      value={patientInfo.birthDate}
                      onChange={(e) => setPatientInfo({...patientInfo, birthDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şikayetleriniz ve Notlarınız</label>
                  <textarea
                    rows={4}
                    placeholder="Lütfen şikayetlerinizi ve doktora iletmek istediğiniz notları yazınız..."
                    value={patientInfo.symptoms}
                    onChange={(e) => setPatientInfo({...patientInfo, symptoms: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Medical Document Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tıbbi Belgeler (isteğe bağlı)</label>
                  <input type="file" className="w-full" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Yöntemi</h3>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="credit"
                      checked={paymentMethod === 'credit'}
                      onChange={() => setPaymentMethod('credit')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2">Kredi Kartı</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === 'transfer'}
                      onChange={() => setPaymentMethod('transfer')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2">Banka Transferi</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-1.5 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
                Randevu Al
              </button>
            </form>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Telehealth Nedir?</h3>
              <p className="text-gray-600 text-sm">
                Telehealth, uzaktan sağlık hizmeti sunan modern bir teknolojidir. Online doktor görüşmeleri ile zamandan ve mekandan bağımsız olarak sağlık hizmeti alabilirsiniz.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gizlilik ve Güvenlik</h3>
              <p className="text-gray-600 text-sm">
                Tüm görüşmeleriniz GDPR ve KVKK uyumlu, güvenli altyapı ile gerçekleştirilir. Kişisel verileriniz koruma altındadır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelehealthAppointmentPage; 