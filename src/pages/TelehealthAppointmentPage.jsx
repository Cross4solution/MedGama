import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

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

  const doctors = useMemo(() => ([
    {
      name: 'Dr. Ahmet Yılmaz',
      specialty: 'Kardiyoloji Uzmanı',
      experience: '15 yıl tecrübe',
      rating: 4.8,
      reviews: 342,
      priceUSD: 200,
      image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg',
    },
    {
      name: 'Dr. Elif Demir',
      specialty: 'Dahiliye Uzmanı',
      experience: '12 yıl tecrübe',
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
    // TODO: Backend entegrasyonu
    // console.log('Randevu bilgileri:', payload);
    alert('Randevunuz başarıyla oluşturuldu!');
  };

  const doctorPrice = (name) => {
    const d = doctors.find((x) => x.name === name);
    return d ? formatCurrency(d.priceUSD) : formatCurrency(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Başlık */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Telehealth Randevu Al</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Evinizin konforunda uzman doktorlarımızla online görüşme yapın. Güvenli ve GDPR uyumlu video görüşme teknolojisi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Sütun - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Klinik/Ücret Bilgisi */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-4">
                  <img
                    src={doctors[0].image}
                    alt="Klinik görseli"
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Anadolu Sağlık Merkezi</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <span>📍 İstanbul, Türkiye</span>
                      <span className="ml-4">4.8 ⭐ (342)</span>
                    </div>
                    <div className="mt-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {doctorPrice(selectedDoctor)} Konsültasyon Ücreti
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doktor Seçimi */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Randevu Bilgileri</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doktor Seçimi</label>
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
                            <div className="text-sm text-gray-600 mt-1">Puan: {doctor.rating} ({doctor.reviews} değerlendirme)</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tarih & Saat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Seçimi</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Saat Seçimi</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Hasta Bilgileri */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hasta Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                    <input
                      type="text"
                      placeholder="Adınız ve soyadınız"
                      value={patientInfo.fullName}
                      onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
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
                      onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
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
                      onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
                    <input
                      type="date"
                      value={patientInfo.birthDate}
                      onChange={(e) => setPatientInfo({ ...patientInfo, birthDate: e.target.value })}
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
                    onChange={(e) => setPatientInfo({ ...patientInfo, symptoms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Ödeme Yöntemi */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Yöntemi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'credit', label: 'Kredi Kartı' },
                    { key: 'transfer', label: 'Havale/EFT' },
                    { key: 'onarrival', label: 'Görüşme Öncesi' },
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
                  Randevuyu Oluştur
                </button>
              </div>
            </form>
          </div>

          {/* Sağ Sütun - Özet */}
          <aside className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Özet</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><span className="text-gray-500">Doktor:</span> {selectedDoctor}</li>
                <li><span className="text-gray-500">Tarih:</span> {selectedDate}</li>
                <li><span className="text-gray-500">Saat:</span> {selectedTime}</li>
                <li><span className="text-gray-500">Ücret:</span> {doctorPrice(selectedDoctor)}</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-lg p-4 text-sm flex justify-center items-center">
              Görüşme bağlantısı randevu saatinden önce e-posta adresinize gönderilecektir. Lütfen doğru iletişim bilgisi girdiğinizden emin olun.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}