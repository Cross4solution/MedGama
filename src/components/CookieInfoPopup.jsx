import React from 'react';

const CookieInfoPopup = ({ setShowCookieInfoPopup }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowCookieInfoPopup(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Çerez Politikası</h2>
          <button
            onClick={() => setShowCookieInfoPopup(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-gray-700 space-y-4">
          <p><strong>Çerezler Nedir?</strong></p>
          <p>Çerezler, web sitemizi ziyaret ettiğinizde tarayıcınıza gönderilen küçük metin dosyalarıdır. Bu dosyalar, deneyiminizi geliştirmek ve site performansını artırmak için kullanılır.</p>
          
          <p><strong>Hangi Çerezleri Kullanıyoruz?</strong></p>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-800">Gerekli Çerezler</p>
              <p>Bu çerezler sitenin temel işlevlerini yerine getirmek için gereklidir. Güvenlik, oturum yönetimi ve temel site işlevleri için kullanılır.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Analitik Çerezler</p>
              <p>Site trafiğini ve kullanıcı davranışlarını analiz etmek için kullanılır. Bu bilgiler, site performansını iyileştirmemize yardımcı olur.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Fonksiyonel Çerezler</p>
              <p>Tercihlerinizi hatırlamak ve kişiselleştirilmiş içerik sunmak için kullanılır.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Pazarlama Çerezleri</p>
              <p>Size ilgili reklamlar göstermek ve pazarlama kampanyalarının etkinliğini ölçmek için kullanılır.</p>
            </div>
          </div>
          
          <p><strong>Çerez Yönetimi</strong></p>
          <p>Tarayıcı ayarlarınızdan çerezleri yönetebilir, silebilir veya devre dışı bırakabilirsiniz. Ancak bazı çerezler devre dışı bırakıldığında sitenin düzgün çalışmayabileceğini unutmayın.</p>
          
          <p><strong>Üçüncü Taraf Çerezler</strong></p>
          <p>Google Analytics, Facebook Pixel gibi üçüncü taraf hizmetler de çerezler kullanabilir. Bu hizmetlerin gizlilik politikalarını incelemenizi öneririz.</p>
          
          <p><strong>Güncellemeler</strong></p>
          <p>Bu çerez politikası zaman zaman güncellenebilir. Önemli değişiklikler olduğunda sizi bilgilendireceğiz.</p>
          
          <p><strong>İletişim</strong></p>
          <p>Çerez politikamız hakkında sorularınız için: <span className="text-blue-600">privacy@meditravel.com</span> adresinden bizimle iletişime geçebilirsiniz.</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowCookieInfoPopup(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieInfoPopup; 