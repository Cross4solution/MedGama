#!/usr/bin/env python3
# MedaGama Büyüme Planı — profesyonel, mavi tema + grafikler (reportlab, Türkçe).
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, KeepTogether, PageBreak)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.graphics.charts.barcharts import VerticalBarChart

pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))

BLUE   = colors.HexColor('#1d4ed8')
BLUE_D = colors.HexColor('#1e3a8a')
BLUE_L = colors.HexColor('#eff6ff')
BLUE_L2= colors.HexColor('#dbeafe')
BLUE_M = colors.HexColor('#3b82f6')
INK    = colors.HexColor('#1f2937')
GRAY   = colors.HexColor('#6b7280')
GREEN  = colors.HexColor('#16a34a')
AMBER  = colors.HexColor('#d97706')
RED    = colors.HexColor('#dc2626')

def st(name, **kw):
    base = dict(fontName='Arial', textColor=INK, fontSize=10, leading=14)
    base.update(kw); return ParagraphStyle(name, **base)

H2   = st('h2', fontName='Arial-Bold', fontSize=14, leading=19, textColor=BLUE_D, spaceBefore=14, spaceAfter=7)
P    = st('p', spaceAfter=5)
LI   = st('li', leading=14, spaceAfter=2.5)
CELL = st('cell', fontSize=9, leading=12)
CELLH= st('cellh', fontName='Arial-Bold', fontSize=9, leading=12, textColor=colors.white)
SMALL= st('small', fontSize=8.5, textColor=GRAY)
CARDTTL = st('cardttl', fontName='Arial-Bold', fontSize=12, leading=15, textColor=BLUE_D)

def bullet(text, color='#1d4ed8'):
    return Paragraph(f'<font color="{color}">•</font>&nbsp; {text}', LI)

def badge(label, color):
    # küçük renkli etiket (Drawing)
    w = 4 + len(label) * 5.4 + 6
    d = Drawing(w, 14)
    d.add(Rect(0, 0, w, 14, fillColor=color, strokeColor=None, rx=7, ry=7))
    d.add(String(w/2, 4, label, fontName='Arial-Bold', fontSize=8, fillColor=colors.white, textAnchor='middle'))
    return d

# ---- Kapak bandı ----
def header_band():
    W, H = 515, 70
    d = Drawing(W, H)
    d.add(Rect(0, 0, W, H, fillColor=BLUE_D, strokeColor=None))
    d.add(Rect(0, 0, 6, H, fillColor=BLUE_M, strokeColor=None))
    d.add(String(20, 42, 'MedaGama — Büyüme (Scale) Planı', fontName='Arial-Bold', fontSize=19, fillColor=colors.white))
    d.add(String(20, 24, 'Kullanıcı artışına göre adım adım teknoloji ve altyapı yol haritası', fontName='Arial', fontSize=10, fillColor=colors.HexColor('#bfdbfe')))
    d.add(String(20, 10, 'Hazırlayan: Geliştirme Ekibi  ·  Sürüm 1.0', fontName='Arial', fontSize=8, fillColor=colors.HexColor('#93c5fd')))
    return d

