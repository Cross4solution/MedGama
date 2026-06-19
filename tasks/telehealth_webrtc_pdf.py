#!/usr/bin/env python3
# MedaGama Telehealth — WebRTC Çözüm Planı. Mavi, görselli (reportlab, TR).
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon, Circle

pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))

BLUE=colors.HexColor('#1d4ed8'); BLUE_D=colors.HexColor('#1e3a8a'); BLUE_L=colors.HexColor('#eff6ff')
BLUE_L2=colors.HexColor('#dbeafe'); BLUE_M=colors.HexColor('#3b82f6')
INK=colors.HexColor('#1f2937'); GRAY=colors.HexColor('#6b7280')
GREEN=colors.HexColor('#16a34a'); AMBER=colors.HexColor('#d97706'); REDC=colors.HexColor('#dc2626')

def s(n,**k):
    b=dict(fontName='Arial',textColor=INK,fontSize=10,leading=14); b.update(k); return ParagraphStyle(n,**b)
H2=s('h2',fontName='Arial-Bold',fontSize=13.5,leading=18,textColor=BLUE_D,spaceBefore=13,spaceAfter=6)
P=s('p',spaceAfter=4); LI=s('li',leading=13.5,spaceAfter=2)
CELL=s('cell',fontSize=8.6,leading=11.5); CELLH=s('cellh',fontName='Arial-Bold',fontSize=8.6,leading=11.5,textColor=colors.white)
def bullet(t,c='#1d4ed8'): return Paragraph(f'<font color="{c}">•</font>&nbsp; {t}', LI)

def header_band():
    W,H=515,66; d=Drawing(W,H)
    d.add(Rect(0,0,W,H,fillColor=BLUE_D,strokeColor=None)); d.add(Rect(0,0,6,H,fillColor=BLUE_M,strokeColor=None))
    d.add(String(20,40,'MedaGama — Telehealth WebRTC Çözüm Planı',fontName='Arial-Bold',fontSize=15.5,fillColor=colors.white))
    d.add(String(20,23,'Kendi video görüşme altyapımız + çeviri altyazı (Deepgram)',fontName='Arial',fontSize=9.5,fillColor=colors.HexColor('#bfdbfe')))
    d.add(String(20,10,'Haziran 2026  ·  Sürüm 1.0',fontName='Arial',fontSize=8,fillColor=colors.HexColor('#93c5fd')))
    return d

def chip(label,color):
    w=4+len(label)*5.0+8; d=Drawing(w,13)
    d.add(Rect(0,0,w,13,fillColor=color,strokeColor=None,rx=6,ry=6))
    d.add(String(w/2,3.5,label,fontName='Arial-Bold',fontSize=7.5,fillColor=colors.white,textAnchor='middle'))
    return d

# Mimari diyagram: Hasta <-> (Signaling) <-> Doktor, altında STUN/TURN
def architecture():
    W,H=515,150; d=Drawing(W,H)
    # iki uç kutu
    def box(x,y,w,h,title,sub,col):
        d.add(Rect(x,y,w,h,fillColor=BLUE_L,strokeColor=col,strokeWidth=1.4,rx=8,ry=8))
        d.add(Rect(x,y,5,h,fillColor=col,strokeColor=None))
        d.add(String(x+w/2,y+h-20,title,fontName='Arial-Bold',fontSize=10.5,fillColor=BLUE_D,textAnchor='middle'))
        d.add(String(x+w/2,y+10,sub,fontName='Arial',fontSize=7.5,fillColor=GRAY,textAnchor='middle'))
    box(8,95,150,46,'Hasta','tarayıcı · kamera/mik',BLUE_M)
    box(357,95,150,46,'Doktor','tarayıcı · kamera/mik',BLUE_M)
    # ortada signaling
    d.add(Rect(200,103,115,32,fillColor=BLUE,strokeColor=None,rx=7,ry=7))
    d.add(String(257,121,'Signaling',fontName='Arial-Bold',fontSize=9,fillColor=colors.white,textAnchor='middle'))
    d.add(String(257,108,'Pusher/Reverb (var)',fontName='Arial',fontSize=7,fillColor=BLUE_L2,textAnchor='middle'))
    # oklar hasta<->signaling<->doktor
    d.add(Line(158,118,200,118,strokeColor=BLUE_M,strokeWidth=1.2)); d.add(Line(315,118,357,118,strokeColor=BLUE_M,strokeWidth=1.2))
    # doğrudan medya akışı (P2P) altta kavisli
    d.add(Line(83,95,83,68,strokeColor=GREEN,strokeWidth=1.4,strokeDashArray=[3,2]))
    d.add(Line(432,95,432,68,strokeColor=GREEN,strokeWidth=1.4,strokeDashArray=[3,2]))
    d.add(Line(83,68,432,68,strokeColor=GREEN,strokeWidth=1.6))
    d.add(String(257,72,'Şifreli ses/video — doğrudan (P2P)',fontName='Arial-Bold',fontSize=8,fillColor=GREEN,textAnchor='middle'))
    # STUN / TURN altyapı
    d.add(Rect(8,18,243,34,fillColor=colors.white,strokeColor=GREEN,strokeWidth=1,rx=7,ry=7))
    d.add(String(129,38,'STUN (bedava)',fontName='Arial-Bold',fontSize=8.5,fillColor=GREEN,textAnchor='middle'))
    d.add(String(129,25,'IP keşfi — çoğu bağlantı doğrudan kurulur',fontName='Arial',fontSize=7,fillColor=GRAY,textAnchor='middle'))
    d.add(Rect(264,18,243,34,fillColor=colors.white,strokeColor=AMBER,strokeWidth=1.2,rx=7,ry=7))
    d.add(String(385,38,'TURN (kurmamız şart)',fontName='Arial-Bold',fontSize=8.5,fillColor=AMBER,textAnchor='middle'))
    d.add(String(385,25,'~%20-30 kullanıcı için relay (mobil/kurumsal ağ)',fontName='Arial',fontSize=7,fillColor=GRAY,textAnchor='middle'))
    return d

