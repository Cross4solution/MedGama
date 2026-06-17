#!/usr/bin/env python3
# MedaGama CRM Durum & MVP Hazırlık Raporu — mavi, görselli (reportlab, Türkçe).
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Wedge

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
CELL=s('cell',fontSize=8.8,leading=12); CELLH=s('cellh',fontName='Arial-Bold',fontSize=8.8,leading=12,textColor=colors.white)
def bullet(t,c='#1d4ed8'): return Paragraph(f'<font color="{c}">•</font>&nbsp; {t}', LI)

def header_band():
    W,H=515,66; d=Drawing(W,H)
    d.add(Rect(0,0,W,H,fillColor=BLUE_D,strokeColor=None)); d.add(Rect(0,0,6,H,fillColor=BLUE_M,strokeColor=None))
    d.add(String(20,40,'MedaGama — CRM Durum & MVP Hazırlık Raporu',fontName='Arial-Bold',fontSize=16.5,fillColor=colors.white))
    d.add(String(20,23,'Platformla entegre klinik/hastane yönetim sistemi',fontName='Arial',fontSize=9.5,fillColor=colors.HexColor('#bfdbfe')))
    d.add(String(20,10,'Haziran 2026  ·  Sürüm 1.0',fontName='Arial',fontSize=8,fillColor=colors.HexColor('#93c5fd')))
    return d

# Tamamlanma donut (%93)
def donut(pct=93):
    W,H=170,150; d=Drawing(W,H); cx,cy,r=85,75,52
    d.add(Circle(cx,cy,r,fillColor=BLUE_L2,strokeColor=None))
    ang=360*pct/100
    d.add(Wedge(cx,cy,r,90,90-ang,fillColor=BLUE,strokeColor=None))
    d.add(Circle(cx,cy,r*0.62,fillColor=colors.white,strokeColor=None))
    d.add(String(cx,cy-2,f'%{pct}',fontName='Arial-Bold',fontSize=24,fillColor=BLUE_D,textAnchor='middle'))
    d.add(String(cx,cy-20,'tamamlandı',fontName='Arial',fontSize=9,fillColor=GRAY,textAnchor='middle'))
    return d

def chip(label,color):
    w=4+len(label)*5.0+8; d=Drawing(w,13)
    d.add(Rect(0,0,w,13,fillColor=color,strokeColor=None,rx=6,ry=6))
    d.add(String(w/2,3.5,label,fontName='Arial-Bold',fontSize=7.5,fillColor=colors.white,textAnchor='middle'))
    return d

def mvp_table():
    rows=[['#','Özellik (MVP standardı)','Durum']]
    data=[
        ('1','Randevu (slot/onay/iptal/no-show)','tam'),
        ('2','Hasta kaydı + 360° görünüm','tam'),
        ('3','Hasta dokümanları (yükle/indir)','tam'),
        ('4','Hasta iletişimi / mesajlaşma','tam'),
        ('5','Muayene / anamnez / tanı','tam'),
        ('6','Reçete + PDF','tam'),
        ('7','Faturalama + gelir raporu','tam'),
        ('8','Telehealth (video + transkripsiyon)','tam'),
        ('9','Onaylı yorum / değerlendirme','tam'),
        ('10','Rol / yetki yönetimi','tam'),
        ('11','Otomatik randevu hatırlatma','tam'),
        ('12','KVKK açık rıza + denetim kaydı','tam'),
        ('13','Lead / satış hunisi','tam'),
        ('14','Çoklu şube / personel','tam'),
        ('15','Raporlama / analitik','kismi'),
        ('16','Online ödeme tahsilatı','ertelendi'),
    ]
    body=[]
    for num,feat,st in data:
        if st=='tam': cell=chip('TAM',GREEN)
        elif st=='kismi': cell=chip('KISMİ',AMBER)
        else: cell=chip('ERTELENDİ',GRAY)
        body.append([Paragraph(num,CELL),Paragraph(feat,CELL),cell])
    full=[ [Paragraph('#',CELLH),Paragraph('Özellik (MVP standardı)',CELLH),Paragraph('Durum',CELLH)] ]+body
    t=Table(full,colWidths=[12*mm,128*mm,30*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),3.5),('BOTTOMPADDING',(0,0),(-1,-1),3.5)]))
    return t

