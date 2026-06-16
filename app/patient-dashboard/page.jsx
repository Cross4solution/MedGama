'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import PatientDashboard from '@/screens/PatientDashboard';
export default function Page() { return <PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>; }
