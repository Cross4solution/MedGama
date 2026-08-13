#!/usr/bin/env python3
"""
Markdown → PDF (Medagama tasarımı).

Teslimat belgeleri .md olarak yazıldı; müşteri tarafında .md açılamıyor.
Bu dönüştürücü onları paketteki diğer sunum belgeleriyle aynı görünüme
sokar — ayrı bir araç kurmaya gerek kalmadan, tek bir tasarım dili.

Desteklenen: başlıklar, tablolar, madde ve numaralı listeler, kalın metin,
satır içi kod, kod blokları, alıntı, yatay çizgi, onay kutuları.

Kullanım:  python3 md2pdf.py <girdi.md> <cikti.pdf> ["Belge Başlığı"]
"""
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer,
    Table, TableStyle,
)

FONT = "AU"
pdfmetrics.registerFont(TTFont(FONT, "/Library/Fonts/Arial Unicode.ttf"))

# Eşit aralıklı yazı tipi Türkçe harfleri de içermeli: gömülü Courier'da
# "ı, ş, ğ, ç" yok ve kod bloklarındaki Türkçe açıklamalar kutu çıkıyordu.
MONO = "MonoTR"
pdfmetrics.registerFont(TTFont(MONO, "/System/Library/Fonts/Supplemental/Courier New.ttf"))

TEAL = colors.HexColor("#0d9488")
DARK = colors.HexColor("#111827")
GRAY = colors.HexColor("#6b7280")
LIGHT = colors.HexColor("#f0fdfa")
LINE = colors.HexColor("#e5e7eb")
CODEBG = colors.HexColor("#f8fafc")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


S = {
    "title": st("title", fontSize=19, textColor=DARK, leading=23, spaceAfter=2),
    "sub": st("sub", fontSize=9.5, textColor=GRAY, leading=13, spaceAfter=2),
    "h1": st("h1", fontSize=15, textColor=DARK, leading=19, spaceBefore=14, spaceAfter=5),
    "h2": st("h2", fontSize=12, textColor=TEAL, leading=16, spaceBefore=12, spaceAfter=4),
    "h3": st("h3", fontSize=10.5, textColor=DARK, leading=14, spaceBefore=9, spaceAfter=3),
    "body": st("body", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=4),
    "li": st("li", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3, leftIndent=12),
    "quote": st("quote", fontSize=9, textColor=GRAY, leading=13, spaceAfter=4,
                leftIndent=10, borderPadding=(0, 0, 0, 6)),
    "code": st("code", fontName=MONO, fontSize=8, textColor=DARK, leading=11),
    "cell": st("cell", fontSize=8.5, textColor=DARK, leading=11.5),
    "cellh": st("cellh", fontSize=8.5, textColor=colors.white, leading=11.5),
}


def satir_ici(m: str) -> str:
    """Markdown satır içi biçimlendirmesini reportlab etiketlerine çevirir."""
    m = m.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    m = re.sub(r"`([^`]+)`", r'<font face="%s" size="8.5">\1</font>' % MONO, m)
    m = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", m)
    m = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", m)
    m = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", m)  # bağlantı metni kalır
    m = m.replace("[ ]", "☐").replace("[x]", "☑")
    return m


