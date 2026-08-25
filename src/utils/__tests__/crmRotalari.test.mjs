import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * CRM rotaları adının vaat ettiği ekranı açmalı.
 *
 * Yirmi yedi CRM ekranı ilk kez oturum açılmış hâlde gezildi (yerel demo
 * oturumlarıyla). Hepsi 200 döndü, hiçbiri çökmedi — ama iki adres BİREBİR aynı
 * içeriği veriyordu. Sebebi:
 *
 *   /crm/integrations → `/crm/settings`e yönlendiriyor (bilinçli, belgelenmiş)
 *   /crm/help         → doğrudan `CRMSettings` render ediyordu
 *
 * Yani adı "yardım" olan bir sayfa ayarları gösteriyordu, üstelik sayfa başlığı
 * "CRM Help" diyordu. Rota menüde de yok: kenar çubuğu Destek, SSS ve Ayarlar
 * bağlantılarını veriyor.
 *
 * Silmek yerine yönlendirildi — `/crm/integrations` için verilmiş kararın
 * aynısı, kayıtlı bağlantı 404 görmesin diye.
 *
 * Bu sınıf sessiz: sayfa açılıyor, çökmüyor, 200 dönüyor. Yalnızca YANLIŞ
 * ekranı gösteriyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');
const crmKok = path.join(uygulamaKok, 'app/[locale]/crm');

/**
 * Yorumsuz kaynak.
 *
 * Yeni `/crm/help` sayfasının açıklaması `CRMSettings` adını METİN olarak
 * taşıyor (neyi değiştirdiğini anlatıyor) ve ham metinde arayan ilk hâli onu
 * ihlal sanıyordu — ölçüt doğru koda karşı kırmızı yandı. Aynı tuzağa bu
 * çalışmada altıncı düşüş.
 */
const oku = (p) => readFileSync(p, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((satir) => !satir.trim().startsWith('//'))
  .join('\n');

/** CRM rota adı → sayfa kaynağı. */
function rotalar() {
  const bulunan = new Map();

  for (const g of readdirSync(crmKok, { withFileTypes: true })) {
    if (!g.isDirectory()) continue;

    const sayfa = path.join(crmKok, g.name, 'page.jsx');
    if (existsSync(sayfa)) bulunan.set(g.name, oku(sayfa));
  }

  return bulunan;
}

test('yardım adresi ayarları göstermiyor', () => {
  const kaynak = rotalar().get('help');

  assert.ok(kaynak, '/crm/help sayfası bulunamadı — bu ölçüt güncellenmeli');
  assert.doesNotMatch(kaynak, /CRMSettings/, '`/crm/help` hâlâ Ayarlar ekranını çiziyor');
  assert.match(kaynak, /redirect\(/, '`/crm/help` yönlendirmiyor: kayıtlı bağlantılar bir yere gitmeli');
  assert.match(kaynak, /crm\/support/, 'yönlendirme hedefi Destek ekranı değil');
});

test('kaldırılan ekranlar 404 değil yönlendirme veriyor', () => {
  // Kayıtlı bir bağlantının 404 görmesi, kaldırma kararını kullanıcıya
  // yıkmaktır. Proje bu kararı `/crm/integrations` için zaten vermişti.
  for (const ad of ['integrations', 'help']) {
    const kaynak = rotalar().get(ad);

    assert.ok(kaynak, `/crm/${ad} sayfası yok`);
    assert.match(kaynak, /redirect\(`\/\$\{locale\}\/crm\//, `/crm/${ad} yönlendirme yapmıyor`);
  }
});

test('kenar çubuğundaki her bağlantının rotası var', () => {
  // Menüde olup rotası olmayan bir bağlantı 404 verir; sessiz çünkü kimse
  // her menü ögesini tıklamıyor.
  const duzen = oku(path.join(uygulamaKok, 'src/components/crm/CRMLayout.jsx'));
  const mevcut = rotalar();

  const yollar = [...new Set(
    [...duzen.matchAll(/path:\s*'\/crm\/([a-z0-9-]+)'/g)].map((m) => m[1]),
  )];

  assert.ok(yollar.length >= 8, `menü ayrıştırılamadı: ${yollar.length} bağlantı`);

  const eksik = yollar.filter((y) => !mevcut.has(y));

  assert.deepEqual(eksik, [], 'menüde olup rotası olmayan CRM bağlantıları');
});

test('yönlendirme hedefleri gerçek ekranlar', () => {
  // Bir yönlendirme, kendisi de yönlendiren ya da var olmayan bir adrese
  // gitmemeli.
  const mevcut = rotalar();

  for (const [ad, kaynak] of mevcut) {
    const hedef = kaynak.match(/redirect\(`\/\$\{locale\}\/crm\/([a-z0-9-]+)`\)/);
    if (!hedef) continue;

    const hedefKaynak = mevcut.get(hedef[1]);

    assert.ok(hedefKaynak, `/crm/${ad} → /crm/${hedef[1]}: hedef rota yok`);
    assert.doesNotMatch(
      hedefKaynak,
      /redirect\(/,
      `/crm/${ad} → /crm/${hedef[1]}: hedef de yönlendiriyor (zincir)`,
    );
  }
});
