# Geri Alma Planı (Rollback)

Bir dağıtım ters gittiğinde ne yapılacağı. O anda kimse düşünmek istemez;
adımlar sırayla uygulanacak şekilde yazıldı.

**Önce şunu bilin:** geri alma iki ayrı şeydir ve karıştırmak veri kaybettirir.

| | |
|---|---|
| **Kodu geri almak** | Hızlı, güvenli, çoğu durumda yeterli |
| **Veritabanını geri almak** | Yavaş, veri kaybettirir, son çare |

---

## 1. Kod geri alma — varsayılan yol

Render panelinde önceki dağıtıma dönülür (Deploys → önceki başarılı dağıtım →
Rollback). Birkaç dakika sürer.

**Veritabanına DOKUNULMAZ.** Göçler uygulanmış hâlde kalır.

Bu çoğu zaman doğru olan yoldur, çünkü göçlerin büyük kısmı yalnızca **ekleme**
yapıyor: yeni sütun, yeni indeks. Eski kod fazladan sütunu görmezden gelir ve
sorunsuz çalışır.

### Ama her göç böyle değil

Bazı göçler **var olan veriyi dönüştürüyor**. Bunlardan sonra kodu geri almak
uygulamayı bozar — veritabanı yeni biçimde, eski kod eski biçim bekliyor.

| Göç | Kod geri alınırsa ne olur |
|---|---|
| `2026_08_27_110000_iletisim_mesaji_govdesini_sifrele` | İletişim mesajı gövdeleri şifreli. Eski kodda şifre çözme yok — kullanıcıya **şifreli metin** görünür. |
| `2026_08_26_120000_dogrulama_basvurusuna_bilgi_istendi_durumu` | Yeni durum değeri (`info_requested`) veride var; eski kod onu tanımaz. |

**Kural:** bu göçlerden birini içeren bir sürümü dağıttıysanız, kodu ondan
öncesine geri almak **yetmez**. Ya ileri doğru düzeltme yapılır (yeni sürüm),
ya veritabanı da geri yüklenir.

---

## 2. Göç geri alma — genelde YANLIŞ yol

```bash
php artisan migrate:rollback
```

**Bunu refleksle çalıştırmayın.** İki sebeple:

**Birincisi:** 118 göçün **11'inin** `down()` gövdesi bilerek boş — veri
temizleme, sütun düşürme, geri doldurma gibi işler geri alınamaz. Rollback o
göçleri "geri aldım" der ama hiçbir şey yapmaz; şema ile kayıt arasındaki
ilişki sessizce bozulur.

**İkincisi:** geri alınabilen göçler bile veri siler. Yeni eklenmiş bir sütunu
düşürmek, o sütuna yazılmış her şeyi siler — dağıtımdan sonra girilen gerçek
veriyi de.

Göç geri alma yalnızca şu durumda anlamlı: **dağıtım yeni yapıldı, kimse
kullanmadı, ve göç yalnız yapı değiştiriyor.**

---

## 3. Veritabanı geri yükleme — son çare

Buraya ancak veri bozulduysa gelinir. Yordam ayrı belgede:
`docs/YEDEK-VE-GERI-YUKLEME.md`

Özet: önce yazmayı durdur, yedeği **yeni** bir veritabanına yükle, verinin
nereye kadar geldiğini ölç, sonra uygulamayı ona çevir.

**Kayıp kaçınılmaz:** son yedek 04:10'da alınıyor. Arıza saat 15:00'te olduysa
aradaki yaklaşık on bir saatlik veri gider — o gün alınan randevular, yazılan
mesajlar, kesilen faturalar.

---

## 4. Dosyalar

Kod geri alma dosyaları etkilemez; kalıcı diskte duruyorlar.

Ama **veritabanı geri yüklenirse dosyalar geri gelmez** — ikisi ayrı yerlerde.
Sonuç: veritabanı belge kaydını unutmuş olur ama dosya diskte durur (zararsız),
ya da kayıt durur dosya yoktur (belge açılmaz).

Bu, dosya deposunun kendi yedeği alınana kadar böyle kalacak.

---

## 5. Geri aldıktan sonra kontrol

Sırayla:

```bash
# 1. Uygulama ayakta mı
curl -sf https://<alan-adi>/api/health

# 2. Giriş çalışıyor mu
# 3. Randevu listesi açılıyor mu
# 4. Bir hasta belgesi açılıyor mu   ← dosya/veritabanı uyumunu gösterir
```

Dördüncüsü önemli: veritabanı ile dosya deposunun aynı ana ait olup olmadığını
gösteren en hızlı sınama.

Ardından Sentry'ye bakın — geri alma sonrası hata dalgası, uyumsuz bir şey
kaldığının işaretidir.

---

## 6. Geri alma ihtimalini azaltmak

Buradaki asıl kazanç, geri almayı hızlandırmak değil, gerekmemesini sağlamak:

- **Göçler geriye uyumlu yazılır.** Sütun eklemek güvenlidir; sütun düşürmek
  ya da veri dönüştürmek değildir. Dönüştürme gerekiyorsa iki sürüme bölünür:
  önce yeni biçimi yazan ve ikisini de okuyan sürüm, sonra eskiyi bırakan sürüm.
- **Veri dönüştüren göç, kod dağıtımıyla aynı sürümde gitmez.** Aksi halde geri
  alınacak tek bir nokta kalmaz.
- **Dağıtımdan önce yedek alındığı doğrulanır** (`db:yedek --dogrula`).

> `preDeployCommand` göçleri dağıtımdan ÖNCE çalıştırıyor. Yani göç başarısız
> olursa yeni kod hiç yayına girmez — bu iyi. Ama göç başarılı olup kod
> bozuksa, göç uygulanmış durumda kalır. Yukarıdaki tablo tam olarak bu durum
> için var.
