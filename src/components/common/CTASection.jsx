import React from 'react';

export default function CTASection({ title, description, actionLabel, onAction }) {
  return (
    <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-center text-white">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-blue-100 mb-6">{description}</p>
      <button onClick={onAction} className="bg-white text-blue-600 px-6 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
        {actionLabel}
      </button>
    </div>
  );
}
