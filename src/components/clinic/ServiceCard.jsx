import React from 'react';

export default function ServiceCard({ icon, name, description }) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          {icon}
        </div>
        <h4 className="font-semibold text-gray-900">{name}</h4>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
