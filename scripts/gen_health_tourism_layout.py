#!/usr/bin/env python3
"""Medagama — "Tek Tuşla Sağlık Turizmi" modül taslağı (görsel sürüm)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether,
)

FONT = "AU"
pdfmetrics.registerFont(TTFont(FONT, "/Library/Fonts/Arial Unicode.ttf"))

NAVY = colors.HexColor("#1e3a8a")
BLUE = colors.HexColor("#2563eb")
SKY = colors.HexColor("#dbeafe")
LIGHT = colors.HexColor("#eff6ff")
GREEN = colors.HexColor("#059669")
GREENBG = colors.HexColor("#d1fae5")
AMBER = colors.HexColor("#d97706")
AMBERBG = colors.HexColor("#fef3c7")
DARK = colors.HexColor("#111827")
GRAY = colors.HexColor("#6b7280")
GRID = colors.HexColor("#e2e8f0")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


title = st("t", fontSize=20, textColor=colors.white, leading=24)
subtitle = st("st", fontSize=10, textColor=colors.HexColor("#c7d2fe"), leading=13)
lead = st("l", fontSize=11.5, textColor=DARK, leading=16, spaceAfter=4)
h1 = st("h1", fontSize=14, textColor=NAVY, leading=18, spaceBefore=14, spaceAfter=7)
body = st("b", fontSize=9.5, textColor=DARK, leading=13.5, spaceAfter=3)
note = st("n", fontSize=8.5, textColor=GRAY, leading=12)

num = st("num", fontSize=17, textColor=colors.white, leading=20, alignment=1)
stept = st("stt", fontSize=11, textColor=NAVY, leading=14)
stepd = st("std", fontSize=9, textColor=GRAY, leading=12)

cardlbl = st("cl", fontSize=8, textColor=GRAY, leading=10)
cardval = st("cv", fontSize=10.5, textColor=NAVY, leading=13.5)

cellh = st("ch", fontSize=9, textColor=colors.white, leading=12)
cell = st("c", fontSize=9, textColor=DARK, leading=12)
big = st("bg", fontSize=11, textColor=NAVY, leading=14)
arrow = st("ar", fontSize=11, textColor=BLUE, leading=12, alignment=1)

W = 178 * mm
doc = SimpleDocTemplate(
    "docs/Medagama_Tek_Tusla_Saglik_Turizmi.pdf", pagesize=A4,
    leftMargin=16 * mm, rightMargin=16 * mm, topMargin=13 * mm, bottomMargin=13 * mm,
)
E = []

# ══════════ Başlık ══════════
hdr = Table([[Paragraph("Tek Tuşla Sağlık Turizmi", title)],
             [Paragraph("Medagama — Modül Taslağı", subtitle)]], colWidths=[W])
hdr.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (0, 0), 12), ("BOTTOMPADDING", (0, 1), (0, 1), 12),
]))
E.append(hdr)
E.append(Spacer(1, 10))

E.append(Paragraph(
    "Hasta bir tedaviye karar verir. <b>Tek tuşa basar.</b> Hangi ülkede, hangi klinikte, "
    "uçuş ve otel dahil <b>toplam kaça</b> geleceğini görür ve yol planını alır.", lead))
E.append(Spacer(1, 6))

# ══════════ Karar kartları ══════════
cards = [
    ("TEK TUŞ NE YAPAR", "Yol planı + randevu"),
    ("BİLETİ KİM ALIR", "Hasta (bkz. A/B kararı)"),
    ("HASTA NE ÖDER", "Hiçbir şey"),
    ("BİZ NASIL KAZANIRIZ", "Klinikten komisyon"),
    ("FİYAT NASIL GÖRÜNÜR", "“2.000 $’dan başlayan”"),
    ("İNSAN DESTEĞİ", "Yok, tam otomatik"),
]
rows, r = [], []
for i, (l, v) in enumerate(cards):
    r.append(Table([[Paragraph(l, cardlbl)], [Paragraph(f"<b>{v}</b>", cardval)]],
                   colWidths=[56 * mm],
                   style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0),
                                     ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                     ("TOPPADDING", (0, 0), (0, 0), 0),
                                     ("BOTTOMPADDING", (0, 0), (0, 0), 1),
                                     ("TOPPADDING", (0, 1), (0, 1), 0)])))
    if len(r) == 3:
        rows.append(r)
        r = []
if r:
    rows.append(r + [""] * (3 - len(r)))
t = Table(rows, colWidths=[59.3 * mm] * 3)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
    ("BOX", (0, 0), (-1, -1), 0.6, SKY),
    ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
]))
E.append(t)

# ══════════ Akış ══════════
E.append(Paragraph("Hasta Ne Yaşıyor?", h1))

steps = [
    ("1", "Tedaviyi seçer", "“Burun ameliyatı” yazar", BLUE),
    ("2", "Birkaç soru cevaplar", "Nereden · ne zaman · önceliği ne · varsa kısıtı (ör. vizesiz ülke)", BLUE),
    ("3", "Listeyi görür", "Ülke ülke klinikler, toplam maliyete göre sıralı. Ülke seçmezse hepsi listelenir", BLUE),
    ("4", "Kliniği inceler", "Profil, paylaşımları, yorumlar, fiyat. Dilerse mesajlaşır veya video görüşme yapar", BLUE),
    ("5", "TEK TUŞA BASAR", "Randevu alınır + yol planı hazırlanır", GREEN),
    ("6", "Yolculuğum", "Takvim, yapılacaklar, hatırlatmalar", BLUE),
]
for i, (n, t1, t2, col) in enumerate(steps):
    numcell = Table([[Paragraph(n, num)]], colWidths=[13 * mm], rowHeights=[13 * mm],
                    style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), col),
                                      ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                      ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                      ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    txt = Table([[Paragraph(f"<b>{t1}</b>", stept)], [Paragraph(t2, stepd)]],
                colWidths=[160 * mm],
                style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 10),
                                  ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                                  ("TOPPADDING", (0, 0), (0, 0), 0),
                                  ("BOTTOMPADDING", (0, 0), (0, 0), 1),
                                  ("TOPPADDING", (0, 1), (0, 1), 0)]))
    row = Table([[numcell, txt]], colWidths=[13 * mm, 165 * mm])
    row.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (1, 0), GREENBG if col == GREEN else colors.white),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("BOX", (1, 0), (1, 0), 0.6, GRID),
    ]))
    E.append(row)
    if i < len(steps) - 1:
        E.append(Table([["", Paragraph("▼", arrow)]], colWidths=[13 * mm, 165 * mm],
                       style=TableStyle([("TOPPADDING", (0, 0), (-1, -1), 1),
                                         ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                                         ("ALIGN", (1, 0), (1, 0), "LEFT"),
                                         ("LEFTPADDING", (1, 0), (1, 0), 6)])))

E.append(PageBreak())

# ══════════ Tek tuş: kim ne yapar ══════════
blk = [Paragraph("Tek Tuşa Basınca", h1)]
sistem = ["Randevuyu klinikte oluşturur", "Kaç gün kalınacağını hesaplar",
          "Gün gün program çıkarır", "Toplam maliyeti gösterir",
          "Klinikle yazışmayı açar", "Takvime ekler, hatırlatır"]
hasta = ["Uçak biletini alır", "Otel rezervasyonunu yapar", "Vize gerekiyorsa başvurur"]
n = max(len(sistem), len(hasta))
rows = [[Paragraph("<b>SİSTEM OTOMATİK YAPAR</b>", cellh),
         Paragraph("<b>HASTA KENDİ YAPAR</b> (hazır bağlantıyla)", cellh)]]
for i in range(n):
    a = f"✓&nbsp;&nbsp;{sistem[i]}" if i < len(sistem) else ""
    b = f"→&nbsp;&nbsp;{hasta[i]}" if i < len(hasta) else ""
    rows.append([Paragraph(a, cell), Paragraph(b, cell)])
t = Table(rows, colWidths=[100 * mm, 78 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), GREEN), ("BACKGROUND", (1, 0), (1, 0), GRAY),
    ("BACKGROUND", (0, 1), (0, -1), GREENBG),
    ("BACKGROUND", (1, 1), (1, -1), colors.HexColor("#f8fafc")),
    ("GRID", (0, 0), (-1, -1), 0.6, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
]))
blk.append(t)
blk.append(Spacer(1, 4))
blk.append(Paragraph(
    "Bilet ve otel hastada kalıyor — böylece kendi havayolunu, milini, otel tercihini kullanabilir. "
    "Biz bilet satmadığımız için seyahat acenteliği yükü de doğmuyor.", note))
E.append(KeepTogether(blk))

# ══════════ Maliyet ══════════
blk = [Paragraph("Toplam Maliyet Karşılaştırması", h1)]
blk.append(Paragraph("Tedavi + Uçuş + Otel + Transfer = <b>Toplam</b>", body))
blk.append(Spacer(1, 3))

comp = [("Türkiye · İstanbul", 2000, 400, 350, 2750, "4.8", True),
        ("Meksika · Cancún", 2400, 100, 500, 3000, "4.6", False),
        ("Almanya · Berlin", 5500, 250, 700, 6450, "4.9", False)]
maxv = max(c[4] for c in comp)
rows = [[Paragraph("<b>Ülke</b>", cellh), Paragraph("<b>Tedavi</b>", cellh),
         Paragraph("<b>Uçuş</b>", cellh), Paragraph("<b>Otel</b>", cellh),
         Paragraph("<b>Toplam</b>", cellh), Paragraph("<b>Puan</b>", cellh)]]
for name, tr, fl, ho, tot, rate, win in comp:
    bw = 30 * mm * (tot / maxv)
    bar = Table([[""]], colWidths=[bw], rowHeights=[4.5 * mm],
                style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), GREEN if win else colors.HexColor("#94a3b8")),
                                  ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                  ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    totcell = Table([[Paragraph(f"<b>{tot:,} $</b>".replace(",", "."), big)], [bar]],
                    colWidths=[32 * mm],
                    style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0),
                                      ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                      ("TOPPADDING", (0, 0), (0, 0), 0),
                                      ("BOTTOMPADDING", (0, 0), (0, 0), 2),
                                      ("TOPPADDING", (0, 1), (0, 1), 0)]))
    rows.append([Paragraph(name, cell), Paragraph(f"{tr:,} $".replace(",", "."), cell),
                 Paragraph(f"{fl} $", cell), Paragraph(f"{ho} $", cell), totcell, Paragraph(rate, cell)])
t = Table(rows, colWidths=[42 * mm, 26 * mm, 22 * mm, 22 * mm, 44 * mm, 22 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BLUE),
    ("BACKGROUND", (0, 1), (-1, 1), GREENBG),
    ("ROWBACKGROUNDS", (0, 2), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ("GRID", (0, 0), (-1, -1), 0.5, GRID),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
blk.append(t)
blk.append(Spacer(1, 3))
blk.append(Paragraph(
    "Meksika’da tedavi daha pahalı ama uçuş ucuz — yine de Türkiye kazanıyor. "
    "Hastanın kendi başına yapamadığı hesap bu. Rakamlar tahminidir (±%10).", note))
E.append(KeepTogether(blk))

# ══════════ Filtreler ══════════
blk = [Paragraph("Filtreler", h1)]
blk.append(Paragraph("Hasta listeyi kendi önceliğine göre daraltır:", body))
filt = [("PUAN", "4,5+ · 4+ · 3,5+"),
        ("MÜSAİTLİK", "En erken randevu veren (takvime bağlı)"),
        ("BÜTÇE", "Toplam maliyet aralığı"),
        ("ÜLKE / ŞEHİR", "Seçilmezse hepsi"),
        ("YORUM", "En çok / en iyi yorum alan"),
        ("KISIT", "Vizesiz ülkeler · konuşulan dil")]
rows, r = [], []
for l, v in filt:
    r.append(Table([[Paragraph(l, cardlbl)], [Paragraph(f"<b>{v}</b>", st("fv", fontSize=9.5, textColor=NAVY, leading=12))]],
                   colWidths=[52 * mm],
                   style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                     ("TOPPADDING", (0, 0), (0, 0), 0), ("BOTTOMPADDING", (0, 0), (0, 0), 1),
                                     ("TOPPADDING", (0, 1), (0, 1), 0)])))
    if len(r) == 3:
        rows.append(r)
        r = []
if r:
    rows.append(r + [""] * (3 - len(r)))
t = Table(rows, colWidths=[59.3 * mm] * 3)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), SKY),
    ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.white),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
blk.append(t)
blk.append(Spacer(1, 3))
blk.append(Paragraph(
    "“Vizesiz ülke” gibi kısıtlarda sistem gerektiğinde internetten güncel bilgiyi de kontrol eder. "
    "Klinik ve doktorlar ise <b>her zaman kendi üye veritabanımızdan</b> gelir.", note))
E.append(KeepTogether(blk))

# ══════════ Veri ══════════
blk = [Paragraph("Rakamlar Nereden Geliyor?", h1)]
blk.append(Paragraph("İlk sürümde dışarıdan <b>ücretli hiçbir servis</b> almıyoruz:", body))
rows = [[Paragraph("<b>Klinik giriyor</b>", cellh), Paragraph("<b>Bizde zaten var</b>", cellh)],
        [Paragraph("✓&nbsp;&nbsp;Tedavi fiyatı", cell), Paragraph("✓&nbsp;&nbsp;Klinik, doktor, puan, yorum", cell)],
        [Paragraph("✓&nbsp;&nbsp;Kaç gün kalınacak", cell), Paragraph("✓&nbsp;&nbsp;Müsait randevu tarihleri", cell)],
        [Paragraph("✓&nbsp;&nbsp;Anlaşmalı otel fiyatı", cell), Paragraph("✓&nbsp;&nbsp;Uçuş ortalama fiyat tablomuz", cell)]]
t = Table(rows, colWidths=[89 * mm, 89 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), AMBER), ("BACKGROUND", (1, 0), (1, 0), BLUE),
    ("BACKGROUND", (0, 1), (0, -1), AMBERBG), ("BACKGROUND", (1, 1), (1, -1), LIGHT),
    ("GRID", (0, 0), (-1, -1), 0.6, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
]))
blk.append(t)
blk.append(Spacer(1, 3))
blk.append(Paragraph(
    "<b>Not:</b> Modül tamamen kliniklerin fiyat girmesine bağlı. Fiyat girmeyen klinik listede çıkamaz.", note))
E.append(KeepTogether(blk))

# ══════════ Bilet: A / B ══════════
blk = [Paragraph("Karar: Uçak Biletini Kim Alır?", h1)]
blk.append(Paragraph(
    "Randevu, yol planı ve toplam maliyet hesabı her iki durumda da bizde. "
    "Fark sadece <b>bileti ve oteli kimin satın aldığı</b>.", body))

optA = ["Bileti ve oteli hasta satın alır",
        "Hasta ayrı ayrı öder",
        "Havayolu ve otel tercihi hastada",
        "İptal/iade sorumluluğu bizde değil",
        "Seyahat acenteliği yapısı gerekmez",
        "Orta ölçekte"]
optB = ["Bileti ve oteli biz satın alırız",
        "Hasta tek ödeme yapar",
        "Havayolu ve otel tercihi bizde",
        "İptal/iade sorumluluğu bizde",
        "Seyahat acenteliği yapısı gerekir",
        "Yüksek operasyon"]
n = max(len(optA), len(optB))
rows = [[Paragraph("<b>A · PLANI BİZ HAZIRLARIZ</b>", cellh),
         Paragraph("<b>B · HER ŞEYİ BİZ SATIN ALIRIZ</b>", cellh)]]
for i in range(n):
    rows.append([Paragraph(f"•&nbsp;&nbsp;{optA[i]}" if i < len(optA) else "", cell),
                 Paragraph(f"•&nbsp;&nbsp;{optB[i]}" if i < len(optB) else "", cell)])
t = Table(rows, colWidths=[89 * mm, 89 * mm])
t.setStyle(TableStyle([
    # İki seçenek eşit ağırlıkta sunulur — renk farkı yok
    ("BACKGROUND", (0, 0), (-1, 0), BLUE),
    ("BACKGROUND", (0, 1), (-1, -1), LIGHT),
    ("GRID", (0, 0), (-1, -1), 0.6, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
]))
blk.append(t)
E.append(KeepTogether(blk))

# ══════════ Komisyon ══════════
blk = [Paragraph("Komisyonu Nasıl Takip Ederiz?", h1)]
blk.append(Paragraph("Hasta bedava kullanıyor. Gelir klinikten geliyor. Sistem şöyle kanıtlıyor:", body))
flow = [("Hasta tek tuşa basar", "Randevu kaydı oluşur"),
        ("Klinik onaylar", "Hasta gelince “tamamlandı” işaretler"),
        ("Hastaya sorulur", "“Geldiniz mi?” + yorum daveti"),
        ("Fatura", "Tamamlananlar aylık klinik faturasına yansır")]
rows = []
for i, (a, b) in enumerate(flow, 1):
    rows.append([Paragraph(f"<b>{i}</b>", st("x", fontSize=12, textColor=colors.white, alignment=1)),
                 Paragraph(f"<b>{a}</b>", cell), Paragraph(b, cell)])
t = Table(rows, colWidths=[10 * mm, 52 * mm, 116 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), BLUE),
    ("ROWBACKGROUNDS", (1, 0), (-1, -1), [LIGHT, colors.white]),
    ("GRID", (0, 0), (-1, -1), 0.6, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING", (1, 0), (-1, -1), 10),
]))
blk.append(t)
E.append(KeepTogether(blk))

# ══════════ Fazlar ══════════
blk = [Paragraph("Yapım Sırası", h1)]
ph = [("FAZ 1", "Tedavi araması", "Klinik fiyatları + arama + filtreler.\nUçuş/otel yok — tek başına çalışır ve gelir üretir.", GREEN, GREENBG),
      ("FAZ 2", "Karşılaştırma", "Uçuş + otel tahmini → toplam maliyet ekranı.", BLUE, LIGHT),
      ("FAZ 3", "Tek tuş", "Yol planı + “Yolculuğum” paneli + hatırlatmalar.", AMBER, AMBERBG),
      ("FAZ 4", "Vasco bağlantısı", "“Vizesiz, uygun, kaliteli nerede?” → hazır plan.", NAVY, SKY)]
rows = []
for tag, ttl, desc, col, bg in ph:
    tagcell = Table([[Paragraph(f"<b>{tag}</b>", st("tg", fontSize=9.5, textColor=colors.white, alignment=1))]],
                    colWidths=[22 * mm], rowHeights=[14 * mm],
                    style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), col),
                                      ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    body_t = Table([[Paragraph(f"<b>{ttl}</b>", stept)],
                    [Paragraph(desc.replace("\n", "<br/>"), stepd)]],
                   colWidths=[154 * mm],
                   style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 10),
                                     ("TOPPADDING", (0, 0), (0, 0), 0),
                                     ("BOTTOMPADDING", (0, 0), (0, 0), 1),
                                     ("TOPPADDING", (0, 1), (0, 1), 0)]))
    rows.append([tagcell, body_t])
t = Table(rows, colWidths=[22 * mm, 156 * mm])
sty = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
       ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
       ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
       ("GRID", (0, 0), (-1, -1), 0.6, colors.white)]
for i, (_, _, _, _, bg) in enumerate(ph):
    sty.append(("BACKGROUND", (1, i), (1, i), bg))
t.setStyle(TableStyle(sty))
blk.append(t)
E.append(KeepTogether(blk))

doc.build(E)
print("OK docs/Medagama_Tek_Tusla_Saglik_Turizmi.pdf")
