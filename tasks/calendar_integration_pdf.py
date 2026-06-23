#!/usr/bin/env python3
# MedaGama Takvim Entegrasyonu — Mevcut Durum + Plan. Mavi, görselli (reportlab, TR).
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line

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
    d.add(String(20,40,'MedaGama — Takvim Entegrasyonu',fontName='Arial-Bold',fontSize=16.5,fillColor=colors.white))
    d.add(String(20,23,'Mevcut yapı + dış takvim (Google/Outlook/iCal) entegrasyon planı',fontName='Arial',fontSize=9.5,fillColor=colors.HexColor('#bfdbfe')))
    d.add(String(20,10,'Haziran 2026  ·  Sürüm 1.0',fontName='Arial',fontSize=8,fillColor=colors.HexColor('#93c5fd')))
    return d

def chip(label,color):
    w=4+len(label)*5.0+8; d=Drawing(w,13)
    d.add(Rect(0,0,w,13,fillColor=color,strokeColor=None,rx=6,ry=6))
    d.add(String(w/2,3.5,label,fontName='Arial-Bold',fontSize=7.5,fillColor=colors.white,textAnchor='middle'))
    return d

# Mevcut iç akış: Hasta -> müsaitlik -> randevu -> CRM takvim + telehealth + hatırlatma
def current_flow():
    W,H=515,70; d=Drawing(W,H)
    steps=['Hasta','Müsaitlik (slot)','Randevu','CRM Takvim']
    bw=110; gap=22; x=6; y=26
    for i,t in enumerate(steps):
        col=GREEN if i==len(steps)-1 else BLUE_M
        d.add(Rect(x,y,bw,28,fillColor=BLUE_L,strokeColor=col,strokeWidth=1.2,rx=7,ry=7))
        d.add(String(x+bw/2,y+10,t,fontName='Arial-Bold',fontSize=8.5,fillColor=BLUE_D,textAnchor='middle'))
        if i<len(steps)-1:
            ax=x+bw; d.add(Line(ax,y+14,ax+gap,y+14,strokeColor=BLUE_M,strokeWidth=1.2))
            d.add(String(ax+gap/2,y+18,'>',fontName='Arial-Bold',fontSize=9,fillColor=BLUE_M,textAnchor='middle'))
        x+=bw+gap
    d.add(String(257,8,'+ Telehealth linki  ·  + Otomatik hatırlatma  ·  + Yeniden planlama / İptal / Gelmedi',
        fontName='Arial',fontSize=7.5,fillColor=GRAY,textAnchor='middle'))
    return d

