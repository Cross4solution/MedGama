import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DoctorAppointmentCalendar({ onChange }) {
  const [selectedDate, setSelectedDate] = useState(''); // ISO yyyy-mm-dd (committed selection)
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Modal state
  const [open, setOpen] = useState(false);

  // Working selection inside modal
  const [month, setMonth] = useState(() => new Date());
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('09:00');

  const timeSlots = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '14:00','14:30','15:00','15:30','16:00','16:30',
  ];

  const bookedSlotsByDate = {
    '2025-12-05': ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    '2025-12-12': ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'],
    '2025-12-20': [...timeSlots],
  };

  const formatIso = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const selected = draftDate ? new Date(draftDate) : null;
  const selectedIso = draftDate || selectedDate || '';
  const selectedBooked = selectedIso ? (bookedSlotsByDate[selectedIso] || []) : [];
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startWeekday = (startOfMonth.getDay() + 6) % 7; // Mon=0
  const days = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

  const handleSelectDay = (day) => {
    const iso = formatIso(month.getFullYear(), month.getMonth(), day);
    const booked = bookedSlotsByDate[iso] || [];
    if (Array.isArray(booked) && booked.length >= timeSlots.length) return;
    setDraftDate(iso);
    const firstAvailable = timeSlots.find((t) => !(bookedSlotsByDate[iso] || []).includes(t));
    if (firstAvailable) setDraftTime(firstAvailable);
  };

  const handleTimeChange = (e) => {
    const value = e.target.value;
    setDraftTime(value);
  };

  const applySelection = () => {
    const dateToUse = draftDate || selectedDate;
    const timeToUse = draftTime || selectedTime;
    if (!dateToUse) {
      setOpen(false);
      return;
    }
    setSelectedDate(dateToUse);
    setSelectedTime(timeToUse);
    if (onChange) onChange({ date: dateToUse, time: timeToUse });
    setOpen(false);
  };

  const formattedSummary = () => {
    if (!selectedDate) return 'No date selected yet';
    try {
      const d = new Date(selectedDate);
      const day = String(d.getDate()).padStart(2, '0');
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${monthName} ${year} · ${selectedTime}`;
    } catch {
      return `${selectedDate} · ${selectedTime}`;
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 mt-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-2">Schedule a consultation</h3>
        <p className="text-xs text-gray-500 mb-3">
          Choose a date and time to request an appointment with this doctor.
        </p>

        <div className="text-xs text-gray-700 mb-3 flex items-center justify-between gap-2">
          <span className="text-gray-500">Selected slot:</span>
          <span className="font-medium text-gray-900 truncate">
            {formattedSummary()}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            // initialize draft values when opening
            setDraftDate(selectedDate || draftDate || '');
            setDraftTime(selectedTime || draftTime || '09:00');
            setOpen(true);
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C6A83] text-white text-sm font-medium py-2.5 hover:bg-[#0F4A5C] transition-colors shadow-sm hover:shadow-md"
        >
          <Calendar className="w-4 h-4 text-white" />
          <span>Open calendar</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Choose date &amp; time</h4>
            <p className="text-xs text-gray-500 mb-3">Select a suitable day from the calendar and then choose a time slot.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Date</label>
                <div className="border border-gray-200 rounded-xl p-3 text-xs bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-800">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {month.toLocaleString('default', { month: 'long' })} {month.getFullYear()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] text-gray-500">
                    {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d) => (
                      <div key={d} className="text-center">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[11px]">
                    {Array.from({ length: startWeekday }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {days.map((day) => {
                      const iso = formatIso(month.getFullYear(), month.getMonth(), day);
                      const booked = bookedSlotsByDate[iso] || [];
                      const fullyBooked = Array.isArray(booked) && booked.length >= timeSlots.length;
                      const hasAnyBooked = Array.isArray(booked) && booked.length > 0;
                      const isSelected =
                        selected &&
                        selected.getFullYear() === month.getFullYear() &&
                        selected.getMonth() === month.getMonth() &&
                        selected.getDate() === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          disabled={fullyBooked}
                          className={`h-7 rounded-full flex items-center justify-center transition-colors border ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm border-blue-600 ring-2 ring-blue-200'
                              : fullyBooked
                                ? 'bg-rose-100 text-rose-800 border-rose-200 cursor-not-allowed opacity-70 line-through'
                                : hasAnyBooked
                                  ? 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200'
                                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Time</label>
                <div className="border border-gray-200 rounded-xl p-3 text-xs bg-gray-50">
                  <div className="text-[11px] text-gray-500 mb-2">Available slots</div>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((t) => {
                      const active = draftTime === t;
                      const isBooked = selectedIso ? selectedBooked.includes(t) : false;
                      const isDisabled = isBooked || !selectedIso;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleTimeChange({ target: { value: t } })}
                          className={`h-8 rounded-full px-2 text-xs flex items-center justify-center border transition-colors ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                              : isBooked
                                ? 'bg-rose-100 text-rose-800 border-rose-200 cursor-not-allowed opacity-80 line-through'
                                : isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'bg-white text-gray-900 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#1C6A83] text-white hover:bg-[#0F4A5C]"
                onClick={applySelection}
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

