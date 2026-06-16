'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import ClinicTeam from '@/screens/ClinicTeam';
export default function Page() { return <PrivateRoute roles={['clinic', 'clinicOwner']}><ClinicTeam /></PrivateRoute>; }
