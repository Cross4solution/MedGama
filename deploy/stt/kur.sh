#!/usr/bin/env bash
# Medagama — alt yazı motoru (STT) + çeviri (LibreTranslate) kurulumu.
# OVH sunucuda, sudo ile çalıştırılır. Tekrar çalıştırılabilir (idempotent).
#
#   sudo STT_SECRET=<gizli> bash kur.sh
#
# Ne yapar:
#   1. /etc/medagama/stt.env yazar (gizli anahtar, yalnız root okur)
#   2. STT imajını derler (model imajın içine iner) ve konteyneri açar
#   3. LibreTranslate konteynerini açar (yalnız gerekli 7 dil)
#   4. nginx'e /stt/ ve /lt/ yollarını ekler, yeniden yükler
# Her iki servis de YALNIZ 127.0.0.1'e bağlanır; dışarıya nginx (TLS) açar.
set -euo pipefail

if [[ -z "${STT_SECRET:-}" ]]; then
  echo "STT_SECRET ver: sudo STT_SECRET=... bash kur.sh" >&2
  exit 1
fi

BURASI="$(cd "$(dirname "$0")" && pwd)"
DILLER="tr,en,de,ar,ru,fr,es"
NGINX_SITE="$(ls /etc/nginx/sites-enabled/* | head -1)"

echo "== 1/4 gizli anahtar"
mkdir -p /etc/medagama
umask 077
cat > /etc/medagama/stt.env <<EOF
STT_SECRET=${STT_SECRET}
STT_LANGUAGES=${DILLER}
WHISPER_MODEL=${WHISPER_MODEL:-small}
WHISPER_THREADS=${WHISPER_THREADS:-4}
LIBRETRANSLATE_URL=http://libretranslate:5000
STT_ALLOWED_ORIGINS=${STT_ALLOWED_ORIGINS:-https://med-gama.vercel.app,http://127.0.0.1:3000,http://localhost:3000}
EOF
umask 022

docker network inspect medagama >/dev/null 2>&1 || docker network create medagama

echo "== 2/4 STT imajı ve konteyneri"
docker build -t medagama-stt:latest --build-arg WHISPER_MODEL="${WHISPER_MODEL:-small}" "$BURASI"
docker rm -f medagama-stt >/dev/null 2>&1 || true
docker run -d --name medagama-stt --restart unless-stopped \
  --network medagama \
  --env-file /etc/medagama/stt.env \
  -p 127.0.0.1:9100:9100 \
  --memory 3g --cpus 4 \
  medagama-stt:latest

echo "== 3/4 LibreTranslate"
if ! docker ps -a --format '{{.Names}}' | grep -qx libretranslate; then
  docker run -d --name libretranslate --restart unless-stopped \
    --network medagama \
    -p 127.0.0.1:5000:5000 \
    -e LT_LOAD_ONLY="${DILLER}" \
    -e LT_DISABLE_WEB_UI=true \
    -v libretranslate-models:/home/libretranslate/.local \
    --memory 4g \
    libretranslate/libretranslate:latest
else
  docker start libretranslate >/dev/null
fi

echo "== 4/4 nginx"
if ! grep -q 'location /stt/' "$NGINX_SITE"; then
  # 443 sunucu bloğundaki ilk `location / {` satırından ÖNCE eklenir.
  python3 - "$NGINX_SITE" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
ek = """    # Alt yazı motoru (STT) ve çeviri — yalnız yerelde dinlerler, dışarıya buradan.
    location /stt/ {
        proxy_pass http://127.0.0.1:9100/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 400m;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
    location /lt/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        client_max_body_size 2m;
        proxy_read_timeout 30s;
    }
"""
# yalnız 443 bloğu: 'listen 443' sonrasındaki ilk 'location / {'
i = s.index('listen 443')
j = s.index('    location / {', i)
s = s[:j] + ek + s[j:]
open(p, 'w').write(s)
PY
fi
nginx -t && systemctl reload nginx

echo
echo "STT sağlık:"; curl -s http://127.0.0.1:9100/health || echo "(henüz açılıyor — model yükleniyor)"
echo
echo "LibreTranslate modelleri ilk açılışta iner (birkaç dakika). Kontrol:"
echo "  curl -s http://127.0.0.1:5000/languages | head -c 200"
