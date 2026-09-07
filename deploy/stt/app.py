"""
Medagama — konuşmayı yazıya çeviren servis (kendi sunucumuzda).

Neden var: telehealth alt yazısı hasta konuşmasını işler; bu sağlık verisidir
ve üçüncü tarafa gönderilemez (uyum kararı, 3 Ağustos 2026). Bu servis
sesi yalnız bellekte tutar, yazıya çevirir, döner — diske hiçbir şey yazmaz,
hiçbir dış adrese çıkmaz. Çeviri de aynı makinedeki LibreTranslate'e gider.

Bu CPU sürümü "şimdilik": `faster-whisper small int8`, 4 vCPU'da 4 sn'lik bir
parça ~1-2 sn'de çevriliyor. GPU sunucu gelince yalnız model adı ve cihaz
değişir; uç noktalar, jeton biçimi ve Laravel tarafı aynı kalır.

Uç noktalar:
  GET  /health            — Laravel `kullanilabilir()` bunu yoklar
  POST /transcribe        — CANLI parça (jeton: randevuya bağlı, süreli, HMAC)
  POST /transcribe-file   — KAYITLI dosya (gönderi videoları; paylaşılan gizli anahtar)
"""
from __future__ import annotations

import hashlib
import hmac
import io
import logging
import os
import subprocess
import threading
import time

import numpy as np
import requests
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

log = logging.getLogger("stt")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

SECRET = os.environ.get("STT_SECRET", "")
MODEL = os.environ.get("WHISPER_MODEL", "small")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")
THREADS = int(os.environ.get("WHISPER_THREADS", "4"))
LT_URL = os.environ.get("LIBRETRANSLATE_URL", "http://127.0.0.1:5000")
DILLER = [d for d in os.environ.get("STT_LANGUAGES", "tr,en,de,ar,ru,fr,es").split(",") if d]
MAX_CHUNK = 8 * 1024 * 1024        # canlı parça: 4 sn opus ≈ 40 KB; 8 MB bol bol
MAX_FILE = 400 * 1024 * 1024       # gönderi videosu

if not SECRET:
    raise SystemExit("STT_SECRET tanımlı değil — jeton doğrulanamaz, servis açılmadı.")

app = FastAPI(title="medagama-stt", docs_url=None, redoc_url=None)

# Tarayıcı sesi DOĞRUDAN buraya gönderir (Laravel'den geçmez — ses, kendi
# sunucumuz dışında bir yere uğramasın). Farklı köken olduğu için CORS şart;
# ilk tarayıcı denemesinde her parça "blocked by CORS policy" ile düştü,
# Node'dan atılan test bunu göremiyordu. Kökenler ayardan, joker yok.
KOKENLER = [k.strip() for k in os.environ.get(
    "STT_ALLOWED_ORIGINS",
    "https://med-gama.vercel.app,http://127.0.0.1:3000,http://localhost:3000",
).split(",") if k.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=KOKENLER,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
    max_age=600,
)

# Model bir kez yüklenir; iki konuşmacı aynı anda gönderirse sırayla işlenir.
# 4 vCPU'da iki paralel çeviri birbirini yavaşlatır, sırayla daha hızlı biter.
_model = WhisperModel(MODEL, device=DEVICE, compute_type=COMPUTE, cpu_threads=THREADS, num_workers=1)
_kilit = threading.Lock()
log.info("model hazır: %s (%s/%s, %d iş parçacığı)", MODEL, DEVICE, COMPUTE, THREADS)


