<?php

/**
 * Görüntülü görüşme ayarları.
 *
 * Bu değerler bir dönem doğrudan env() ile okunuyordu. Yapılandırma
 * önbelleğe alındığında env() null döner; o hâlde TURN bilgisi kaybolur ve
 * görüşme, iki taraf farklı ağdaysa sessizce kurulamaz. Bu yüzden ayarların
 * tek okunma yeri burasıdır.
 */
return [
    // Görüşme kaydı yasal olarak ayrı rıza ister; varsayılan KAPALI.
    'recording' => (bool) env('TELEHEALTH_RECORDING', false),

    'stun_urls' => env('STUN_URLS', 'stun:stun.l.google.com:19302'),

    // Kendi coturn sunucumuz. Boşsa yalnızca STUN ile denenir.
    'turn_urls'   => env('TURN_URLS', ''),
    'turn_secret' => env('TURN_SECRET'),
    'turn_ttl'    => (int) env('TURN_TTL', 3600),
];
