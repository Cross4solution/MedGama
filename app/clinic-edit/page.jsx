'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import ClinicProfileEdit from '@/screens/ClinicProfileEdit';
export default function Page() { return <PrivateRoute roles={['clinic', 'clinicOwner']}><ClinicProfileEdit /></PrivateRoute>; }
