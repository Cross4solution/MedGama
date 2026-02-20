import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const role = user?.role || user?.role_id || 'patient';

    if (role === 'superAdmin' || role === 'saasAdmin') {
      navigate('/admin', { replace: true });
    } else {
      // All users (doctor, clinic, patient) land on main platform
      // CRM is a separate premium module accessed via sidebar
      navigate('/explore', { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default DashboardRedirect;
