'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import DoctorDashboard from '@/screens/DoctorDashboard';
export default function Page() { return <PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>; }
