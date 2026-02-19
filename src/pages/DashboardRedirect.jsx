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

    if (role === 'doctor') {
      navigate('/crm', { replace: true });
    } else if (role === 'superAdmin' || role === 'saasAdmin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/home-v2', { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default DashboardRedirect;
