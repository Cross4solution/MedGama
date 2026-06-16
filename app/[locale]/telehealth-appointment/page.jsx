'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import TelehealthAppointmentPage from '@/screens/TelehealthAppointmentPage';
export default function Page() { return <PrivateRoute roles={['patient', 'doctor']}><TelehealthAppointmentPage /></PrivateRoute>; }
