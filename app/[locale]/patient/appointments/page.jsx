'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import PatientAppointments from '@/screens/PatientAppointments';
export default function Page() { return <PrivateRoute roles={['patient']}><PatientAppointments /></PrivateRoute>; }
