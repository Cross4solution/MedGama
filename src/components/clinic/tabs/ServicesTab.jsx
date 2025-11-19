import React from 'react';

export default function ServicesTab({ services }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Our Services</h3>
      <div className="space-y-3">
        {services.map((service, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
          >
            <service.icon className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-medium text-gray-900">{service.name}</span>
              <span className="text-sm text-gray-600">{service.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
