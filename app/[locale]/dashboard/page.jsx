'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import DashboardRedirect from '@/screens/DashboardRedirect';
export default function Page() { return <PrivateRoute><DashboardRedirect /></PrivateRoute>; }
