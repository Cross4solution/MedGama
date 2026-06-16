'use client';
// FAZ 2 — CRA App.js'teki nested admin route'unun (Outlet pattern) Next karşılığı.
//   <Route path="/admin" element={<PrivateRoute><AdminLayout/></PrivateRoute>}> ...nested </Route>
// AdminLayout artık children prop'unu alıp kendi <Outlet>{children}</Outlet> ile render eder.
import PrivateRoute from '@/components/auth/PrivateRoute';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({ children }) {
  return (
    <PrivateRoute roles={['superAdmin', 'saasAdmin']}>
      <AdminLayout>{children}</AdminLayout>
    </PrivateRoute>
  );
}
