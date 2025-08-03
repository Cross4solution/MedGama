import React from 'react';
import { Send, Shield } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Sağlık Hizmetlerinizi
                <span className="text-blue-600"> Dijital Platformda</span> Bulun
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Yapay zeka destekli asistanımız ile semptomlarınızı analiz edin, 
                size en uygun doktor ve klinikleri bulun. Güvenli, hızlı ve 
                kolay sağlık hizmeti erişimi.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2">
                <Send className="w-4 h-4" />
                <span>AI Asistanı ile Başla</span>
              </button>
            </div>
          </div>
          
          {/* Right Side - Image */}
          <div className="relative">
            <div className="bg-gray-100 rounded-2xl relative overflow-hidden h-80">
              <img 
                src="/images/caroline-lm-uqved8dypum-unsplash_720.jpg" 
                alt="Doktor konsültasyonu - Modern klinik ortamında profesyonel sağlık hizmeti" 
                className="w-full h-full object-cover absolute inset-0"
                loading="lazy"
              />
              <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg flex items-center space-x-2 z-10">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">GDPR & HIPAA Uyumlu</span>
                <span className="text-xs text-gray-500">Güvenli Veri Koruması</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 