'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import ClinicOnboarding from '@/screens/ClinicOnboarding';
export default function Page() { return <PrivateRoute roles={['clinic', 'clinicOwner']}><ClinicOnboarding /></PrivateRoute>; }
