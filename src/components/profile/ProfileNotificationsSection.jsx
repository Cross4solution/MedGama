import React from 'react';
import PatientNotify from '../../components/notifications/PatientNotify';

export default function ProfileNotificationsSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Patient Notifications</h2>
        <PatientNotify />
      </div>
    </div>
  );
}
