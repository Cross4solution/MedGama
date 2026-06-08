import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI } from '../lib/api';
import { 
  Calendar, Clock, MapPin, Video, Phone, Building2, User, 
  Loader2, AlertCircle, CheckCircle2, XCircle, X, ChevronRight 
} from 'lucide-react';

export default function PatientAppointments() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Fetch appointments
  useEffect(() => {
    if (!user) return;
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentAPI.list({ per_page: 100 });
      const list = res?.data || [];
      setAppointments(list);
    } catch (err) {
      setError(isTr ? 'Randevular yüklenemedi.' : 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;
    setCancellingId(selectedAppointment.id);
    try {
      await appointmentAPI.update(selectedAppointment.id, { status: 'cancelled' });
      setAppointments(prev => prev.map(a => 
        a.id === selectedAppointment.id ? { ...a, status: 'cancelled' } : a
      ));
      setShowCancelModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      alert(isTr ? 'Randevu iptal edilemedi.' : 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return a.status === 'pending' || a.status === 'confirmed';
    if (filter === 'completed') return a.status === 'completed';
    if (filter === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: isTr ? 'Onay Bekliyor' : 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      confirmed: { label: isTr ? 'Onaylandı' : 'Confirmed', color: 'bg-teal-100 text-teal-700 border-teal-200' },
      completed: { label: isTr ? 'Tamamlandı' : 'Completed', color: 'bg-green-100 text-green-700 border-green-200' },
      cancelled: { label: isTr ? 'İptal Edildi' : 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.color}`}>
        {status === 'confirmed' && <CheckCircle2 className="w-3 h-3" />}
        {status === 'cancelled' && <XCircle className="w-3 h-3" />}
        {status === 'pending' && <Clock className="w-3 h-3" />}
        {badge.label}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    if (type === 'online' || type === 'video') return <Video className="w-4 h-4 text-teal-600" />;
    if (type === 'phone') return <Phone className="w-4 h-4 text-violet-600" />;
    return <MapPin className="w-4 h-4 text-blue-600" />;
  };

  const getTypeLabel = (type) => {
    if (type === 'online' || type === 'video') return isTr ? 'Online Görüşme' : 'Video Call';
    if (type === 'phone') return isTr ? 'Telefon Görüşmesi' : 'Phone Call';
    return isTr ? 'Yüz Yüze' : 'In-Person';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{isTr ? 'Lütfen giriş yapın.' : 'Please log in.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isTr ? 'Randevularım' : 'My Appointments'}
          </h1>
          <p className="text-sm text-gray-500">
            {isTr ? 'Tüm randevularınızı görüntüleyin ve yönetin' : 'View and manage all your appointments'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: isTr ? 'Tümü' : 'All' },
            { key: 'upcoming', label: isTr ? 'Yaklaşan' : 'Upcoming' },
            { key: 'completed', label: isTr ? 'Tamamlanan' : 'Completed' },
            { key: 'cancelled', label: isTr ? 'İptal Edilen' : 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">{isTr ? 'Hata' : 'Error'}</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isTr ? 'Randevu Bulunamadı' : 'No Appointments Found'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {isTr ? 'Henüz randevunuz bulunmuyor.' : 'You don\'t have any appointments yet.'}
                </p>
                <button
                  onClick={() => navigate('/telehealth-appointment')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  {isTr ? 'Randevu Al' : 'Book Appointment'}
                </button>
              </div>
            ) : (
              filteredAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Appointment Info */}
                    <div className="flex-1 space-y-3">
                      {/* Doctor/Clinic Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">
                            {appointment.doctor?.fullname || appointment.doctor_name || (isTr ? 'Doktor' : 'Doctor')}
                          </h3>
                          {appointment.clinic?.fullname && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" />
                              {appointment.clinic.fullname}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date, Time, Type */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{appointment.appointment_time?.slice(0, 5) || '--:--'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          {getTypeIcon(appointment.appointment_type)}
                          <span className="font-medium">{getTypeLabel(appointment.appointment_type)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2">
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          disabled={cancellingId === appointment.id}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {cancellingId === appointment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {isTr ? 'İptal Et' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Book Appointment Button (Fixed Bottom on Mobile) */}
        <div className="fixed bottom-6 right-6 sm:hidden z-40">
          <button
            onClick={() => navigate('/telehealth-appointment')}
            className="w-14 h-14 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            <Calendar className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {isTr ? 'Randevuyu İptal Et' : 'Cancel Appointment'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {isTr 
                  ? 'Bu randevuyu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
                  : 'Are you sure you want to cancel this appointment? This action cannot be undone.'}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isTr ? 'Doktor' : 'Doctor'}</span>
                  <span className="font-medium text-gray-900">
                    {selectedAppointment.doctor?.fullname || selectedAppointment.doctor_name || '--'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isTr ? 'Tarih' : 'Date'}</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedAppointment.appointment_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isTr ? 'Saat' : 'Time'}</span>
                  <span className="font-medium text-gray-900">{selectedAppointment.appointment_time?.slice(0, 5)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  {isTr ? 'Vazgeç' : 'Keep'}
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancellingId === selectedAppointment.id}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancellingId === selectedAppointment.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isTr ? 'İptal Ediliyor...' : 'Cancelling...'}
                    </>
                  ) : (
                    <>{isTr ? 'İptal Et' : 'Cancel Appointment'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
