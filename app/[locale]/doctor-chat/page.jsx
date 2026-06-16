'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import DoctorChatPage from '@/screens/DoctorChatPage';
export default function Page() { return <PrivateRoute><DoctorChatPage /></PrivateRoute>; }
