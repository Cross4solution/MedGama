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
    } else if (role === 'patient') {
      navigate('/', { replace: true });
    } else if (role === 'hospital') {
      navigate('/crm', { replace: true });
    } else if (role === 'doctor' && user?.onboarding_completed === false) {
      navigate('/onboarding', { replace: true });
    } else {
      // Doctors and clinics land on MedaGama panel
      navigate('/doctor/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default DashboardRedirect;
