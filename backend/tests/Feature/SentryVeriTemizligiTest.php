<?php

namespace Tests\Feature;

use App\Observability\SentryVeriTemizleyici;
use Sentry\Event;
use Tests\TestCase;

/**
 * Sentry'ye giden raporun içinde hasta verisi olmamalı.
 *
 * Bu süzgeç config/sentry.php içinde bir kapanıştı; yapılandırmanın önbelleğe
 * alınabilmesi için sınıfa taşındı. Güvenlik kodu taşındığında davranışının
 * aynı kaldığı kanıtlanmalı — testin varlık sebebi bu.
 */
class SentryVeriTemizligiTest extends TestCase
{
    public function test_hassas_alanlar_gizleniyor(): void
    {
        $olay = Event::createEvent();
        $olay->setExtra([
            'email'     => 'hasta@ornek.com',
            'diagnosis' => 'Hipertansiyon',
            'anamnesis' => 'Üç gündür göğüs ağrısı',
            'randevu'   => ['token' => 'gizli-anahtar', 'saat' => '14:00'],
            'zararsiz'  => 'randevu-42',
        ]);
        $olay->setTags(['national_id' => '12345678901', 'surum' => '1.2.3']);

        $temiz = SentryVeriTemizleyici::uygula($olay);

        $ekstra = $temiz->getExtra();
        $this->assertSame('[gizlendi]', $ekstra['email']);
        $this->assertSame('[gizlendi]', $ekstra['diagnosis']);
        $this->assertSame('[gizlendi]', $ekstra['anamnesis']);
        $this->assertSame('[gizlendi]', $ekstra['randevu']['token'], 'İç içe alan temizlenmiyor');

        // Hassas olmayan veri korunmalı: aşırı temizlik hata ayıklamayı bitirir.
        $this->assertSame('randevu-42', $ekstra['zararsiz']);
        $this->assertSame('14:00', $ekstra['randevu']['saat']);

        $this->assertSame('[gizlendi]', $temiz->getTags()['national_id']);
        $this->assertSame('1.2.3', $temiz->getTags()['surum']);
    }

    public function test_istek_govdesi_ve_cerezler_hic_gonderilmiyor(): void
    {
        // Hastanın yazdığı her şey gövdede; gövde maskelenmez, TAMAMEN atılır.
        $olay = Event::createEvent();
        $olay->setRequest([
            'url'     => 'https://medagama.com/api/examinations',
            'data'    => ['diagnosis_note' => 'Hasta şikayeti'],
            'cookies' => ['session' => 'abc'],
            'env'     => ['DB_PASSWORD' => 'gizli'],
            'headers' => ['Authorization' => 'Bearer xyz', 'Accept' => 'application/json'],
        ]);

        $istek = SentryVeriTemizleyici::uygula($olay)->getRequest();

        $this->assertArrayNotHasKey('data', $istek);
        $this->assertArrayNotHasKey('cookies', $istek);
        $this->assertArrayNotHasKey('env', $istek);
        $this->assertSame('[gizlendi]', $istek['headers']['Authorization']);
        $this->assertSame('application/json', $istek['headers']['Accept']);
        $this->assertSame('https://medagama.com/api/examinations', $istek['url']);
    }

    public function test_yapilandirma_suzgeci_gercekten_bagliyor(): void
    {
        // Yapılandırmadaki değer çağrılabilir olmalı: yanlış yazılırsa süzgeç
        // hiç çalışmaz ve hasta verisi süzülmeden gider.
        $suzgec = config('sentry.before_send');

        $this->assertIsCallable($suzgec, 'Sentry süzgeci çağrılabilir değil — temizlik hiç çalışmaz');
    }
}
