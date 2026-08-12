#!/usr/bin/env python3
"""Medagama — Randevu kaporası ödeme akışı (tek sayfa, sade)."""
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
LINE = colors.HexColor("#e5e7eb")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


title = st("t", fontSize=19, textColor=DARK, leading=23, spaceAfter=2)
sub = st("s", fontSize=9.5, textColor=GRAY, leading=13, spaceAfter=2)
h2 = st("h2", fontSize=12, textColor=TEAL, leading=16, spaceBefore=12, spaceAfter=4)
body = st("b", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
cell = st("c", fontSize=8.8, textColor=DARK, leading=12)
cellh = st("ch", fontSize=8.8, textColor=colors.white, leading=12)
adim = st("a", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=5, leftIndent=14)

doc = SimpleDocTemplate(
    "docs/Medagama_Kapora_Akisi.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("Randevu Kaporası — Ödeme Akışı", title))
E.append(Paragraph("Medagama · Onayınıza sunulur", sub))
E.append(Spacer(1, 6))
E.append(HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=10))

E.append(Paragraph(
    "Hasta randevu alırken küçük bir kapora öder. Randevuya gelirse tedavi ücretinden düşülür. "
    "Amaç, gelmeyen hasta oranını azaltmaktır.", body))

E.append(Paragraph("Hasta ne yaşıyor?", h2))
for i, metin in enumerate([
    "Doktoru ve saati seçer. Kapora tutarı ekranda görünür.",
    "Seçtiği saat 15 dakika kendisine ayrılır; bu sürede başkası alamaz.",
    "Bankanın güvenli ödeme ekranına yönlenir, kartıyla öder.",
    "Ödeme onaylanınca randevusu kesinleşir ve bildirim gider.",
    "Ödemeyi tamamlamazsa saat serbest kalır, randevu oluşmaz.",
], start=1):
    E.append(Paragraph(f"<b>{i}.</b>&nbsp;&nbsp;{metin}", adim))

E.append(Paragraph("Para nasıl paylaşılıyor?", h2))
E.append(Paragraph(
    "Kaporayı Medagama tahsil eder, komisyonunu keser, kalanı kliniğin hakedişi olarak kaydeder. "
    "Her ödemenin komisyonu tahsilat anında sabitlenir; oran ileride değişse bile geçmiş kayıtlar "
    "değişmez.", body))

hdr = ["Örnek", "Tutar"]
rows = [
    ["Hastanın ödediği kapora", "200,00 TL"],
    ["Medagama komisyonu (%15)", "30,00 TL"],
    ["Kliniğin hakedişi", "170,00 TL"],
]
data = [[Paragraph(h, cellh) for h in hdr]] + [[Paragraph(c, cell) for c in r] for r in rows]
t = Table(data, colWidths=[110 * mm, 64 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.4, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
E.append(Spacer(1, 4))
E.append(t)
E.append(Spacer(1, 3))
E.append(Paragraph("Komisyon oranı ve kapora tutarı ayarlanabilir; yukarıdakiler örnektir.", sub))

E.append(Paragraph("İptal ve iade", h2))
E.append(Paragraph(
    "<b>Doktor iptal ederse:</b> hastaya her durumda tam iade yapılır.", body))
E.append(Paragraph(
    "<b>Hasta iptal ederse:</b> randevuya belirlenen süreden fazla varsa tam iade, azsa iade yapılmaz. "
    "Bu süre şu an 24 saat olarak hazırlandı — <b>onayınıza göre değiştirilebilir.</b>", body))

E.append(Paragraph("Güvenlik", h2))
E.append(Paragraph(
    "Kart bilgileri Medagama'ya hiç ulaşmaz; ödeme bankanın kendi ekranında yapılır ve bize yalnızca "
    "sonuç bilgisi döner. Ödemenin gerçekleştiği, hastanın ekranından değil bankadan gelen doğrulamayla "
    "kabul edilir. Para birimi ne ise o para biriminde tahsil edilir, çevrilmez.", body))

E.append(Paragraph("Sizden beklenen", h2))
E.append(Paragraph(
    "1. Kapora tutarı ve komisyon oranı ne olsun?", body))
E.append(Paragraph(
    "2. Hasta iptalinde iade süresi 24 saat uygun mu?", body))
E.append(Paragraph(
    "3. Ödeme kuruluşu tercihiniz (iyzico, PayTR, Stripe) — sözleşme ve evrak süreci sizde yürütülür.", body))

doc.build(E)
print("docs/Medagama_Kapora_Akisi.pdf")
