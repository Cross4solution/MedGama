import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Frontend-side route guard. Backend remains the source of truth.
 *
 * Props:
 *   children — protected element tree
 *   roles    — optional array of allowed role_ids (e.g. ['doctor', 'clinic'])
 */
export default function PrivateRoute({ children, roles }) {
  const auth = useAuth() || {};
  const { user } = auth;
  // AuthContext exposes `hydrated` (true once initial auth bootstrap finished).
  // Treat lack of hydration as loading.
  const loading = auth.loading !== undefined ? auth.loading : (auth.hydrated === false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Yükleniyor...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (Array.isArray(roles) && roles.length > 0) {
    const userRole = user.role_id || user.role;
    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