def tablo_yap(satirlar, genislik):
    ayirici = [h.strip() for h in satirlar[0].strip("|").split("|")]
    govde = [
        [h.strip() for h in s.strip("|").split("|")]
        for s in satirlar[2:]
        if s.strip()
    ]
    sutun = len(ayirici)
    veri = [[Paragraph(satir_ici(h), S["cellh"]) for h in ayirici]]
    for r in govde:
        r = (r + [""] * sutun)[:sutun]
        veri.append([Paragraph(satir_ici(h), S["cell"]) for h in r])

    # İlk sütun genelde etiket: biraz dar, kalanlar eşit paylaşır.
    if sutun == 1:
        w = [genislik]
    else:
        ilk = genislik * (0.34 if sutun == 2 else 0.28)
        w = [ilk] + [(genislik - ilk) / (sutun - 1)] * (sutun - 1)

    t = Table(veri, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def kod_yap(satirlar, genislik):
    metin = "<br/>".join(
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;")
        for s in satirlar
    )
    t = Table([[Paragraph(metin, S["code"])]], colWidths=[genislik])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODEBG),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def cevir(md_yolu: Path, pdf_yolu: Path, alt_baslik: str = "Medagama"):
    satirlar = md_yolu.read_text(encoding="utf-8").split("\n")
    genislik = A4[0] - 36 * mm

    doc = SimpleDocTemplate(
        str(pdf_yolu), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm,
        title=md_yolu.stem, author="Medagama",
    )

    E = []
    i = 0
    baslik_kondu = False

    while i < len(satirlar):
        s = satirlar[i]
        d = s.strip()

        if not d:
            i += 1
            continue

        # Kod bloğu
        if d.startswith("```"):
            j = i + 1
            blok = []
            while j < len(satirlar) and not satirlar[j].strip().startswith("```"):
                blok.append(satirlar[j])
                j += 1
            if blok:
                E.append(Spacer(1, 3))
                E.append(kod_yap(blok, genislik))
                E.append(Spacer(1, 5))
            i = j + 1
            continue

        # Tablo
        if d.startswith("|") and i + 1 < len(satirlar) and re.match(r"^\|[\s:|-]+\|$", satirlar[i + 1].strip()):
            j = i
            blok = []
            while j < len(satirlar) and satirlar[j].strip().startswith("|"):
                blok.append(satirlar[j])
                j += 1
            E.append(Spacer(1, 3))
            E.append(tablo_yap(blok, genislik))
            E.append(Spacer(1, 6))
            i = j
            continue

        # Yatay çizgi
        if re.match(r"^(---|\*\*\*|___)$", d):
            E.append(Spacer(1, 4))
            E.append(HRFlowable(width="100%", thickness=0.7, color=LINE))
            E.append(Spacer(1, 6))
            i += 1
            continue

        # Başlıklar
        m = re.match(r"^(#{1,4})\s+(.*)$", d)
        if m:
            seviye, metin = len(m.group(1)), satir_ici(m.group(2))
            if seviye == 1 and not baslik_kondu:
                E.append(Paragraph(metin, S["title"]))
                E.append(Paragraph(alt_baslik, S["sub"]))
                E.append(Spacer(1, 6))
                E.append(HRFlowable(width="100%", thickness=1, color=LINE))
                baslik_kondu = True
            else:
                E.append(Paragraph(metin, S["h1" if seviye == 1 else ("h2" if seviye == 2 else "h3")]))
            i += 1
            continue

        # Alıntı
        if d.startswith(">"):
            E.append(Paragraph(satir_ici(d.lstrip("> ").strip()), S["quote"]))
            i += 1
            continue

        # Madde listesi
        if re.match(r"^[-*+]\s+", d):
            E.append(Paragraph("•&nbsp;&nbsp;" + satir_ici(re.sub(r"^[-*+]\s+", "", d)), S["li"]))
            i += 1
            continue

        # Numaralı liste
        m = re.match(r"^(\d+)\.\s+(.*)$", d)
        if m:
            E.append(Paragraph(f"<b>{m.group(1)}.</b>&nbsp;&nbsp;" + satir_ici(m.group(2)), S["li"]))
            i += 1
            continue

        # Düz paragraf — ardışık satırlar birleştirilir
        blok = [d]
        j = i + 1
        while j < len(satirlar):
            n = satirlar[j].strip()
            if (not n or n.startswith(("#", "|", ">", "```", "---"))
                    or re.match(r"^([-*+]\s+|\d+\.\s+)", n)):
                break
            blok.append(n)
            j += 1
        E.append(Paragraph(satir_ici(" ".join(blok)), S["body"]))
        i = j

    doc.build(E)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    alt = sys.argv[3] if len(sys.argv) > 3 else "Medagama"
    cevir(Path(sys.argv[1]), Path(sys.argv[2]), alt)
    print(sys.argv[2])
