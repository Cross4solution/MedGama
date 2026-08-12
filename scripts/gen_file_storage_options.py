#!/usr/bin/env python3
"""Medagama — Hasta belgeleri saklama seçenekleri (tek sayfa, müşteri kararı)."""
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
h2 = st("h2", fontSize=12, textColor=TEAL, leading=16, spaceBefore=11, spaceAfter=4)
body = st("b", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
cell = st("c", fontSize=8.8, textColor=DARK, leading=12)
cellh = st("ch", fontSize=8.8, textColor=colors.white, leading=12)

doc = SimpleDocTemplate(
    "docs/Medagama_Dosya_Saklama_Secenekleri.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("Hasta Belgeleri Nerede Saklanacak?", title))
E.append(Paragraph("Medagama · Karar bekleyen konu", sub))
E.append(Spacer(1, 6))
E.append(HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=8))

E.append(Paragraph("Durum", h2))
E.append(Paragraph(
    "Hastaların yüklediği belgeler (tahlil, rapor, görüntü) ve profil fotoğrafları şu anda "
    "uygulamanın çalıştığı sunucunun kendi diskinde tutuluyor. Bu disk her yazılım "
    "güncellemesinde sıfırlanıyor; yani yüklenen belgeler kalıcı değil. Kalıcı ve yedekli bir "
    "saklama alanına geçilmesi gerekiyor.", body))
E.append(Paragraph(
    "Belgeler Medagama tarafında <b>şifrelenerek</b> yazılıyor: saklama alanını sağlayan firma "
    "dosyaların içeriğini okuyamıyor. Aşağıdaki seçim, dosyaların hangi firmanın veri "
    "merkezinde duracağını belirliyor.", body))

E.append(Paragraph("Seçim neden hukuki bir konu?", h2))
E.append(Paragraph(
    "Avrupa (KVKK / GDPR) için belirleyici olan, verinin <b>nerede</b> durduğu: Avrupa sınırları "
    "içinde kalması yeterli. Amerika (HIPAA) için ek olarak, veriyi barındıran firmanın "
    "<b>imzalı bir sorumluluk sözleşmesi</b> (BAA) vermesi gerekiyor. Bazı firmalar bu "
    "sözleşmeyi veriyor, bazıları vermiyor. Şifreli saklamak bu şartı ortadan kaldırmıyor.", body))

hdr = ["Seçenek", "Avrupa (KVKK/GDPR)", "Amerika (HIPAA)", "Yaklaşık maliyet"]
rows = [
    ["AWS (Frankfurt)", "Uygun", "Uygun — sözleşme veriyor", "Aylık birkaç dolar"],
    ["OVH (Fransa)", "Uygun", "Sözleşme vermiyor", "En düşük — hesabımız var"],
    ["Cloudflare", "Uygun", "Yalnızca üst pakette", "Düşük"],
]
data = [[Paragraph(h, cellh) for h in hdr]] + [[Paragraph(c, cell) for c in r] for r in rows]

t = Table(data, colWidths=[38 * mm, 40 * mm, 50 * mm, 46 * mm])
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

E.append(Paragraph("Kararı belirleyen tek soru", h2))
E.append(Paragraph(
    "<b>Amerika pazarı gerçekten hedefte mi?</b>", body))
E.append(Paragraph(
    "• <b>Evet ya da belki</b> ise: AWS (Frankfurt) seçilmeli. Veriler Almanya'da kalır, Avrupa "
    "kuralları karşılanır ve Amerika için gereken sözleşme baştan alınmış olur. İleride pazara "
    "girildiğinde taşınma gerekmez.", body))
E.append(Paragraph(
    "• <b>Hayır, yalnızca Avrupa ve Türkiye</b> ise: OVH yeterli. Mevcut hesabımız üzerinden "
    "ilerler, yeni tedarikçi sözleşmesi gerekmez, maliyet en düşüktür. Amerika'ya açılma kararı "
    "sonradan çıkarsa taşıma yapılması gerekir.", body))

E.append(Paragraph("Not", h2))
E.append(Paragraph(
    "Her iki seçenekte de veriler Avrupa'da kalır, şifreli saklanır ve erişim kayıtları tutulur. "
    "Fark yalnızca Amerika pazarına açılma ihtimalinde ortaya çıkar. Karar verilene kadar "
    "yüklenen belgeler kalıcı olmadığı için, bu konunun kısa sürede netleşmesi gerekiyor.", body))

doc.build(E)
print("docs/Medagama_Dosya_Saklama_Secenekleri.pdf")
