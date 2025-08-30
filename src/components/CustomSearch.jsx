import React, { useMemo, useState } from 'react';
import countryCities from '../data/countryCities';
import CountryCombobox from './CountryCombobox';
import CityCombobox from './CityCombobox';

export default function CustomSearch() {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [symptom, setSymptom] = useState('');
  const [citiesOptions, setCitiesOptions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const countries = useMemo(() => Object.keys(countryCities), []);
  const specialties = ['Diş', 'Plastik Cerrahi', 'Göz', 'Ortopedi', 'Dermatoloji', 'Kardiyoloji'];
  const symptoms = ['Diş ağrısı', 'Burun estetiği', 'Katarakt', 'Menisküs', 'Akne', 'Anjiyo'];

  const canSearch = useMemo(() => !!(country || city || specialty || symptom), [country, city, specialty, symptom]);

  const onSubmit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log('Custom search:', { country, city, specialty, symptom });
  };

  // Load cities dynamically for selected country (full list) with fallback to local map
  React.useEffect(() => {
    let aborted = false;
    const load = async () => {
      setCitiesOptions([]);
      if (!country) return;
      setLoadingCities(true);
      try {
        // CountriesNow API: https://countriesnow.space/api/v0.1/countries/cities
        const res = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country }),
        });
        if (!aborted && res.ok) {
          const data = await res.json();
          if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            setCitiesOptions(data.data);
          } else {
            setCitiesOptions(countryCities[country] || []);
          }
        } else if (!aborted) {
          setCitiesOptions(countryCities[country] || []);
        }
      } catch (err) {
        if (!aborted) setCitiesOptions(countryCities[country] || []);
      } finally {
        if (!aborted) setLoadingCities(false);
      }
    };
    // reset city on country change
    setCity('');
    load();
    return () => { aborted = true; };
  }, [country]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        {/* 1. Country (combobox) */}
        <CountryCombobox
          options={countries}
          value={country}
          onChange={(val) => { setCountry(val); setCity(''); }}
          placeholder="Select Country"
        />

        {/* 2. City (dependent combobox) */}
        <CityCombobox
          options={country ? citiesOptions : []}
          value={city}
          onChange={setCity}
          disabled={!country}
          loading={loadingCities}
          placeholder="Select City"
        />

        {/* 3. Specialty (autocomplete via datalist) */}
        <div>
          <input list="specialties" value={specialty} onChange={(e)=>setSpecialty(e.target.value)} placeholder="Speciality" className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base md:text-sm md:py-2" />
          <datalist id="specialties">
            {specialties.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        {/* 4. Symptom/Procedure (autocomplete via datalist) */}
        <div>
          <input list="symptoms" value={symptom} onChange={(e)=>setSymptom(e.target.value)} placeholder="Symptom / Procedure" className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base md:text-sm md:py-2" />
          <datalist id="symptoms">
            {symptoms.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
      </div>
      <div className="flex">
        <button type="submit" disabled={!canSearch} className="ml-auto bg-gray-900 text-white rounded-lg text-base px-5 py-3 md:text-sm md:py-2 disabled:opacity-50">Search</button>
      </div>
    </form>
  );
}
