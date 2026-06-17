#!/usr/bin/env python3
# MedaGama KVKK/HIPAA/GDPR Uyumluluk Raporu — mavi, görselli (reportlab, TR).
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String

pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))

BLUE=colors.HexColor('#1d4ed8'); BLUE_D=colors.HexColor('#1e3a8a'); BLUE_L=colors.HexColor('#eff6ff')
BLUE_L2=colors.HexColor('#dbeafe'); BLUE_M=colors.HexColor('#3b82f6')
INK=colors.HexColor('#1f2937'); GRAY=colors.HexColor('#6b7280')
GREEN=colors.HexColor('#16a34a'); AMBER=colors.HexColor('#d97706')

def s(n,**k):
    b=dict(fontName='Arial',textColor=INK,fontSize=10,leading=14); b.update(k); return ParagraphStyle(n,**b)
H2=s('h2',fontName='Arial-Bold',fontSize=13.5,leading=18,textColor=BLUE_D,spaceBefore=13,spaceAfter=6)
P=s('p',spaceAfter=4); LI=s('li',leading=13.5,spaceAfter=2)
CELL=s('cell',fontSize=8.8,leading=12); CELLH=s('cellh',fontName='Arial-Bold',fontSize=8.8,leading=12,textColor=colors.white)
def bullet(t,c='#1d4ed8'): return Paragraph(f'<font color="{c}">•</font>&nbsp; {t}', LI)

def header_band():
    W,H=515,66; d=Drawing(W,H)
    d.add(Rect(0,0,W,H,fillColor=BLUE_D,strokeColor=None)); d.add(Rect(0,0,6,H,fillColor=BLUE_M,strokeColor=None))
    d.add(String(20,40,'MedaGama — Veri Koruma Uyumluluk Raporu',fontName='Arial-Bold',fontSize=16.5,fillColor=colors.white))
    d.add(String(20,23,'KVKK · HIPAA · GDPR — alınan teknik önlemler',fontName='Arial',fontSize=9.5,fillColor=colors.HexColor('#bfdbfe')))
    d.add(String(20,10,'Haziran 2026  ·  Sürüm 1.0',fontName='Arial',fontSize=8,fillColor=colors.HexColor('#93c5fd')))
    return d

# 3 framework rozeti
def frameworks():
    W,H=515,58; d=Drawing(W,H)
    items=[('KVKK','Türkiye'),('HIPAA','ABD sağlık'),('GDPR','Avrupa')]
    bw=160; gap=18; x0=8
    for i,(name,desc) in enumerate(items):
        x=x0+i*(bw+gap)
        d.add(Rect(x,6,bw,44,fillColor=BLUE_L,strokeColor=BLUE,strokeWidth=1,rx=8,ry=8))
        d.add(Rect(x,6,5,44,fillColor=BLUE,strokeColor=None))
        d.add(String(x+bw/2,30,name,fontName='Arial-Bold',fontSize=15,fillColor=BLUE_D,textAnchor='middle'))
        d.add(String(x+bw/2,15,desc+' · teknik önlemler ✓',fontName='Arial',fontSize=8,fillColor=GRAY,textAnchor='middle'))
    return d

def chip(label,color):
    w=4+len(label)*5.0+8; d=Drawing(w,13)
    d.add(Rect(0,0,w,13,fillColor=color,strokeColor=None,rx=6,ry=6))
    d.add(String(w/2,3.5,label,fontName='Arial-Bold',fontSize=7.5,fillColor=colors.white,textAnchor='middle'))
    return d

def area_table():
    data=[
        ('Açık rıza (sağlık verisi)','Kayıtta zorunlu onay + zaman/IP kaydı','tam'),
        ('Veli rızası (18 yaş altı)','Veli e-posta onayı zorunlu','tam'),
        ('PHI şifreleme','Hassas alanlar (not, tanı, anamnez, mesaj, doküman) şifreli','tam'),
        ('Parola güvenliği','bcrypt hash','tam'),
        ('Oturum güvenliği','Token süresi 120 dk (otomatik sonlanır)','tam'),
        ('Erişim kontrolü','Hasta yalnızca kendi verisi; doktor/klinik kendi kapsamı','tam'),
        ('Yetkisiz erişim (IDOR)','Tüm uçlarda kimlik+yetki doğrulaması','tam'),
        ('Denetim kaydı (audit log)','PHI erişimleri ve rıza işlenir','tam'),
        ('Veri erişim/taşıma hakkı','Kullanıcı verisini dışa aktarabilir','tam'),
        ('Silinme hakkı','Hesap + veri silme','tam'),
        ('Çerez onayı','Granular (analitik/pazarlama/yurtdışı ayrı)','tam'),
        ('Analitik gizliliği','GA anonim IP + sağlık URL’leri maskeli','tam'),
        ('Telehealth gizliliği','Bulut kaydı/transkript varsayılan KAPALI','tam'),
        ('Subprocessor şeffaflığı','Gizlilik sayfasında işleyici + yurtdışı tablosu','tam'),
        ('Veri saklama (retention)','Soft-delete + yasal süre sonu otomatik silme','tam'),
        ('İhlal bildirim altyapısı','Breach notification servisi','tam'),
    ]
    rows=[[Paragraph('Alan',CELLH),Paragraph('Alınan önlem',CELLH),Paragraph('Durum',CELLH)]]
    for a,desc,stt in data:
        rows.append([Paragraph(a,CELL),Paragraph(desc,CELL),chip('TAM',GREEN)])
    t=Table(rows,colWidths=[48*mm,98*mm,24*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),3.5),('BOTTOMPADDING',(0,0),(-1,-1),3.5)]))
    return t

