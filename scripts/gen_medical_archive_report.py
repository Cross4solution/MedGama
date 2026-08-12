#!/usr/bin/env python3
"""Medagama — Tıbbi Arşiv Paylaşımı müşteri raporu (tek sayfa, Model B)."""
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
step = st("stp", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=4, leftIndent=2)


def bullets(items):
    return [Paragraph(f"•&nbsp;&nbsp;{x}", body) for x in items]


doc = SimpleDocTemplate(
    "docs/Medagama_Tibbi_Arsiv_Paylasimi.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("Tıbbi Arşiv Paylaşımı", title))
E.append(Paragraph("Medagama — Nasıl Çalışıyor?", sub))
E.append(Spacer(1, 4))
E.append(HRFlowable(width="100%", thickness=1.2, color=TEAL))
E.append(Spacer(1, 6))

E.append(Paragraph(
    "<b>Kural:</b> Hasta bir doktora/kliniğe randevu aldığında, o doktor hastanın "
    "<b>tüm tıbbi geçmişini (anamnez) otomatik</b> görür. Ayrı bir onay adımı yoktur.", body))
E.append(Paragraph(
    "<b>Neden?</b> Hasta neyin kritik olduğunu bilemez. Örnek: hasta C vitamini kullanır, "
    "“gerek yok” deyip gizler; doktor bunu görmeden etkileşen bir ilaç yazarsa risk doğar. "
    "Bu yüzden tedaviyi yapacak doktorun bilgiyi eksiksiz görmesi gerekir.", body))

E.append(Paragraph("Adım Adım Akış", h2))
E.append(Paragraph("<b>1.</b> Hasta profilindeki <b>Tıbbi Arşiv</b> sayfasına bilgilerini girer: "
                   "hastalıklar/alerjiler, ilaçlar, aşılar, notlar ve belgeler.", step))
E.append(Paragraph("<b>2.</b> İlaç girişinde <b>otomatik tamamlama</b> vardır — yazmaya başlayınca "
                   "ilaç listesinden seçer (yanlış/eksik yazımı önler).", step))
E.append(Paragraph("<b>3.</b> Sayfanın altında bilgilendirme yer alır: "
                   "<i>“Bu bilgiler, randevu aldığınız doktorla paylaşılacaktır.”</i>", step))
E.append(Paragraph("<b>4.</b> Hasta bir doktora randevu alır. O <b>randevu anında</b> anamnez "
                   "randevuya bağlanır.", step))
E.append(Paragraph("<b>5.</b> Doktor kendi randevu ekranında <b>Hasta Tıbbi Bilgileri</b> panelini "
                   "açar; tüm anamnezi görür ve belgeleri indirir.", step))
E.append(Paragraph("<b>6.</b> Yalnızca <b>o randevunun doktoru/kliniği</b> erişir — başka kimse değil. "
                   "Her erişim <b>kayıt altına</b> alınır.", step))

E.append(Paragraph("Kim Neyi Görür?", h2))
data = [
    [Paragraph("<b>Kişi</b>", cellh), Paragraph("<b>Erişim</b>", cellh)],
    [Paragraph("Hasta", cell), Paragraph("Kendi tüm arşivini görür ve düzenler.", cell)],
    [Paragraph("Randevu alınan doktor / klinik", cell),
     Paragraph("Hastanın komple anamnezini otomatik görür (durum, ilaç, aşı, not, belgeler).", cell)],
    [Paragraph("Diğer doktorlar / kullanıcılar", cell), Paragraph("Erişemez.", cell)],
]
tbl = Table(data, colWidths=[62 * mm, 112 * mm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, colors.white]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
E.append(tbl)

E.append(Paragraph("Güvenlik ve Uyumluluk (KVKK / GDPR / HIPAA)", h2))
E += bullets([
    "Tüm tıbbi veriler <b>şifreli</b> saklanır; belgeler korumalı alandadır.",
    "<b>Her erişim kayıt altına alınır</b> (denetim kaydı) — kim, ne zaman, neye baktı.",
    "Erişim yalnızca hasta + randevu alınan doktor/klinik ile sınırlıdır.",
])

doc.build(E)
print("OK docs/Medagama_Tibbi_Arsiv_Paylasimi.pdf")
