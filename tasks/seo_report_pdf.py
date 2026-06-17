#!/usr/bin/env python3
# MedaGama SEO Raporu — mavi, görselli (reportlab, Türkçe).
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))

BLUE=colors.HexColor('#1d4ed8'); BLUE_D=colors.HexColor('#1e3a8a'); BLUE_L=colors.HexColor('#eff6ff')
BLUE_L2=colors.HexColor('#dbeafe'); BLUE_M=colors.HexColor('#3b82f6')
INK=colors.HexColor('#1f2937'); GRAY=colors.HexColor('#6b7280')
GREEN=colors.HexColor('#16a34a'); REDC=colors.HexColor('#dc2626')

def s(n,**k):
    b=dict(fontName='Arial',textColor=INK,fontSize=10,leading=14); b.update(k); return ParagraphStyle(n,**b)
H2=s('h2',fontName='Arial-Bold',fontSize=13.5,leading=18,textColor=BLUE_D,spaceBefore=12,spaceAfter=6)
P=s('p',spaceAfter=4); LI=s('li',leading=13.5,spaceAfter=2)
CELL=s('cell',fontSize=9,leading=12); CELLH=s('cellh',fontName='Arial-Bold',fontSize=9,leading=12,textColor=colors.white)
def bullet(t): return Paragraph(f'<font color="#1d4ed8">•</font>&nbsp; {t}', LI)

def header_band():
    W,H=515,66; d=Drawing(W,H)
    d.add(Rect(0,0,W,H,fillColor=BLUE_D,strokeColor=None))
    d.add(Rect(0,0,6,H,fillColor=BLUE_M,strokeColor=None))
    d.add(String(20,40,'MedaGama — SEO Çalışması Raporu',fontName='Arial-Bold',fontSize=18,fillColor=colors.white))
    d.add(String(20,23,'Platformda yapılan tüm arama motoru optimizasyonu iyileştirmeleri',fontName='Arial',fontSize=9.5,fillColor=colors.HexColor('#bfdbfe')))
    d.add(String(20,10,'Haziran 2026  ·  Sürüm 1.0',fontName='Arial',fontSize=8,fillColor=colors.HexColor('#93c5fd')))
    return d

# Önce / Sonra görseli
def before_after():
    W,H=515,120; d=Drawing(W,H)
    d.add(String(W/2,H-12,'Google Botu Sayfayı Nasıl Görüyor?',fontName='Arial-Bold',fontSize=11,fillColor=BLUE_D,textAnchor='middle'))
    # ÖNCE kutu
    d.add(Rect(8,8,232,90,fillColor=colors.HexColor('#fef2f2'),strokeColor=REDC,strokeWidth=1,rx=8,ry=8))
    d.add(String(124,80,'ÖNCE (CRA)',fontName='Arial-Bold',fontSize=10,fillColor=REDC,textAnchor='middle'))
    for i,t in enumerate(['Boş sayfa indirilir','İçerik JavaScript ile sonradan gelir','Google çoğu zaman göremez → sıralayamaz']):
        d.add(String(20,60-i*16,'✕ '+t,fontName='Arial',fontSize=8.5,fillColor=INK))
    # ok
    d.add(Polygon([248,53, 262,46, 262,60],fillColor=BLUE,strokeColor=None))
    d.add(Line(244,53,258,53,strokeColor=BLUE,strokeWidth=2))
    # SONRA kutu
    d.add(Rect(275,8,232,90,fillColor=BLUE_L,strokeColor=BLUE,strokeWidth=1,rx=8,ry=8))
    d.add(String(391,80,'SONRA (Next.js)',fontName='Arial-Bold',fontSize=10,fillColor=BLUE,textAnchor='middle'))
    for i,t in enumerate(['Hazır, dolu HTML sunulur','İçerik ilk yüklemede mevcut','Google her şeyi görür → sıralar']):
        d.add(String(287,60-i*16,'✓ '+t,fontName='Arial',fontSize=8.5,fillColor=INK))
    return d

# Tamamlanma grafiği (10 alan)
def completion():
    areas=['Altyapı (Next.js)','Meta + canonical','Yapılandırılmış veri','Sitemap + robots',
           'İçerik SSR','Hız (CWV)','Çok dilli (5 dil)','Tedavi+şehir landing','İçerik zenginleştirme','Ölçüm (GA4/SC)']
    rowh=17; top=len(areas)*rowh+24; W=515; d=Drawing(W,top)
    d.add(String(0,top-12,'Tamamlanan SEO Alanları',fontName='Arial-Bold',fontSize=11,fillColor=BLUE_D))
    barx=205; barw=270
    for i,a in enumerate(areas):
        y=top-40-i*rowh
        d.add(String(0,y,a,fontName='Arial',fontSize=8.5,fillColor=INK))
        d.add(Rect(barx,y-2,barw,11,fillColor=BLUE_L2,strokeColor=None,rx=3,ry=3))
        d.add(Rect(barx,y-2,barw,11,fillColor=BLUE,strokeColor=None,rx=3,ry=3))  # %100
        d.add(String(barx+barw+6,y,'✓',fontName='Arial-Bold',fontSize=9,fillColor=GREEN))
    return d

