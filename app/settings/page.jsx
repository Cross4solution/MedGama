'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import CRMSettings from '@/screens/crm/CRMSettings';
export default function Page() { return <PrivateRoute><CRMSettings standalone /></PrivateRoute>; }