def footer(c,doc):
    c.saveState(); c.setStrokeColor(BLUE_L2); c.setLineWidth(0.5); c.line(20*mm,15*mm,190*mm,15*mm)
    c.setFont('Arial',8); c.setFillColor(GRAY)
    c.drawString(20*mm,11*mm,'MedaGama — Veri Koruma Uyumluluk Raporu')
    c.drawRightString(190*mm,11*mm,f'Sayfa {doc.page}'); c.restoreState()

st=[]
st.append(header_band()); st.append(Spacer(1,10))
st.append(Paragraph('Özet',H2))
st.append(Paragraph('MedaGama bir sağlık platformudur; işlediği veriler "özel nitelikli kişisel veri" (sağlık verisi) '
    'kapsamındadır. Platform, KVKK, HIPAA ve GDPR\'nin gerektirdiği teknik ve idari önlemleri uygulayacak şekilde '
    'tasarlanmıştır. Aşağıda alınan teknik önlemler ve durumları yer alır.',P))
st.append(Spacer(1,6))
st.append(frameworks())
st.append(Spacer(1,8))

st.append(Paragraph('Uygulanan Teknik Önlemler',H2))
st.append(area_table())
st.append(Spacer(1,4))
lg=Table([[chip('TAM',GREEN),Paragraph(' Uygulandı / aktif',CELL)]],colWidths=[16*mm,60*mm])
lg.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),2)]))
st.append(lg)

st.append(Paragraph('Öne Çıkan Hassas Önlemler',H2))
for t in [
    '<b>Telehealth (video görüşme):</b> ses/video kaydı ve otomatik altyazı varsayılan olarak KAPALIDIR — hasta verisi üçüncü taraf bulutta saklanmaz. (İleride yalnızca yasal sözleşme + hasta açık rızası ile açılabilir.)',
    '<b>Analitik:</b> Google Analytics yalnızca kullanıcı onayıyla çalışır; IP anonimleştirilir ve doktor/klinik gibi sağlık bağlamlı adresler maskelenir — sağlık verisi analitiğe sızmaz.',
    '<b>Şifreleme:</b> Tıbbi notlar, tanı, anamnez, mesaj içeriği ve dokümanlar veritabanında şifreli saklanır.',
    '<b>Erişim:</b> Her kullanıcı yalnızca yetkili olduğu veriye erişir; sistem her istekte kimlik ve yetki doğrular.',
]:
    st.append(bullet(t))

st.append(Paragraph('Tamamlanması Gereken Hukuki/İdari Adımlar',H2))
st.append(Paragraph('Teknik altyapı hazırdır. Aşağıdakiler yazılımla değil, hukuki/idari süreçle tamamlanır:',P))
for t in [
    'Üçüncü taraf hizmet sağlayıcılarla (video, vb.) veri işleme/gizlilik sözleşmesi (BAA/DPA) imzalanması',
    'Telehealth kaydı açılacaksa hastadan ayrı açık rıza alınması (altyapı hazır)',
    'KVKK VERBİS (veri sorumluları sicili) kaydı',
    'Gerekiyorsa Veri Koruma Sorumlusu (DPO) atanması',
]:
    st.append(bullet(t,'#6b7280'))

st.append(Spacer(1,8))
note=Table([[Paragraph('<b>Sonuç:</b> Platformun veri koruma teknik altyapısı KVKK, HIPAA ve GDPR gereklilikleriyle '
    'uyumlu şekilde uygulanmıştır. Kalan maddeler hukuki/idari süreçlerdir ve yazılım dışıdır.',P)]],colWidths=[170*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE_L2),('BOX',(0,0),(-1,-1),0.6,BLUE),
    ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st.append(note)
st.append(Spacer(1,6))
st.append(Paragraph('Not: Bu rapor, alınan teknik önlemleri özetler; hukuki uygunluk görüşü yerine geçmez. '
    'Nihai uyum için hukuk/veri koruma uzmanı değerlendirmesi önerilir.',s('disc',fontSize=8,textColor=GRAY)))

doc=SimpleDocTemplate('tasks/MedaGama-Uyumluluk-Raporu.pdf',pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=16*mm,bottomMargin=18*mm)
doc.build(st,onFirstPage=footer,onLaterPages=footer)
print('PDF: tasks/MedaGama-Uyumluluk-Raporu.pdf')
