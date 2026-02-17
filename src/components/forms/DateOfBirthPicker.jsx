import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAYS_IN_MONTH = (year, month) => new Date(year, month + 1, 0).getDate();

/**
 * DateOfBirthPicker — keyboard-typeable (DD/MM/YYYY) + dropdown calendar with quick year/month selection.
 * @param {{ value: string, onChange: (iso: string) => void, className?: string, placeholder?: string }} props
 * value format: YYYY-MM-DD (ISO), onChange receives YYYY-MM-DD
 */
export default function DateOfBirthPicker({ value = '', onChange, className = '', placeholder = 'DD / MM / YYYY' }) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Parse ISO value to display
  const parseISO = (iso) => {
    if (!iso) return { day: '', month: '', year: '' };
    const [y, m, d] = iso.split('-');
    return { day: d || '', month: m || '', year: y || '' };
  };

  const { day: initD, month: initM, year: initY } = parseISO(value);
  const [dayStr, setDayStr] = useState(initD);
  const [monthStr, setMonthStr] = useState(initM);
  const [yearStr, setYearStr] = useState(initY);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('days'); // 'days' | 'months' | 'years'

  // Calendar navigation state
  const now = new Date();
  const [calYear, setCalYear] = useState(initY ? parseInt(initY) : now.getFullYear() - 25);
  const [calMonth, setCalMonth] = useState(initM ? parseInt(initM) - 1 : now.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((initY ? parseInt(initY) : now.getFullYear() - 25) / 20) * 20);

  // Sync from external value
  useEffect(() => {
    const { day, month, year } = parseISO(value);
    setDayStr(day);
    setMonthStr(month);
    setYearStr(year);
    if (year) setCalYear(parseInt(year));
    if (month) setCalMonth(parseInt(month) - 1);
  }, [value]);

  // Emit change
  const emitChange = useCallback((d, m, y) => {
    if (d && m && y && y.length === 4) {
      const dd = d.padStart(2, '0');
      const mm = m.padStart(2, '0');
      onChange(`${y}-${mm}-${dd}`);
    } else if (!d && !m && !y) {
      onChange('');
    }
  }, [onChange]);

  // Keyboard input refs
  const dayRef = useRef(null);
  const monthRef2 = useRef(null);
  const yearRef = useRef(null);

  const handleDayChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(v) > 31) v = '31';
    setDayStr(v);
    if (v.length === 2) monthRef2.current?.focus();
    emitChange(v, monthStr, yearStr);
  };

  const handleMonthChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(v) > 12) v = '12';
    setMonthStr(v);
    if (v.length === 2) yearRef.current?.focus();
    emitChange(dayStr, v, yearStr);
  };

  const handleYearChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYearStr(v);
    emitChange(dayStr, monthStr, v);
  };

  const handleDayKeyDown = (e) => {
    if (e.key === '/' || e.key === '.' || e.key === '-' || e.key === 'Tab') {
      if (e.key !== 'Tab') e.preventDefault();
      monthRef2.current?.focus();
    }
    if (e.key === 'Backspace' && !dayStr) {
      // already empty, stay
    }
  };

  const handleMonthKeyDown = (e) => {
    if (e.key === '/' || e.key === '.' || e.key === '-' || e.key === 'Tab') {
      if (e.key !== 'Tab') e.preventDefault();
      yearRef.current?.focus();
    }
    if (e.key === 'Backspace' && !monthStr) {
      dayRef.current?.focus();
    }
  };

  const handleYearKeyDown = (e) => {
    if (e.key === 'Backspace' && !yearStr) {
      monthRef2.current?.focus();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setMode('days');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Select a day from calendar
  const selectDay = (day) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yy = String(calYear);
    setDayStr(dd);
    setMonthStr(mm);
    setYearStr(yy);
    onChange(`${yy}-${mm}-${dd}`);
    setOpen(false);
    setMode('days');
  };

  // Calendar grid
  const daysInMonth = DAYS_IN_MONTH(calYear, calMonth);
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Monday=0
  const calDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const selectedISO = value;
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Keyboard input */}
      <div
        className="flex items-center gap-0 border border-gray-300 rounded-xl hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 transition-all bg-white h-11 px-3 cursor-text"
        onClick={() => dayRef.current?.focus()}
      >
        <Calendar
          className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setOpen(!open); setMode('days'); }}
        />
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          placeholder="DD"
          value={dayStr}
          onChange={handleDayChange}
          onKeyDown={handleDayKeyDown}
          onFocus={() => dayRef.current?.select()}
          className="w-7 text-center text-sm bg-transparent outline-none placeholder:text-gray-400"
          maxLength={2}
        />
        <span className="text-gray-300 text-sm mx-0.5">/</span>
        <input
          ref={monthRef2}
          type="text"
          inputMode="numeric"
          placeholder="MM"
          value={monthStr}
          onChange={handleMonthChange}
          onKeyDown={handleMonthKeyDown}
          onFocus={() => monthRef2.current?.select()}
          className="w-7 text-center text-sm bg-transparent outline-none placeholder:text-gray-400"
          maxLength={2}
        />
        <span className="text-gray-300 text-sm mx-0.5">/</span>
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          placeholder="YYYY"
          value={yearStr}
          onChange={handleYearChange}
          onKeyDown={handleYearKeyDown}
          onFocus={() => yearRef.current?.select()}
          className="w-12 text-center text-sm bg-transparent outline-none placeholder:text-gray-400"
          maxLength={4}
        />
      </div>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute z-50 mt-1.5 left-0 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 animate-in fade-in slide-in-from-top-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMode(mode === 'months' ? 'days' : 'months')}
                className="text-sm font-semibold text-gray-800 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded-lg transition-colors"
              >
                {MONTHS[calMonth]}
              </button>
              <button
                type="button"
                onClick={() => { setYearRangeStart(Math.floor(calYear / 20) * 20); setMode(mode === 'years' ? 'days' : 'years'); }}
                className="text-sm font-semibold text-gray-800 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded-lg transition-colors"
              >
                {calYear}
              </button>
            </div>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year picker */}
          {mode === 'years' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setYearRangeStart(yearRangeStart - 20)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">← {yearRangeStart - 20}s</button>
                <span className="text-xs font-medium text-gray-500">{yearRangeStart} – {yearRangeStart + 19}</span>
                <button type="button" onClick={() => setYearRangeStart(yearRangeStart + 20)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">{yearRangeStart + 20}s →</button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 20 }, (_, i) => yearRangeStart + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setCalYear(y); setMode('months'); }}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      y === calYear ? 'bg-teal-600 text-white' :
                      y === now.getFullYear() ? 'bg-teal-50 text-teal-700 font-semibold' :
                      'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Month picker */}
          {mode === 'months' && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setCalMonth(i); setMode('days'); }}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    i === calMonth && calYear === parseInt(yearStr || '0') ? 'bg-teal-600 text-white' :
                    i === now.getMonth() && calYear === now.getFullYear() ? 'bg-teal-50 text-teal-700' :
                    'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Day picker */}
          {mode === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-0 mb-1">
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0">
                {calDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="h-8" />;
                  const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = iso === selectedISO;
                  const isToday = iso === todayISO;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`h-8 w-full rounded-lg text-xs font-medium transition-colors ${
                        isSelected ? 'bg-teal-600 text-white shadow-sm' :
                        isToday ? 'bg-teal-50 text-teal-700 font-semibold' :
                        'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Quick actions */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setDayStr(''); setMonthStr(''); setYearStr(''); onChange(''); setOpen(false); }}
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const td = now.getDate();
                const tm = now.getMonth();
                const ty = now.getFullYear();
                setCalYear(ty); setCalMonth(tm);
                selectDay(td);
              }}
              className="text-xs text-teal-600 hover:text-teal-700 px-2 py-1 rounded hover:bg-teal-50 transition-colors font-medium"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
