#!/usr/bin/env python3
"""MedaGama — Tıbbi Arşiv Paylaşımı müşteri raporu (tek sayfa PDF)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

FONT = "AU"
pdfmetrics.registerFont(TTFont(FONT, "/Library/Fonts/Arial Unicode.ttf"))

TEAL = colors.HexColor("#0d9488")
DARK = colors.HexColor("#111827")
GRAY = colors.HexColor("#6b7280")
LIGHT = colors.HexColor("#f0fdfa")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


title = st("t", fontSize=19, textColor=DARK, leading=23, spaceAfter=2)
sub = st("s", fontSize=9.5, textColor=GRAY, leading=13, spaceAfter=2)
h2 = st("h2", fontSize=12, textColor=TEAL, leading=16, spaceBefore=11, spaceAfter=5)
body = st("b", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
small = st("sm", fontSize=8.5, textColor=GRAY, leading=12)
cellh = st("ch", fontSize=9, textColor=colors.white, leading=12)
cell = st("c", fontSize=9, textColor=DARK, leading=12.5)


def bullets(items):
    return [Paragraph(f"•&nbsp;&nbsp;{x}", body) for x in items]


doc = SimpleDocTemplate(
    "docs/MedaGama_Tibbi_Arsiv_Paylasimi.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("Tıbbi Arşiv Paylaşımı", title))
E.append(Paragraph("MedaGama — Yapılan Çalışma Özeti", sub))
E.append(Spacer(1, 4))
E.append(HRFlowable(width="100%", thickness=1.2, color=TEAL))
E.append(Spacer(1, 6))

E.append(Paragraph(
    "<b>Amaç:</b> Hasta bir kliniğe/doktora randevu aldığında, tıbbi bilgilerinin "
    "karşı tarafa <b>güvenli ve kontrollü</b> şekilde ulaşması.", body))
E.append(Paragraph(
    "<b>Seçilen model — Hibrit:</b> Hem hasta güvenliği hem hasta mahremiyeti aynı anda korunur.", body))

E.append(Paragraph("Nasıl Çalışıyor?", h2))

data = [
    [Paragraph("<b>Katman</b>", cellh), Paragraph("<b>Görünürlük</b>", cellh), Paragraph("<b>İçerik</b>", cellh)],
    [Paragraph("Otomatik Özet", cell), Paragraph("Her zaman açık", cell),
     Paragraph("Bilinen hastalıklar / alerjiler + kullanılan ilaçlar", cell)],
    [Paragraph("Tam Arşiv", cell), Paragraph("Hastanın onayıyla", cell),
     Paragraph("Aşılar, doktor notları, yüklenen belgeler", cell)],
]
tbl = Table(data, colWidths=[33 * mm, 34 * mm, 107 * mm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, colors.white]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
E.append(tbl)
E.append(Spacer(1, 5))
E.append(Paragraph(
    "Otomatik özet, ilaç etkileşimi veya alerji gibi <b>riskleri önlemek</b> için daima açıktır. "
    "Tam arşiv ise <b>yalnızca hasta o randevu için “Paylaş” dediğinde</b> görünür.", body))

E.append(Paragraph("Hasta Kontrolü", h2))
E += bullets([
    "Hasta istediği an paylaşımı <b>geri alabilir</b>.",
    "İzin <b>sadece o randevuya bağlı</b> ve sürelidir; randevu bitince otomatik kapanır.",
    "Onay yoksa doktor <b>yalnızca özeti</b> görür; detaya erişemez.",
])

E.append(Paragraph("Kullanıcı Deneyimi", h2))
E += bullets([
    "<b>Hasta ekranı:</b> Randevu kartında “Bu randevu için arşivimi paylaş” / “Geri Al” butonu.",
    "<b>Doktor / klinik ekranı:</b> Özet her zaman; hasta onayladıysa tam arşiv + belge indirme.",
])

E.append(Paragraph("Güvenlik ve Uyumluluk (KVKK / GDPR / HIPAA)", h2))
E += bullets([
    "Tüm tıbbi veriler <b>şifreli</b> saklanır.",
    "Belgeler özel/korumalı alanda; izinsiz erişim engellidir.",
    "<b>Her erişim, her paylaşım ve her geri alma kayıt altına alınır</b> (denetim kaydı).",
    "Erişim yalnızca hasta + açıkça izin verdiği sağlayıcı ile sınırlıdır.",
])

E.append(Spacer(1, 8))
E.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#d1d5db")))
E.append(Spacer(1, 4))
E.append(Paragraph(
    "<b>Durum:</b> Backend ve arayüz tamamlandı, sisteme alındı. "
    "Canlı test bir hasta hesabıyla örnek randevu üzerinde birlikte gösterilebilir.", small))

doc.build(E)
print("OK docs/MedaGama_Tibbi_Arsiv_Paylasimi.pdf")
