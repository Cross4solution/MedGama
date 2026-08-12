#!/usr/bin/env python3
"""Medagama — E-posta gönderimi seçenekleri (tek sayfa, sade)."""
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

doc = SimpleDocTemplate(
    "docs/Medagama_Eposta_Secenekleri.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("E-posta Gönderimi", title))
E.append(Paragraph("Medagama · Seçenekler", sub))
E.append(Spacer(1, 6))
E.append(HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=10))

E.append(Paragraph(
    "Randevu onayı, iptali ve hatırlatma e-postaları için bir gönderim servisi kullanılacak. "
    "Kullanabileceğimiz seçenekler:", body))

hdr = ["Seçenek", "Aylık maliyet", "Veri bölgesi", "Amerika (HIPAA)"]
rows = [
    ["Amazon SES", "≈ 1 $ (4.000 e-posta)", "Frankfurt", "Sözleşme veriyor"],
    ["Resend", "3.000 e-posta ücretsiz", "Avrupa seçilebilir", "Vermiyor"],
    ["Brevo", "Günde 300 ücretsiz", "Fransa", "Vermiyor"],
]
data = [[Paragraph(h, cellh) for h in hdr]] + [[Paragraph(c, cell) for c in r] for r in rows]

t = Table(data, colWidths=[36 * mm, 48 * mm, 44 * mm, 46 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.4, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
E.append(Spacer(1, 6))
E.append(t)
E.append(Spacer(1, 4))
E.append(Paragraph("Tahmini hacim: 1.000 hasta, kişi başı ayda 4 bildirim ≈ 4.000 e-posta.", sub))


doc.build(E)
print("docs/Medagama_Eposta_Secenekleri.pdf")
