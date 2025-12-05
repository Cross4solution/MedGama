import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';

export default function FavoriteClinicsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);

  const handleRemoveFavorite = (e, clinicToRemove) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    try {
      const userKey = user?.email || user?.id;
      if (!userKey) return;
      const key = `patient_favorite_clinics_${userKey}`;
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const nextList = (Array.isArray(list) ? list : []).filter(
        (c) =>
          !(
            c &&
            c.name === clinicToRemove?.name &&
            c.location === clinicToRemove?.location &&
            c.image === clinicToRemove?.image
          )
      );
      localStorage.setItem(key, JSON.stringify(nextList));
      setFavorites(nextList);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    try {
      const userKey = user?.email || user?.id;
      if (userKey) {
        const key = `patient_favorite_clinics_${userKey}`;
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        setFavorites(Array.isArray(list) ? list : []);
      }
    } catch {
      setFavorites([]);
    }
  }, [user?.email, user?.id, user?.role]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-500" />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Favorite Clinics</h1>
        </div>
        {favorites.length === 0 ? (
          <p className="text-sm text-gray-600">
            You don&apos;t have any favorite clinics yet. Go to a clinic page and tap the heart icon to add it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((clinic, idx) => (
              <div
                key={idx}
                className="group text-left rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col"
              >
                {/* Hero alanı */}
                <div className="relative h-40 bg-gray-100">
                  {clinic.image ? (
                    <img
                      src={clinic.image}
                      alt={clinic.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-700 text-lg font-bold">
                      {clinic.name?.charAt(0) || 'C'}
                    </div>
                  )}

                  {/* Favorite Rozeti */}
                  <div
                    className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-[11px] text-teal-700 border border-teal-100 shadow-sm"
                  >
                    <Heart className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-medium">Favorite</span>
                  </div>
                </div>

                {/* Alt bilgi alanı */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate text-[15px]">
                        {clinic.name}
                      </div>

                      {clinic.location && (
                        <div className="mt-1 flex items-center text-xs text-gray-600 truncate">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          <span className="truncate">{clinic.location}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveFavorite(e, clinic)}
                      className="p-1 rounded-full hover:bg-rose-50"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </button>
                  </div>

                  <div
                    className="
      flex items-center justify-between 
      text-[11px] text-gray-500
    "
                  >
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500/70" />
                      <span>Saved to favorites</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation?.();
                        navigate('/clinic');
                      }}
                      className="inline-flex items-center gap-1 text-teal-700 font-medium hover:underline"
                    >
                      <span>View details</span>
                      <span className="text-[10px]">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
