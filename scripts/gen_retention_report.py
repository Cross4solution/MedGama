#!/usr/bin/env python3
"""Medagama — Saklama Süresi: nasıl çalışacak + iletilmesi gerekenler (tek sayfa)."""
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
h2 = st("h2", fontSize=11.5, textColor=TEAL, leading=15, spaceBefore=9, spaceAfter=3)
body = st("b", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
step = st("stp", fontSize=9.4, textColor=DARK, leading=13.5, spaceAfter=4, leftIndent=2)
note = st("n", fontSize=8.8, textColor=GRAY, leading=12)
cellh = st("ch", fontSize=9, textColor=colors.white, leading=12)
cell = st("c", fontSize=9, textColor=DARK, leading=12.5)
fill = st("f", fontSize=9, textColor=colors.HexColor("#9ca3af"), leading=12.5)

doc = SimpleDocTemplate(
    "docs/Mevzuat_Uyum_Saklama_Suresi.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("Saklama Süresi", title))
E.append(Paragraph("Medagama — Nasıl Çalışacak + Standart Süreler (Onayınıza)", sub))
E.append(Spacer(1, 4))
E.append(HRFlowable(width="100%", thickness=1.2, color=TEAL))
E.append(Spacer(1, 5))

E.append(Paragraph(
    "<b>Karar (A):</b> Sağlık verisinde “kısa tutup silme” değil, <b>yasal asgari saklama</b> esastır; "
    "erken silmek de ihlaldir. Yaklaşımımız: yasal asgari süre + hastanın silme hakkı.", body))

E.append(Paragraph("Nasıl Çalışacak?", h2))
E.append(Paragraph("<b>1.</b> Her belge/kayıt için doküman-tipine göre bir <b>yasal asgari saklama süresi</b> tanımlanır.", step))
E.append(Paragraph("<b>2.</b> Hasta silme talep ettiğinde: <b>yasal zorunluluğu olmayan</b> kayıtlar <b>hemen</b> silinir.", step))
E.append(Paragraph("<b>3.</b> <b>Yasal zorunluluğu olan</b> kayıtlar hemen silinmez; süre bitene kadar arşivde (erişim kısıtlı) tutulur, <b>süre sonunda otomatik silinir</b>.", step))
E.append(Paragraph("<b>4.</b> Süre boyunca ve silme anında işlem <b>denetim kaydına</b> yazılır.", step))

E.append(Paragraph("Standart Saklama Süreleri (Öneri — Onayınıza)", h2))
E.append(Paragraph(
    "Sağlık verilerinde yaygın standart <b>yasal asgari</b> süreler aşağıdadır. Bu değerlerle "
    "sistemi ön-yapılandırabiliriz; onayınızla devreye alınır.", body))

ch = st("chs", fontSize=8.5, textColor=colors.white, leading=11)
cc = st("cc", fontSize=8.5, textColor=DARK, leading=11)
cd = st("cd", fontSize=8.5, textColor=DARK, leading=11)
rows = [
    [Paragraph("<b>Doküman Tipi</b>", ch), Paragraph("<b>TR</b>", ch),
     Paragraph("<b>AB (tipik)</b>", ch), Paragraph("<b>ABD (tipik)</b>", ch)],
    [Paragraph("Hasta dosyası / tıbbi kayıt (anamnez)", cc), Paragraph("20 yıl", cd), Paragraph("10 yıl", cd), Paragraph("6–10 yıl", cd)],
    [Paragraph("Görüntüleme / tetkik (röntgen, MR, tomografi)", cc), Paragraph("20 yıl", cd), Paragraph("10 yıl", cd), Paragraph("6–10 yıl", cd)],
    [Paragraph("Laboratuvar sonuçları", cc), Paragraph("20 yıl", cd), Paragraph("10 yıl", cd), Paragraph("6–10 yıl", cd)],
    [Paragraph("Reçete", cc), Paragraph("5 yıl", cd), Paragraph("5 yıl", cd), Paragraph("6 yıl", cd)],
    [Paragraph("Rıza / onam formları", cc), Paragraph("20 yıl", cd), Paragraph("10 yıl", cd), Paragraph("6 yıl", cd)],
    [Paragraph("Çocuk hastalar (reşit olana dek + üstüne)", cc), Paragraph("18 yaş +", cd), Paragraph("18 yaş +", cd), Paragraph("21–28 yaş", cd)],
]
tbl = Table(rows, colWidths=[86 * mm, 26 * mm, 30 * mm, 32 * mm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, colors.white]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
E.append(tbl)
E.append(Spacer(1, 3))
E.append(Paragraph(
    "Süreler genelde <b>son işlem/son ziyaret tarihinden</b> itibaren işler. TR’de hasta dosyası "
    "için esas alınan süre 20 yıldır.", note))

E.append(Spacer(1, 7))
E.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#d1d5db")))
E.append(Spacer(1, 4))
E.append(Paragraph(
    "<b>Not:</b> Bu değerler yaygın standart/gösterge niteliğindedir; nihai süreler hedef pazar ve "
    "yerel mevzuat + avukat teyidiyle kesinleşir. Onayladığınızda sistem bu sürelerle yapılandırılır; "
    "farklı istediğiniz satır olursa üzerine yazarız.", note))

doc.build(E)
print("OK docs/Mevzuat_Uyum_Saklama_Suresi.pdf")
