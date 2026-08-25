import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Bir yazma isteğinde gönderilen alan, arka uçta kabul edilmiyorsa SESSİZCE
 * kaybolur — ve kaybolan şey kullanıcının girdiği veridir.
 *
 * Bulunan örnek: profil ekranında parola değiştirme.
 *
 *     const yanit = await authAPI.changePassword({ … });   // doğru uç
 *     } catch (err) {
 *       if (err?.status === 404) {
 *         await authAPI.updateProfile({ current_password, password, … });
 *         showToast('Password updated successfully ✓');
 *       }
 *
 * Bu yedek ÇALIŞAMAZ. `PUT /auth/profile` doğrulaması yalnızca `fullname`,
 * `avatar`, `mobile`, `city_id`, `country_id`, `country`, `preferred_language`,
 * `date_of_birth` ve `gender` kabul ediyor; `AuthService::updateProfile`
 * parolaya hiç dokunmuyor. Laravel `validated()` tanınmayan alanları düşürdüğü
 * için istek 200 dönüyor ve ekran "başarılı" diyor — parola değişmemiş olarak.
 *
 * Özel uç (`PUT /auth/profile/password`) bugün var, yani yedek tetiklenmiyor.
 * Ama rota adı değiştiği gün, sessizce yanlış söyleyen bir yol açılıyordu.
 * Kullanıcının parolasını değiştirdiğini SANMASI, hata görmesinden kötü: eskisini
 * kullanmaya devam eder ve bir daha bakmaz.
 *
 * Kalan otuz üç yazma çağrısı elle tarandı; başka uyumsuzluk yok. Üç aday
 * yanlış pozitifti ve nedenleri burada yazılı, çünkü aynı yerlerde yeniden
 * takılmak kolay:
 *
 *   • `/crm/billing/invoices` — alanlar `items.*.description` gibi İÇ İÇE
 *     kurallarla tanımlı.
 *   • `/auth/profile/notification-preferences` — kurallar
 *     `NotificationPreferences::AYARLAR` sabitinden DİNAMİK üretiliyor.
 *   • `/doctor-profile/onboarding` — `$request->except(['step'])` + `fill()`
 *     kullanıyor, yani modelin `$fillable` listesi geçerli.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklama yorumu kaldırılan çağrıyı METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//') && !s.trim().startsWith('*'))
    .join('\n');
}

test('parola değişimi yalnız kendi ucuna gidiyor', () => {
  const profil = yorumsuz(oku('src/screens/Profile.jsx'));

  assert.match(profil, /authAPI\.changePassword\(/, 'özel parola ucu çağrılmıyor');
  assert.doesNotMatch(
    profil,
    /updateProfile\(\{[^}]*password/,
    'Parola alanları `/auth/profile` ucuna gönderiliyor. O uç onları doğrulamıyor\n'
      + 've servis parolaya dokunmuyor: istek başarılı döner, parola değişmez.',
  );
});

test('parola ekranı olmayan bir başarıyı duyurmuyor', () => {
  // Eski yedek `showToast('Password updated successfully ✓')` diyordu — hem
  // yanlış hem de tek sabit İngilizce metin.
  const profil = yorumsuz(oku('src/screens/Profile.jsx'));

  assert.doesNotMatch(profil, /Password updated successfully/, 'sabit İngilizce başarı mesajı geri gelmiş');
});

test('parola ucu gerçekten var', () => {
  // Yedek kaldırıldığı için bu uç artık tek yol. Adı değişirse parola değiştirme
  // tümüyle çalışmaz — sessizce değil, görünür biçimde; yine de burada yakalansın.
  const api = yorumsuz(oku('src/lib/api.js'));
  const rotalar = yorumsuz(oku('backend/routes/api.php'));

  const m = api.match(/changePassword:\s*\([^)]*\)\s*=>\s*api\.put\(\s*'([^']+)'/);
  assert.ok(m, 'changePassword tanımı bulunamadı');

  // `/auth/profile/password` → rota dosyasında grup öneki olmadan `/profile/password`.
  const yol = m[1].replace(/^\/auth/, '');
  assert.ok(
    rotalar.includes(`'${yol}'`),
    `${m[1]} için rota yok — parola değiştirme çalışmaz`,
  );
});

test('/auth/profile hâlâ parola kabul etmiyor', () => {
  // Ölçütün dayandığı gerçek. Uç bir gün parola almaya başlarsa yukarıdaki
  // yasak gereksizleşir ve bu dosya gözden geçirilmeli.
  const istekDosyasi = path.join(uygulamaKok, 'backend/app/Http/Requests/Auth/UpdateProfileRequest.php');

  assert.ok(existsSync(istekDosyasi), 'UpdateProfileRequest bulunamadı — ölçüt güncellenmeli');

  const kurallar = readFileSync(istekDosyasi, 'utf8');

  assert.doesNotMatch(kurallar, /'password'\s*=>/, 'profil ucu artık parola kabul ediyor: bu dosyayı gözden geçirin');
});

test('yazma çağrılarının hepsi taranabiliyor', () => {
  // Elle taranan otuz üç çağrı buradan geliyor. Sayı çökerse tarama körelmiş
  // demektir — aradığı hatayla aynı sessizlik.
  const api = yorumsuz(oku('src/lib/api.js'));
  const yazmaUclari = [...api.matchAll(/(\w+):\s*\([^)]*\)\s*=>\s*api\.(post|put|patch)\(/g)];

  assert.ok(yazmaUclari.length > 100, `yazma ucu sayısı beklenenden az: ${yazmaUclari.length}`);

  let cagri = 0;
  const gez = (dizin) => {
    for (const g of readdirSync(dizin, { withFileTypes: true })) {
      if (g.name === '__tests__' || g.name === 'node_modules') continue;

      const tam = path.join(dizin, g.name);
      if (g.isDirectory()) { gez(tam); continue; }
      if (!/\.jsx?$/.test(g.name)) continue;

      cagri += [...yorumsuz(readFileSync(tam, 'utf8')).matchAll(/\w+API\.\w+\(\{/g)].length;
    }
  };
  gez(path.join(uygulamaKok, 'src'));

  assert.ok(cagri > 30, `nesne gövdeli API çağrısı bulunamadı: ${cagri}`);
});
