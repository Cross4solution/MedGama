'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import TelehealthPage from '@/screens/TelehealthPage';
export default function Page() { return <PrivateRoute><TelehealthPage /></PrivateRoute>; }
