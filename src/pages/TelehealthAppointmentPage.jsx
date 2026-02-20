import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PhoneNumberInput from '../components/forms/PhoneNumberInput';
import { listCountriesAll } from '../utils/geo';
import {
  Calendar, Loader2, CheckCircle2, ChevronLeft, ChevronRight,
  User, Clock, Video, Shield, Star, FileText, CreditCard,
  Building2, ArrowRight, ArrowLeft, Stethoscope, BadgeCheck,
  Mail, Phone, CalendarDays, Sparkles, Info, Heart
} from 'lucide-react';
import { doctorAPI, appointmentAPI, calendarSlotAPI } from '../lib/api';

const STEPS_PATIENT = [
  { key: 'doctor', label: 'Doctor', icon: Stethoscope },
  { key: 'datetime', label: 'Date & Time', icon: CalendarDays },
  { key: 'info', label: 'Your Info', icon: User },
  { key: 'review', label: 'Confirm', icon: CheckCircle2 },
];

const STEPS_DOCTOR = [
  { key: 'datetime', label: 'Date & Time', icon: CalendarDays },
  { key: 'info', label: 'Patient Info', icon: User },
  { key: 'review', label: 'Confirm', icon: CheckCircle2 },
];

export default function TelehealthAppointmentPage() {
  const { formatCurrency, country, user } = useAuth();
  const navigate = useNavigate();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const isDoctor = user?.role_id === 'doctor' || user?.role_id === 'clinicOwner';
  const STEPS = isDoctor ? STEPS_DOCTOR : STEPS_PATIENT;

  const [step, setStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('online');
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

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [allCountries, setAllCountries] = useState([]);
  useEffect(() => {
    listCountriesAll({ excludeIslands: true, excludeNoCities: true }).then(setAllCountries);
  }, []);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Auto-fill only for patients (not doctors — doctors enter patient info manually)
  useEffect(() => {
    if (user && !isDoctor) {
      setPatientInfo(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullname || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.mobile || '',
      }));
    }
  }, [user, isDoctor]);

  // If doctor, auto-select themselves and skip doctor step
  useEffect(() => {
    if (isDoctor && user?.id) {
      setSelectedDoctor(user.id);
    }
  }, [isDoctor, user]);

  useEffect(() => {
    setLoadingDoctors(true);
    doctorAPI.list({ per_page: 50 }).then(res => {
      const list = res?.data || [];
      setDoctors(list.map(d => ({
        id: d.id,
        name: d.fullname,
        avatar: d.avatar || '/images/caroline-lm-uqved8dypum-unsplash_720.jpg',
        specialty: d.specialty || 'General Practitioner',
        is_verified: d.is_verified,
        rating: d.rating || 4.8,
        experience: d.experience || '5+ years',
      })));
    }).catch(() => {}).finally(() => setLoadingDoctors(false));
  }, []);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    calendarSlotAPI.list({ doctor_id: selectedDoctor, date: selectedDate, available: 1 }).then(res => {
      const list = res?.data || [];
      setAvailableSlots(list);
    }).catch(() => setAvailableSlots([])).finally(() => setLoadingSlots(false));
  }, [selectedDoctor, selectedDate]);


  const defaultTimeSlots = useMemo(() => ({
    morning: ['09:00','09:30','10:00','10:30','11:00','11:30'],
    afternoon: ['14:00','14:30','15:00','15:30','16:00','16:30'],
    evening: ['17:00','17:30','18:00'],
  }), []);

  const groupedTimeSlots = useMemo(() => {
    if (availableSlots.length > 0) {
      const slots = availableSlots.map(s => s.start_time?.slice(0, 5) || s.start_time);
      return {
        morning: slots.filter(t => { const h = parseInt(t); return h >= 8 && h < 12; }),
        afternoon: slots.filter(t => { const h = parseInt(t); return h >= 12 && h < 17; }),
        evening: slots.filter(t => { const h = parseInt(t); return h >= 17; }),
      };
    }
    return defaultTimeSlots;
  }, [availableSlots, defaultTimeSlots]);

  const allTimeSlots = [...(groupedTimeSlots.morning || []), ...(groupedTimeSlots.afternoon || []), ...(groupedTimeSlots.evening || [])];

  // Calendar helpers
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calendarMonth]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }, []);

  const dateStr = useCallback((day) => {
    return `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [calendarMonth]);

  const isPastDate = useCallback((day) => {
    if (!day) return true;
    return dateStr(day) < todayStr;
  }, [dateStr, todayStr]);

  const handleSubmit = async () => {
    if (!user) { setError('Randevu oluşturmak için lütfen giriş yapın.'); return; }
    if (!selectedDoctor) { setError('Lütfen bir doktor seçin.'); return; }
    if (!selectedTime) { setError('Lütfen bir saat dilimi seçin.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const slot = availableSlots.find(s => (s.start_time?.slice(0, 5) || s.start_time) === selectedTime);

      const payload = {
        doctor_id: isDoctor ? user.id : selectedDoctor,
        appointment_type: appointmentType,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        slot_id: slot?.id || undefined,
        confirmation_note: patientInfo.symptoms || undefined,
      };

      if (isDoctor) {
        payload.patient_name = patientInfo.fullName;
        payload.patient_email = patientInfo.email;
        payload.patient_phone = patientInfo.phone || undefined;
        // Convert dd.mm.yyyy to yyyy-mm-dd for backend
        if (patientInfo.birthDate && patientInfo.birthDate.includes('.')) {
          const [dd, mm, yyyy] = patientInfo.birthDate.split('.');
          if (dd && mm && yyyy && yyyy.length === 4) {
            payload.patient_dob = `${yyyy}-${mm}-${dd}`;
          }
        }
      } else {
        payload.patient_id = user.id;
      }

      await appointmentAPI.create(payload);
      setSuccess(true);
    } catch (err) {
      // Slot conflict: backend returns 422 with slot_id error "This time slot is no longer available."
      const slotErr = err?.errors?.slot_id?.[0] || '';
      const isSlotConflict = err?.status === 422 && (slotErr.includes('no longer available') || slotErr.includes('slot'));
      if (isSlotConflict) {
        setError('Bu saat dilimi az önce doldu. Lütfen başka bir saat seçin. / This time slot was just taken. Please choose another.');
        // Go back to datetime step so user can pick a new slot
        const dtIdx = STEPS.findIndex(s => s.key === 'datetime');
        if (dtIdx >= 0) { setStep(dtIdx); setSelectedTime(''); }
      } else if (err?.status === 403) {
        setError('Bu randevuyu oluşturma yetkiniz bulunmuyor.');
      } else {
        const msg = err?.errors?.appointment_date?.[0] || err?.errors?.doctor_id?.[0] || err?.message || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctor);
  const currentStepKey = STEPS[step]?.key;

  const canProceed = () => {
    switch (currentStepKey) {
      case 'doctor': return !!selectedDoctor;
      case 'datetime': return !!selectedDate && !!selectedTime;
      case 'info': return !!patientInfo.fullName && !!patientInfo.email;
      case 'review': return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (step < STEPS.length - 1 && canProceed()) {
      setStep(step + 1);
      setError('');
    } else if (step === STEPS.length - 1) {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 0) { setStep(step - 1); setError(''); }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // ─── Success Screen ───
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-teal-50/30 px-4">
        <div className="bg-white rounded-3xl shadow-2xl shadow-teal-100/50 border border-gray-100 p-8 sm:p-10 max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/50">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-6">{isDoctor ? `Appointment for ${patientInfo.fullName || 'the patient'} has been successfully created.` : 'Your telehealth appointment has been successfully booked.'}</p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-3">
            {isDoctor && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Patient</p>
                  <p className="text-sm font-semibold text-gray-900">{patientInfo.fullName || '—'}</p>
                  {patientInfo.email && <p className="text-[11px] text-gray-400">{patientInfo.email}</p>}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Doctor</p>
                <p className="text-sm font-semibold text-gray-900">{isDoctor ? (user?.fullname || user?.name || '—') : (selectedDoctorObj?.name || '—')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Date & Time</p>
                <p className="text-sm font-semibold text-gray-900">{formatDateDisplay(selectedDate)} at {selectedTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Type</p>
                <p className="text-sm font-semibold text-gray-900">{appointmentType === 'online' ? 'Online Telehealth' : 'In-Person Visit'}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
            <p className="text-xs text-blue-700 flex items-center gap-1.5 justify-center">
              <Info className="w-3.5 h-3.5" />
              {isDoctor ? `A confirmation email has been sent to ${patientInfo.email || 'the patient'}.` : 'A session link will be sent to your email before the appointment.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate(isDoctor ? '/crm/appointments' : '/telehealth')} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">
              {isDoctor ? 'View Appointments' : 'My Appointments'}
            </button>
            <button onClick={() => navigate(isDoctor ? '/crm' : '/home-v2')} className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md shadow-teal-200/50">
              {isDoctor ? 'Back to Dashboard' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Layout ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{isDoctor ? 'Create Appointment' : 'Book Appointment'}</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium">{isDoctor ? 'Schedule an appointment for your patient' : 'Schedule your telehealth consultation'}</p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const isActive = i === step;
              const isDone = i < step;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.key}>
                  <button
                    onClick={() => { if (isDone) setStep(i); }}
                    className={`flex items-center gap-2 sm:gap-2.5 transition-all duration-200 ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200/50 scale-110' :
                      isDone ? 'bg-emerald-100 text-emerald-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-teal-600' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                        Step {i + 1}
                      </p>
                      <p className={`text-xs font-bold ${isActive ? 'text-gray-900' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                        {s.label}
                      </p>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 sm:mx-4 rounded-full transition-colors duration-300 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Step: Doctor Selection (patients only) */}
            {currentStepKey === 'doctor' && (
              <div className="space-y-4">
                {/* Appointment Type Toggle */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4 text-teal-600" />
                    Appointment Type
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'online', label: 'Online Telehealth', desc: 'Video consultation from home', icon: Video, color: 'teal' },
                      { key: 'inPerson', label: 'In-Person Visit', desc: 'Visit the clinic directly', icon: Building2, color: 'blue' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setAppointmentType(opt.key)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          appointmentType === opt.key
                            ? opt.color === 'teal'
                              ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-100/50'
                              : 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100/50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        {appointmentType === opt.key && (
                          <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center ${opt.color === 'teal' ? 'bg-teal-500' : 'bg-blue-500'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <opt.icon className={`w-6 h-6 mb-2 ${appointmentType === opt.key ? (opt.color === 'teal' ? 'text-teal-600' : 'text-blue-600') : 'text-gray-400'}`} />
                        <p className={`text-sm font-bold ${appointmentType === opt.key ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doctor Cards */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    Select Your Doctor
                  </h3>
                  {loadingDoctors ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-3 text-teal-500" />
                      <p className="text-sm font-medium">Loading available doctors...</p>
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Stethoscope className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">No doctors available at the moment</p>
                      <p className="text-xs text-gray-400 mt-1">Please try again later</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {doctors.map((doctor) => {
                        const isSelected = selectedDoctor === doctor.id;
                        return (
                          <button
                            key={doctor.id}
                            onClick={() => setSelectedDoctor(doctor.id)}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group ${
                              isSelected
                                ? 'border-teal-500 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 shadow-md shadow-teal-100/50'
                                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50/50 hover:shadow-sm'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <img
                                src={doctor.avatar}
                                alt={doctor.name}
                                className={`w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2 transition-colors ${isSelected ? 'border-teal-300' : 'border-gray-200 group-hover:border-teal-200'}`}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{doctor.name}</h4>
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">{doctor.specialty}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  {doctor.is_verified && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                      <BadgeCheck className="w-3 h-3" /> Verified
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                    <Star className="w-3 h-3 fill-amber-400" /> {doctor.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step: Date & Time */}
            {currentStepKey === 'datetime' && (
              <div className="space-y-4">
                {/* Appointment Type Toggle — shown here for doctors (patients see it in doctor step) */}
                {isDoctor && (
                  <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Video className="w-4 h-4 text-teal-600" />
                      Appointment Type
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'online', label: 'Online Telehealth', desc: 'Video consultation', icon: Video, color: 'teal' },
                        { key: 'inPerson', label: 'In-Person Visit', desc: 'Visit the clinic', icon: Building2, color: 'blue' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setAppointmentType(opt.key)}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            appointmentType === opt.key
                              ? opt.color === 'teal'
                                ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-100/50'
                                : 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100/50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                          }`}
                        >
                          {appointmentType === opt.key && (
                            <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center ${opt.color === 'teal' ? 'bg-teal-500' : 'bg-blue-500'}`}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <opt.icon className={`w-6 h-6 mb-2 ${appointmentType === opt.key ? (opt.color === 'teal' ? 'text-teal-600' : 'text-blue-600') : 'text-gray-400'}`} />
                          <p className={`text-sm font-bold ${appointmentType === opt.key ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Select Date
                  </h3>
                  {/* Month Nav */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h4 className="text-sm font-bold text-gray-900">
                      {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                    </h4>
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAYS.map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">{d}</div>
                    ))}
                  </div>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} className="h-10" />;
                      const ds = dateStr(day);
                      const isToday = ds === todayStr;
                      const isSelected = ds === selectedDate;
                      const past = isPastDate(day);
                      return (
                        <button
                          key={day}
                          disabled={past}
                          onClick={() => { setSelectedDate(ds); setSelectedTime(''); }}
                          className={`h-10 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-200/50 scale-105'
                              : isToday
                                ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                                : past
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    Select Time
                  </h3>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-500 mr-2" />
                      <span className="text-sm text-gray-400">Loading available slots...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { label: 'Morning', slots: groupedTimeSlots.morning, icon: '🌅' },
                        { label: 'Afternoon', slots: groupedTimeSlots.afternoon, icon: '☀️' },
                        { label: 'Evening', slots: groupedTimeSlots.evening, icon: '🌙' },
                      ].filter(g => g.slots.length > 0).map(group => (
                        <div key={group.label}>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span>{group.icon}</span> {group.label}
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {group.slots.map(time => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`h-10 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                  selectedTime === time
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-200/50'
                                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {allTimeSlots.length === 0 && (
                        <div className="text-center py-6">
                          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No available slots for this date</p>
                          <p className="text-xs text-gray-400 mt-1">Try selecting a different date</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step: Patient Information */}
            {currentStepKey === 'info' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" />
                    {isDoctor ? 'Patient Information' : 'Personal Information'}
                  </h3>
                  {isDoctor && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        Enter the patient's details for this appointment. The patient will receive a confirmation email at the provided address.
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{isDoctor ? 'Patient Name' : 'Full Name'} *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={isDoctor ? "Patient's full name" : 'Your full name'}
                            value={patientInfo.fullName}
                            onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
                            className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{isDoctor ? 'Patient Email' : 'Email'} *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            placeholder={isDoctor ? "patient@email.com" : 'example@email.com'}
                            value={patientInfo.email}
                            onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                            className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{isDoctor ? 'Patient Phone' : 'Phone'}</label>
                        <PhoneNumberInput
                          value={patientInfo.phone}
                          countryName={country || ''}
                          onChange={(val) => setPatientInfo({ ...patientInfo, phone: val })}
                          allowedCountryNames={allCountries}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{isDoctor ? 'Patient Date of Birth' : 'Date of Birth'}</label>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="dd.mm.yyyy"
                            value={patientInfo.birthDate}
                            onChange={(e) => {
                              let v = e.target.value.replace(/[^0-9.]/g, '');
                              const digits = v.replace(/\./g, '');
                              if (digits.length >= 3 && !v.includes('.')) {
                                v = digits.slice(0, 2) + '.' + digits.slice(2);
                              }
                              if (digits.length >= 5) {
                                v = digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4, 8);
                              }
                              setPatientInfo({ ...patientInfo, birthDate: v });
                            }}
                            maxLength={10}
                            className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Symptoms & Notes
                  </h3>
                  <textarea
                    rows={4}
                    placeholder={isDoctor ? "Describe the patient's symptoms, reason for visit, or clinical notes..." : 'Please describe your symptoms, medical history, or any notes for the doctor...'}
                    value={patientInfo.symptoms}
                    onChange={(e) => setPatientInfo({ ...patientInfo, symptoms: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {isDoctor ? 'Patient data is encrypted and protected under GDPR regulations.' : 'Your information is encrypted and protected under GDPR regulations.'}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'credit', label: 'Credit Card', desc: 'Visa, Mastercard', icon: CreditCard },
                      { key: 'transfer', label: 'Bank Transfer', desc: 'Direct transfer', icon: Building2 },
                      { key: 'onarrival', label: 'Before Session', desc: 'Pay before start', icon: Clock },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setPaymentMethod(opt.key)}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                          paymentMethod === opt.key
                            ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <opt.icon className={`w-5 h-5 mb-1.5 ${paymentMethod === opt.key ? 'text-teal-600' : 'text-gray-400'}`} />
                        <p className={`text-xs font-bold ${paymentMethod === opt.key ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</p>
                        <p className="text-[10px] text-gray-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Review & Confirm */}
            {currentStepKey === 'review' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/50 to-emerald-50/30">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Review Your Appointment
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Please review all details before confirming</p>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Doctor */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      {isDoctor ? (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <Stethoscope className="w-6 h-6 text-teal-600" />
                        </div>
                      ) : (
                        <img
                          src={selectedDoctorObj?.avatar || '/images/caroline-lm-uqved8dypum-unsplash_720.jpg'}
                          alt={selectedDoctorObj?.name}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm"
                        />
                      )}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Doctor</p>
                        <p className="text-sm font-bold text-gray-900">{isDoctor ? (user?.fullname || user?.name || '—') : (selectedDoctorObj?.name || '—')}</p>
                        {!isDoctor && <p className="text-xs text-gray-500">{selectedDoctorObj?.specialty}</p>}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CalendarDays className="w-4 h-4 text-blue-500" />
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatDateDisplay(selectedDate)}</p>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Clock className="w-4 h-4 text-violet-500" />
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Time</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{selectedTime || '—'}</p>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Video className="w-4 h-4 text-teal-500" />
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Type</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{appointmentType === 'online' ? 'Online Telehealth' : 'In-Person Visit'}</p>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CreditCard className="w-4 h-4 text-amber-500" />
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payment</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 capitalize">
                          {paymentMethod === 'credit' ? 'Credit Card' : paymentMethod === 'transfer' ? 'Bank Transfer' : 'Before Session'}
                        </p>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Patient Information</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] text-gray-400">Name</p>
                          <p className="text-sm font-semibold text-gray-900">{patientInfo.fullName || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400">Email</p>
                          <p className="text-sm font-semibold text-gray-900">{patientInfo.email || '—'}</p>
                        </div>
                        {patientInfo.phone && (
                          <div>
                            <p className="text-[11px] text-gray-400">Phone</p>
                            <p className="text-sm font-semibold text-gray-900">{patientInfo.phone}</p>
                          </div>
                        )}
                        {patientInfo.symptoms && (
                          <div className="col-span-2">
                            <p className="text-[11px] text-gray-400">Notes</p>
                            <p className="text-sm text-gray-700 mt-0.5">{patientInfo.symptoms}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consent Notice */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">Data Protection Notice</p>
                    <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                      By confirming this appointment, you consent to the processing of your health data for the purpose of this consultation in accordance with GDPR Art. 9(2)(a). Your data is encrypted and stored securely.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goBack}
                disabled={step === 0}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  step === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-medium flex-1 mx-4 text-center">
                  {error}
                </div>
              )}

              <button
                onClick={goNext}
                disabled={!canProceed() || submitting}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  canProceed() && !submitting
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-200/50 hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {currentStepKey === 'review'
                  ? (submitting ? 'Confirming...' : 'Confirm Appointment')
                  : 'Continue'
                }
                {step < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right Sidebar - Live Summary */}
          <aside className="space-y-4">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Booking Summary
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Doctor */}
                {isDoctor ? (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center border border-teal-200">
                      <Stethoscope className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{user?.fullname || user?.name}</p>
                      <p className="text-[11px] text-teal-600 font-medium">You (Doctor)</p>
                    </div>
                  </div>
                ) : selectedDoctorObj ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedDoctorObj.avatar}
                      alt={selectedDoctorObj.name}
                      className="w-11 h-11 rounded-xl object-cover border border-gray-200"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{selectedDoctorObj.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{selectedDoctorObj.specialty}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-xs text-gray-400">Select a doctor</p>
                  </div>
                )}

                <div className="h-px bg-gray-100" />

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Date
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Time
                    </span>
                    <span className="text-xs font-semibold text-gray-900">{selectedTime || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" /> Type
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      appointmentType === 'online'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {appointmentType === 'online' ? 'Online' : 'In-Person'}
                    </span>
                  </div>
                  {patientInfo.fullName && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Patient
                      </span>
                      <span className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">{patientInfo.fullName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Banner */}
              <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-t border-teal-100">
                <p className="text-[11px] text-teal-700 flex items-center gap-1.5 leading-relaxed">
                  <Heart className="w-3.5 h-3.5 flex-shrink-0 text-teal-500" />
                  {isDoctor ? 'A confirmation will be sent to the patient\'s email.' : 'Session link will be sent to your email before the appointment.'}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4">
              <div className="space-y-2.5">
                {[
                  { icon: Shield, label: 'GDPR Compliant', desc: 'Data protection guaranteed' },
                  { icon: Video, label: 'HD Video Quality', desc: 'Crystal clear consultations' },
                  { icon: BadgeCheck, label: 'Verified Doctors', desc: 'Licensed professionals' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <badge.icon className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">{badge.label}</p>
                      <p className="text-[10px] text-gray-400">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}