import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * İçerik çevirisinin HEDEF dili.
 *
 * Bulunan hata: hedef dil sunucudaki `preferred_language` kopyasından
 * alınıyordu. Başlıktaki dil seçici o sütunu HİÇ yazmıyor (yalnız profil ve
 * CRM ayarları yazıyor), dolayısıyla Almancaya geçen bir kullanıcının
 * sunucudaki dili `tr` kalıyordu. Hedef `tr` olunca Türkçe gönderi Türkçeye
 * "çevriliyor" ve metin AYNEN dönüyordu. Arka uçta ölçüldü:
 *
 *   hedef tr → "Robotik kalp cerrahisinde yeni bir çağ başlıyor"  (değişmedi)
 *   hedef de → "Eine neue Ära in der robotergestützten Herzchirurgie beginnt"
 *
 * Kullanıcının gördüğü: arayüz Almanca, tik işaretli, gönderiler Türkçe.
 * Hata SESSİZ: istek 200 dönüyor, çeviri "başarılı", sonuç aynı metin —
 * hiçbir hata kaydı düşmüyor.
 *
 * Bu test kaynak düzeyinde: bileşenler React ağacı gerektiriyor ve paket
 * bağımlılıksız (node --test) koşuyor. Ölçüt, kırılan satırların geri
 * gelmemesi.
 */

const oku = (yol) => readFileSync(new URL(`../../${yol}`, import.meta.url), 'utf8');

test('toplu çeviri hedefi sunucudaki eski dil kopyası değil', () => {
  const kaynak = oku('context/ContentTranslationContext.jsx');

  assert.match(
    kaynak,
    /contentTranslationAPI\.batch\(\s*gonderilecek\s*,\s*hedefDil\s*\)/,
    'toplu çeviri hedefi hedefDil değil — eski `durum?.language` geri gelmiş olabilir',
  );
  assert.doesNotMatch(
    kaynak,
    /batch\([^)]*durum\?\.language/,
    'hedef yine sunucudaki preferred_language kopyasından alınıyor',
  );
});

test('hedef dil aktif arayüz dilinden türetiliyor', () => {
  const kaynak = oku('context/ContentTranslationContext.jsx');

  assert.match(kaynak, /useTranslation/, 'i18n dili bağlama hiç alınmamış');
  assert.match(
    kaynak,
    /const hedefDil = .*i18n\?\.language/,
    'hedefDil aktif arayüz dilinden türetilmiyor',
  );
});

test('dil değişince eldeki çeviriler temizleniyor', () => {
  // Temizlenmezse Fransızcaya geçen kullanıcı ekranda Almanca metin görür:
  // önbellek anahtarı yalnız gönderi kimliği, dil değil.
  const kaynak = oku('context/ContentTranslationContext.jsx');

  assert.match(
    kaynak,
    /setCeviriler\(\{\}\);[\s\S]{0,200}\}, \[hedefDil\]\)/,
    'dil değişiminde çeviri önbelleği sıfırlanmıyor',
  );
});

test('başlıktaki dil seçici sunucudaki dili de güncelliyor', () => {
  // Sunucudaki sütun e-posta ve bildirim dilinde kullanılıyor; seçici onu
  // yazmazsa kullanıcı arayüzü değiştirir ama postalar eski dilde gelir.
  const kaynak = oku('components/ui/LanguageSwitcher.jsx');

  assert.match(
    kaynak,
    /updateProfile\(\{\s*preferred_language:\s*code\s*\}\)/,
    'dil seçici sunucudaki preferred_language sütununu güncellemiyor',
  );
  assert.match(kaynak, /getStoredToken\(\)/, 'misafir kullanıcı için de istek atılıyor olabilir');
});
