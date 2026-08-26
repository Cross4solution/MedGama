import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from '@/compat/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { appointmentAPI } from '../lib/api';
import useAppointmentSync from '../hooks/useAppointmentSync';
import AddToCalendar from '../components/AddToCalendar';
import { formatLocalDate, appointmentTimeDisplay } from '../utils/dates';
import useModalDavranisi from '../hooks/useModalDavranisi';

/**
 * Randevu saati, hastanın KENDİ saat diliminde. Klinik başka bir saat
 * dilimindeyse kliniğin yerel saati de yazılır — tek bir "14:00" yurt
 * dışındaki hasta için hangi ülkenin saati olduğunu belirsiz bırakıyordu.
 */
const AppointmentTime = ({ appointment }) => {
  // Saat biçimi kullanıcının DİLİNE göre; eskiden "Türkçe mi" sorusuna göre
  // seçiliyordu ve dokuz dilin yedisi Amerikan biçimine düşüyordu.
  const { t, i18n } = useTranslation();
  const g = appointmentTimeDisplay(appointment, i18n.language || 'tr-TR');
  return (
    <div className="flex items-center gap-2 text-gray-700">
      <Clock className="w-4 h-4 text-gray-400" />
      <span className="font-medium">{g.time || '--:--'}</span>
      {g.showProvider && (
        <span className="text-xs text-gray-500">
          ({t('hastaRandevu.clinic', 'clinic')} {g.providerTime})
        </span>
      )}
    </div>
  );
};
import { 
  Calendar, Clock, MapPin, Video, Phone, Building2, User, 
  Loader2, AlertCircle, CheckCircle2, XCircle, X, ChevronRight 
} from 'lucide-react';

