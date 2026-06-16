'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import ClinicDashboard from '@/screens/ClinicDashboard';
export default function Page() { return <PrivateRoute roles={['clinic', 'clinicOwner']}><ClinicDashboard /></PrivateRoute>; }