# ---- Kademe merdiveni ----
def ladder():
    tiers = [
        ('1.000', 'Önbellek + arka plan', BLUE_L2, INK),
        ('10.000', 'Kopya + izleme', colors.HexColor('#93c5fd'), INK),
        ('100.000', 'Sunucu güçlendirme', BLUE_M, colors.white),
        ('1.000.000', 'Çok bölge + otomatik', BLUE_D, colors.white),
    ]
    W, H = 515, 195
    d = Drawing(W, H)
    bw = 116; gap = 12; base_x = 8
    for i, (users, action, fill, txt) in enumerate(tiers):
        bh = 55 + i * 40
        x = base_x + i * (bw + gap); y = 6
        d.add(Rect(x, y, bw, bh, fillColor=fill, strokeColor=BLUE, strokeWidth=1, rx=7, ry=7))
        d.add(String(x + bw/2, y + bh - 20, users, fontName='Arial-Bold', fontSize=13, fillColor=txt, textAnchor='middle'))
        d.add(String(x + bw/2, y + bh - 33, 'aktif kullanıcı', fontName='Arial', fontSize=7.5, fillColor=txt, textAnchor='middle'))
        words = action.split(' '); mid = (len(words)+1)//2
        d.add(String(x + bw/2, y + 16, ' '.join(words[:mid]), fontName='Arial', fontSize=7.5, fillColor=txt, textAnchor='middle'))
        d.add(String(x + bw/2, y + 7, ' '.join(words[mid:]), fontName='Arial', fontSize=7.5, fillColor=txt, textAnchor='middle'))
    # yukarı ok
    d.add(Line(8, H-8, W-20, H-8, strokeColor=BLUE_L2, strokeWidth=1))
    d.add(Polygon([W-20,H-8, W-28,H-4, W-28,H-12], fillColor=BLUE, strokeColor=None))
    d.add(String(W-30, H-20, 'büyüme yönü', fontName='Arial', fontSize=7.5, fillColor=GRAY, textAnchor='end'))
    return d

# ---- Bar grafik: altyapı karmaşıklığı + maliyet ----
def dual_chart():
    d = Drawing(515, 185)
    bc = VerticalBarChart()
    bc.x = 45; bc.y = 28; bc.height = 120; bc.width = 430
    bc.data = [[1, 2, 4, 7], [1, 2, 5, 9]]   # parça sayısı / göreli maliyet
    bc.categoryAxis.categoryNames = ['1.000', '10.000', '100.000', '1.000.000']
    bc.categoryAxis.labels.fontName = 'Arial'; bc.categoryAxis.labels.fontSize = 8
    bc.valueAxis.valueMin = 0; bc.valueAxis.valueMax = 10; bc.valueAxis.valueStep = 2
    bc.valueAxis.labels.fontName = 'Arial'; bc.valueAxis.labels.fontSize = 8
    bc.bars[0].fillColor = BLUE
    bc.bars[1].fillColor = colors.HexColor('#93c5fd')
    bc.barWidth = 11; bc.groupSpacing = 26
    d.add(bc)
    d.add(String(257, 170, 'Kademeye Göre Altyapı Karmaşıklığı ve Göreli Maliyet (temsili)',
                 fontName='Arial-Bold', fontSize=10, fillColor=BLUE_D, textAnchor='middle'))
    # legend
    d.add(Rect(150, 8, 10, 10, fillColor=BLUE, strokeColor=None))
    d.add(String(164, 9, 'Altyapı parça sayısı', fontName='Arial', fontSize=8, fillColor=INK))
    d.add(Rect(290, 8, 10, 10, fillColor=colors.HexColor('#93c5fd'), strokeColor=None))
    d.add(String(304, 9, 'Göreli maliyet', fontName='Arial', fontSize=8, fillColor=INK))
    return d

def tbl(rows, widths, header_bg=BLUE):
    data = []
    for ri, r in enumerate(rows):
        sty = CELLH if ri == 0 else CELL
        data.append([Paragraph(str(c), sty) for c in r])
    t = Table(data, colWidths=widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),header_bg),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, BLUE_L]),
        ('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
    ]))
    return t

