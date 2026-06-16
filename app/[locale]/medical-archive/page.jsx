'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import MedicalArchive from '@/screens/MedicalArchive';
export default function Page() { return <PrivateRoute roles={['patient']}><MedicalArchive /></PrivateRoute>; }
