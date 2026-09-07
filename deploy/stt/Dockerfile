# Medagama STT — faster-whisper, CPU. Model derleme sırasında indirilir ki
# konteyner açılışta internete çıkmasın ve ilk istek beklemesin.
FROM python:3.11-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG WHISPER_MODEL=small
ENV WHISPER_MODEL=${WHISPER_MODEL} \
    HF_HUB_DISABLE_TELEMETRY=1 \
    PYTHONUNBUFFERED=1
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('${WHISPER_MODEL}', device='cpu', compute_type='int8')"

COPY app.py .

# Kök olmayan kullanıcı; model önbelleği onun ev dizininde kalsın.
RUN useradd -r -m stt && cp -r /root/.cache /home/stt/.cache 2>/dev/null || true \
 && chown -R stt:stt /home/stt /srv
USER stt
ENV HOME=/home/stt

EXPOSE 9100
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9100", "--timeout-keep-alive", "30"]
