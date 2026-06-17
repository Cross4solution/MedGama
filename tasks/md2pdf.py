#!/usr/bin/env python3
# Basit markdown -> PDF (reportlab). Rapor formatına özel: # ## ### başlıklar,
# tablolar (| |), - madde, **kalın**, --- ayraç. Türkçe için Arial TTF.
import re, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, ListFlowable, ListItem)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ARIAL = '/System/Library/Fonts/Supplemental/Arial.ttf'
ARIAL_B = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
pdfmetrics.registerFont(TTFont('Arial', ARIAL))
pdfmetrics.registerFont(TTFont('Arial-Bold', ARIAL_B))

TEAL = colors.HexColor('#1d4ed8')   # mavi tema (eski teal yerine)
INK = colors.HexColor('#1f2937')
GRAY = colors.HexColor('#6b7280')

styles = getSampleStyleSheet()
def mk(name, **kw):
    base = dict(fontName='Arial', textColor=INK, fontSize=10.5, leading=15)
    base.update(kw); return ParagraphStyle(name, **base)

S = {
  'h1': mk('h1', fontName='Arial-Bold', fontSize=20, leading=26, textColor=TEAL, spaceBefore=6, spaceAfter=10),
  'h2': mk('h2', fontName='Arial-Bold', fontSize=14.5, leading=20, textColor=INK, spaceBefore=14, spaceAfter=6),
  'h3': mk('h3', fontName='Arial-Bold', fontSize=12, leading=17, textColor=TEAL, spaceBefore=10, spaceAfter=4),
  'p': mk('p', spaceAfter=6),
  'li': mk('li', spaceAfter=3, leading=14),
  'cell': mk('cell', fontSize=9.5, leading=13),
  'cellh': mk('cellh', fontName='Arial-Bold', fontSize=9.5, leading=13, textColor=colors.white),
  'small': mk('small', fontSize=9, textColor=GRAY),
  'h2feat': mk('h2feat', fontName='Arial-Bold', fontSize=15, leading=21, textColor=colors.white,
               spaceBefore=16, spaceAfter=8, backColor=TEAL, borderPadding=(8,10,8,10), leftIndent=0),
  'callout': mk('callout', fontSize=10.5, leading=15, textColor=colors.HexColor('#1e3a8a'),
                backColor=colors.HexColor('#dbeafe'), borderColor=TEAL, borderWidth=0,
                borderPadding=(8,10,8,10), spaceBefore=2, spaceAfter=10, fontName='Arial-Bold'),
}

def inline(t):
    t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'`(.+?)`', r'<font face="Arial">\1</font>', t)
    return t

def parse(md):
    flow = []
    lines = md.split('\n')
    i = 0
    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            i += 1; continue
        # table block
        if ln.lstrip().startswith('|') and i+1 < len(lines) and re.match(r'^\s*\|[-:\s|]+\|\s*$', lines[i+1]):
            rows = []
            while i < len(lines) and lines[i].lstrip().startswith('|'):
                if re.match(r'^\s*\|[-:\s|]+\|\s*$', lines[i]):
                    i += 1; continue
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                rows.append(cells); i += 1
            if rows:
                ncol = len(rows[0])
                data = []
                for ri, r in enumerate(rows):
                    r = (r + ['']*ncol)[:ncol]
                    st = S['cellh'] if ri == 0 else S['cell']
                    data.append([Paragraph(inline(c), st) for c in r])
                tbl = Table(data, hAlign='LEFT', colWidths=[ (170/ncol)*mm ]*ncol)
                tbl.setStyle(TableStyle([
                    ('BACKGROUND',(0,0),(-1,0),TEAL),
                    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#f3f4f6')]),
                    ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#d1d5db')),
                    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                    ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
                    ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                ]))
                flow += [Spacer(1,4), tbl, Spacer(1,8)]
            continue
        if ln.startswith('# '):
            flow.append(Paragraph(inline(ln[2:]), S['h1']))
        elif ln.startswith('## ★ '):
            flow.append(Paragraph(inline(ln[5:]), S['h2feat']))
        elif ln.startswith('> '):
            flow.append(Paragraph(inline(ln[2:]), S['callout']))
        elif ln.startswith('## '):
            flow.append(Paragraph(inline(ln[3:]), S['h2']))
        elif ln.startswith('### '):
            flow.append(Paragraph(inline(ln[4:]), S['h3']))
        elif ln.strip() == '---':
            flow.append(Spacer(1,4)); flow.append(HRFlowable(width='100%', thickness=0.6, color=colors.HexColor('#e5e7eb'))); flow.append(Spacer(1,4))
        elif re.match(r'^\s*[-*]\s+', ln):
            items = []
            while i < len(lines) and re.match(r'^\s*[-*]\s+', lines[i]):
                txt = re.sub(r'^\s*[-*]\s+', '', lines[i])
                items.append(ListItem(Paragraph(inline(txt), S['li']), leftIndent=10, value='•'))
                i += 1
            flow.append(ListFlowable(items, bulletType='bullet', start='•', leftIndent=12))
            continue
        elif re.match(r'^\s*\d+\.\s+', ln):
            items = []
            while i < len(lines) and re.match(r'^\s*\d+\.\s+', lines[i]):
                txt = re.sub(r'^\s*\d+\.\s+', '', lines[i])
                items.append(ListItem(Paragraph(inline(txt), S['li']), leftIndent=10))
                i += 1
            flow.append(ListFlowable(items, bulletType='1', leftIndent=14))
            continue
        else:
            flow.append(Paragraph(inline(ln), S['p']))
        i += 1
    return flow

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Arial', 8); canvas.setFillColor(GRAY)
    canvas.drawString(20*mm, 12*mm, 'MedaGama')
    canvas.drawRightString(190*mm, 12*mm, f'Sayfa {doc.page}')
    canvas.restoreState()

src, out = sys.argv[1], sys.argv[2]
md = open(src, encoding='utf-8').read()
doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=20*mm)
doc.build(parse(md), onFirstPage=footer, onLaterPages=footer)
print('PDF:', out)
