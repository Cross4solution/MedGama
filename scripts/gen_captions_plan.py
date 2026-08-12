#!/usr/bin/env python3
"""Medagama — Canlı alt yazı ve çeviri planı (tek sayfa, sade)."""
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
AMBER = colors.HexColor("#b45309")
LIGHT = colors.HexColor("#f0fdfa")
WARM = colors.HexColor("#fffbeb")
LINE = colors.HexColor("#e5e7eb")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


title = st("t", fontSize=19, textColor=DARK, leading=23, spaceAfter=2)
sub = st("s", fontSize=9.5, textColor=GRAY, leading=13, spaceAfter=2)
h2 = st("h2", fontSize=12, textColor=TEAL, leading=16, spaceBefore=12, spaceAfter=4)
body = st("b", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
uyari = st("u", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
cell = st("c", fontSize=8.8, textColor=DARK, leading=12)
cellh = st("ch", fontSize=8.8, textColor=colors.white, leading=12)
adim = st("a", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=5, leftIndent=14)

doc = SimpleDocTemplate(
    "docs/Medagama_Alt_Yazi_Plani.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("Canlı Alt Yazı ve Çeviri", title))
E.append(Paragraph("Medagama", sub))
E.append(Spacer(1, 6))
E.append(HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=10))

E.append(Paragraph(
    "Görüşme sırasında konuşulanlar anında yazıya dökülür ve karşı tarafın diline çevrilerek "
    "ekranın altında akar. Yurt dışından gelen hasta ile Türkçe konuşan doktorun tercümansız "
    "görüşebilmesi için tasarlanıyor.", body))

E.append(Paragraph("Nasıl çalışıyor?", h2))
for i, metin in enumerate([
    "Doktor konuşur, sesi anında yazıya dökülür.",
    "Yazı, karşı tarafın diline çevrilir.",
    "Her iki taraf ekranın altında kendi dilinde alt yazı görür.",
], start=1):
    E.append(Paragraph(f"<b>{i}.</b>&nbsp;&nbsp;{metin}", adim))

E.append(Paragraph("Dikkatinize sunulan nokta", h2))
kutu = Table([[Paragraph(
    "<b>Alt yazı açıkken ses sunucumuzdan geçer.</b><br/><br/>"
    "Şu anda ses doğrudan doktordan hastaya gidiyor, arada hiçbir sistem yok. Alt yazı için "
    "sesin yazıya çevrilmesi gerekiyor ve bu işlem sunucumuzda yapılıyor; dolayısıyla ses oradan "
    "geçmek zorunda.<br/><br/>"
    "Buna karşı alınan önlemler: alt yazı <b>isteğe bağlıdır</b>, kapalıyken ses yine doğrudan gider. "
    "Açılabilmesi için <b>karşı tarafın onayı</b> aranır. Yazıya çevrilen metin <b>hiçbir yere "
    "kaydedilmez</b>, görüşme bitince silinir. Ses hiçbir üçüncü şirkete gönderilmez.", uyari)]],
    colWidths=[174 * mm])
kutu.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), WARM),
    ("BOX", (0, 0), (-1, -1), 0.8, AMBER),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
]))
E.append(kutu)

E.append(Paragraph("Alınan kararlar", h2))
hdr = ["Konu", "Karar"]
rows = [
    ["Alt yazıyı kim açabilir", "Karşı taraf onaylamadan açılmaz"],
    ["Metin saklanıyor mu", "Hayır — görüşme bitince silinir"],
    ["Dil nasıl belirlenir", "Kullanıcının profil dilinden otomatik"],
    ["Ses üçüncü tarafa gider mi", "Hayır — yalnızca kendi sunucumuzda işlenir"],
]
data = [[Paragraph(h, cellh) for h in hdr]] + [[Paragraph(c, cell) for c in r] for r in rows]
t = Table(data, colWidths=[70 * mm, 104 * mm])
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

E.append(Paragraph("Durum", h2))
E.append(Paragraph(
    "Ekran tasarımı, onay akışı, dil yönetimi ve açma/kapama tamamlandı. Konuşmayı yazıya çeviren "
    "programın gerçek zamanlı çalışabilmesi için güçlü bir sunucu (GPU) gerekiyor; o sağlandığında "
    "sisteme takılacak ve özellik devreye girecek.", body))

doc.build(E)
print("docs/Medagama_Alt_Yazi_Plani.pdf")
