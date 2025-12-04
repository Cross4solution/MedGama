import React, { useState } from 'react';

export default function DoctorServicesSection({ services }) {
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Services</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service.id || service.name}
            type="button"
            onClick={() => setSelectedServiceId(selectedServiceId === service.id ? null : service.id)}
            className={`text-left p-4 rounded-xl border shadow-sm bg-white hover:bg-teal-50 transition ${
              selectedServiceId === service.id ? 'ring-2 ring-teal-500' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <service.icon className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="font-semibold text-gray-900">{service.name}</div>
            </div>
            <div className="text-sm text-gray-600">{service.description}</div>
          </button>
        ))}
      </div>

      {selectedService && Array.isArray(selectedService.prices) && selectedService.prices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              {selectedService.name} - Pricing
            </h4>
            <button
              type="button"
              onClick={() => setSelectedServiceId(null)}
              className="text-sm text-teal-700 hover:underline"
            >
              Hide
            </button>
          </div>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procedure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Range
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedService.prices.map((price, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {price.procedure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-600 font-semibold">
                      {price.range}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 italic">
            * Prices may vary depending on the patient&apos;s condition and treatment plan. Please contact the doctor for an exact quote.
          </p>
        </div>
      )}
    </div>
  );
}