def tbl(rows,widths):
    data=[[Paragraph(str(c),CELLH if r==0 else CELL) for c in row] for r,row in enumerate(rows)]
    t=Table(data,colWidths=widths,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return t

def sec(title, items):
    out=[Paragraph(title,H2)]
    for it in items: out.append(bullet(it))
    return out

def footer(c,doc):
    c.saveState(); c.setStrokeColor(BLUE_L2); c.setLineWidth(0.5); c.line(20*mm,15*mm,190*mm,15*mm)
    c.setFont('Arial',8); c.setFillColor(GRAY)
    c.drawString(20*mm,11*mm,'MedaGama — SEO Çalışması Raporu')
    c.drawRightString(190*mm,11*mm,f'Sayfa {doc.page}'); c.restoreState()

st=[]
st.append(header_band()); st.append(Spacer(1,10))
st.append(Paragraph('Özet',H2))
st.append(Paragraph('Platform modern altyapıya (Next.js) taşındı ve baştan sona SEO optimizasyonu yapıldı. '
  'Amaç: doktor, klinik ve tedavi sayfalarının Google\'da üst sıralarda çıkması; her ülkede yerel görünürlük; '
  'rakiplerle rekabet edebilir teknik temel.',P))
st.append(Spacer(1,6))
st.append(before_after())
st.append(Spacer(1,8))
st.append(completion())

st.append(Paragraph('Yapılan Çalışmalar (Detay)',H2))
for blk in [
  ('1. Altyapı Dönüşümü',['Eski teknolojiden (CRA) modern Next.js\'e geçildi',
     'Sayfalar sunucuda hazırlanıp Google\'a dolu HTML olarak sunuluyor','94+ sayfa kayıpsız taşındı']),
  ('2. Sayfa Etiketleri (Meta)',['Tüm sayfalarda benzersiz başlık + açıklama','Canonical (asıl adres) — çift içerik önlendi',
     'Open Graph + Twitter Card (sosyal önizleme)','Doktor/klinik dinamik OG görselleri']),
  ('3. Yapılandırılmış Veri (Zengin Sonuç)',['Physician (doktor), MedicalClinic (klinik)',
     'Organization + WebSite (kurumsal + arama kutusu)','BreadcrumbList (sayfa yolu) + FAQPage (SSS)']),
  ('4. Site Haritası ve Yönlendirme',['Otomatik sitemap.xml — tüm doktor/klinik/tedavi, 5 dil',
     'robots.txt — tarama yönetimi, panel sayfaları gizli','Yönlendirmeler + 404 yönetimi (yanlış indeksleme önlendi)']),
  ('5. İçeriğin Sunucuda Hazırlanması',['Doktor/klinik içeriği ilk HTML\'de hazır',
     'Tüm siteyi etkileyen "boş kabuk" sorunu giderildi']),
  ('6. Hız ve Performans (Core Web Vitals)',['Yazı tipleri site içine alındı (hızlı, kaymasız)',
     'Görseller optimize (boyut, geç yükleme, modern format)','Statik sayfalar önceden üretiliyor']),
  ('7. Çok Dilli SEO (5 Dil)',['URL: /tr /en /de /ar /ru + hreflang etiketleri','Arapça sağdan-sola (RTL) + dil değiştirici',
     'Arayüz çevirileri tamamlandı (~689 metin/dil) — karışık dil giderildi']),
  ('8. Programatik SEO — Tedavi+Şehir',['/tedaviler/[uzmanlık]/[şehir] sayfa sistemi',
     'Sunucuda hazır: başlık, sağlayıcı listesi, SSS','İnce içerik koruması (sağlayıcı yoksa indekslenmez)']),
  ('9. İçerik Zenginleştirme',['5 sayfaya özgün ~400 kelime + alt başlık + SSS + iç link',
     '"İnce içerik" sorunu giderildi; tıbbi iddia yok']),
  ('10. Ölçüm + Backend',['Google Analytics 4 (çerez onaylı, KVKK)','Search Console doğrulama altyapısı',
     'Backend: doktor/klinik uzmanlık+şehir filtresi']),
]:
    st += sec(blk[0], blk[1])

st.append(Spacer(1,6))
st.append(KeepTogether([
  Paragraph('Devreye Alma (Son Adım)',H2),
  Paragraph('Teknik çalışma tamamlandı. Google\'da görünmeye başlamak için: (1) Analytics + Search Console hesaplarının bağlanması, '
    '(2) site haritasının gönderilmesi. Sonrası: çevrilmiş içerik genişletme ve blog/içerik üretimi.',P),
]))
note=Table([[Paragraph('<b>Özet:</b> Platformun SEO teknik altyapısı sektör standartlarında ve rakiplerle rekabet edebilir seviyede tamamlanmıştır.',P)]],colWidths=[170*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE_L2),('BOX',(0,0),(-1,-1),0.6,BLUE),
  ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st.append(Spacer(1,4)); st.append(note)

doc=SimpleDocTemplate('tasks/MedaGama-SEO-Raporu.pdf',pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=16*mm,bottomMargin=18*mm)
doc.build(st,onFirstPage=footer,onLaterPages=footer)
print('PDF: tasks/MedaGama-SEO-Raporu.pdf')
