'use client';
// FAZ 2 — CRA App.js'teki nested admin route'unun (Outlet pattern) Next karşılığı.
//   <Route path="/admin" element={<PrivateRoute><AdminLayout/></PrivateRoute>}> ...nested </Route>
// AdminLayout artık children prop'unu alıp kendi <Outlet>{children}</Outlet> ile render eder.
import PrivateRoute from '@/components/auth/PrivateRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import DemoYoneticiKapisi from '@/components/admin/DemoYoneticiKapisi';

export default function AdminRootLayout({ children }) {
  // Tanıtım kipi PrivateRoute'un ÜSTÜNDE: o bekçi oturumsuz ziyaretçiyi
  // doğrudan /login'e yolluyor, yani denemenin ondan önce bitmesi gerekiyor.
  // Kip kapalıyken (üretim varsayılanı) hiçbir şey değişmiyor.
  return (
    <DemoYoneticiKapisi>
      <PrivateRoute roles={['superAdmin', 'saasAdmin']}>
        <AdminLayout>{children}</AdminLayout>
      </PrivateRoute>
    </DemoYoneticiKapisi>
  );
}
