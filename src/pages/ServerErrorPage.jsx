import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';

const ServerErrorPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6">
          <img src="/images/logo/crm-logo.jpg" alt="MedGama" className="h-16 w-16 mx-auto rounded-2xl shadow-lg" />
        </div>
        <h1 className="text-7xl font-extrabold text-red-500 mb-2">500</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Sunucu Hatası</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Bir şeyler ters gitti. Teknik ekibimiz bilgilendirildi.
          Lütfen birkaç dakika sonra tekrar deneyin.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Tekrar Dene
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
