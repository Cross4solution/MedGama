import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6">
          <img src="/images/logo/logo.svg" alt="MedaGama" className="h-16 w-16 mx-auto rounded-2xl shadow-lg" />
        </div>
        <h1 className="text-7xl font-extrabold text-teal-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Sayfa Bulunamadı</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          Lütfen URL'yi kontrol edin veya ana sayfaya dönün.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