def have_table():
    data=[
        ('Müsaitlik / slot yönetimi','Doktor/klinik uygun saatleri tanımlar (tekil + toplu)','VAR'),
        ('Randevu alma','Hasta uygun slota randevu alır','VAR'),
        ('Yeniden planlama / İptal / Gelmedi','Tam randevu yaşam döngüsü','VAR'),
        ('CRM takvim görünümü','FullCalendar ile gün/hafta/ay','VAR'),
        ('Telehealth bağlantısı','Randevuya video görüşme linki iliştirilir','VAR'),
        ('Otomatik hatırlatma','Randevu öncesi bildirim/e-posta','VAR'),
        ('Depozito altyapısı','Randevu depozitosu (ödemesiz hazır)','VAR'),
    ]
    rows=[[Paragraph('Yetenek',CELLH),Paragraph('Açıklama',CELLH),Paragraph('Durum',CELLH)]]
    for a,b,_ in data:
        rows.append([Paragraph(a,CELL),Paragraph(b,CELL),chip('VAR',GREEN)])
    t=Table(rows,colWidths=[55*mm,95*mm,20*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),
        ('GRID',(0,0),(-1,-1),0.4,BLUE_L2),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),
        ('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),3.5),('BOTTOMPADDING',(0,0),(-1,-1),3.5)]))
    return t

def options_table():
    data=[
        ('A · iCal / ICS','Tek yön (biz → onlar)','".ics ekle" butonu + abonelik linki. Google/Outlook/Apple hepsi okur. OAuth yok.','Kolay','En hızlı kazanım'),
        ('B · Google Calendar','Çift yön','Doktor Google hesabını bağlar; randevular takvimine yazılır + meşgul saatleri okunur (çakışma önlenir).','Orta','En çok istenen'),
        ('C · Outlook / M365','Çift yön','Microsoft Graph API; Outlook kullananlar için B ile aynı mantık.','Orta','Kurumsal hekimler'),
        ('D · CalDAV','Çift yön','Apple Takvim ve genel standart. Daha az yaygın.','Zor','İleride'),
    ]
    rows=[[Paragraph('Seçenek',CELLH),Paragraph('Yön',CELLH),Paragraph('Ne yapar',CELLH),Paragraph('Efor',CELLH),Paragraph('Kime',CELLH)]]
    for a,b,c,e,w in data:
        col=GREEN if e=='Kolay' else (AMBER if e=='Orta' else REDC)
        rows.append([Paragraph('<b>'+a+'</b>',CELL),Paragraph(b,CELL),Paragraph(c,CELL),chip(e.upper(),col),Paragraph(w,CELL)])
    t=Table(rows,colWidths=[28*mm,18*mm,68*mm,18*mm,38*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),
        ('GRID',(0,0),(-1,-1),0.4,BLUE_L2),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),5),
        ('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),3.5),('BOTTOMPADDING',(0,0),(-1,-1),3.5)]))
    return t

def scenario_table():
    data=[
        ('Takvim kullanmayan hekim','Doğrudan MedaGama takvimi','HAZIR'),
        ('Google Calendar kullanan','Seçenek B — çift yön senkron','PLAN'),
        ('Outlook / Microsoft 365','Seçenek C — Graph API','PLAN'),
        ('Sadece "takvimime ekle" isteyen','Seçenek A — iCal/ICS','PLAN'),
        ('Apple / diğer','Seçenek A (ekle) veya D (CalDAV)','PLAN'),
    ]
    rows=[[Paragraph('Hekim profili',CELLH),Paragraph('Çözüm',CELLH),Paragraph('Durum',CELLH)]]
    for a,b,st in data:
        col=GREEN if st=='HAZIR' else BLUE_M
        rows.append([Paragraph(a,CELL),Paragraph(b,CELL),chip(st,col)])
    t=Table(rows,colWidths=[58*mm,82*mm,30*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),
        ('GRID',(0,0),(-1,-1),0.4,BLUE_L2),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),
        ('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),3.5),('BOTTOMPADDING',(0,0),(-1,-1),3.5)]))
    return t

def footer(c,doc):
    c.saveState(); c.setStrokeColor(BLUE_L2); c.setLineWidth(0.5); c.line(20*mm,15*mm,190*mm,15*mm)
    c.setFont('Arial',8); c.setFillColor(GRAY)
    c.drawString(20*mm,11*mm,'MedaGama — Takvim Entegrasyonu')
    c.drawRightString(190*mm,11*mm,f'Sayfa {doc.page}'); c.restoreState()

st=[]
st.append(header_band()); st.append(Spacer(1,10))
st.append(Paragraph('Özet',H2))
st.append(Paragraph('MedaGama\'nın <b>kendi iç takvim altyapısı güçlü ve çalışır durumdadır</b> — hekimler '
    'müsaitliklerini tanımlar, hastalar randevu alır, randevular telehealth ve hatırlatmalarla yönetilir. '
    '<b>Eksik olan tek şey, hekimlerin halihazırda kullandığı dış takvimlerle (Google, Outlook vb.) senkronizasyondur.</b> '
    'Bu belge mevcut yapıyı ve dış takvim entegrasyon seçeneklerini, mutabık kalmak üzere özetler.',P))

st.append(Paragraph('Mevcut Sistem — Akış',H2))
st.append(current_flow())
st.append(Paragraph('Mevcut Yetenekler (hazır)',H2))
st.append(have_table())

st.append(Paragraph('Eksik: Dış Takvim Senkronu',H2))
st.append(Paragraph('Şu an randevular yalnızca MedaGama içinde tutulur. Hekimin <b>kişisel Google/Outlook takvimine '
    'yazılmaz</b> ve hekimin o takvimlerdeki <b>meşgul saatleri okunmaz</b> (dolayısıyla dış çakışmalar görülmez). '
    'Müşterinin talebi tam olarak bu köprüdür.',P))

st.append(Paragraph('Entegrasyon Seçenekleri',H2))
st.append(options_table())
st.append(Spacer(1,3))
st.append(Paragraph('Çift yön = randevu hem dış takvime yazılır hem de hekimin dış meşgul saatleri okunarak çift '
    'rezervasyon engellenir. Tek yön = yalnızca bizden dış takvime aktarım (okuma yok).',s('mini',fontSize=8.5,textColor=GRAY)))

st.append(Paragraph('Hekim Profiline Göre Çözüm',H2))
st.append(scenario_table())

st.append(Paragraph('Önerilen Yol Haritası',H2))
for t in [
    '<b>Faz 1 — iCal/ICS (hızlı):</b> Randevu onayına "Takvime ekle" (.ics) + hekime özel abonelik linki. Tüm takvimler okur, OAuth gerekmez.',
    '<b>Faz 2 — Google Calendar (çift yön):</b> Hekim Google hesabını bağlar; randevular yazılır + meşgul saatler okunur, çakışma önlenir. (En çok istenen.)',
    '<b>Faz 3 — Outlook / Microsoft 365:</b> Graph API ile aynı çift-yön deneyim.',
    '<b>Faz 4 — CalDAV / Apple:</b> İhtiyaç olursa genel standart desteği.',
]:
    st.append(bullet(t))

st.append(Paragraph('Riskler ve Notlar',H2))
for t in [
    '<b>Gizlilik (PHI):</b> Randevu başlığında hasta adı dış takvimde görünebilir → varsayılan başlığı genel tutma seçeneği ("MedaGama randevusu") sunulmalı.',
    '<b>OAuth güvenliği:</b> Google/Microsoft erişim anahtarları şifreli saklanır; hekim istediğinde bağlantıyı koparabilir.',
    '<b>Google/Microsoft doğrulaması:</b> Üretimde OAuth uygulaması için sağlayıcı onay süreci gerekir (zaman planına eklenmeli).',
    '<b>Maliyet:</b> Google/Microsoft takvim API\'leri kota dahilinde ücretsizdir; maliyet yalnızca geliştirme eforudur.',
]:
    st.append(bullet(t,'#6b7280'))

st.append(Spacer(1,8))
note=Table([[Paragraph('<b>Sonuç:</b> İç takvim hazır ve sağlam. Müşterinin istediği dış senkron için önerimiz: '
    '<b>Faz 1 (iCal) ile hızlı başlayıp, Faz 2 (Google çift yön) ile asıl değeri vermek.</b> '
    'Mutabık kalınan seçeneklerle geliştirmeye başlayabiliriz.',P)]],colWidths=[170*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE_L2),('BOX',(0,0),(-1,-1),0.6,BLUE),
    ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st.append(note)

doc=SimpleDocTemplate('tasks/MedaGama-Takvim-Entegrasyonu.pdf',pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=16*mm,bottomMargin=18*mm)
doc.build(st,onFirstPage=footer,onLaterPages=footer)
print('PDF: tasks/MedaGama-Takvim-Entegrasyonu.pdf')
