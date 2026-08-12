#!/usr/bin/env python3
"""Medagama — Mevzuat Uyumu (KVKK/GDPR/HIPAA) müşteri raporu (tek sayfa)."""
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
GREEN = colors.HexColor("#047857")
AMBER = colors.HexColor("#b45309")
BLUE = colors.HexColor("#1d4ed8")
LIGHT = colors.HexColor("#f0fdfa")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


title = st("t", fontSize=19, textColor=DARK, leading=23, spaceAfter=2)
sub = st("s", fontSize=9.5, textColor=GRAY, leading=13, spaceAfter=2)
h2 = st("h2", fontSize=12, textColor=TEAL, leading=16, spaceBefore=10, spaceAfter=4)
body = st("b", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
cell = st("c", fontSize=8.8, textColor=DARK, leading=12)
cellb = st("cb", fontSize=8.8, textColor=DARK, leading=12)


def row_item(text):
    return Paragraph(text, cell)


doc = SimpleDocTemplate(
    "docs/Medagama_Mevzuat_Uyumu.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("Mevzuat Uyumu", title))
E.append(Paragraph("Medagama — KVKK / GDPR / HIPAA Durum ve Yol Haritası", sub))
E.append(Spacer(1, 4))
E.append(HRFlowable(width="100%", thickness=1.2, color=TEAL))
E.append(Spacer(1, 6))

# ── Mevcut durum ──
E.append(Paragraph("Şu An Hazır Olanlar", h2))
data = [[Paragraph("<b>Madde</b>", st("ch", fontSize=9, textColor=colors.white)),
         Paragraph("<b>Durum</b>", st("ch2", fontSize=9, textColor=colors.white))]]
ready = [
    "Tıbbi geçmiş veritabanında şifreli saklanıyor",
    "Her değişiklik/erişim denetim kaydına (audit log) yazılıyor",
    "KVKK / GDPR bilgilendirme sayfaları mevcut",
    "Veri hakları talep akışı (erişim / düzeltme / silme) mevcut",
    "Çerez onayı (cookie consent) mevcut",
]
for r in ready:
    data.append([row_item(r), Paragraph("<b>Hazır</b>", st("g", fontSize=8.8, textColor=GREEN))])
tbl = Table(data, colWidths=[142 * mm, 32 * mm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, colors.white]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
E.append(tbl)

# ── Yapılacaklar ──
E.append(Paragraph("Tam Uyum İçin Yapılacaklar", h2))
data2 = [[Paragraph("<b>İş</b>", st("ch", fontSize=9, textColor=colors.white)),
          Paragraph("<b>Tür</b>", st("ch2", fontSize=9, textColor=colors.white))]]
todo = [
    ("Yüklenen belge dosyalarının da şifreli saklanması", "Yazılım", BLUE),
    ("Erişim loglaması: “hangi klinik / doktor ne zaman baktı” raporu", "Yazılım", BLUE),
    ("Açık rıza kayıtları (zaman damgalı onay kaydı)", "Yazılım", BLUE),
    ("Veri işleme envanteri (KVKK VERBİS / GDPR Md.30) dokümanı", "Hukuki", AMBER),
]
for txt, typ, col in todo:
    data2.append([row_item(txt), Paragraph(f"<b>{typ}</b>", st("ty", fontSize=8.8, textColor=col))])
tbl2 = Table(data2, colWidths=[142 * mm, 32 * mm])
tbl2.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
E.append(tbl2)

# ── HIPAA / ABD ──
E.append(Paragraph("ABD Pazarı — HIPAA", h2))
E.append(Paragraph(
    "HIPAA yalnızca <b>ABD hastası/sağlayıcısı</b> hedeflenirse gerekir. "
    "<b>Karar: Evet</b>, ABD pazarı için de uyumlu olacak.", body))
E.append(Paragraph(
    "HIPAA bir yazılım özelliği değil, <b>altyapı + hukuki</b> gereksinimdir: verinin "
    "<b>ABD bölgesinde barındırılması</b>, bulut sağlayıcı ile imzalı <b>BAA</b> sözleşmesi ve "
    "anahtar yönetimi (KMS). Bu adım <b>sunucu kurulumuna bağlıdır</b>; sunucu alındığında "
    "ele alınacaktır. Yukarıdaki yazılım işleri (şifreleme, erişim logu) HIPAA'ya da hizmet eder.", body))

doc.build(E)
print("OK docs/Medagama_Mevzuat_Uyumu.pdf")
