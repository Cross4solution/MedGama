import React from 'react';

const TermsPopup = ({ setShowTermsPopup }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Kullanım Şartları</h2>
        <button
          onClick={() => setShowTermsPopup(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
      <div className="text-sm text-gray-700 space-y-4">
        <p><strong>1. TARAFLAR VE KONU</strong></p>
        <p>Bu Kullanım Şartları ("Şartlar"), MediTravel Sağlık Teknolojileri A.Ş. ("Şirket") ile platformu kullanan kişiler ("Kullanıcı") arasında yapılan hukuki sözleşmeyi düzenlemektedir. Platform, sağlık hizmetleri arama, randevu alma ve sağlık bilgilerini yönetme amacıyla sunulmaktadır.</p>
        
        <p><strong>2. HİZMET KAPSAMI VE SINIRLAMALAR</strong></p>
        <p>2.1. Platform üzerinden sunulan hizmetler, tıbbi tavsiye, teşhis veya tedavi niteliği taşımamaktadır. Sunulan bilgiler sadece bilgilendirme amaçlıdır.</p>
        <p>2.2. Acil tıbbi durumlarda kullanıcıların doğrudan 112 Acil Servis'e başvurması zorunludur.</p>
        <p>2.3. Platform, 18 yaş üzeri kullanıcılar için tasarlanmıştır. Reşit olmayan kullanıcıların platformu kullanması yasaktır.</p>
        
        <p><strong>3. KULLANICI SORUMLULUKLARI</strong></p>
        <p>3.1. Kullanıcı, platform üzerinden aldığı bilgileri kendi sorumluluğunda değerlendirmekle yükümlüdür.</p>
        <p>3.2. Kullanıcı, hesap bilgilerinin güvenliğinden sorumludur ve üçüncü kişilerle paylaşmamalıdır.</p>
        <p>3.3. Kullanıcı, platformu yasal amaçlar dışında kullanmamalıdır.</p>
        
        <p><strong>4. VERİ GÜVENLİĞİ VE GİZLİLİK</strong></p>
        <p>4.1. Kişisel sağlık verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında korunmaktadır.</p>
        <p>4.2. Verileriniz, hizmet kalitesini artırmak ve yasal yükümlülükleri yerine getirmek amacıyla işlenmektedir.</p>
        <p>4.3. Veri güvenliği için endüstri standardı güvenlik protokolleri kullanılmaktadır.</p>
        
        <p><strong>5. FİKRİ MÜLKİYET HAKLARI</strong></p>
        <p>5.1. Platform içeriği, tasarımı ve yazılımı, Şirket'in fikri mülkiyet hakları kapsamındadır.</p>
        <p>5.2. İzinsiz kullanım, kopyalama veya dağıtım yasaktır.</p>
        <p>5.3. Platform üzerindeki tüm haklar Şirket'e aittir.</p>
        
        <p><strong>6. SORUMLULUK SINIRLAMALARI</strong></p>
        <p>6.1. Şirket, platform üzerinden sunulan bilgilerin doğruluğu konusunda garanti vermemektedir.</p>
        <p>6.2. Kullanıcılar, hizmetlerden kendi riskleri altında faydalanır.</p>
        <p>6.3. Şirket, dolaylı zararlardan sorumlu değildir.</p>
        
        <p><strong>7. SÖZLEŞME DEĞİŞİKLİKLERİ</strong></p>
        <p>7.1. Bu şartlar, önceden haber verilmeksizin değiştirilebilir.</p>
        <p>7.2. Değişiklikler platform üzerinden duyurulur ve yayınlandığı tarihten itibaren geçerli olur.</p>
        <p>7.3. Değişikliklerden sonra platformu kullanmaya devam etmek, yeni şartları kabul etmek anlamına gelir.</p>
        
        <p><strong>8. UYUŞMAZLIK ÇÖZÜMÜ</strong></p>
        <p>8.1. Bu sözleşmeden doğacak uyuşmazlıklar, İstanbul Mahkemeleri ve İcra Müdürlükleri'nin yetkisindedir.</p>
        <p>8.2. Türkiye Cumhuriyeti hukuku uygulanacaktır.</p>
        
        <p><strong>9. İLETİŞİM</strong></p>
        <p>Bu şartlarla ilgili sorularınız için: info@meditravel.com adresinden bizimle iletişime geçebilirsiniz.</p>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowTermsPopup(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Anladım
        </button>
      </div>
    </div>
  </div>
);

export default TermsPopup; 