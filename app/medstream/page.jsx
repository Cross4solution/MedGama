'use client';
import PrivateRoute from '@/components/auth/PrivateRoute';
import ExploreTimeline from '@/screens/ExploreTimeline';
export default function Page() { return <PrivateRoute><ExploreTimeline /></PrivateRoute>; }
