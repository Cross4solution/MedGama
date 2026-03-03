import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, ArrowLeft, Trash2, MapPin, Star, Heart } from 'lucide-react';
import { socialAPI, clinicAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LS_KEY = 'saved_clinics';

function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function writeLS(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
}

export default function SavedClinics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useTranslation();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const fetchSavedClinics = useCallback(async () => {
    setLoading(true);
    try {
      // Try API first
      const res = await socialAPI.favorites({ target_type: 'clinic', per_page: 50 });
      const list = res?.data || [];
      if (list.length > 0) {
        const mapped = list.map(f => {
          const c = f.target || f.clinic || f;
          return {
            id: c.id || f.target_id,
            name: c.fullname || c.name || 'Clinic',
            codename: c.codename || c.id,
            avatar: c.avatar || '/images/default/default-clinic.svg',
            address: c.address || c.city || '',
            rating: c.rating || c.average_rating || 0,
            reviewCount: c.review_count || c.reviews_count || 0,
            specialty: c.specialty || '',
            savedAt: f.created_at || null,
          };
        });
        setClinics(mapped);
        setLoading(false);
        return;
      }
    } catch {
      // API failed, fallback to localStorage
    }

    // localStorage fallback
    const saved = readLS();
    if (saved.length > 0) {
      // Try to enrich from API
      const enriched = [];
      for (const item of saved) {
        try {
          const res = await clinicAPI.getByCodename(item.codename || item.id);
          const raw = res?.data || res;
          const c = raw?.clinic || raw;
          if (c && c.id) {
            enriched.push({
              id: c.id,
              name: c.fullname || c.name || item.name || 'Clinic',
              codename: c.codename || item.codename || c.id,
              avatar: c.avatar || '/images/default/default-clinic.svg',
              address: c.address || '',
              rating: c.rating || c.average_rating || 0,
              reviewCount: c.review_count || c.reviews_count || 0,
              specialty: c.specialty || '',
              savedAt: item.savedAt || null,
            });
          } else {
            enriched.push(item);
          }
        } catch {
          enriched.push(item);
        }
      }
      setClinics(enriched);
    } else {
      setClinics([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchSavedClinics();
    else setLoading(false);
  }, [user, fetchSavedClinics]);

  const handleRemove = async (clinic) => {
    setConfirmRemove(null);
    setRemoving(clinic.id);
    setClinics(prev => prev.filter(c => c.id !== clinic.id));
    try {
      await socialAPI.unfavorite('clinic', clinic.id);
    } catch {
      // Also remove from localStorage
    }
    // Remove from localStorage too
    const saved = readLS().filter(c => c.id !== clinic.id && c.codename !== clinic.codename);
    writeLS(saved);
    setRemoving(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in required</h2>
          <p className="text-gray-500 mb-6">You need to sign in to view saved clinics.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
              Saved Clinics
            </h1>
            <p className="text-sm text-gray-500">{clinics.length} {clinics.length === 1 ? 'clinic' : 'clinics'} saved</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No saved clinics yet</h3>
            <p className="text-sm text-gray-400 mb-6">Save clinics from search results or clinic profiles to find them here later.</p>
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
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={clinic.avatar || '/images/default/default-clinic.svg'}
                      alt={clinic.name}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                      onError={(e) => { e.target.src = '/images/default/default-avatar.svg'; }}
                    />
                  </div>

                  {/* Info */}
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

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmRemove(clinic); }}
                    disabled={removing === clinic.id}
                    className="flex-shrink-0 p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from saved"
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
          <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Saved Clinic?</h3>
          <p className="text-sm text-gray-500 mb-5">Are you sure you want to remove <strong>{confirmRemove.name}</strong> from your saved list?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmRemove(null)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRemove(confirmRemove)}
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
