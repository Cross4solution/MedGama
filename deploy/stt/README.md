# Alt yazı motoru (STT) + çeviri — kendi sunucumuzda

Telehealth görüşmesinin canlı alt yazısı ve gönderi videolarının alt yazısı
bu servisten geçer. **Hasta konuşması sağlık verisidir; üçüncü tarafa
gitmez.** Ses yalnız bellekte çevrilir, diske yazılmaz, metin saklanmaz
(bkz. `backend/config/captions.php`).

## Nerede çalışıyor

OVH `57.128.27.244` (sslip.io alan adı `57-128-27-244.sslip.io`), Docker:

| Konteyner        | Görev                         | Dinler            | Dışarıdan                                  |
|------------------|-------------------------------|-------------------|--------------------------------------------|
| `medagama-stt`   | faster-whisper `small` (CPU)  | 127.0.0.1:9100    | `https://57-128-27-244.sslip.io/stt/`      |
| `libretranslate` | çeviri (tr en de ar ru fr es) | 127.0.0.1:5000    | `https://57-128-27-244.sslip.io/lt/`       |

İkisi de yalnız yerelde dinler; TLS'i nginx verir (Let's Encrypt, otomatik).

## Bugünkü durum: CPU, "şimdilik"

Karar (7 Eylül 2026): GPU sunucu müşteride beklediği için **CPU'da küçük
model ile teslim**. Ölçüldü: 4 sn'lik Türkçe parça ~2.3 sn'de çevriliyor.
Kalite asgari düzeyde — ör. "ağrıyor" → "arıyor" gibi hatalar oluyor ve
çeviri o hatayı taşıyor.

**GPU gelince** — Laravel'de hiçbir şey değişmez, yalnız bu servis büyür:

```bash
# sunucuda
sudo WHISPER_MODEL=large-v3 WHISPER_DEVICE=cuda WHISPER_COMPUTE=float16 \
     STT_SECRET=$(sudo grep STT_SECRET /etc/medagama/stt.env | cut -d= -f2) \
     bash /home/ubuntu/stt/kur.sh
```
(Dockerfile'a CUDA tabanlı imaj + `nvidia-container-toolkit` eklenir; jeton,
uç noktalar ve ön yüz aynı kalır.)

## Kurulum / yeniden kurulum

```bash
scp -i ~/.ssh/medagama_deploy -r deploy/stt ubuntu@57.128.27.244:/home/ubuntu/
ssh -i ~/.ssh/medagama_deploy ubuntu@57.128.27.244
sudo STT_SECRET=<gizli> bash /home/ubuntu/stt/kur.sh
```

Gizli anahtar `/etc/medagama/stt.env` içinde (yalnız root okur). Aynı değer
Render'da `CAPTIONS_WHISPER_SECRET` olmak zorunda — jeton bununla imzalanır.

## Laravel tarafı (Render ortam değişkenleri)

```
CAPTIONS_ENGINE=whisper
CAPTIONS_WHISPER_URL=https://57-128-27-244.sslip.io/stt
CAPTIONS_WHISPER_SECRET=<sunucudaki STT_SECRET ile aynı>
TRANSLATE_PROVIDER=libretranslate
LIBRETRANSLATE_URL=https://57-128-27-244.sslip.io/lt
```

`TRANSLATE_PROVIDER=libretranslate` ile gönderi çevirileri de artık kendi
sunucumuzdan geçer (eskiden MyMemory — üçüncü taraf).

## Nasıl çalışıyor

1. Görüşmede alt yazı açılınca (karşı taraf onaylayınca) tarayıcı
   `GET /api/telehealth/{id}/caption-session` ister → `{url, token, language}`.
2. Jeton: `"<randevu>.<exp>.<HMAC-SHA256>"` — randevuya bağlı, 1 saat.
   Laravel `WhisperEngine::jetonUret`, servis `app.py:jeton_dogrula`;
   **iki taraf birebir aynı olmalı** (`CanliAltYaziTest` bunu sınıyor).
3. Tarayıcı mikrofonu 4 sn'lik parçalarla `POST {url}` — `audio`, `token`,
   `lang`, `target` (karşı tarafın dili). Yanıt: `{text, language, translated}`.
4. Konuşanın tarayıcısı satırı sinyal kanalından (`caption-line`) karşıya
   yollar; karşı taraf çevrilmiş metni okur.

## İşletme

```bash
sudo docker logs -f medagama-stt          # istek başına süre/karakter
sudo docker restart medagama-stt libretranslate
curl -s http://127.0.0.1:9100/health      # {"ok":true,...}
curl -s http://127.0.0.1:5000/languages   # çeviri hazır mı
sudo docker stats --no-stream             # bellek (STT ~350 MB boşta, ~1.2 GB çevirirken)
```

Servis düşerse Laravel `/health`'i bir dakika önbellekler; düğme en geç bir
dakika içinde pasifleşir, görüşme etkilenmez.
