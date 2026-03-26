import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Globe, Building2, Users, ChevronRight,
  CheckCircle, Loader2, Heart, Star, ArrowRight, Stethoscope,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hospitalAPI } from '../lib/api';
import SEOHead, { buildMedicalBusinessSchema } from '../components/seo/SEOHead';
import resolveStorageUrl from '../utils/resolveStorageUrl';

// ─── Hero ─────────────────────────────────────────────────────────────────────
const HospitalHero = ({ hospital }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 mt-4">
      {/* Cover */}
      <div className="relative h-52 md:h-64">
        <img
          src={resolveStorageUrl(hospital.avatar)}
          alt={hospital.fullname || hospital.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {/* Verified badge */}
        {hospital.is_verified && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
            <CheckCircle className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-semibold text-teal-700">
              {t('hospital.verified', 'Verified')}
            </span>
          </div>
        )}
        {/* Level badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-teal-600/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
          <Building2 className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold text-white">
            {t('hospital.level', 'Hospital Network')}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {hospital.fullname || hospital.name}
            </h1>
            {hospital.address && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">
                  {[hospital.address, hospital.city, hospital.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <StatPill icon={Building2} label={t('hospital.branches', 'Branches')} value={hospital.branches?.length ?? 0} color="teal" />
            <StatPill icon={Stethoscope} label={t('hospital.clinics', 'Clinics')} value={hospital.clinics_count ?? 0} color="blue" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatPill = ({ icon: Icon, label, value, color = 'teal' }) => {
  const colors = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${colors[color]}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{value} {label}</span>
    </div>
  );
};

// ─── About Card ───────────────────────────────────────────────────────────────
const AboutCard = ({ hospital }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const bio = hospital.biography;
  const longBio = bio && bio.length > 300;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-teal-600" />
        {t('hospital.about', 'About')}
      </h2>

      {bio ? (
        <>
          <p className={`text-sm text-gray-600 leading-relaxed ${!expanded && longBio ? 'line-clamp-4' : ''}`}>
            {bio}
          </p>
          {longBio && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-teal-600 font-medium hover:underline"
            >
              {expanded ? t('common.showLess', 'Show less') : t('common.readMore', 'Read more')}
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">{t('hospital.noBio', 'No description available.')}</p>
      )}

      {/* Contact details */}
      <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
        {hospital.phone && (
          <a href={`tel:${hospital.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {hospital.phone}
          </a>
        )}
        {hospital.email && (
          <a href={`mailto:${hospital.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {hospital.email}
          </a>
        )}
        {hospital.website && (
          <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {hospital.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Branch Card ──────────────────────────────────────────────────────────────
const BranchCard = ({ branch }) => {
  const { t } = useTranslation();
  const primaryClinic = branch.clinics?.[0];
  const hasCoords = branch.coordinates?.lat && branch.coordinates?.lng;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all duration-200 p-5">
      {/* Branch header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-teal-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{branch.name}</h3>
          {(branch.city || branch.country) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {[branch.city, branch.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-4">
        {branch.address && (
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-2">{branch.address}</span>
          </p>
        )}
        {branch.phone && (
          <a href={`tel:${branch.phone}`} className="text-xs text-gray-500 flex items-center gap-1.5 hover:text-teal-600 transition-colors">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            {branch.phone}
          </a>
        )}
        {branch.email && (
          <a href={`mailto:${branch.email}`} className="text-xs text-gray-500 flex items-center gap-1.5 hover:text-teal-600 transition-colors">
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{branch.email}</span>
          </a>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-50 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          {branch.clinics_count ?? 0} {t('hospital.clinics', 'clinics')}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          {branch.doctors_count ?? 0} {t('hospital.doctors', 'doctors')}
        </span>
        {hasCoords && (
          <a
            href={`https://www.google.com/maps?q=${branch.coordinates.lat},${branch.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-teal-600 hover:underline font-medium"
          >
            <MapPin className="w-3 h-3" />
            {t('hospital.viewMap', 'Map')}
          </a>
        )}
      </div>

      {/* Primary clinic preview */}
      {primaryClinic && (
        <div className="mt-3 flex items-center gap-2">
          <img
            src={resolveStorageUrl(primaryClinic.avatar)}
            alt={primaryClinic.name}
            className="w-7 h-7 rounded-lg object-cover border border-gray-100"
            onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
          />
          <span className="text-xs text-gray-600 font-medium truncate flex-1">
            {primaryClinic.fullname || primaryClinic.name}
          </span>
        </div>
      )}

      {/* CTA — "Şubeyi İncele" */}
      <div className="mt-4">
        {primaryClinic?.codename ? (
          <Link
            to={`/clinic/${primaryClinic.codename}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
          >
            {t('hospital.viewBranch', 'Şubeyi İncele')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm font-medium border border-gray-100 cursor-default">
            {t('hospital.comingSoon', 'Coming Soon')}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Branches Section ─────────────────────────────────────────────────────────
const BranchesSection = ({ branches }) => {
  const { t } = useTranslation();

  if (!branches?.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <MapPin className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-sm text-gray-400">{t('hospital.noBranches', 'No branches listed yet.')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-teal-600" />
        {t('hospital.ourBranches', 'Our Branches')}
        <span className="ml-1 text-sm font-normal text-gray-400">({branches.length})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
      </div>
    </div>
  );
};

// ─── Sidebar Info Card ────────────────────────────────────────────────────────
const SidebarInfo = ({ hospital }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
        <Building2 className="w-4 h-4 text-teal-600" />
        {t('hospital.hospitalInfo', 'Hospital Info')}
      </h3>

      <div className="space-y-3 text-sm">
        {hospital.fullname && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t('hospital.legalName', 'Legal Name')}</p>
            <p className="text-gray-700 font-medium">{hospital.fullname}</p>
          </div>
        )}
        {hospital.city && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t('hospital.location', 'Location')}</p>
            <p className="text-gray-700">{[hospital.city, hospital.country].filter(Boolean).join(', ')}</p>
          </div>
        )}
        {hospital.owner && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t('hospital.director', 'Director')}</p>
            <div className="flex items-center gap-2">
              <img
                src={resolveStorageUrl(hospital.owner.avatar)}
                alt={hospital.owner.fullname}
                className="w-6 h-6 rounded-full object-cover border border-gray-100"
                onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
              />
              <span className="text-gray-700">{hospital.owner.fullname}</span>
            </div>
          </div>
        )}
      </div>

      {/* L4 Rule notice */}
      <div className="pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-400 leading-relaxed">
          {t('hospital.appointmentNote', 'Appointments are managed at each branch. Please select a branch to book.')}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-600 font-medium">
          <ArrowRight className="w-3.5 h-3.5" />
          {t('hospital.selectBranch', 'Select a branch below')}
        </div>
      </div>
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 mt-4">
      <div className="h-64 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded-lg w-1/2" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 h-52" />
      ))}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HospitalProfilePage() {
  const { codename } = useParams();
  const { t } = useTranslation();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!codename) return;

    setLoading(true);
    hospitalAPI.getByCodename(codename)
      .then((res) => {
        const h = res?.hospital || res?.data?.hospital || res;
        if (h?.id) {
          setHospital(h);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [codename]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <Skeleton />
        </div>
      </div>
    );
  }

  if (notFound || !hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{t('hospital.notFound', 'Hospital not found')}</h2>
          <p className="text-sm text-gray-500">{t('hospital.notFoundDesc', 'This hospital profile does not exist or is no longer active.')}</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline">
            <ArrowRight className="w-4 h-4 rotate-180" />
            {t('common.backToHome', 'Back to home')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`${hospital.fullname || hospital.name} — ${t('hospital.level', 'Hospital Network')}`}
        description={hospital.biography?.slice(0, 160) || `${hospital.fullname || hospital.name} — ${hospital.city || ''} ${t('hospital.level', 'Hospital Network')}`}
        canonical={`/hospital/${codename}`}
        image={hospital.avatar}
        jsonLd={buildMedicalBusinessSchema({
          name: hospital.fullname || hospital.name,
          image: hospital.avatar,
          description: hospital.biography,
          address: [hospital.address, hospital.city, hospital.country].filter(Boolean).join(', '),
          url: `https://medagama.com/hospital/${codename}`,
        })}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <HospitalHero hospital={hospital} />
            <BranchesSection branches={hospital.branches} />
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:top-24 h-max">
            <SidebarInfo hospital={hospital} />
            <AboutCard hospital={hospital} />
          </div>

        </div>
      </div>
    </div>
  );
}