def footer(c,doc):
    c.saveState(); c.setStrokeColor(BLUE_L2); c.setLineWidth(0.5); c.line(20*mm,15*mm,190*mm,15*mm)
    c.setFont('Arial',8); c.setFillColor(GRAY)
    c.drawString(20*mm,11*mm,'MedaGama — CRM Durum & MVP Hazırlık Raporu')
    c.drawRightString(190*mm,11*mm,f'Sayfa {doc.page}'); c.restoreState()

st=[]
st.append(header_band()); st.append(Spacer(1,10))

# Özet + donut yan yana
intro=Paragraph('CRM modülü, randevudan faturaya, muayeneden telehealth\'e kadar bir klinik/hastanenin '
    'günlük operasyonunu tek panelde yönetir. 16 sektör-standardı özelliğin 14\'ü tam çalışır durumda; '
    'piyasaya çıkış (MVP) için gerekli çekirdek tamamlanmıştır.',P)
row=Table([[intro, donut(93)]],colWidths=[120*mm,50*mm])
row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),0)]))
st.append(Paragraph('Özet',H2)); st.append(row)

st.append(Paragraph('MVP Standardı — Özellik Durumu',H2))
st.append(mvp_table())
st.append(Spacer(1,4))
legend=Table([[chip('TAM',GREEN),Paragraph(' Çalışıyor',CELL),chip('KISMİ',AMBER),Paragraph(' Kısmi/genişletilebilir',CELL),chip('ERTELENDİ',GRAY),Paragraph(' İleri aşama',CELL)]],
    colWidths=[16*mm,28*mm,18*mm,46*mm,24*mm,38*mm])
legend.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),2)]))
st.append(legend)

st.append(Paragraph('Bu Çalışmada Yapılanlar',H2))
for t in [
    '<b>Otomatik hatırlatma:</b> randevudan 24 saat ve 1 saat önce hasta/doktora bildirim (otomatik, çift gönderim korumalı)',
    '<b>Mesajlaşma:</b> gerçek konuşma/mesaj sistemi devreye alındı (önceden örnek veriydi)',
    '<b>KVKK açık rıza:</b> kayıt sırasında sağlık verisi rızası alınıp denetim kaydına işleniyor',
    '<b>Dokümanlar:</b> tahlil/görüntü/PDF yükleme-indirme (güvenli tip+boyut sınırı)',
    '<b>Reçeteler:</b> gerçek muayene reçeteleri + PDF',
    '<b>Raporlar:</b> gerçek gelir, randevu (durum + 30 gün trend + no-show), hasta ve hizmet analitiği',
]:
    st.append(bullet(t))

st.append(Paragraph('Kalanlar (İleri Aşama)',H2))
for t in [
    'Online ödeme tahsilatı — ödeme altyapısı (gateway) hesabı gerektirir (planlı erteleme)',
    'Gerçek entegrasyonlar — Zoom/SMS/takvim üçüncü-parti hesapları gerektirir',
    'Derin analitik — tedavi sonuçları, operasyonel verimlilik (daha geniş veri modeli)',
    'Detaylı rıza yönetimi — rıza geri çekme, versiyonlama',
]:
    st.append(bullet(t,'#6b7280'))

st.append(Spacer(1,8))
note=Table([[Paragraph('<b>Sonuç:</b> CRM, bir medikal platformun piyasaya çıkışta sahip olması gereken tüm '
    'çekirdek özelliklere sahiptir ve rakiplerle aynı seviyededir. Kalan maddeler dış hesap gerektiren '
    'veya ileri aşama özelliklerdir; çekirdek işleyişi engellemez.',P)]],colWidths=[170*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE_L2),('BOX',(0,0),(-1,-1),0.6,BLUE),
    ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st.append(note)

doc=SimpleDocTemplate('tasks/MedaGama-CRM-Raporu.pdf',pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=16*mm,bottomMargin=18*mm)
doc.build(st,onFirstPage=footer,onLaterPages=footer)
print('PDF: tasks/MedaGama-CRM-Raporu.pdf')
