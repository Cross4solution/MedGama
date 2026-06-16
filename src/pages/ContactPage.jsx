import React from 'react';
import SEOHead from '../components/seo/SEOHead';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="İletişim"
        description="MedaGama ile iletişime geçin. Sorularınız, iş birlikleri ve destek için bize info@medagama.com adresinden ulaşın."
        canonical="/contact"
        alternates
      />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Contact</h1>
        <p className="mt-3 text-gray-600">Get in touch with us: info@medagama.com</p>
      </section>
    </div>
  );
}
