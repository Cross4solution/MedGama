#!/usr/bin/env python3
"""Medagama — Hasta Deneyimi (tek sayfa, sade yolculuk)."""
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

SLATE = colors.HexColor("#334155")
DARK = colors.HexColor("#0f172a")
GRAY = colors.HexColor("#64748b")
SOFT = colors.HexColor("#e2e8f0")
FAINT = colors.HexColor("#f8fafc")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


title = st("t", fontSize=17, textColor=DARK, leading=21)
subtitle = st("s", fontSize=9.5, textColor=GRAY, leading=13)

num = st("num", fontSize=15, textColor=colors.white, leading=18, alignment=1)
stept = st("stt", fontSize=11, textColor=DARK, leading=14)
stepd = st("std", fontSize=9, textColor=GRAY, leading=12.5)

scrh = st("sh", fontSize=7.5, textColor=SLATE, leading=9.5)
scrl = st("sl", fontSize=7.8, textColor=DARK, leading=10.5)
scrm = st("sm", fontSize=7.8, textColor=GRAY, leading=10.5)

W = 178 * mm
doc = SimpleDocTemplate(
    "docs/Medagama_Hasta_Deneyimi.pdf", pagesize=A4,
    leftMargin=16 * mm, rightMargin=16 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []


def screen(header, lines, width=55 * mm):
    """Sade ekran taslağı."""
    rows = [[Paragraph(header, scrh)]]
    for txt, strong in lines:
        rows.append([Paragraph(txt, scrl if strong else scrm)])
    t = Table(rows, colWidths=[width])
    sty = [("BACKGROUND", (0, 0), (0, 0), SOFT),
           ("BACKGROUND", (0, 1), (0, -1), colors.white),
           ("BOX", (0, 0), (-1, -1), 0.7, SOFT),
           ("LINEBELOW", (0, 0), (0, 0), 0.7, colors.HexColor("#cbd5e1")),
           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
           ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7)]
    for i in range(1, len(rows)):
        if i % 2 == 0:
            sty.append(("BACKGROUND", (0, i), (0, i), FAINT))
    t.setStyle(TableStyle(sty))
    return t


# ── Başlık ──
E.append(Paragraph("Hasta Deneyimi", title))
E.append(Paragraph("Medagama — Tek Tuşla Sağlık Turizmi", subtitle))
E.append(Spacer(1, 5))
E.append(HRFlowable(width="100%", thickness=1, color=SLATE))
E.append(Spacer(1, 8))

journey = [
    ("1", "Aramaya başlar",
     "“Burun estetiği” yazar. Nereden geldiğini ve ne zaman gitmek istediğini belirtir.",
     "ARAMA", [("Burun estetiği", True), ("Nereden: Hollanda", False),
               ("Ne zaman: Mart", False), ("Öncelik: Uygun fiyat", False)]),
    ("2", "Karşılaştırır",
     "Ülke ülke klinikleri toplam maliyetiyle görür. Puana, yoruma ve en erken tarihe göre filtreler.",
     "SONUÇLAR", [("İstanbul · 2.750 $", True), ("Cancún · 3.000 $", False),
                  ("Berlin · 6.450 $", False), ("Filtre: 4,5+ puan", False)]),
    ("3", "Kliniği tanır",
     "Klinik profilini, paylaşımlarını ve hasta yorumlarını inceler. Mesaj atar, dilerse video görüşme yapar.",
     "KLİNİK", [("Estetik Merkezi", True), ("★ 4,8 · 126 yorum", False),
                ("Fiyat: 2.000 $’dan", False), ("Mesaj gönder", False)]),
    ("4", "Tek tuşa basar",
     "Randevusu oluşur; gün gün programı, toplam maliyeti, uçuş ve otel bağlantıları hazır gelir.",
     "PLANIM", [("Randevu: 12 Mart", True), ("5 gece kalış", False),
                ("Toplam ≈ 2.750 $", False), ("Uçuş & otel bağlantısı", False)]),
    ("5", "Yolculuğunu yönetir",
     "Takvim, yapılacaklar listesi ve hatırlatmalar tek panelde.",
     "YOLCULUĞUM", [("Kalan: 12 gün", True), ("✓ Randevu onaylandı", False),
                    ("○ Uçuş bileti", False), ("○ Otel", False)]),
    ("6", "Tedavi ve sonrası",
     "Klinikte işlemi olur. Dönüşte kontrol takibi ve klinikle iletişim aynı panelden sürer.",
     "TAKİP", [("İşlem tamamlandı", True), ("Kontrol: 3. hafta", False),
               ("Klinikle mesajlaş", False), ("Deneyimini puanla", False)]),
]

for i, (n, ttl, desc, scr_h, scr_l) in enumerate(journey):
    numcell = Table([[Paragraph(n, num)]], colWidths=[11 * mm], rowHeights=[11 * mm],
                    style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), SLATE),
                                      ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                      ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                      ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    txt = Table([[Paragraph(f"<b>{ttl}</b>", stept)], [Paragraph(desc, stepd)]],
                colWidths=[106 * mm],
                style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                                  ("TOPPADDING", (0, 0), (0, 0), 0), ("BOTTOMPADDING", (0, 0), (0, 0), 2),
                                  ("TOPPADDING", (0, 1), (0, 1), 0)]))
    row = Table([[numcell, txt, screen(scr_h, scr_l)]], colWidths=[11 * mm, 108 * mm, 59 * mm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (1, 0), "MIDDLE"), ("VALIGN", (2, 0), (2, 0), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (1, 0), 0),
        ("LEFTPADDING", (2, 0), (2, 0), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (1, 0), 0.6, SOFT),
    ]))
    E.append(row)

doc.build(E)
print("OK docs/Medagama_Hasta_Deneyimi.pdf")