# ---- Kademe kartı (detaylı) ----
def tier_card(num, users, tag, tagcolor, belirti, yapilacaklar, eklenen, maliyet, mcolor, risk, rcolor):
    inner = []
    head = Table([[
        Paragraph(f'<font color="#1e3a8a"><b>Kademe {num}</b></font> &nbsp;·&nbsp; <font color="#1d4ed8"><b>~{users}</b></font> aktif kullanıcı', CARDTTL),
        badge(tag, tagcolor),
    ]], colWidths=[125*mm, 40*mm])
    head.setStyle(TableStyle([('ALIGN',(1,0),(1,0),'RIGHT'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                              ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))
    inner.append(head)
    inner.append(Spacer(1,3))
    inner.append(Paragraph(f'<b>Belirti:</b> {belirti}', P))
    inner.append(Paragraph('<b>Yapılacaklar:</b>', P))
    for it in yapilacaklar:
        inner.append(bullet(it))
    inner.append(Spacer(1,2))
    meta = Table([[
        Paragraph(f'<b>Eklenen:</b> {eklenen}', SMALL),
        badge(f'Maliyet: {maliyet}', mcolor),
        badge(f'Risk: {risk}', rcolor),
    ]], colWidths=[95*mm, 35*mm, 35*mm])
    meta.setStyle(TableStyle([('ALIGN',(1,0),(2,0),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                              ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))
    inner.append(meta)
    card = Table([[inner]], colWidths=[170*mm])
    card.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),BLUE_L),
        ('BOX',(0,0),(-1,-1),0.6,BLUE_L2),
        ('LINEBEFORE',(0,0),(0,-1),3,BLUE),
        ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),10),
        ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
    ]))
    return KeepTogether([card, Spacer(1,8)])

def footer(c, doc):
    c.saveState()
    c.setStrokeColor(BLUE_L2); c.setLineWidth(0.5); c.line(20*mm, 15*mm, 190*mm, 15*mm)
    c.setFont('Arial', 8); c.setFillColor(GRAY)
    c.drawString(20*mm, 11*mm, 'MedaGama — Büyüme (Scale) Planı')
    c.drawRightString(190*mm, 11*mm, f'Sayfa {doc.page}')
    c.restoreState()

story = []
story.append(header_band())
story.append(Spacer(1,12))

story.append(Paragraph('Genel Bakış', H2))
story.append(Paragraph(
    'Sistem bugün sağlam ve büyümeye hazırdır. Amacımız her şeyi baştan kurmak değil; '
    'kullanıcı arttıkça <b>ihtiyaç doğdukça</b>, <b>önce ucuz ve risksiz</b> olanlardan başlayarak '
    'adım adım ilerlemektir. Aşağıdaki dört kademe, hangi kullanıcı seviyesinde neyi devreye '
    'alacağımızı önceden gösterir.', P))
story.append(Spacer(1,6))

story.append(Paragraph('Büyüme Merdiveni', H2))
story.append(ladder())
story.append(Spacer(1,4))
story.append(dual_chart())

story.append(KeepTogether([
    Paragraph('Tek Bakışta Yol Haritası', H2),
    tbl([
        ['Kademe','Kullanıcı','Ana adım','Maliyet','Risk'],
        ['1','~1.000','Önbellek + arka plan çalışma','Düşük','Yok'],
        ['2','~10.000','Kopya artır + izleme paneli','Orta','Düşük'],
        ['3','~100.000','Sunucu güçlendirme + arama + medya','Orta-Yük.','Orta'],
        ['4','~1.000.000','Çok bölge + otomatik ölçekleme','Yüksek','Orta'],
    ], [18*mm, 26*mm, 78*mm, 24*mm, 24*mm]),
]))
story.append(Spacer(1,10))
story.append(Paragraph('Kademe Detayları', H2))

story.append(tier_card('1','1.000','BAŞLANGIÇ', BLUE_M,
    'Mevcut yapı fazlasıyla yeterli, darboğaz yok.',
    ['<b>Arka plan çalışma (Queue):</b> e-posta, bildirim, PDF gibi yan işler kullanıcıyı bekletmeden arka planda yapılır',
     '<b>Önbellek (Redis):</b> aynı veri tekrar tekrar çekilmez; sık görülen sayfalar anında açılır',
     '<b>İnce ayar:</b> mevcut sunucu ayarları (opcache/JIT) optimize edilir'],
    'Redis, arka plan işçisi', 'Düşük', GREEN, 'Yok', GREEN))

