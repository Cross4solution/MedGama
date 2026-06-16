import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, Trash2, MapPin, Star, Heart, User2, Stethoscope } from 'lucide-react';
import { socialAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTranslation } from 'react-i18next';
import resolveStorageUrl from '../utils/resolveStorageUrl';

export default function SavedClinics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { decrement: favDecrement } = useFavorites();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('clinics');
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Redirect doctors away
  useEffect(() => {
    if (user && user.role === 'doctor') {
      navigate('/medstream', { replace: true });
    }
  }, [user, navigate]);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await socialAPI.favorites({ per_page: 50 });
      const list = res?.data || [];

      const mappedClinics = list
        .filter(f => f?.type === 'clinic')
        .map(f => ({
          id: f.id,
          name: f.name || 'Clinic',
          codename: f.codename || f.id,
          avatar: f.avatar || '/images/default/default-clinic.svg',
          address: f.address || '',
          rating: f.rating || f.average_rating || 0,
          reviewCount: f.review_count || f.reviews_count || 0,
          specialty: f.specialty || '',
          isVerified: f.is_verified || false,
          savedAt: f.saved_at || null,
        }));

      const mappedDoctors = list
        .filter(f => f?.type === 'doctor')
        .map(f => ({
          id: f.id,
          name: f.name || 'Doctor',
          title: f.title || '',
          specialty: f.specialty || '',
          avatar: f.avatar || '/images/default/default-avatar.svg',
          isVerified: f.is_verified || false,
          savedAt: f.saved_at || null,
        }));

      setClinics(mappedClinics);
      setDoctors(mappedDoctors);
    } catch {
      setClinics([]);
      setDoctors([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchFavorites();
    else setLoading(false);
  }, [user, fetchFavorites]);

  const handleRemove = async (item, type) => {
    setConfirmRemove(null);
    setRemoving(item.id);
    if (type === 'clinic') {
      setClinics(prev => prev.filter(c => c.id !== item.id));
    } else {
      setDoctors(prev => prev.filter(d => d.id !== item.id));
    }
    favDecrement();
    try {
      await socialAPI.unfavorite(type, item.id);
    } catch {}
    setRemoving(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in required</h2>
          <p className="text-gray-500 mb-6">You need to sign in to view your favorites.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const totalCount = clinics.length + doctors.length;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Favorites</h1>
            <p className="text-sm text-gray-500 mt-0.5">{totalCount} {totalCount === 1 ? 'item' : 'items'} saved</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 bg-gray-100/70 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('clinics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'clinics'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Clinics
              {clinics.length > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'clinics' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-600'}`}>
                  {clinics.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'doctors'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctors
              {doctors.length > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'doctors' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-600'}`}>
                  {doctors.length}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          ) : activeTab === 'clinics' ? (
            clinics.length === 0 ? (
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No favorite clinics yet</h3>
                <p className="text-sm text-gray-400 mb-6">Save clinics from search results or clinic profiles.</p>
                <button onClick={() => navigate('/home-v2')} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
                  Browse Clinics
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="relative group bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/clinic/${encodeURIComponent(clinic.codename || clinic.id)}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={resolveStorageUrl(clinic.avatar) || '/images/default/default-clinic.svg'}
                          alt={clinic.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                          onError={(e) => { e.target.src = '/images/default/default-clinic.svg'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{clinic.name}</h3>
                        {clinic.address && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {clinic.address}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {clinic.rating > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Star className="w-3 h-3" fill="currentColor" />
                              {Number(clinic.rating).toFixed(1)}
                            </span>
                          )}
                          {clinic.reviewCount > 0 && (
                            <span className="text-xs text-gray-400">{clinic.reviewCount} reviews</span>
                          )}
                          {clinic.specialty && (
                            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">{clinic.specialty}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setConfirmRemove({ item: clinic, type: 'clinic' }); }}
                        disabled={removing === clinic.id}
                        className="flex-shrink-0 p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {removing === clinic.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            doctors.length === 0 ? (
              <div className="text-center py-20">
                <User2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No favorite doctors yet</h3>
                <p className="text-sm text-gray-400 mb-6">Save doctors from search results or doctor profiles.</p>
                <button onClick={() => navigate('/home-v2')} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
                  Browse Doctors
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="relative group bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/doctor/${doctor.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={resolveStorageUrl(doctor.avatar) || '/images/default/default-avatar.svg'}
                          alt={doctor.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                          onError={(e) => { e.target.src = '/images/default/default-avatar.svg'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {doctor.title ? `${doctor.title} ${doctor.name}` : doctor.name}
                        </h3>
                        {doctor.specialty && (
                          <p className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">{doctor.specialty}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setConfirmRemove({ item: doctor, type: 'doctor' }); }}
                        disabled={removing === doctor.id}
                        className="flex-shrink-0 p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {removing === doctor.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Confirm Remove Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setConfirmRemove(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Remove from Favorites?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to remove <strong>{confirmRemove.item.name}</strong> from your favorites?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(confirmRemove.item, confirmRemove.type)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
