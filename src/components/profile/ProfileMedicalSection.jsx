import React from 'react';

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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Medical History</h2>
      <p className="text-sm text-gray-600 mb-3">Current Medical Conditions (e.g., Hypertension, Diabetes, Asthma)</p>
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
        <button onClick={saveMedical} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save</button>
      </div>
    </div>
  );
}
