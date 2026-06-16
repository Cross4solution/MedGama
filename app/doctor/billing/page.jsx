'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import DoctorBilling from '@/screens/DoctorBilling';
export default function Page() { return <PrivateRoute roles={['doctor']}><DoctorBilling /></PrivateRoute>; }
