import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Scale, FileText, UserCheck, Lock, Eye, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const KVKK_SECTIONS = [
  {
    id: 'controller',
    icon: UserCheck,
    titleKey: 'kvkk.s1_title',
    titleFallback: '1. Veri Sorumlusu',
    contentKey: 'kvkk.s1_content',
    contentFallback: 'MedGama Sağlık Teknolojileri A.Ş. ("MedGama"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi işlemektedir. MedGama, kişisel verilerinizin güvenliğine büyük önem vermekte ve tüm teknik ve idari tedbirleri almaktadır.',
  },
  {
    id: 'purposes',
    icon: Eye,
    titleKey: 'kvkk.s2_title',
    titleFallback: '2. Kişisel Verilerin İşlenme Amaçları',
    contentKey: 'kvkk.s2_content',
    contentFallback: 'Kişisel verileriniz; sağlık hizmetlerinin sunulması, randevu yönetimi, telesağlık hizmetleri, hasta-doktor iletişimi, fatura ve ödeme işlemleri, yasal yükümlülüklerin yerine getirilmesi, hizmet kalitesinin artırılması ve istatistiksel analizler amacıyla işlenmektedir.',
  },
  {
    id: 'legal',
    icon: Scale,
    titleKey: 'kvkk.s3_title',
    titleFallback: '3. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri',
    contentKey: 'kvkk.s3_content',
    contentFallback: 'Kişisel verileriniz, KVKK\'nın 5. ve 6. maddelerinde belirtilen; açık rızanız, sözleşmenin ifası, yasal yükümlülük, bir hakkın tesisi/kullanılması/korunması ve meşru menfaat hukuki sebeplerine dayanılarak işlenmektedir. Özel nitelikli kişisel verileriniz (sağlık verileri) ise yalnızca açık rızanız veya kamu sağlığının korunması amacıyla işlenmektedir.',
  },
  {
    id: 'transfer',
    icon: FileText,
    titleKey: 'kvkk.s4_title',
    titleFallback: '4. Kişisel Verilerin Aktarılması',
    contentKey: 'kvkk.s4_content',
    contentFallback: 'Kişisel verileriniz; hizmet sağlayıcıları, iş ortakları, yasal merciler ve yetkili kamu kurum ve kuruluşları ile KVKK\'nın 8. ve 9. maddelerinde belirtilen şartlara uygun olarak paylaşılabilir. Yurt dışına veri aktarımı, yeterli korumaya sahip ülkelere veya açık rızanız dahilinde gerçekleştirilir.',
  },
  {
    id: 'retention',
    icon: Lock,
    titleKey: 'kvkk.s5_title',
    titleFallback: '5. Kişisel Verilerin Saklanma Süresi',
    contentKey: 'kvkk.s5_content',
    contentFallback: 'Kişisel verileriniz, işlenme amaçlarının gerektirdiği süre boyunca ve yasal saklama yükümlülükleri kapsamında muhafaza edilir. Sağlık verileri yasal zorunluluk gereği en az 10 yıl, mali kayıtlar 5 yıl, hesap verileri hesap kapanışından itibaren 3 yıl süreyle saklanır.',
  },
  {
    id: 'rights',
    icon: Shield,
    titleKey: 'kvkk.s6_title',
    titleFallback: '6. İlgili Kişinin Hakları (Madde 11)',
    contentKey: 'kvkk.s6_content',
    contentFallback: 'KVKK\'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, yapılan işlemlerin veri aktarılan üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz.',
  },
  {
    id: 'application',
    icon: Trash2,
    titleKey: 'kvkk.s7_title',
    titleFallback: '7. Başvuru Yöntemi',
    contentKey: 'kvkk.s7_content',
    contentFallback: 'Yukarıda belirtilen haklarınızı kullanmak için kvkk@medgama.com adresine e-posta gönderebilir veya platformumuz üzerinden "Veri Hakları" sayfasını ziyaret edebilirsiniz. Başvurularınız en geç 30 gün içinde ücretsiz olarak yanıtlanacaktır. İşlemin ayrıca bir maliyet gerektirmesi halinde, Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.',
  },
];

export default function KVKKPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Scale className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('kvkk.title', 'KVKK Aydınlatma Metni')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('kvkk.subtitle', '6698 Sayılı Kişisel Verilerin Korunması Kanunu')}
              </p>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-teal-900 mb-1">
                  {t('kvkk.summary_title', 'Kişisel Verileriniz Güvende')}
                </h3>
                <p className="text-sm text-teal-800 leading-relaxed">
                  {t('kvkk.summary_text', 'MedGama olarak, 6698 sayılı KVKK ve ilgili mevzuat kapsamında kişisel verilerinizin korunması için gerekli tüm teknik ve idari tedbirleri almaktayız. Bu aydınlatma metni, verilerinizin nasıl işlendiğini şeffaf bir şekilde açıklamaktadır.')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3 text-xs">
            <Link to="/privacy-policy" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              {t('kvkk.link_privacy', 'Gizlilik Politikası')} <ExternalLink className="w-3 h-3" />
            </Link>
            <Link to="/data-rights" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              {t('kvkk.link_rights', 'Veri Haklarınız')} <ExternalLink className="w-3 h-3" />
            </Link>
            <Link to="/cookie-policy" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              {t('kvkk.link_cookie', 'Çerez Politikası')} <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {KVKK_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                    {t(section.titleKey, section.titleFallback)}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pl-11">
                  {t(section.contentKey, section.contentFallback)}
                </p>
              </section>
            );
          })}
        </div>

        {/* Contact / DPO */}
        <div className="mt-10 bg-gradient-to-br from-gray-50 to-teal-50/30 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            {t('kvkk.contact_title', 'İletişim ve Başvuru')}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Veri Sorumlusu:</strong> MedGama Sağlık Teknolojileri A.Ş.</p>
            <p><strong>KVKK İletişim:</strong>{' '}
              <a href="mailto:kvkk@medgama.com" className="text-teal-600 underline underline-offset-2">kvkk@medgama.com</a>
            </p>
            <p><strong>Veri Koruma Görevlisi (DPO):</strong>{' '}
              <a href="mailto:dpo@medgama.com" className="text-teal-600 underline underline-offset-2">dpo@medgama.com</a>
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            {t('kvkk.last_updated', 'Son güncelleme: Mart 2026')}
          </p>
        </div>
      </main>
    </div>
  );
}
