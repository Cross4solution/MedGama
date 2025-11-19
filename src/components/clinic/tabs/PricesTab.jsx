import React from 'react';

export default function PricesTab({ services, selectedService, setSelectedService }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Top Services</h3>

      {/* Service tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
            className={`text-left p-4 rounded-xl border shadow-sm bg-white hover:bg-teal-50 transition ${selectedService === service.id ? 'ring-2 ring-teal-500' : ''}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <service.icon className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="font-semibold text-gray-900">{service.name}</div>
            </div>
            <div className="text-sm text-gray-600">{service.description}</div>
          </button>
        ))}
      </div>

      {/* Prices of selected service */}
      {selectedService && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              {services.find(s => s.id === selectedService)?.name} - Pricing
            </h4>
            <button 
              type="button" 
              onClick={() => setSelectedService(null)} 
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
                {(services.find(s => s.id === selectedService)?.prices || []).map((price, idx) => (
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
            * Prices may vary depending on the complexity of the procedure and patient condition. Please contact us for detailed information.
          </p>
        </div>
      )}
    </div>
  );
}
