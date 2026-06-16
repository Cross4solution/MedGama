'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import SavedPosts from '@/screens/SavedPosts';
export default function Page() { return <PrivateRoute><SavedPosts /></PrivateRoute>; }
