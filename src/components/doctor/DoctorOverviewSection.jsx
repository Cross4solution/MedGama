import React from 'react';
import { CheckCircle, Shield, Award, Users } from 'lucide-react';

export default function DoctorOverviewSection({ aboutP1, aboutP2, certificates = [] }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600 leading-relaxed mb-4" style={{ whiteSpace: 'pre-line' }}>
          {aboutP1}
        </p>
        <p className="text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
          {aboutP2}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Board Certified</span>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
          <Shield className="w-6 h-6 text-green-600" />
          <span className="text-sm font-medium text-gray-700">15+ Years</span>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
          <Award className="w-6 h-6 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Publications</span>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
          <Users className="w-6 h-6 text-orange-600" />
          <span className="text-sm font-medium text-gray-700">Patient-Focused</span>
        </div>
      </div>

      {certificates && certificates.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-base font-semibold text-gray-900 mb-3">Certificates &amp; Licences</h4>
          <div className="flex flex-wrap gap-3">
            {certificates.slice(0, 3).map((src, idx) => (
              <div
                key={`overview-cert-${idx}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center"
              >
                <img
                  src={src}
                  alt={`Certificate ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
