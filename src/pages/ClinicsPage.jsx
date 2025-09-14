import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCountries, loadPreferredAdminOrCities, getFlagCode } from '../utils/geo';
import SPECIALTIES from '../data/specialties';
import PatientLayout from '../components/PatientLayout';
import ClinicSearchBar from 'components/forms/ClinicSearchBar';
import FiltersSidebar from 'components/filters/FiltersSidebar';
import ResultsHeader from 'components/listing/ResultsHeader';
import ClinicCard from 'components/clinic/ClinicCard';
import Pagination from 'components/pagination/Pagination';
import CTASection from 'components/common/CTASection';

const MediTravelClinics = () => {
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState({
    rating: [],
    features: [],
    insurance: []
  });
  // Apply'e basılınca kullanılacak, gerçek filtreler
  const [appliedFilters, setAppliedFilters] = useState({
    rating: [],
    features: [],
    insurance: []
  });

  const toggleFilter = (group, value) => {
    setSelectedFilters((prev) => {
      const list = new Set(prev[group] || []);
      if (list.has(value)) list.delete(value); else list.add(value);
      return { ...prev, [group]: Array.from(list) };
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters(selectedFilters);
  };
 
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('highest-score');

  // Search bar state
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);
  const [adminType, setAdminType] = useState('city');
  const loadRef = React.useRef(0);

  const countryOptions = React.useMemo(() => listCountries(['Europe','Asia','MiddleEast']), []);
  const specialtyOptions = SPECIALTIES;
  const priceOptions = ['Ekonomik','Orta','Premium','Lüks'];

  // Ülke değişince şehir/eyalet listesini asenkron yükle
  React.useEffect(() => {
    setCity('');
    setCityOptions([]);
    if (!country) return;
    setCitiesLoading(true);
    const runId = ++loadRef.current;
    (async () => {
      try {
        const result = await loadPreferredAdminOrCities(country);
        if (loadRef.current !== runId) return;
        setAdminType(result?.type === 'state' ? 'state' : 'city');
        const list = Array.isArray(result?.list) ? result.list : [];
        setCityOptions(Array.from(new Set(list.filter(Boolean))).sort());
      } finally {
        if (loadRef.current === runId) setCitiesLoading(false);
      }
    })();
  }, [country]);

  // CountryCombobox için bayrak URL üretici
  const getFlagUrl = React.useCallback((name) => {
    try {
      const code = getFlagCode(name);
      return code ? `https://flagcdn.com/24x18/${code}.png` : null;
    } catch { return null; }
  }, []);

  const clinics = [
    {
      id: 1,
      name: "Anadolu Sağlık Merkezi",
      location: "İstanbul, Türkiye",
      rating: 4.8,
      reviewCount: 342,
      image: "/api/placeholder/300/200",
      tags: ["Kalp Cerrahisi", "Onkoloji", "Telehealth"],
      description: "JCI akreditasyonlu, 25 yıllık deneyim, uluslararası standartlarda hizmet...",
      features: ["Telehealth", "Sağlık Turizmi", "GDPR Uyumlu"],
      type: "premium"
    },
    {
      id: 2,
      name: "Memorial Hastanesi",
      location: "Ankara, Türkiye",
      rating: 4.9,
      reviewCount: 186,
      image: "/api/placeholder/300/200",
      tags: ["Plastik Cerrahi", "Estetik", "Pro Review"],
      description: "Estetik cerrahide öncü, dünya standartlarında hizmet, profesyonel değerlendirme mevcut...",
      features: ["Pro Review", "Sağlık Turizmi", "ISO 9001"],
      type: "premium"
    },
    {
      id: 3,
      name: "Ege Üniversitesi Tıp Fakültesi",
      location: "İzmir, Türkiye",
      rating: 4.7,
      reviewCount: 428,
      image: "/api/placeholder/300/200",
      tags: ["Nöroloji", "Ortopedi", "SGK Anlaşmalı"],
      description: "Akademik hastane, araştırma ve eğitim odaklı, deneyimli kadro, SGK anlaşmalı...",
      features: ["Akademik", "Uzman Kadro", "SGK"],
      type: "academic"
    }
  ];

  // Uygulanan filtrelere göre sonuçları hesapla (client-side demo)
  const filteredClinics = clinics.filter((c) => {
    // Rating
    if (appliedFilters.rating.includes('4.5+ Rating') && c.rating < 4.5) return false;
    if (appliedFilters.rating.includes('4.0+ Rating') && c.rating < 4.0) return false;

    // Features map (EN -> dataset)
    const hasFeature = (label) => {
      if (label === 'Telehealth') return c.features?.includes('Telehealth');
      if (label === 'Health Tourism') return c.features?.includes('Sağlık Turizmi');
      if (label === 'Professional Review') return c.features?.some((f)=> /pro\s*review/i.test(f));
      return false;
    };
    for (const f of appliedFilters.features) {
      if (!hasFeature(f)) return false;
    }

    // Insurance
    const hasInsurance = (label) => {
      if (label === 'SGK') {
        const tags = c.tags || [];
        const feats = c.features || [];
        return tags.some((t)=> /sgk|public insurance|sgk anlaşmalı/i.test(t)) ||
               feats.some((t)=> /sgk/i.test(t));
      }
      if (label === 'Private Insurance') {
        const tags = c.tags || [];
        const feats = c.features || [];
        return tags.some((t)=> /private insurance/i.test(t)) ||
               feats.some((t)=> /private/i.test(t));
      }
      return true;
    };
    for (const ins of appliedFilters.insurance) {
      if (!hasInsurance(ins)) return false;
    }

    return true;
  });

  const toggleFavorite = (clinicId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(clinicId)) {
      newFavorites.delete(clinicId);
    } else {
      newFavorites.add(clinicId);
    }
    setFavorites(newFavorites);
  };

  // Yardımcı bileşenlere taşındı: Rating/FeaturePill/Badge varyantları ClinicCard içinde ele alınıyor.

  // Filtre gruplarını UI bileşenine geçirmek için yapılandıralım
  const filterGroups = [
    {
      title: 'Rating',
      options: ['4.5+ Rating', '4.0+ Rating'],
      selected: selectedFilters.rating,
      onToggle: (opt) => toggleFilter('rating', opt),
    },
    {
      title: 'Features',
      options: ['Telehealth', 'Health Tourism', 'Professional Review'],
      selected: selectedFilters.features,
      onToggle: (opt) => toggleFilter('features', opt),
    },
    {
      title: 'Insurance',
      options: ['SGK', 'Private Insurance'],
      selected: selectedFilters.insurance,
      onToggle: (opt) => toggleFilter('insurance', opt),
    },
  ];

  return (
    <PatientLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-6">
        {/* Search Bar */}
        <ClinicSearchBar
          country={country}
          city={city}
          specialty={specialty}
          priceRange={priceRange}
          countryOptions={countryOptions}
          cityOptions={country ? cityOptions : []}
          specialtyOptions={specialtyOptions}
          priceOptions={priceOptions}
          onCountryChange={(val) => { setCountry(val); setCity(''); }}
          onCityChange={setCity}
          onSpecialtyChange={setSpecialty}
          onPriceRangeChange={setPriceRange}
          onSubmit={() => { /* mevcut demo: filtreleme butonu UI */ }}
          getFlagUrl={getFlagUrl}
          citiesLoading={citiesLoading}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <FiltersSidebar groups={filterGroups} onApply={handleApplyFilters} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <ResultsHeader
              count={247}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOptions={[
                { value: 'highest-score', label: 'Highest Rated' },
                { value: 'most-reviews', label: 'Most Reviews' },
                { value: 'nearest', label: 'Nearest' },
              ]}
            />

            {/* Clinics List */}
            <div className="space-y-6">
              {filteredClinics.map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  isFavorite={favorites.has(clinic.id)}
                  onToggleFavorite={toggleFavorite}
                  onView={() => navigate('/clinic')}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination page={1} totalPages={3} onChange={() => {}} />

            {/* CTA Section */}
            <CTASection
              title={"Didn't find the right clinic?"}
              description={"Our experts are ready to help you find the most suitable healthcare service."}
              actionLabel={"Get Expert Help"}
              onAction={() => {}}
            />
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default MediTravelClinics; 