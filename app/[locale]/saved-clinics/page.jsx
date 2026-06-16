'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import SavedClinics from '@/screens/SavedClinics';
export default function Page() { return <PrivateRoute><SavedClinics /></PrivateRoute>; }
