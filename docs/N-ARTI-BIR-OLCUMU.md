# N+1 ve sorgu sayısı ölçümü

**Sonuç: N+1 bulunmadı.** Bu belge ölçümün nasıl yapıldığını kaydediyor ki
aynı tarama baştan kurulmasın ve sonuç bir iddia değil, tekrarlanabilir bir
ölçüm olarak kalsın.

## Neden şimdi anlamlı

Önceki ölçümler SQLite üzerinde yapılmıştı. Üretim TiDB (MySQL uyumlu) ve
sorgu planları farklı. Yerel yığın üretimin sürücüsüne çevrildikten sonra
(bkz. `YEREL-TEST.md`) ölçüm ilk kez üretimle aynı motorda yapıldı.

## Yöntem

`X-Sorgu-Sayisi` başlığı (`TIMING_HEADER=true` ile açılıyor) her yanıtta o
istek için çalışan sorgu sayısını veriyor. N+1'in imzası basit: **sayfa
boyutu büyürken sorgu sayısı da büyüyorsa** kayıt başına ek sorgu var.

Kritik nokta — tohumda 21 randevu varken `per_page=50` istemek hepsini
döndürür ve sayılar sahte biçimde eşleşir. Ölçüm bu yüzden **200 hasta,
221 randevu** üretildikten sonra tekrarlandı.

## Ölçüm

Kimliksiz listeler (sayfa boyutu 5 → 50):

| uç | 5 | 50 |
|---|---|---|
| `clinics` | 2 | 2 |
| `doctors` | 5 | 5 |
| `medstream/posts` | 4 | 5 |

Oturumlu listeler (5 → 50 → 200, gerçek hacimle):

| uç | 5 | 50 | 200 | db |
|---|---|---|---|---|
| `crm/patients` | 7 | 7 | 7 | 5.3 ms |
| `appointments` | 5 | 5 | 5 | 2.5 ms |
| `crm/billing/invoices` | 6 | 6 | — | — |

`crm/billing/invoices` 200'de **422** dönüyor: `per_page` 100 ile sınırlı.
Bu doğru davranış — sınırsız sayfa boyutu, N+1 olmasa bile tek istekle
veritabanını yorabilirdi.

## Nasıl tekrarlanır

```bash
# 1) TIMING_HEADER=true (backend/.env), config:clear, sunucuyu yeniden başlat
# 2) jeton al
JETON=$(curl -s -i "http://127.0.0.1:8001/api/demo-login/klinik?key=<DEMO_LOGIN_KEY>" \
  | grep -oE "demo_token=[^&\"']+" | head -1 | cut -d= -f2)

# 3) aynı ucu iki sayfa boyutuyla çağır, başlığı karşılaştır
for N in 5 50; do
  curl -s -D - -o /dev/null -H "Authorization: Bearer $JETON" \
    "http://127.0.0.1:8001/api/crm/patients?per_page=$N" | grep -i X-Sorgu-Sayisi
done
```

Ölçüm bitince `TIMING_HEADER` **kapatılmalı**: başlık sorgu sayısını, süreyi
ve istisna sınıfının adını yanıta yazıyor (`render.yaml` üretimde açıkça
`false` diyor).
