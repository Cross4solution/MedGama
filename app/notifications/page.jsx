'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import Notifications from '@/screens/Notifications';
export default function Page() { return <PrivateRoute><Notifications /></PrivateRoute>; }
