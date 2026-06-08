import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Video, MapPin, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const APPOINTMENT_TYPES = [
  { id: 'in_person', icon: MapPin, label: 'In-Person Visit', labelTr: 'Yüz Yüze Muayene', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'video', icon: Video, label: 'Telehealth', labelTr: 'Görüntülü Görüşme', color: 'bg-blue-50 text-[#2D8CFF] border-blue-200' },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00',
];

// Check if a time slot is in the past (only for today)
function isPastTimeSlot(time, selectedDate) {
  if (!time || !selectedDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selDate = new Date(selectedDate);
  selDate.setHours(0, 0, 0, 0);
  
  // Only check if selected date is today
  if (selDate.getTime() !== today.getTime()) return false;
  
  const now = new Date();
  const [hh, mm] = time.split(':').map(Number);
  const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
  
  // Slot is past if it's before current time
  return slotTime.getTime() < now.getTime();
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function BookAppointmentModal({ open, onClose, targetId, targetName, targetType = 'doctor', initialType = null }) {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  const [step, setStep] = useState(initialType ? 2 : 1);
  const [appointmentType, setAppointmentType] = useState(initialType);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const daysInMonth = useMemo(() => getDaysInMonth(calYear, calMonth), [calYear, calMonth]);
  const firstDay = useMemo(() => getFirstDayOfMonth(calYear, calMonth), [calYear, calMonth]);

  const dayNames = isTr
    ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const monthNames = isTr
    ? ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const isPast = (day) => {
    const d = new Date(calYear, calMonth, day);
    const t2 = new Date(); t2.setHours(0, 0, 0, 0);
    return d < t2;
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleClose = () => {
    setStep(initialType ? 2 : 1);
    setAppointmentType(initialType || null);
    setSelectedDate(null);
    setSelectedTime(null);
    setNote('');
    setSubmitted(false);
    onClose();
  };

  if (!open) return null;

  // Adjust firstDay for Monday-start
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {initialType === 'video'
                ? (isTr ? 'Görüntülü Görüşme Randevusu' : 'Telehealth Appointment')
                : (isTr ? 'Randevu Al' : 'Book Appointment')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{targetName}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{isTr ? 'Randevu Talebiniz Alındı!' : 'Appointment Requested!'}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {isTr
                ? `${targetName} ile randevu talebiniz başarıyla gönderildi. Onay için bekleyiniz.`
                : `Your appointment request with ${targetName} has been submitted. Please wait for confirmation.`}
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm"><span className="text-gray-500">{isTr ? 'Tarih' : 'Date'}</span><span className="font-medium text-gray-900">{selectedDate?.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{isTr ? 'Saat' : 'Time'}</span><span className="font-medium text-gray-900">{selectedTime}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{isTr ? 'Tür' : 'Type'}</span><span className="font-medium text-gray-900">{APPOINTMENT_TYPES.find(a => a.id === appointmentType)?.[isTr ? 'labelTr' : 'label']}</span></div>
            </div>
            <button onClick={handleClose} className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
              {isTr ? 'Tamam' : 'Done'}
            </button>
          </div>
        ) : (
          <div className="p-5">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {(initialType ? [2, 3] : [1, 2, 3]).map((s, idx, arr) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? 'bg-teal-600 text-white' : step > s ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'
                  }`}>{step > s ? '✓' : idx + 1}</div>
                  {idx < arr.length - 1 && <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-teal-300' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Type */}
            {step === 1 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{isTr ? 'Randevu Türü' : 'Appointment Type'}</h3>
                {APPOINTMENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setAppointmentType(type.id); setStep(2); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      appointmentType === type.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color}`}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm text-gray-900">{isTr ? type.labelTr : type.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">{isTr ? 'Tarih ve Saat Seçin' : 'Select Date & Time'}</h3>
                <div className="flex gap-4">
                  {/* Mini Calendar */}
                  <div className="flex-1 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                      <span className="text-sm font-semibold text-gray-900">{monthNames[calMonth]} {calYear}</span>
                      <button onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {dayNames.map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: adjustedFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const past = isPast(day);
                        const sel = isSelected(day);
                        return (
                          <button
                            key={day}
                            disabled={past}
                            onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                            className={`w-full aspect-square rounded-lg text-xs font-medium transition-all ${
                              sel ? 'bg-teal-600 text-white shadow-sm' :
                              past ? 'text-gray-300 cursor-not-allowed' :
                              'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                            }`}
                          >{day}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots - right side */}
                  <div className="w-44 flex-shrink-0">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">{isTr ? 'Uygun Saatler' : 'Available Times'}</h4>
                    <div className="grid grid-cols-3 gap-1.5">
                      {TIME_SLOTS.map(time => {
                        const isPast = isPastTimeSlot(time, selectedDate);
                        return (
                          <button
                            key={time}
                            onClick={() => !isPast && setSelectedTime(time)}
                            disabled={isPast}
                            className={`py-2 rounded-lg text-xs font-medium transition-all ${
                              isPast
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                : selectedTime === time
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-700 border border-gray-200'
                            }`}
                          >{time}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-1">
                  {!initialType && (
                    <button onClick={() => setStep(1)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                      {isTr ? 'Geri' : 'Back'}
                    </button>
                  )}
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isTr ? 'İleri' : 'Next'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Note & Confirm */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">{isTr ? 'Onay' : 'Confirmation'}</h3>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span className="text-gray-700">{selectedDate?.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span className="text-gray-700">{selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {appointmentType === 'video' ? <Video className="w-4 h-4 text-teal-600 flex-shrink-0" /> : <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                    <span className="text-gray-700">{APPOINTMENT_TYPES.find(a => a.id === appointmentType)?.[isTr ? 'labelTr' : 'label']}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{isTr ? 'Not (isteğe bağlı)' : 'Note (optional)'}</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={isTr ? 'Şikayetinizi veya notunuzu yazın...' : 'Describe your symptoms or add a note...'}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                    {isTr ? 'Geri' : 'Back'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isTr ? 'Randevu Al' : 'Book Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
