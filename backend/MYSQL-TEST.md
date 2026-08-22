# Testleri gerçek MySQL'e karşı çalıştırma

Test paketi varsayılan olarak SQLite (bellek içi) kullanıyor — hızlı, ama
**canlı sürücü o değil.** Canlıda TiDB (MySQL uyumlu) var ve iki sürücü
sessizce farklı davranıyor.

Bu fark teorik değil. Yalnız MySQL'e karşı koşarak bulunan hatalar:

- `/api/admin/users/{id}` her çağrıda **500** veriyordu: sorgu var olmayan
  `start_time`/`end_time` sütunlarını seçiyordu. SQLite bunu sessizce
  tolere ediyor, MySQL sert hata veriyor.
- Yeniden tohumlama akışa **14 kopya gönderi** ekliyordu: sırasız bir
  `first()` MySQL'de farklı satır döndürebiliyor.
- Ayrıca `ESCAPE '\'` hatası (arama ucu canlıda 500) aynı sınıftandı ve
  yerelde 600+ test yeşilken gözden kaçmıştı.

## Kurulum (tek seferlik)

```bash
brew install mysql
brew services start mysql
mysql -u root -e "CREATE DATABASE medagama_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Çalıştırma

```bash
php artisan test -c phpunit.mysql.xml
```

`phpunit.mysql.xml` yalnız bağlantı ayarlarında farklı; test listesi aynı.

## Notlar

- `DB_SSL_DISABLED=true` YALNIZ bu yapılandırmada kullanılıyor. Canlı
  yapılandırma değişmiyor — anahtar kurulmadıkça SSL davranışı eskisi gibi.
- Yerel MySQL kendi imzaladığı sertifikayı kullandığı ve uygulama TiDB için
  SSL zorunlu kıldığı için bu anahtar olmadan bağlantı kurulamıyor.
- SQLite koşusunda 3 Türkçe katlama testi atlanıyor (SQLite `LOWER()` Türkçe
  harfleri katlamıyor). MySQL'de **çalışıyorlar** — o testleri gerçekten
  doğrulayan koşu budur.

## Ne zaman çalıştırılmalı

En az: ham SQL'e (`whereRaw`, `selectRaw`, `DB::raw`, `ESCAPE`, `REGEXP`)
dokunan her değişiklikten sonra ve canlıya çıkmadan önce.
