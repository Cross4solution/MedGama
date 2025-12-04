import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function FavoriteClinicsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      if (user?.role === 'patient' && user?.email) {
        const key = `patient_favorite_clinics_${user.email}`;
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        setFavorites(Array.isArray(list) ? list : []);
      }
    } catch {
      setFavorites([]);
    }
  }, [user?.email, user?.role]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((clinic, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate('/clinic')}
                className="text-left bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-teal-200 transition p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {clinic.image ? (
                      <img
                        src={clinic.image}
                        alt={clinic.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{clinic.name}</div>
                    <div className="text-xs text-gray-600 truncate">{clinic.location}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
