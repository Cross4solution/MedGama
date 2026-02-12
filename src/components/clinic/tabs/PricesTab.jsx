import React from 'react';

export default function PricesTab({ services, selectedService, setSelectedService }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Top Services</h3>

      {/* Service tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 ${selectedService === service.id ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <service.icon className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">{service.name}</div>
            </div>
            <div className="text-xs text-gray-500 pl-[42px]">{service.description}</div>
          </button>
        ))}
      </div>

      {/* Prices of selected service */}
      {selectedService && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
              {services.find(s => s.id === selectedService)?.name} — Pricing
            </h4>
            <button 
              type="button" 
              onClick={() => setSelectedService(null)} 
              className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Procedure
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Price Range
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(services.find(s => s.id === selectedService)?.prices || []).map((price, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {price.procedure}
                    </td>
                    <td className="px-4 py-3 text-sm text-teal-700 font-semibold">
                      {price.range}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            * Prices may vary depending on the complexity of the procedure and patient condition.
          </p>
        </div>
      )}
    </div>
  );
}
