<?php

/**
 * Rıza tipleri ve yürürlükteki metin sürümleri.
 *
 * Metin güncellendiğinde SÜRÜMÜ artır — böylece kimin hangi metni onayladığı
 * denetimde ayrışır ve gerekirse kullanıcıdan yeniden onay istenebilir.
 *
 * revocable=false olanlar hizmetin verilebilmesi için zorunludur (sözleşme/yasal
 * yükümlülük); bunlar "geri alınamaz" değil, geri alınması hesabın kapatılması
 * anlamına gelir — kullanıcı bunu veri hakları akışından yapar.
 */
return [
    'types' => [
        'health_data_processing' => [
            'version'   => '1.0',
            'required'  => true,
            'revocable' => true,
            'label'     => ['tr' => 'Sağlık verilerimin işlenmesi', 'en' => 'Processing of my health data'],
        ],
        'privacy_policy' => [
            'version'   => '1.0',
            'required'  => true,
            'revocable' => false,
            'label'     => ['tr' => 'Gizlilik Politikası', 'en' => 'Privacy Policy'],
        ],
        'terms_of_service' => [
            'version'   => '1.0',
            'required'  => true,
            'revocable' => false,
            'label'     => ['tr' => 'Kullanım Koşulları', 'en' => 'Terms of Service'],
        ],
        'medical_share_notice' => [
            'version'   => '1.0',
            'required'  => true,
            'revocable' => false,
            'label'     => [
                'tr' => 'Tıbbi bilgilerimin randevu aldığım doktorla paylaşılması',
                'en' => 'Sharing my medical information with the doctor I book',
            ],
        ],
        'marketing_communications' => [
            'version'   => '1.0',
            'required'  => false,
            'revocable' => true,
            'label'     => ['tr' => 'Pazarlama bildirimleri', 'en' => 'Marketing communications'],
        ],
    ],
];
