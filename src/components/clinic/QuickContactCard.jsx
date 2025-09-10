import React from 'react';
import { Phone, Mail, Clock } from 'lucide-react';

export default function QuickContactCard({ phone, email, hours }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
      <h3 className="font-semibold mb-4">Quick Contact</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Phone className="w-5 h-5" />
          <span>{phone}</span>
        </div>
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5" />
          <span>{email}</span>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5" />
          <span>{hours}</span>
        </div>
      </div>
    </div>
  );
}