# ── Jeton ────────────────────────────────────────────────────────────────────
# Laravel `WhisperEngine::oturumAc()` ile birebir aynı biçim:
#   "<appointmentId>.<exp>.<hex(HMAC_SHA256(secret, "<appointmentId>.<exp>"))>"
# Randevuya bağlı ve süreli: başka bir randevunun jetonuyla ya da süresi
# dolmuş bir jetonla ses gönderilemez.
def jeton_dogrula(jeton: str) -> str:
    try:
        randevu, exp, imza = jeton.split(".", 2)
        exp_i = int(exp)
    except (ValueError, AttributeError):
        raise HTTPException(401, "jeton biçimi geçersiz")
    if exp_i < int(time.time()):
        raise HTTPException(401, "jeton süresi dolmuş")
    beklenen = hmac.new(SECRET.encode(), f"{randevu}.{exp}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(beklenen, imza):
        raise HTTPException(401, "jeton imzası geçersiz")
    return randevu


# ── Ses çözme ────────────────────────────────────────────────────────────────
# Tarayıcıdan webm/opus ya da mp4/aac gelir; ffmpeg 16 kHz mono float32'ye
# çevirir. Girdi de çıktı da bellek — diske dokunulmaz.
def sesi_coz(ham: bytes) -> np.ndarray:
    try:
        p = subprocess.run(
            ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", "pipe:0",
             "-f", "f32le", "-ac", "1", "-ar", "16000", "pipe:1"],
            input=ham, capture_output=True, timeout=120, check=False,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(422, "ses çözülemedi (zaman aşımı)")
    if p.returncode != 0 or not p.stdout:
        raise HTTPException(422, "ses çözülemedi: " + p.stderr.decode(errors="ignore")[:200])
    return np.frombuffer(p.stdout, dtype=np.float32)


def cevir(ses: np.ndarray, dil: str | None, canli: bool) -> tuple[str, list[dict], str | None]:
    """Dönen: (birleşik metin, segmentler, tespit edilen dil)."""
    secenekler = dict(
        language=dil if dil and dil != "auto" else None,
        # Sessiz parçalarda Whisper metin UYDURUR ("Altyazı M.K." gibi);
        # VAD süzgeci sessizliği atar. Canlıda parça kısa, eşik düşük.
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=300 if canli else 500),
        beam_size=1 if canli else 5,
        condition_on_previous_text=False,
        no_speech_threshold=0.6,
    )
    with _kilit:
        segmentler, bilgi = _model.transcribe(ses, **secenekler)
        parcalar = [
            {"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()}
            for s in segmentler if s.text.strip()
        ]
    metin = " ".join(p["text"] for p in parcalar).strip()
    return metin, parcalar, (bilgi.language if bilgi else None)


def tercume(metin: str, kaynak: str | None, hedef: str) -> str | None:
    """Aynı makinedeki LibreTranslate. Ulaşılamazsa None — alt yazı özgün dilde kalır."""
    if not metin or not hedef:
        return None
    if kaynak and kaynak[:2] == hedef[:2]:
        return None
    try:
        r = requests.post(
            f"{LT_URL.rstrip('/')}/translate",
            json={"q": metin, "source": (kaynak or "auto")[:2], "target": hedef[:2], "format": "text"},
            timeout=8,
        )
        if r.ok:
            return (r.json().get("translatedText") or "").strip() or None
        log.warning("çeviri yanıtı %s: %s", r.status_code, r.text[:120])
    except requests.RequestException as e:
        log.warning("çeviri ulaşılamadı: %s", e)
    return None


# ── Uç noktalar ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"ok": True, "engine": f"whisper-{MODEL}-{DEVICE}", "languages": DILLER}


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    token: str = Form(...),
    lang: str = Form("auto"),
    target: str | None = Form(None),
):
    randevu = jeton_dogrula(token)
    ham = await audio.read()
    if len(ham) > MAX_CHUNK:
        raise HTTPException(413, "parça çok büyük")
    if len(ham) < 200:
        return {"text": "", "language": None, "translated": None}

    t0 = time.time()
    metin, _, tespit = cevir(sesi_coz(ham), lang, canli=True)
    cevrilmis = tercume(metin, tespit or (lang if lang != "auto" else None), target) if target else None
    log.info("canlı %s: %d bayt → %d karakter, %.1fs", randevu[:8], len(ham), len(metin), time.time() - t0)
    return {"text": metin, "language": tespit, "translated": cevrilmis, "target": target}


@app.post("/transcribe-file")
async def transcribe_file(
    audio: UploadFile = File(...),
    lang: str | None = Form(None),
    x_stt_secret: str | None = Header(None),
):
    # Dosya çevirisi randevuya bağlı değil; Laravel arka planda çağırır.
    # Yetki: paylaşılan gizli anahtar, sabit-zamanlı karşılaştırma.
    if not x_stt_secret or not hmac.compare_digest(x_stt_secret, SECRET):
        raise HTTPException(401, "yetkisiz")
    ham = await audio.read()
    if len(ham) > MAX_FILE:
        raise HTTPException(413, "dosya çok büyük")
    t0 = time.time()
    _, parcalar, tespit = cevir(sesi_coz(ham), lang, canli=False)
    log.info("dosya: %d bayt → %d segment, %.1fs", len(ham), len(parcalar), time.time() - t0)
    return {"language": tespit, "segments": parcalar}
