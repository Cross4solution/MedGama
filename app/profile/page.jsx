'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import Profile from '@/screens/Profile';
export default function Page() { return <PrivateRoute><Profile /></PrivateRoute>; }
