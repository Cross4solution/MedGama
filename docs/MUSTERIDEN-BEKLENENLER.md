# Medagama — Müşteri'den Beklenenler

7 Eylül 2026 · Teslim tutanağının eki

## Kısaca

Aşağıdaki kalemlerin hepsi daha önce Müşteri'ye yazılı olarak iletildi ve
bugüne kadar dönüş gelmedi. İki gruba ayrılıyor:

- **A. Teslimi bekleten girdiler (6 kalem):** hesap, onay ya da lisans
  gelmeden ilgili modül tamamlanamıyor. Geliştirme tarafı hazır.
- **B. Cevap bekleyen soru (1 kalem):** cevap gelmediği için makul bir
  varsayımla ilerlendi; cevap gelince o yönde değiştirilebilir.

Her kalemde ne istendiği, ne için gerektiği ve ne zaman hangi belgeyle
istendiği yazılı. Belgelerin kendileri teslim paketinde.

---

## A. Teslimi bekleten girdiler

| # | Ne bekleniyor | Ne için gerekli | Ne zaman, hangi belgeyle istendi | Durum |
|--|--|--|--|--|
| 1 | **Sanal POS / ödeme sağlayıcısı hesabı** (iyzico, PayTR, Stripe vb.) ve API anahtarları | Site içi online ödeme, randevu kaporası, ücretli profesyonel inceleme | 12 Ağustos 2026 — "Randevu Kaporası — Ödeme Akışı" ve "Hasta Deneyimi" belgeleri | Dönüş yok |
| 2 | **Sağlık turizmi taslağının onayı ya da düzeltmeleri**; A / B seçeneğinden biri; uçuş / otel verisi istenirse API lisansı | Tek tuşla sağlık turizmi paketi modülü | 10 Ağustos 2026 — "Tek Tuşla Sağlık Turizmi" karar belgesi | Dönüş yok |
| 3 | **GPU sunucu** ya da bulut GPU hesabı | Yapay zekânın Müşteri verisiyle eğitilmesi; alt yazı motorunun büyük modele taşınması | 3 Ağustos 2026 sunucu kararında; 12 Ağustos 2026 "Alt Yazı Planı" belgesi | Dönüş yok |
| 4 | **Alan adı** (medagama.com) satın alınması ve DNS erişimi | Kayıt ve şifre sıfırlama e-postaları (bugün hiç e-posta gidemiyor), kalıcı sertifika ve site adresi | 12 Ağustos 2026 "E-posta Seçenekleri" belgesi; 21 Ağustos 2026 e-posta engelinin bildirimi | Dönüş yok |
| 5 | **AWS hesabı** (Frankfurt bölgesi) | Hasta belgelerinin ve yedeklerin buluta taşınması | 12 Ağustos 2026 "Dosya Saklama Seçenekleri" belgesi; aynı gün Frankfurt kararı teyit edildi | Karar verildi, hesap açılmadı |
| 6 | **Hukuk onaylı metinler:** KVKK aydınlatma, kullanım şartları, çerez politikası; belge türüne göre yasal saklama süreleri | Son metinlerin siteye konması; saklama sürelerinin sistemde uygulanması | 3 Ağustos 2026 pazar kararıyla; 12 Ağustos 2026 "Mevzuat Uyumu: İletilmesi Gerekenler" ve "Saklama Süresi" belgeleri | Dönüş yok |

Sözleşme dayanağı: madde 4.4 (API lisansları, ödeme entegrasyonları, bulut
depolama, e-posta servisi ve alan adı Müşteri sorumluluğunda); madde 4.2
(yasal uyumluluk Müşteri'de); Ek-1 LLM maddesi (GPU eğitimi "yayından sonra
en geç 5 ay içinde").

## B. Cevap bekleyen soru

| # | Soru | Ne zaman soruldu | Bugünkü durum |
|--|--|--|--|
| 1 | Semptom ve işlem eş anlamlı listesi (halk diliyle arama: "burun estetiği", "nose job" gibi) için altı adımlı plan onaylanıyor mu? Listeyi kim girecek? | 22 Temmuz 2026 | Yönetim panelinde eş anlamlı giriş ekranı hazır (Katalog Yönetimi). Halk dili sözlüğü ve kimin dolduracağı kararı Müşteri'den bekleniyor; o gelene kadar arama katalogdaki adlarla ve Vasco AI ile çalışıyor |

## Sonuç

Bu kalemler iletildiğinde ilgili işler karşılıklı olarak en makul şekilde
ve ayrı bir iş planıyla projeye eklenecektir. İletilmediği sürece teslimin
tamamlanmasına engel oluşturmaz.
