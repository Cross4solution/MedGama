#!/usr/bin/env python3
# MedaGama Vasco AI — Uygulama Planı (MVP). Mavi, görselli (reportlab, TR).
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Polygon

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
    d.add(String(20,40,'MedaGama — Vasco AI Uygulama Planı',fontName='Arial-Bold',fontSize=16.5,fillColor=colors.white))
    d.add(String(20,23,'Semptom → doğru doktor/klinik eşleştirme (MVP)',fontName='Arial',fontSize=9.5,fillColor=colors.HexColor('#bfdbfe')))
    d.add(String(20,10,'Haziran 2026  ·  Sürüm 1.0',fontName='Arial',fontSize=8,fillColor=colors.HexColor('#93c5fd')))
    return d

def chip(label,color):
    w=4+len(label)*5.0+8; d=Drawing(w,13)
    d.add(Rect(0,0,w,13,fillColor=color,strokeColor=None,rx=6,ry=6))
    d.add(String(w/2,3.5,label,fontName='Arial-Bold',fontSize=7.5,fillColor=colors.white,textAnchor='middle'))
    return d

# Dikey akış diyagramı — 5 kutu + oklar
def flow():
    W,H=515,300; d=Drawing(W,H)
    steps=[
        ('1 · Hasta anlatır','Doğal dille, herhangi bir dilde: "tek taraflı zonklayan baş ağrım, dengesizlik var"',BLUE_M),
        ('2 · LLM anlar','Semptomları çözer, olası uzmanlık alanını çıkarır (içeride, olasılık bazlı). Eksikse soru sorar.',BLUE),
        ('3 · RAG arar','Üye doktor/klinik veritabanından uzmanlık + baktığı hastalık + lokasyona göre en alakalıları çeker.',BLUE),
        ('4 · Sıralar','Alaka skoru + puan ile sıralar (ileride sponsorlu öne çıkarma).',BLUE),
        ('5 · Hastaya gösterir','5-10 sıralı doktor/klinik kartı + lokasyon + "neden önerildi". Teşhis YOK.',GREEN),
    ]
    bw=440; bh=42; x=(W-bw)/2; gap=14; y=H-bh
    for i,(title,desc,col) in enumerate(steps):
        d.add(Rect(x,y,bw,bh,fillColor=BLUE_L,strokeColor=col,strokeWidth=1.3,rx=8,ry=8))
        d.add(Rect(x,y,6,bh,fillColor=col,strokeColor=None))
        d.add(String(x+16,y+bh-15,title,fontName='Arial-Bold',fontSize=10.5,fillColor=BLUE_D))
        # desc — kısalt, tek satır
        d.add(String(x+16,y+9,desc[:78],fontName='Arial',fontSize=7.6,fillColor=GRAY))
        if i<len(steps)-1:
            ay=y-2; ax=x+bw/2
            d.add(Polygon([ax-5,ay, ax+5,ay, ax,ay-gap+4],fillColor=BLUE_M,strokeColor=None))
        y-=bh+gap
    return d

def stack_table():
    data=[
        ('LLM (semptom anlama)','Groq + Llama 3.3 (açık kaynak, çok hızlı, çok dilli)','OpenAI gpt-4o-mini'),
        ('Veritabanı arama (RAG)','pgvector — mevcut veritabanı içinde, ek servis yok','TiDB native vektör'),
        ('Çok dilli embedding','multilingual-e5 (açık kaynak, bedava)','OpenAI embedding'),
    ]
    rows=[[Paragraph('Bileşen',CELLH),Paragraph('Önerilen',CELLH),Paragraph('Alternatif',CELLH)]]
    for a,b,c in data:
        rows.append([Paragraph(a,CELL),Paragraph('<b>'+b+'</b>',CELL),Paragraph(c,CELL)])
    t=Table(rows,colWidths=[42*mm,78*mm,50*mm],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,BLUE_L]),('GRID',(0,0),(-1,-1),0.4,BLUE_L2),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return t

def footer(c,doc):
    c.saveState(); c.setStrokeColor(BLUE_L2); c.setLineWidth(0.5); c.line(20*mm,15*mm,190*mm,15*mm)
    c.setFont('Arial',8); c.setFillColor(GRAY)
    c.drawString(20*mm,11*mm,'MedaGama — Vasco AI Uygulama Planı')
    c.drawRightString(190*mm,11*mm,f'Sayfa {doc.page}'); c.restoreState()

st=[]
st.append(header_band()); st.append(Spacer(1,10))
st.append(Paragraph('Amaç',H2))
st.append(Paragraph('Vasco; hastanın kendi dilinde anlattığı şikayetleri anlayıp, platforma üye doktor ve klinikler '
    'arasından <b>en uygun uzmanı öneren</b> bir yönlendirme asistanıdır. <b>Teşhis koymaz.</b> İlk hedef: '
    'sade, sorunsuz ve risksiz çalışan bir sürüm. Uçuk özellik yok; sağlam çekirdek var.',P))
st.append(Spacer(1,4))
st.append(Paragraph('Nasıl Çalışır',H2))
st.append(flow())

st.append(Paragraph('İdeal Stack (ucuz · açık kaynak ağırlıklı · çok dilli)',H2))
st.append(stack_table())
st.append(Spacer(1,3))
st.append(Paragraph('Hepsi düşük maliyetli ve büyük oranda açık kaynak. Sorgu başına maliyet kuruş seviyesinin altında; '
    'ek sunucu gerektirmez (mevcut veritabanı kullanılır).',s('mini',fontSize=8.5,textColor=GRAY)))

st.append(Paragraph('İlk Sürüm Kapsamı (MVP)',H2))
for t in [
    'Üye doktor/klinik verisinin parametrelenmesi (uzmanlık, baktığı hastalıklar, lokasyon, puan)',
    'Semptom anlama + gerektiğinde ek soru sorma',
    'Veritabanından alakalı doktor/klinik bulma + lokasyon filtresi + sıralama',
    'Sohbet arayüzü → sıralı doktor/klinik kartları',
    'Zorunlu yasal uyarı: "Bu bir teşhis değildir."',
]:
    st.append(bullet(t))

st.append(Paragraph('Şimdilik Kapsam Dışı (sonraki sürüm)',H2))
for t in [
    'Sponsorlu / reklamlı öne çıkarma (alaka korunarak)',
    'Çok turlu derin diyalog hafızası',
    'Fine-tuning (gerekirse; muhtemelen gerekmez)',
]:
    st.append(bullet(t,'#6b7280'))

st.append(Spacer(1,8))
note=Table([[Paragraph('<b>Güvenlik & uyumluluk:</b> Semptom verisi sağlık verisi (PHI) sayılır; '
    'analitiğe sızmaz, maskelenir ve sistem hiçbir zaman hastaya teşhis sunmaz — yalnızca uzman önerisi. '
    'Mevcut KVKK/HIPAA/GDPR altyapımız bunu karşılar.',P)]],colWidths=[170*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE_L2),('BOX',(0,0),(-1,-1),0.6,BLUE),
    ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st.append(note)

doc=SimpleDocTemplate('tasks/MedaGama-Vasco-Plani.pdf',pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=16*mm,bottomMargin=18*mm)
doc.build(st,onFirstPage=footer,onLaterPages=footer)
print('PDF: tasks/MedaGama-Vasco-Plani.pdf')
