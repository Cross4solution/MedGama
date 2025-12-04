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

function InlineDurationField() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSelect = (option) => {
    setSelected(option);
    setOpen(false);
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

function InlineYearField() {
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
      }}
    />
  );
}

function InlineDateField() {
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
        placeholder="gg.aa.yyyy"
        defaultValue=""
        className="w-full h-9 pl-9 pr-3 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left text-xs bg-white border-gray-300"
        onChange={(e) => {
          const raw = e.target.value || '';
          // Sadece rakamları al ve en fazla 8 hane tut (gg aaaa)
          let digits = raw.replace(/\D/g, '').slice(0, 8);

          if (digits.length >= 5) {
            // gg.aa.yyyy
            digits = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
          } else if (digits.length >= 3) {
            // gg.aa
            digits = `${digits.slice(0, 2)}.${digits.slice(2)}`;
          }

          e.target.value = digits;
        }}
      />
    </div>
  );
}

function InlineDoseField() {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="3"
        onChange={(e) => {
          const raw = e.target.value || '';
          const digits = raw.replace(/\D/g, '').slice(0, 10);
          e.target.value = digits;
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
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Medical History</h2>
        <p className="text-sm text-gray-600 mb-3">
          Current Medical Conditions (e.g., Hypertension, Diabetes, Asthma)
        </p>
        <div className="relative">
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
              onKeyDown={handleConditionKeyDown}
              onFocus={() => conditionInput.trim() && setShowConditionSuggestions(true)}
              onBlur={() => setTimeout(() => setShowConditionSuggestions(false), 200)}
            />

            {medicalConditions.length > 0 && (
              <button
                type="button"
                onClick={clearAllConditions}
                className="ml-auto text-gray-400 hover:text-gray-600"
                aria-label="Clear all"
              >
                ✕
              </button>
            )}
          </div>

          {showConditionSuggestions && filteredConditions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto text-sm">
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

        <p className="text-xs text-gray-500 mt-1.5">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> or
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">,</kbd> to add
        </p>

        <div className="flex justify-end mt-4">
          <button
            onClick={saveMedical}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Save
          </button>
        </div>
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
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Dosage & frequency</label>
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 10 mg once daily"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Duration</label>
              <InlineDurationField />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Add medication
            </button>
          </div>

          <div className="mt-2 border border-dashed border-gray-200 rounded-lg p-3 text-xs text-gray-500">
            Medication list will appear here.
          </div>
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
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Illness name (e.g. Asthma)"
              />
              <InlineYearField />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Surgery name + Surgery date</h3>
            <div className="grid grid-cols-[minmax(0,1.5fr),minmax(0,1fr)] gap-2 mb-2">
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Surgery name (e.g. Appendectomy)"
              />
              <InlineDateField />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Vaccine + Date of Vaccination + Doses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vaccine (e.g. Tetanus)"
              />
              <InlineDateField />
              <InlineDoseField />
            </div>
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
