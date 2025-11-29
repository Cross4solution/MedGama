import React from 'react';

export default function DoctorPublicationsSection({ publications = [] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Publications</h3>
      {publications.length === 0 ? (
        <p className="text-gray-500 text-sm">No publications have been added yet.</p>
      ) : (
        <ul className="space-y-3">
          {publications.map((pub) => (
            <li key={pub.id} className="p-4 bg-gray-50 rounded-xl border shadow-sm">
              <p className="font-medium text-gray-900">{pub.title}</p>
              {pub.journal && (
                <p className="text-xs text-gray-500 mt-0.5">{pub.journal}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
