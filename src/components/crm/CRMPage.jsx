'use client';
// FAZ 2 — Next App Router CRM route'ları için ortak sarmalayıcı.
// CRA App.js'teki crm(...) / crmManager(...) helper'larının birebir karşılığı:
//   <PrivateRoute roles={CRM_ROLES}><CRMLayout>{children}</CRMLayout></PrivateRoute>
import React from 'react';
import PrivateRoute from '@/components/auth/PrivateRoute';
import CRMLayout from '@/components/crm/CRMLayout';

export const CRM_ROLES = ['doctor', 'clinic', 'clinicOwner', 'hospital', 'salesperson'];
export const CRM_MANAGER_ROLES = ['clinic', 'clinicOwner', 'hospital'];

export default function CRMPage({ roles = CRM_ROLES, children }) {
  return (
    <PrivateRoute roles={roles}>
      <CRMLayout>{children}</CRMLayout>
    </PrivateRoute>
  );
}
