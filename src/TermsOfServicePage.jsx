import React from 'react';
const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-bold text-gray-900">MediTravel</span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900">Ana Sayfa</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Klinikler</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Doktorlar</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Sağlık Turizmi</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Telehealth</a>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Giriş Yap</button>
              <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">Üye Ol</button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hizmet Sözleşmesi</h1>
          <p className="text-lg text-gray-600">MediTravel Sağlık Turizmi Platformu Kullanım Koşulları</p>
        </div>
        {/* Summary Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
              <span className="text-sm">📄</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Sözleşme Özeti</h3>
              <p className="text-blue-800">
                Bu sözleşme, MediTravel platformunda sunulan sağlık turizmi, telehealth ve klinik hizmetlerinin kullanım koşullarını belirler.
              </p>
            </div>
          </div>
        </div>
        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Hizmet Kapsamı</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinic Services */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-green-900">Klinik Hizmetleri</h3>
              </div>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Klinik profil oluşturma ve yönetimi</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Fotoğraf, video ve medya paylaşımı</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Hasta değerlendirmeleri sistemi</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Fiyat paylaşımı ve görüntüleme</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Entegre CRM sistemi</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Randevu yönetim sistemi</li>
              </ul>
            </div>
            {/* Patient Services */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-blue-900">Hasta Hizmetleri</h3>
              </div>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Klinik profil görüntüleme</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>AI destekli doktor önerisi</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Telehealth randevu sistemi</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Sağlık turizmi programları</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Güvenli dosya paylaşımı</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Mesajlaşma portali</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Kullanıcı Tipleri ve Sorumlulukları</h2>
          <div className="space-y-6">
            {/* Clinic Users */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-gray-900">Klinik Kullanıcıları</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Hakları:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Profil oluşturma ve düzenleme</li>
                    <li>• Multimedya içerik yükleme</li>
                    <li>• Fiyat ve hizmet bilgisi paylaşma</li>
                    <li>• Hasta mesajlarına yanıt verme</li>
                    <li>• Randevu yönetimi</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Sorumlulukları:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Doğru ve güncel bilgi sağlama</li>
                    <li>• Yasal izin ve belgelerin geçerliliği</li>
                    <li>• Hasta gizliliğini koruma</li>
                    <li>• Etik kurallara uyma</li>
                    <li>• Zamanında hizmet sunma</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Patient Users */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-gray-900">Hasta Kullanıcıları</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Hakları:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Klinik bilgilerine erişim</li>
                    <li>• AI asistan kullanımı</li>
                    <li>• Telehealth hizmetleri</li>
                    <li>• Değerlendirme yapma</li>
                    <li>• Güvenli iletişim</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Sorumlulukları:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Doğru kişisel bilgi verme</li>
                    <li>• Randevulara zamanında katılma</li>
                    <li>• Objektif değerlendirme yapma</li>
                    <li>• Ödeme yükümlülüklerini yerine getirme</li>
                    <li>• Platform kurallarına uyma</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Veri Güvenliği ve Gizlilik</h2>
          {/* GDPR & HIPAA */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="text-red-600 text-xl mr-3">🔒</span>
              <h3 className="text-lg font-semibold text-red-900">GDPR & HIPAA Uyumluluğu</h3>
            </div>
            <p className="text-red-800">
              Platformumuz, Avrupa GDPR ve Amerika HIPAA standartlarına tam uyumlu olarak tasarlanmıştır.
            </p>
          </div>
          {/* Data Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-blue-900">Veri Toplama</h3>
              </div>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Kişisel kimlik bilgileri</li>
                <li>• Sağlık geçmişi</li>
                <li>• Tıbbi görüntüler</li>
                <li>• İletişim bilgileri</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-green-900">Veri Kullanımı</h3>
              </div>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Hizmet sağlama</li>
                <li>• AI eşleştirme</li>
                <li>• Kalite kontrolü</li>
                <li>• Yasal yükümlülükler</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-purple-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-purple-900">Veri Koruması</h3>
              </div>
              <ul className="space-y-2 text-purple-800 text-sm">
                <li>• End-to-end şifreleme</li>
                <li>• Güvenli sunucular</li>
                <li>• Erişim kontrolü</li>
                <li>• Düzenli denetim</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Değerlendirme Sistemi</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="text-yellow-600 text-xl mr-3">⭐</span>
              <h3 className="text-lg font-semibold text-yellow-900">Onaylı Değerlendirme Sistemi</h3>
            </div>
            <p className="text-yellow-800">
              Sadece platformumuz üzerinden gerçek tedavi alan hastalar değerlendirme yapabilir. Bu sistem sahte değerlendirmeleri engeller.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Standart Değerlendirmeler</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Sadece tedavi alan hastalar yapabilir</li>
                <li>• Sistem üzerinden randevu alınması zorunlu</li>
                <li>• Klinik doğrulama gerekli</li>
                <li>• 1-5 yıldız puanlama sistemi</li>
                <li>• Detaylı metin değerlendirmesi</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Profesyonel Değerlendirmeler</h3>
              <ul className="space-y-2 text-purple-800 text-sm">
                <li>• Uzman ekip tarafından yapılır</li>
                <li>• Hekim ile raporları içerir</li>
                <li>• Detaylı fotoğraf ve video</li>
                <li>• Objektif kalite analizi</li>
                <li>• Etik ücret karşılığında</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Ödeme ve Fiyatlandırma</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-blue-900">Klinik Üyelikleri</h3>
              </div>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Aylık abonelik sistemi</li>
                <li>• CRM sistemi dahil</li>
                <li>• Randevu yönetimi</li>
                <li>• Profil yönetimi</li>
                <li>• Temel destek</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">🌍</span>
                <h3 className="text-lg font-semibold text-green-900">Sağlık Turizmi</h3>
              </div>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Paket program fiyatları</li>
                <li>• Kapıya sistemi</li>
                <li>• Otel rezervasyonları</li>
                <li>• Transfer hizmetleri</li>
                <li>• Uçak bileti desteği</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-purple-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-purple-900">Telehealth</h3>
              </div>
              <ul className="space-y-2 text-purple-800 text-sm">
                <li>• Konsültasyon başına ücret</li>
                <li>• Doktor belirlediği fiyat</li>
                <li>• Platform komisyonu</li>
                <li>• Güvenli ödeme</li>
                <li>• Fatura sistemi</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 6 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Genel Şartlar ve Koşullar</h2>
          <div className="space-y-6">
            {/* Responsibility Limitations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">❗</span>
                <h3 className="text-lg font-semibold text-blue-900">Sorumluluk Sınırlamaları</h3>
              </div>
              <div className="text-blue-800 text-sm">
                <p className="mb-2">MediTravel, bir teknoloji platformudur ve tıbbi hizmet sağlayıcısı değildir. Platform:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Klinikler arasında aracılık yapar</li>
                  <li>• Tıbbi tavsiye vermez</li>
                  <li>• Tedavi sonuçlarını garanti etmez</li>
                  <li>• Klinik kalitesinden doğrudan sorumlu değildir</li>
                </ul>
              </div>
            </div>
            {/* Cancellation and Refund */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-red-600 text-xl mr-3">❌</span>
                <h3 className="text-lg font-semibold text-red-900">İptal ve İade Koşulları</h3>
              </div>
              <ul className="space-y-2 text-red-800 text-sm">
                <li>• Randevu iptalleri 24 saat öncesinden</li>
                <li>• Sağlık turizmi paketi</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Agreement Footer */}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sözleşmeyi Kabul Ediyorum</h3>
          <p className="text-gray-600 mb-6">
            MediTravel platformunu kullanarak yukarıdaki tüm şart ve koşulları kabul etmiş sayılırsınız.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 font-medium">Kabul Ediyorum</button>
            <button className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 font-medium">Geri Dön</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TermsOfServicePage; 