def comp_table():
    data=[
        ('Kamera/mikrofon + bağlantı','Tarayıcı yerleşik (WebRTC)','VAR','tam'),
        ('Signaling (tarafları buluşturma)','Pusher/Reverb — altyapı hazır','VAR','tam'),
        ('STUN (IP keşfi)','Google STUN, ücretsiz','VAR','tam'),
        ('TURN (relay, zor ağlar)','coturn (kendi VPS) veya hazır servis','KURULACAK','eksik'),
        ('Çeviri altyazı','Deepgram (STT) + çeviri katmanı','SONRAKİ FAZ','plan'),
    ]
    rows=[[Paragraph('Bileşen',CELLH),Paragraph('Çözüm',CELLH),Paragraph('Durum',CELLH)]]
    for a,b,st,kind in data:
        col=GREEN;
        if kind=='eksik': col=AMBER
        if kind=='plan': col=BLUE_M
        rows.append([Paragraph(a,CELL),Paragraph(b,CELL),chip(st,col)])
    t=Table(rows,colWidths=[52*mm,86*mm,32*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return t

def risk_table():
    data=[
        ('TURN gerekliliği','Yüksek','~%20-30 kullanıcı (mobil/kurumsal/hastane ağı) doğrudan bağlanamaz','TURN sunucusu kur (zorunlu)'),
        ('Güvenilirlik / uç durumlar','Orta','Yeniden bağlanma, Safari/mobil tuhaflıkları, eko/gürültü bizde','İyi test + olgun WebRTC kütüphanesi'),
        ('Bakım yükü','Orta','Tarayıcı güncellemeleri, TURN operasyonu sürekli bizde','VPS izleme + periyodik test'),
        ('Grup görüşme (3+)','Düşük','P2P yetmez, SFU gerekir','Telehealth 1:1 — gerek yok'),
        ('Kayıt','Düşük','P2P sunucu kaydı yok','Zaten kapalı (uyumluluk)'),
        ('Deepgram = PHI','Yüksek','Hasta sesi 3. tarafa gider','BAA/DPA + hasta açık rızası şart'),
    ]
    rows=[[Paragraph('Risk',CELLH),Paragraph('Seviye',CELLH),Paragraph('Açıklama',CELLH),Paragraph('Önlem',CELLH)]]
    for r,lvl,desc,fix in data:
        col=REDC if lvl=='Yüksek' else (AMBER if lvl=='Orta' else GREEN)
        rows.append([Paragraph(r,CELL),chip(lvl.upper(),col),Paragraph(desc,CELL),Paragraph(fix,CELL)])
    t=Table(rows,colWidths=[34*mm,20*mm,66*mm,50*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
        ('TOPPADDING',(0,0),(-1,-1),3.5),('BOTTOMPADDING',(0,0),(-1,-1),3.5)]))
    return t

def cost_table():
    data=[
        ('Medya (video/ses)','Ücretsiz (tarayıcı P2P)','10k dk/ay ücretsiz, sonra ~$0.004/dk'),
        ('TURN / altyapı','Bizde (VPS + bant genişliği)','Dahil'),
        ('Kayıt / ölçek / uç durum','Bizde','Dahil ("just works")'),
        ('Geliştirme + bakım','Bizde (tek seferlik + sürekli)','Yok'),
        ('Çeviri altyazı (Deepgram)','Ücretli (~$0.0043/dk)','Ücretli (aynı)'),
    ]
    rows=[[Paragraph('Kalem',CELLH),Paragraph('Kendi WebRTC',CELLH),Paragraph('Hazır servis (Daily.co)',CELLH)]]
    for a,b,c in data:
        rows.append([Paragraph(a,CELL),Paragraph(b,CELL),Paragraph(c,CELL)])
    t=Table(rows,colWidths=[46*mm,62*mm,62*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return t

def footer(c,doc):
    c.saveState(); c.setStrokeColor(BLUE_L2); c.setLineWidth(0.5); c.line(20*mm,15*mm,190*mm,15*mm)
    c.setFont('Arial',8); c.setFillColor(GRAY)
    c.drawString(20*mm,11*mm,'MedaGama — Telehealth WebRTC Çözüm Planı')
    c.drawRightString(190*mm,11*mm,f'Sayfa {doc.page}'); c.restoreState()

st=[]
st.append(header_band()); st.append(Spacer(1,10))
st.append(Paragraph('Özet',H2))
st.append(Paragraph('Görüntülü görüşme için hazır bir servis (Zoom/Daily) yerine, tarayıcının yerleşik '
    '<b>WebRTC</b> teknolojisiyle <b>kendi telehealth altyapımızı</b> kurabiliriz. Doktor-hasta görüşmesi '
    '<b>bire bir (1:1)</b> olduğundan WebRTC bu senaryo için idealdir ve aylık dakika ücreti ödenmez. '
    'Yapılabilir; tek kritik gereksinim, bazı ağlarda bağlantıyı kuran <b>TURN sunucusudur</b>. Çeviri '
    'altyazı ise ikinci fazda Deepgram ile eklenir (yasal sözleşme + hasta rızası şartıyla).',P))

st.append(Paragraph('Nasıl çalışır? (mimari)',H2))
st.append(architecture())

st.append(Paragraph('Gereken Bileşenler',H2))
st.append(comp_table())

st.append(Paragraph('Riskler ve Önlemler',H2))
st.append(risk_table())

st.append(Paragraph('Maliyet Karşılaştırması',H2))
st.append(cost_table())
st.append(Spacer(1,3))
st.append(Paragraph('Özet: Kendi WebRTC çözümü, SaaS dakika ücretini ortadan kaldırır; karşılığında TURN '
    'bant genişliği + geliştirme/bakım eforu bizde olur. Düşük-orta hacimde maliyet avantajlıdır.',s('mini',fontSize=8.5,textColor=GRAY)))

st.append(Paragraph('Yol Haritası',H2))
for t in [
    '<b>Faz 1 — Görüşme (çekirdek):</b> 1:1 WebRTC video/ses + Pusher signaling + STUN + TURN. Bağlan, gör, konuş, kapat. (birkaç gün)',
    '<b>Faz 2 — Dayanıklılık:</b> yeniden bağlanma, ağ/bant uyarlama, mobil + Safari gerçek-cihaz testleri.',
    '<b>Faz 3 — Çeviri altyazı:</b> Deepgram canlı konuşma→metin + çeviri. (Deepgram BAA/DPA + hasta açık rızası sonrası.)',
]:
    st.append(bullet(t))

st.append(Paragraph('Uyumluluk Notu',H2))
for t in [
    'WebRTC ses/video <b>uçtan uca şifrelidir</b> (DTLS-SRTP). Görüşme içeriği üçüncü tarafta saklanmaz.',
    'Görüşme <b>kaydı kapalıdır</b> (KVKK/HIPAA/GDPR) — yalnızca yasal sözleşme + hasta açık rızasıyla açılır.',
    'Çeviri altyazı hasta sesini Deepgram\'a gönderir → <b>PHI</b>: Deepgram ile BAA/DPA + hasta rızası zorunludur.',
]:
    st.append(bullet(t,'#6b7280'))

st.append(Spacer(1,8))
note=Table([[Paragraph('<b>Sonuç:</b> Bire bir telehealth için WebRTC ile kendi çözümümüzü kurmak '
    '<b>uygulanabilir ve maliyet avantajlıdır.</b> Üretim kalitesi için tek zorunlu yatırım TURN sunucusudur; '
    'güvenilirlik iyi test ile sağlanır. Onayınız sonrası Faz 1 görüşme iskeleti ile başlayabiliriz.',P)]],colWidths=[170*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE_L2),('BOX',(0,0),(-1,-1),0.6,BLUE),
    ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st.append(note)

doc=SimpleDocTemplate('tasks/MedaGama-Telehealth-WebRTC-Plani.pdf',pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=16*mm,bottomMargin=18*mm)
doc.build(st,onFirstPage=footer,onLaterPages=footer)
print('PDF: tasks/MedaGama-Telehealth-WebRTC-Plani.pdf')