export default function PatientAppointments() {
  const { t, i18n } = useTranslation();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Escape, odak tuzağı, odağın açan öğeye dönmesi, gövde kaydırma kilidi.
  const iptalOnayiyiKapat = useCallback(() => setShowCancelModal(false), []);
  const iptalOnayiKokRef = useModalDavranisi(showCancelModal && !!selectedAppointment, iptalOnayiyiKapat);
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
      setError(t('hastaRandevu.failedToLoadAppointments', 'Failed to load appointments.'));
    } finally {
      setLoading(false);
    }
  };

  // Real-time: refresh when any of this patient's appointments change anywhere.
  useAppointmentSync(fetchAppointments);

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;
    setCancellingId(selectedAppointment.id);
    try {
      await appointmentAPI.cancel(selectedAppointment.id);
      setAppointments(prev => prev.map(a => 
        a.id === selectedAppointment.id ? { ...a, status: 'cancelled' } : a
      ));
      setShowCancelModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      notify({ type: 'error', message: t('hastaRandevu.failedToCancelAppointment', 'Failed to cancel appointment.') });
    } finally {
      setCancellingId(null);
    }
  };

  // Saati geçmiş randevu, durumu değişmediği sürece "yaklaşan"da kalıyordu.
  // 2 saatlik pay: uzayan görüşme erkenden listeden düşmesin.
  const GECMIS_PAYI_DK = 120;
  const dakikaKala = (a) => {
    const abs = a.starts_at ? new Date(a.starts_at) : new Date(`${a.appointment_date}T${(a.appointment_time || '00:00').slice(0, 5)}`);
    return isNaN(abs.getTime()) ? null : Math.round((abs.getTime() - Date.now()) / 60000);
  };
  const gecmisMi = (a) => {
    const k = dakikaKala(a);
    return k !== null && k <= -GECMIS_PAYI_DK;
  };

  // Katılma: onaylı + görüntülü + saati gelmiş.
  const KATILIM_PENCERESI_DK = 15;
  const canJoin = (a) => {
    if (a.status !== 'confirmed' || !isOnline(a.appointment_type)) return false;
    const k = dakikaKala(a);
    return k !== null && k <= KATILIM_PENCERESI_DK && k > -GECMIS_PAYI_DK;
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return (a.status === 'pending' || a.status === 'confirmed') && !gecmisMi(a);
    if (filter === 'completed') return a.status === 'completed'
      || ((a.status === 'pending' || a.status === 'confirmed') && gecmisMi(a));
    if (filter === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: t('hastaRandevu.pending', 'Pending'), color: 'bg-amber-100 text-amber-700 border-amber-200' },
      confirmed: { label: t('hastaRandevu.confirmed', 'Confirmed'), color: 'bg-teal-100 text-teal-700 border-teal-200' },
      completed: { label: t('hastaRandevu.completed', 'Completed'), color: 'bg-green-100 text-green-700 border-green-200' },
      cancelled: { label: t('hastaRandevu.cancelled', 'Cancelled'), color: 'bg-gray-100 text-gray-600 border-gray-200' },
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

  // Görüntülü randevu mu? (backend 'online', bazı kayıtlarda 'video' geçiyor)
  const isOnline = (type) => type === 'online' || type === 'video';

  const getTypeIcon = (type) => {
    if (type === 'online' || type === 'video') return <Video className="w-4 h-4 text-teal-600" />;
    if (type === 'phone') return <Phone className="w-4 h-4 text-violet-600" />;
    return <MapPin className="w-4 h-4 text-blue-600" />;
  };

  const getTypeLabel = (type) => {
    if (type === 'online' || type === 'video') return t('hastaRandevu.videoCall', 'Video Call');
    if (type === 'phone') return t('hastaRandevu.phoneCall', 'Phone Call');
    return t('hastaRandevu.inPerson', 'In-Person');
  };

  // Takvim günü — saat dilimi kaydırmasın diye yerel olarak çözümlenir
  const formatDate = (dateStr) => formatLocalDate(dateStr, (i18n.language || 'tr-TR'));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('hastaRandevu.pleaseLogIn', 'Please log in.')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('hastaRandevu.myAppointments', 'My Appointments')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('hastaRandevu.viewAndManageAllYour', 'View and manage all your appointments')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: t('hastaRandevu.all', 'All') },
            { key: 'upcoming', label: t('hastaRandevu.upcoming', 'Upcoming') },
            { key: 'completed', label: t('hastaRandevu.completed2', 'Completed') },
            { key: 'cancelled', label: t('hastaRandevu.cancelled2', 'Cancelled') },
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
              <p className="text-sm font-semibold text-red-900">{t('hastaRandevu.error', 'Error')}</p>
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
                  {t('hastaRandevu.noAppointmentsFound', 'No Appointments Found')}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {t('hastaRandevu.noAppointmentsYet', "You don't have any appointments yet.")}
                </p>
                <button
                  onClick={() => navigate('/telehealth-appointment')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  {t('hastaRandevu.bookAppointment', 'Book Appointment')}
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
                            {appointment.doctor?.fullname || appointment.doctor_name || (t('hastaRandevu.doctor', 'Doctor'))}
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
                        <AppointmentTime appointment={appointment} />
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
                      {/* Görüntülü randevularda hastanın da görüşmeye girebilmesi gerekiyor —
                          doktor tarafında "Katıl" vardı, hastada hiç yoktu. */}
                      {/* Sadece onaylı, görüntülü ve saati gelmiş randevuda katılınır:
                          doktorun kabul etmediği randevuda oda zaten açılmaz, günler
                          öncesinden düğme göstermek de yanlış beklenti yaratır. */}
                      {canJoin(appointment) && (
                        <button
                          onClick={() => navigate(`/telehealth/call/${appointment.id}`)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          {t('hastaRandevu.joinCall', 'Join Call')}
                        </button>
                      )}
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
                          {t('hastaRandevu.cancel', 'Cancel')}
                        </button>
                      )}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <AddToCalendar
                          appointment={{
                            id: appointment.id,
                            title: `${appointment.doctor?.fullname || appointment.doctor_name || (t('hastaRandevu.doctor', 'Doctor'))} — Medagama`,
                            date: appointment.appointment_date,
                            time: appointment.appointment_time,
                            // Mutlak an: takvime her ülkede aynı ana düşsün.
                            startsAt: appointment.starts_at,
                            durationMin: 30,
                            description: getTypeLabel(appointment.appointment_type),
                            location: appointment.appointment_type === 'online'
                              ? (t('hastaRandevu.onlineConsultation', 'Online consultation'))
                              : (appointment.clinic?.address || appointment.clinic?.fullname || ''),
                          }}
                        />
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
          <div
            ref={iptalOnayiKokRef}
            role="dialog"
            aria-modal="true"
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6"
          >
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
                {t('hastaRandevu.cancelAppointment', 'Cancel Appointment')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('hastaRandevu.areYouSureYouWant', 'Are you sure you want to cancel this appointment? This action cannot be undone.')}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('hastaRandevu.doctor', 'Doctor')}</span>
                  <span className="font-medium text-gray-900">
                    {selectedAppointment.doctor?.fullname || selectedAppointment.doctor_name || '--'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('hastaRandevu.date', 'Date')}</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedAppointment.appointment_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('hastaRandevu.time', 'Time')}</span>
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const g = appointmentTimeDisplay(selectedAppointment, (i18n.language || 'tr-TR'));
                      return g.showProvider
                        ? `${g.time} (${t('hastaRandevu.clinic', 'clinic')} ${g.providerTime})`
                        : g.time;
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  {t('hastaRandevu.keep', 'Keep')}
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancellingId === selectedAppointment.id}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancellingId === selectedAppointment.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('hastaRandevu.cancelling', 'Cancelling...')}
                    </>
                  ) : (
                    <>{t('hastaRandevu.cancelAppointment2', 'Cancel Appointment')}</>
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
