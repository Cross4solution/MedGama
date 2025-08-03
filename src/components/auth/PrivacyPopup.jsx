import React from 'react';

const PrivacyPopup = ({ setShowPrivacyPopup }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowPrivacyPopup(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Gizlilik Politikası</h2>
        <button
          onClick={() => setShowPrivacyPopup(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
      <div className="text-sm text-gray-700 space-y-4">
        <p><strong>1. VERİ SORUMLUSU</strong></p>
        <p>MediTravel Sağlık Teknolojileri A.Ş. ("Şirket"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi işlemektedir.</p>
        
        <p><strong>2. TOPLANAN KİŞİSEL VERİLER</strong></p>
        <p>2.1. Kimlik Bilgileri: Ad, soyad, doğum tarihi, cinsiyet</p>
        <p>2.2. İletişim Bilgileri: E-posta adresi, telefon numarası, adres bilgileri</p>
        <p>2.3. Sağlık Verileri: Sağlık geçmişi, randevu bilgileri, doktor notları</p>
        <p>2.4. İşlem Güvenliği: IP adresi, tarayıcı bilgileri, çerez verileri</p>
        <p>2.5. Platform Kullanım Verileri: Sayfa görüntüleme, arama geçmişi, tercihler</p>
        
        <p><strong>3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI</strong></p>
        <p>3.1. Hizmet Sunumu: Randevu yönetimi, doktor eşleştirme, sağlık hizmeti koordinasyonu</p>
        <p>3.2. İletişim: Bilgilendirme, hatırlatma, destek hizmetleri</p>
        <p>3.3. Güvenlik: Dolandırıcılık önleme, hesap güvenliği, yasal uyumluluk</p>
        <p>3.4. Analiz: Hizmet kalitesi artırma, kullanıcı deneyimi iyileştirme</p>
        <p>3.5. Yasal Yükümlülükler: Mevzuat gereği veri saklama ve raporlama</p>
        
        <p><strong>4. KİŞİSEL VERİLERİN AKTARILMASI</strong></p>
        <p>4.1. Hizmet Sağlayıcıları: Doktorlar, hastaneler, laboratuvarlar (onayınız dahilinde)</p>
        <p>4.2. Teknoloji Ortakları: Bulut hizmet sağlayıcıları, analitik araçlar</p>
        <p>4.3. Yasal Zorunluluklar: Mahkemeler, kamu kurumları, kolluk kuvvetleri</p>
        <p>4.4. İş Ortakları: Sigorta şirketleri, ödeme sağlayıcıları (gerekli hallerde)</p>
        
        <p><strong>5. VERİ GÜVENLİĞİ</strong></p>
        <p>5.1. Teknik Önlemler: SSL şifreleme, güvenli sunucu altyapısı, düzenli güvenlik testleri</p>
        <p>5.2. İdari Önlemler: Personel eğitimi, erişim kontrolü, veri sınıflandırması</p>
        <p>5.3. Fiziksel Önlemler: Veri merkezi güvenliği, yedekleme sistemleri</p>
        
        <p><strong>6. VERİ SAKLAMA SÜRELERİ</strong></p>
        <p>6.1. Hesap Verileri: Hesap aktif olduğu sürece + 3 yıl</p>
        <p>6.2. Sağlık Verileri: 10 yıl (sağlık mevzuatı gereği)</p>
        <p>6.3. İşlem Kayıtları: 5 yıl (vergi mevzuatı gereği)</p>
        <p>6.4. Çerez Verileri: Maksimum 2 yıl</p>
        
        <p><strong>7. KVKK KAPSAMINDAKİ HAKLARINIZ</strong></p>
        <p>7.1. Bilgi Alma Hakkı: Hangi verilerinizin işlendiğini öğrenme</p>
        <p>7.2. Erişim Hakkı: Verilerinize erişim talep etme</p>
        <p>7.3. Düzeltme Hakkı: Yanlış verilerin düzeltilmesini isteme</p>
        <p>7.4. Silme Hakkı: Verilerinizin silinmesini talep etme</p>
        <p>7.5. İşlemeyi Kısıtlama Hakkı: Veri işlemeyi durdurma</p>
        <p>7.6. Veri Taşınabilirliği: Verilerinizi başka sisteme aktarma</p>
        <p>7.7. İtiraz Hakkı: Otomatik işleme karşı itiraz etme</p>
        
        <p><strong>8. HAKLARINIZI KULLANMA</strong></p>
        <p>8.1. Başvuru Yöntemi: E-posta (privacy@meditravel.com) veya yazılı başvuru</p>
        <p>8.2. Yanıt Süresi: Maksimum 30 gün</p>
        <p>8.3. Ücret: İlk başvuru ücretsiz, sonraki başvurular ücretli olabilir</p>
        
        <p><strong>9. ÇEREZ POLİTİKASI</strong></p>
        <p>9.1. Zorunlu Çerezler: Platform işlevselliği için gerekli</p>
        <p>9.2. Analitik Çerezler: Kullanım istatistikleri için</p>
        <p>9.3. Pazarlama Çerezleri: Kişiselleştirilmiş içerik için (onay gerekli)</p>
        
        <p><strong>10. İLETİŞİM</strong></p>
        <p>Kişisel verilerinizle ilgili sorularınız için: privacy@meditravel.com</p>
        <p>Adres: [Şirket Adresi]</p>
        <p>Telefon: [Şirket Telefonu]</p>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowPrivacyPopup(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Anladım
        </button>
      </div>
    </div>
  </div>
  );
};

export default PrivacyPopup; 