story.append(tier_card('2','10.000','BÜYÜME', BLUE_M,
    'Yoğun saatlerde sistem yorulmaya başlar; yanıt süreleri artar.',
    ['<b>Sunucu kopyası artır (2–3):</b> yük dağılır, tek noktaya binmez (yük dengeleyici)',
     '<b>Arka plan işçilerini çoğalt:</b> kuyruğa biriken işler hızla tüketilir',
     '<b>İzleme paneli:</b> hata ve yavaşlıklar görünür olur, sorun büyümeden yakalanır',
     '<b>Genişletilmiş önbellek:</b> doktor/klinik listeleri kenar (CDN) önbelleğinden servis edilir'],
    'Yük dengeleyici, izleme/APM', 'Orta', AMBER, 'Düşük', GREEN))

story.append(tier_card('3','100.000','ÖLÇEK', BLUE_M,
    'Trafik sürekli yüksek; sunucu kapasitesi (işlemci) zorlanır.',
    ['<b>Sunucu güçlendirme (FrankenPHP/RoadRunner):</b> sunucu "hep hazır" çalışır, daha çok istek karşılar — <i>ön koşul: sağlık verisi güvenlik denetimi</i>',
     '<b>Veritabanı okuma kopyaları:</b> okuma yükü birden çok kopyaya dağılır',
     '<b>Medya ayrı depoya (CDN):</b> görsel/dosyalar sunucudan ayrılır, sunucu hafifler',
     '<b>Güçlü arama altyapısı:</b> arama veritabanından ayrı, çok daha hızlı',
     '<b>Bölgesel yayılım başlangıcı:</b> yurt dışı kullanıcıya yakın sunucu'],
    'Octane motoru, arama servisi, medya CDN', 'Orta-Yüksek', AMBER, 'Orta', AMBER))

story.append(tier_card('4','1.000.000','BÜYÜK ÖLÇEK', BLUE_M,
    'Dünya geneli yoğun, eşzamanlı kullanım.',
    ['<b>Çok bölgeli yapı:</b> her kıtada sunucu + veritabanı; herkese yakın, düşük gecikme',
     '<b>Modülleri ayırma:</b> CRM, telehealth, ödeme gibi parçalar bağımsız ölçeklenir',
     '<b>Otomatik ölçekleme:</b> trafik artınca sistem kendi kendine büyür, azalınca küçülür (maliyet kontrolü)',
     '<b>Gelişmiş güvenlik:</b> DDoS koruması, merkezi izleme, dağıtık hata takibi'],
    'Çok bölge, otomatik ölçekleme, WAF', 'Yüksek', RED, 'Orta', AMBER))

story.append(Paragraph('4 Temel İlke', H2))
for it in ['<b>Önce ölç, sonra ekle:</b> tahminle değil, gerçek ihtiyaç görününce adım atılır.',
           '<b>Ucuz ve risksiz önce:</b> önbellek/arka plan/kopya; pahalı ve riskli olanlar en sona.',
           '<b>Sağlık verisi güvenliği:</b> her ölçek adımında birinci öncelik.',
           '<b>Bağımsızlık:</b> tek firmaya kilitlenmeyen, taşınabilir teknolojiler.']:
    story.append(bullet(it))

story.append(Spacer(1,8))
note = Table([[Paragraph('<b>Özet:</b> Bugün hazırız. Büyüdükçe sırayla ilerleriz — önce önbellek ve arka plan '
    'çalışma, sonra kopya artırma ve izleme, daha sonra (gerçekten gerekince) sunucu güçlendirme, '
    'en sonunda çok bölgeli yapı. Her adım ölçüye dayalı, ihtiyaca göre.', P)]], colWidths=[170*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE_L2),('BOX',(0,0),(-1,-1),0.6,BLUE),
    ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),
    ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
story.append(note)

doc = SimpleDocTemplate('tasks/MedaGama-Scale-Plan.pdf', pagesize=A4,
                        leftMargin=20*mm, rightMargin=20*mm, topMargin=16*mm, bottomMargin=18*mm)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('PDF: tasks/MedaGama-Scale-Plan.pdf')
