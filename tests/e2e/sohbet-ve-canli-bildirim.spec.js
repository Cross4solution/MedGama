const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Sohbet ve canlı bildirim.
 *
 * Canlı akış uzun süre sessizce ölüydü: soket bağlanıyor, kanal listede
 * görünüyor ama abonelik hiç tamamlanmıyordu (istemci kütüphanesi yeni sürümde
 * yetkilendirme ayarının adını değiştirmişti). Hata üretmediği için de kimse
 * fark etmedi. Bu dosya o sessiz kırılmayı bir daha sessiz bırakmıyor:
 * aboneliğin tamamlandığını ve olayın gerçekten düştüğünü ölçer.
 *
 * Mesajlar demo hesaplar arasında gider; okunmuş işaretlenerek kapatılır.
 */

async function rolIle(browser, rol, is) {
  const context = await browser.newContext({ storageState: oturumDosyasi(rol) });
  const page = await context.newPage();
  try {
    return await is(page);
  } finally {
    await context.close();
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('Sohbet ve canlı bildirim', () => {
  /** @type {string|null} */
  let sohbetId = null;
  /** @type {string|null} */
  let hastaId = null;

  test('doktor hastayla sohbet açabiliyor ve mesaj gönderebiliyor', async ({ browser }) => {
    hastaId = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/doctor-chat');
      await cerezBandiniKapat(page);
      return page.evaluate(
        () => JSON.parse(localStorage.getItem('auth_state') || '{}')?.user?.id,
      );
    });

    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/messages');
      await cerezBandiniKapat(page);

      const acma = await apiIstek(page, '/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipient_id: hastaId }),
      });
      const sohbet = acma.govde?.data ?? acma.govde;
      if (!sohbet?.id) return { acma };

      const gonderim = await apiIstek(page, `/api/chat/conversations/${sohbet.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Otomatik test mesajı', message_type: 'text' }),
      });
      return { acma, gonderim, sohbetId: sohbet.id };
    });

    expect([200, 201]).toContain(sonuc.acma.http);
    sohbetId = sonuc.sohbetId ?? null;
    expect(sohbetId).toBeTruthy();
    expect(sonuc.gonderim.http).toBe(201);
  });

  test('hastanın okunmamış sayacı artıyor', async ({ browser }) => {
    test.skip(!sohbetId, 'Sohbet açılmadı');

    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/doctor-chat');
      await cerezBandiniKapat(page);

      const { http, govde } = await apiIstek(page, '/api/chat/unread-count');
      expect(http).toBe(200);
      expect(Number(govde?.unread_count ?? 0)).toBeGreaterThan(0);
    });
  });

  test('okundu işaretleyince sayaç düşüyor', async ({ browser }) => {
    test.skip(!sohbetId, 'Sohbet açılmadı');

    // TAZE mesaj: bu testten hemen önce gönderiliyor.
    //
    // Eskiden bir önceki testin gönderdiği mesaja güveniyordu, ama o test
    // hastayı `/tr/doctor-chat` sayfasına götürüyor ve ekran sohbeti açılışta
    // okundu sayıyor. Sıra buraya geldiğinde işaretlenecek bir şey kalmıyordu:
    // ölçüldü, okundu ucu `count: 0` dönüyordu. Test kırmızı yanıyordu ama
    // arka uçta hata yoktu — sayaç doğru çalışıyor (2 → mesajla 3 → okundu
    // ile 2).
    await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/messages');
      await cerezBandiniKapat(page);

      const gonderim = await apiIstek(page, `/api/chat/conversations/${sohbetId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Sayaç ölçümü için mesaj', message_type: 'text' }),
      });
      expect(gonderim.http).toBe(201);
    });

    await rolIle(browser, 'hasta', async (page) => {
      // Sohbet EKRANINA girilmiyor: ekran açılışta okundu işaretliyor ve
      // ölçmek istediğimiz şeyi ölçülemez hâle getiriyor.
      await page.goto('/tr');
      await cerezBandiniKapat(page);

      const once = await apiIstek(page, '/api/chat/unread-count');
      const oncekiSayi = Number(once.govde?.unread_count ?? 0);

      const okundu = await apiIstek(page, `/api/chat/conversations/${sohbetId}/read`, { method: 'POST' });
      expect([200, 204]).toContain(okundu.http);

      // Ölçüt, küresel sayacın "azalması" DEĞİL, tam olarak işaretlenen kadar
      // azalması.
      //
      // Önceki hâli `toBeLessThan(oncekiSayi)` idi ve kırılgandı: sayaç bu
      // hesabın BÜTÜN sohbetlerini topluyor, önceki koşulardan kalan
      // okunmamışlar da içinde. Test kendi açtığı sohbeti değil, paylaşılan
      // bir toplamı ölçüyordu. Arka uç ölçüldü ve doğru çalışıyor
      // (2 → mesajla 3 → okundu ile 2); düşen test bu kirlenmeydi.
      //
      // Uç kaç mesaj işaretlediğini söylüyor; kesin ölçüt o.
      const isaretlenen = Number(okundu.govde?.count ?? 0);
      expect(isaretlenen, 'okundu ucu hiçbir mesajı işaretlemedi').toBeGreaterThan(0);

      await expect
        .poll(async () => {
          const { govde } = await apiIstek(page, '/api/chat/unread-count');
          return Number(govde?.unread_count ?? 0);
        }, { message: 'Okundu işaretlemesi sayacı işaretlenen kadar düşürmedi', timeout: 20_000 })
        .toBe(oncekiSayi - isaretlenen);
    });
  });

  test('canlı kanala abonelik tamamlanıyor ve bildirim olayı düşüyor', async ({ browser }) => {
    test.skip(!sohbetId, 'Sohbet açılmadı');

    const hastaContext = await browser.newContext({ storageState: oturumDosyasi('hasta') });
    const hastaSayfa = await hastaContext.newPage();

    try {
      await hastaSayfa.goto('/tr/medstream');
      await cerezBandiniKapat(hastaSayfa);

      // Yayın sunucusu YAPILANDIRILMAMIŞSA bu test geçemez ve geçmemesi de
      // bir hata değildir. Yerel yığında `REVERB_APP_KEY` boş, yani Echo hiç
      // kurulmuyor; test kırmızı yanıyor ama gösterdiği şey ortamın eksikliği.
      //
      // Ayrım ÖNEMLİ: "anahtar yok" ile "anahtar var ama abonelik tamamlanmadı"
      // farklı şeyler. İkincisi tam olarak bu dosyanın yakalamak için yazıldığı
      // sessiz kırılma, o yüzden orada atlamıyoruz — düşüyoruz.
      // Ölçüt kütüphanenin varlığı DEĞİL — o pakete her hâlükârda giriyor.
      // Ölçüt bir Pusher ÖRNEĞİNİN oluşmuş olması: Echo yalnızca anahtar
      // yapılandırılmışsa örnek yaratıyor. Ölçüldü: yerelde
      // `Pusher` tanımlı ama `Pusher.instances.length === 0`.
      const yayinKurulu = await hastaSayfa.evaluate(
        () => (window.Pusher?.instances?.length ?? 0) > 0,
      );
      test.skip(!yayinKurulu, 'Yayın sunucusu yapılandırılmamış (REVERB/PUSHER anahtarı yok)');

      // Soket bağlanana ve özel kanala abonelik TAMAMLANANA kadar bekle.
      // Eski hatada tam burası sessizce false kalıyordu.
      await expect
        .poll(async () => hastaSayfa.evaluate(() => {
          const P = window.Pusher?.instances?.[0];
          const k = Object.values(P?.channels?.channels || {})[0];
          return !!k?.subscribed;
        }), { message: 'Özel bildirim kanalına abonelik tamamlanmadı', timeout: 45_000 })
        .toBe(true);

      // Gelen olayları yakalamaya başla.
      await hastaSayfa.evaluate(() => {
        window.__testOlaylar = [];
        const P = window.Pusher?.instances?.[0];
        P.connection.bind('message', (m) => {
          if (m.event && m.event !== 'pusher:pong') window.__testOlaylar.push(m.event);
        });
      });

      // Doktor mesaj atar.
      await rolIle(browser, 'demoDoktor', async (page) => {
        await page.goto('/tr/crm/messages');
        await apiIstek(page, `/api/chat/conversations/${sohbetId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: 'Canlı bildirim denemesi', message_type: 'text' }),
        });
      });

      await expect
        .poll(async () => hastaSayfa.evaluate(() => window.__testOlaylar || []), {
          message: 'Canlı bildirim olayı istemciye ulaşmadı',
          timeout: 30_000,
        })
        .toContain('notification.new');
    } finally {
      await hastaContext.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    if (!sohbetId) return;
    // Sohbeti silmiyoruz (mesaj geçmişi hasta kaydının parçası); yalnızca
    // okundu işaretleyip rozeti temiz bırakıyoruz.
    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/doctor-chat');
      await apiIstek(page, `/api/chat/conversations/${sohbetId}/read`, { method: 'POST' });
    }).catch(() => {});
  });
});
