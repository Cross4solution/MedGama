'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import DoctorOnboarding from '@/screens/DoctorOnboarding';
export default function Page() { return <PrivateRoute><DoctorOnboarding /></PrivateRoute>; }
