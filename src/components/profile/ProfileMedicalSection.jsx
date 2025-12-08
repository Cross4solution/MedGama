import React, { useState } from 'react';

const DURATION_OPTIONS = [
  { value: '1_week', label: '1 week' },
  { value: '2_weeks', label: '2 weeks' },
  { value: '1_month', label: '1 month' },
  { value: '3_months', label: '3 months' },
  { value: '6_months', label: '6 months' },
  { value: '1_year', label: '1 year' },
  { value: '2_years', label: '2 years' },
];

/**
 * @param {{ onSelect?: (opt: any) => void }} [props]
 */
function InlineDurationField(props) {
  const { onSelect } = props || {};
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSelect = (option) => {
    setSelected(option);
    setOpen(false);
    if (typeof onSelect === 'function') onSelect(option);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full h-9 border border-gray-300 rounded-lg pl-3 pr-8 text-xs bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : 'Select duration'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 text-gray-500 ml-1"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg text-xs max-h-60 overflow-auto">
          <ul className="py-1">
            {DURATION_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center justify-between ${
                    selected?.value === opt.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected?.value === opt.value && (
                    <span className="text-[10px] uppercase tracking-wide text-blue-600">Selected</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * @param {{ onChangeValue?: (val: any) => void }} [props]
 */
function InlineYearField(props) {
  const { onChangeValue } = props || {};
  return (
    <input
      type="number"
      min="1900"
      max="2100"
      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Year (e.g. 2012)"
      onChange={(e) => {
        const raw = e.target.value || '';
        const digits = raw.replace(/\D/g, '').slice(0, 4);
        e.target.value = digits;
        if (typeof onChangeValue === 'function') onChangeValue(digits);
      }}
    />
  );
}

/**
 * @param {{ onChangeValue?: (val: any) => void }} [props]
 */
function InlineDateField(props) {
  const { onChangeValue } = props || {};
  return (
    <div className="relative w-full">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
        aria-hidden="true"
      >
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </svg>
      <input
        type="text"
        name="genericDate"
        placeholder="aa.yyyy"
        defaultValue=""
        className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left text-sm bg-white border-gray-300"
        onChange={(e) => {
          const raw = e.target.value || '';
          // Sadece rakamları al ve en fazla 6 hane tut (aayyyy)
          let digits = raw.replace(/\D/g, '').slice(0, 6);

          if (digits.length >= 3) {
            // aa.yyyy
            digits = `${digits.slice(0, 2)}.${digits.slice(2)}`;
          }

          e.target.value = digits;
          if (typeof onChangeValue === 'function') onChangeValue(digits);
        }}
      />
    </div>
  );
}

/**
 * @param {{ onChangeValue?: (val: any) => void }} [props]
 */
function InlineDoseField(props) {
  const { onChangeValue } = props || {};
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="3"
        onChange={(e) => {
          const raw = e.target.value || '';
          const digits = raw.replace(/\D/g, '').slice(0, 10);
          e.target.value = digits;
          if (typeof onChangeValue === 'function') onChangeValue(digits);
        }}
      />
      <span className="text-[11px] text-gray-500">doses</span>
    </div>
  );
}

export default function ProfileMedicalSection({
  medicalConditions,
  conditionInput,
  showConditionSuggestions,
  conditionInputRef,
  filteredConditions,
  setConditionInput,
  setShowConditionSuggestions,
  addCondition,
  removeCondition,
  handleConditionKeyDown,
  clearAllConditions,
  saveMedical,
}) {
  // Local UI-only state for structured lists (demo purposes)
  const [medications, setMedications] = useState([]);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medDuration, setMedDuration] = useState('');

  const [illnessName, setIllnessName] = useState('');
  const [illnessYear, setIllnessYear] = useState('');
  const [illnessList, setIllnessList] = useState([]);

  const [surgeryName, setSurgeryName] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryList, setSurgeryList] = useState([]);

  const [vaccineName, setVaccineName] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');
  const [vaccineDoses, setVaccineDoses] = useState('');
  const [vaccineList, setVaccineList] = useState([]);

  const [conditionYears, setConditionYears] = useState('');
  const [conditionHistory, setConditionHistory] = useState([]);

  const handleAddMedication = () => {
    const name = medName.trim();
    const dose = medDose.trim();
    const duration = medDuration.trim();
    if (!name && !dose && !duration) return;
    setMedications((prev) => [...prev, { name, dose, duration }]);
    setMedName('');
    setMedDose('');
    setMedDuration('');
  };

  const handleAddIllness = () => {
    const n = illnessName.trim();
    const y = illnessYear.trim();
    if (!n) return;
    setIllnessList((prev) => [...prev, { name: n, year: y }]);
    setIllnessName('');
    setIllnessYear('');
  };

  const handleAddSurgery = () => {
    const n = surgeryName.trim();
    const d = surgeryDate.trim();
    if (!n) return;
    setSurgeryList((prev) => [...prev, { name: n, date: d }]);
    setSurgeryName('');
    setSurgeryDate('');
  };

  const handleAddVaccine = () => {
    const n = vaccineName.trim();
    const d = vaccineDate.trim();
    const doses = vaccineDoses.trim();
    if (!n) return;
    setVaccineList((prev) => [...prev, { name: n, date: d, doses }]);
    setVaccineName('');
    setVaccineDate('');
    setVaccineDoses('');
  };

  const addConditionWithYears = () => {
    let name = (conditionInput || '').trim();
    if (!name && medicalConditions.length > 0) {
      name = String(medicalConditions[medicalConditions.length - 1] || '').trim();
    }
    if (!name) return;

    const rawYears = (conditionYears || '').trim();
    const yearsLabel = rawYears ? `${rawYears} years` : '';

    setConditionHistory((prev) => [...prev, { name, years: yearsLabel }]);
    setConditionInput('');
    setConditionYears('');
  };

  const handleConditionKeyDownLocal = (e) => {
    if (e.key === 'Backspace' && !conditionInput && medicalConditions.length > 0) {
      e.preventDefault();
      removeCondition(medicalConditions.length - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Medical History</h2>
        <p className="text-sm text-gray-600 mb-3">
          Current Medical Conditions (e.g., Hypertension, Diabetes, Asthma)
        </p>
        <div className="relative">
          <div className="flex items-end gap-2 max-w-xl">
            {/* Left: condition input */}
            <div className="flex-[3] min-w-[0] relative">
              <div className="border border-gray-300 rounded-lg px-2 py-1 text-base md:text-sm flex items-center flex-wrap gap-2 bg-white min-h-[42px]">
                {medicalConditions.map((condition, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-800 border border-teal-200"
                  >
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="ml-0.5 text-teal-700 hover:text-teal-900"
                      aria-label={`Remove ${condition}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}

                <input
                  ref={conditionInputRef}
                  placeholder={medicalConditions.length === 0 ? 'Type condition and press Enter...' : ''}
                  className="flex-1 min-w-[8ch] border-0 outline-none px-1 py-1 text-base md:text-sm bg-transparent"
                  type="text"
                  value={conditionInput}
                  onChange={(e) => {
                    setConditionInput(e.target.value);
                    setShowConditionSuggestions(e.target.value.trim().length > 0);
                  }}
                  onKeyDown={handleConditionKeyDownLocal}
                  onFocus={() => conditionInput.trim() && setShowConditionSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowConditionSuggestions(false), 200)}
                />

                {medicalConditions.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllConditions}
                    className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
                    aria-label="Clear all"
                  >
                    Clear
                  </button>
                )}
              </div>

              {showConditionSuggestions && filteredConditions.length > 0 && (
                <ul className="absolute z-20 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto text-sm">
                  {filteredConditions.map((condition, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => addCondition(condition)}
                        className="w-full text-left px-3 py-2 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                      >
                        {condition}
                        <span className="ml-2 text-xs text-gray-500">(condition)</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right: years field (narrower, same style as other inputs) */}
            <div className="flex flex-col gap-1 w-24 flex-shrink-0">
              <label className="text-xs font-medium text-gray-700">Years</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 5"
                value={conditionYears}
                onChange={(e) => setConditionYears(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              />
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={addConditionWithYears}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Add condition
            </button>
          </div>

          {conditionHistory.length > 0 && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/60 p-2 text-xs text-gray-700">
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Condition summary</span>
                <span className="text-[11px] text-gray-400">{conditionHistory.length} item{conditionHistory.length > 1 ? 's' : ''}</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                <div className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1fr),auto] items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <span>Condition</span>
                  <span>Years</span>
                  <span className="text-right">Actions</span>
                </div>
                {conditionHistory.map((item, index) => {
                  const name = item.name;
                  const years = item.years;
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1fr),auto] items-center gap-2 rounded-md bg-white/80 px-2 py-1 border border-gray-200 shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                    >
                      <span className="font-medium text-gray-900 truncate text-[11px] md:text-xs">{name}</span>
                      <span className="text-[11px] text-gray-700 truncate">{years}</span>
                      <button
                        type="button"
                        onClick={() => setConditionHistory(prev => prev.filter((_, i) => i !== index))}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[10px] text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors justify-self-end"
                        aria-label="Remove condition from summary"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-1.5">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> or
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">,</kbd> to add
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Medications</h2>
        <p className="text-sm text-gray-600 mb-4">
          List the medications the patient is currently taking, including dosage and duration.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Medication name</label>
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Amlodipine"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Dosage & frequency</label>
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 10 mg once daily"
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Duration</label>
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 2 weeks"
                value={medDuration}
                onChange={(e) => setMedDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
              onClick={handleAddMedication}
            >
              Add medication
            </button>
          </div>

          {medications.length > 0 && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/60 p-2 text-xs text-gray-700">
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Medication list</span>
                <span className="text-[11px] text-gray-400">
                  {`${medications.length} item${medications.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                <div className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1.4fr),minmax(0,1.1fr),auto] items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <span>Medication name</span>
                  <span>Dosage & frequency</span>
                  <span>Duration</span>
                  <span className="text-right">Actions</span>
                </div>
                {medications.map((m, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1.4fr),minmax(0,1.1fr),auto] items-center gap-2 rounded-md bg-white/80 px-2 py-1 border border-gray-200 shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                  >
                    <span className="font-medium text-gray-900 truncate text-[11px] md:text-xs">{m.name || 'Medication'}</span>
                    <span className="text-[11px] text-gray-700 truncate">{m.dose}</span>
                    <span className="text-[11px] text-gray-700 truncate">{m.duration}</span>
                    <button
                      type="button"
                      onClick={() => setMedications(prev => prev.filter((_, i) => i !== idx))}
                      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[10px] text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors justify-self-end"
                      aria-label="Remove medication from list"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Past Health Information</h2>
        <p className="text-sm text-gray-600 mb-4">
          Record past illnesses, surgeries and vaccinations relevant to the patient's medical history.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Illness name + Diagnosis date</h3>
            <div className="grid grid-cols-[minmax(0,1.5fr),minmax(0,1fr)] gap-2 mb-2">
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Illness name (e.g. Asthma)"
                value={illnessName}
                onChange={(e) => setIllnessName(e.target.value)}
              />
              <input
                type="number"
                min="1900"
                max="2100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Year (e.g. 2012)"
                value={illnessYear}
                onChange={(e) => setIllnessYear(e.target.value)}
              />
            </div>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                onClick={handleAddIllness}
              >
                Add illness
              </button>
            </div>
            {illnessList.length > 0 && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/60 p-2 text-xs text-gray-700">
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Illness history</span>
                  <span className="text-[11px] text-gray-400">{illnessList.length} item{illnessList.length > 1 ? 's' : ''}</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  <div className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1fr),auto] items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <span>Illness name</span>
                    <span>Year</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {illnessList.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1fr),auto] items-center gap-2 rounded-md bg-white/80 px-2 py-1 border border-gray-200 shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                    >
                      <span className="font-medium text-gray-900 truncate text-[11px] md:text-xs">{item.name}</span>
                      <span className="text-[11px] text-gray-700 truncate">{item.year}</span>
                      <button
                        type="button"
                        onClick={() => setIllnessList(prev => prev.filter((_, i) => i !== idx))}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[10px] text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors justify-self-end"
                        aria-label="Remove illness from list"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Surgery name + Surgery date</h3>
            <div className="grid grid-cols-[minmax(0,1.5fr),minmax(0,1fr)] gap-2 mb-2">
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Surgery name (e.g. Appendectomy)"
                value={surgeryName}
                onChange={(e) => setSurgeryName(e.target.value)}
              />
              <InlineDateField
                onChangeValue={(val) => setSurgeryDate(val)}
              />
            </div>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                onClick={handleAddSurgery}
              >
                Add surgery
              </button>
            </div>
            {surgeryList.length > 0 && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/60 p-2 text-xs text-gray-700">
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Surgery history</span>
                  <span className="text-[11px] text-gray-400">{surgeryList.length} item{surgeryList.length > 1 ? 's' : ''}</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  <div className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1fr),auto] items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <span>Surgery name</span>
                    <span>Date</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {surgeryList.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1fr),auto] items-center gap-2 rounded-md bg-white/80 px-2 py-1 border border-gray-200 shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                    >
                      <span className="font-medium text-gray-900 truncate text-[11px] md:text-xs">{item.name}</span>
                      <span className="text-[11px] text-gray-700 truncate">{item.date}</span>
                      <button
                        type="button"
                        onClick={() => setSurgeryList(prev => prev.filter((_, i) => i !== idx))}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[10px] text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors justify-self-end"
                        aria-label="Remove surgery from list"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Vaccine + Date of Last Vaccination + Doses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vaccine (e.g. Tetanus)"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
              />
              <InlineDateField
                onChangeValue={(val) => setVaccineDate(val)}
              />
              <InlineDoseField
                onChangeValue={(val) => setVaccineDoses(val)}
              />
            </div>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                onClick={handleAddVaccine}
              >
                Add vaccine
              </button>
            </div>
            {vaccineList.length > 0 && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/60 p-2 text-xs text-gray-700">
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Vaccination history</span>
                  <span className="text-[11px] text-gray-400">{vaccineList.length} item{vaccineList.length > 1 ? 's' : ''}</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  <div className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr),minmax(0,0.9fr),auto] items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <span>Vaccine</span>
                    <span>Date of last vaccination</span>
                    <span>Doses</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {vaccineList.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr),minmax(0,0.9fr),auto] items-center gap-2 rounded-md bg-white/80 px-2 py-1 border border-gray-200 shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                    >
                      <span className="font-medium text-gray-900 truncate text-[11px] md:text-xs">{item.name}</span>
                      <span className="text-[11px] text-gray-700 truncate">{item.date}</span>
                      <span className="text-[11px] text-gray-700 truncate">{item.doses}</span>
                      <button
                        type="button"
                        onClick={() => setVaccineList(prev => prev.filter((_, i) => i !== idx))}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[10px] text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors justify-self-end"
                        aria-label="Remove vaccine from list"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
