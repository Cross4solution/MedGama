'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import PatientInvoices from '@/screens/PatientInvoices';
export default function Page() { return <PrivateRoute roles={['patient']}><PatientInvoices /></PrivateRoute>; }
