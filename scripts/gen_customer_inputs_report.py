#!/usr/bin/env python3
"""Medagama — Uyum için müşteriden iletilmesi gerekenler (tek sayfa checklist)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

FONT = "AU"
pdfmetrics.registerFont(TTFont(FONT, "/Library/Fonts/Arial Unicode.ttf"))

TEAL = colors.HexColor("#0d9488")
DARK = colors.HexColor("#111827")
GRAY = colors.HexColor("#6b7280")
RED = colors.HexColor("#b91c1c")
LIGHT = colors.HexColor("#f0fdfa")

ss = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", FONT)
    return ParagraphStyle(name, parent=ss["Normal"], **kw)


title = st("t", fontSize=19, textColor=DARK, leading=23, spaceAfter=2)
sub = st("s", fontSize=9.5, textColor=GRAY, leading=13, spaceAfter=2)
h2 = st("h2", fontSize=11.5, textColor=TEAL, leading=15, spaceBefore=9, spaceAfter=3)
body = st("b", fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3)
item = st("i", fontSize=9.3, textColor=DARK, leading=13.5, spaceAfter=3, leftIndent=4)
note = st("n", fontSize=8.8, textColor=GRAY, leading=12)


def checks(items):
    return [Paragraph(f"☐&nbsp;&nbsp;{x}", item) for x in items]


doc = SimpleDocTemplate(
    "docs/Mevzuat_Uyum_Iletilmesi_Gerekenler.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=14 * mm,
)
E = []

E.append(Paragraph("İletilmesi Gerekenler", title))
E.append(Paragraph("Medagama — Mevzuat Uyumu İçin İstenenler", sub))
E.append(Spacer(1, 4))
E.append(HRFlowable(width="100%", thickness=1.2, color=TEAL))
E.append(Spacer(1, 5))
E.append(Paragraph(
    "Uyum çalışmasını tamamlayabilmemiz için aşağıdaki bilgi ve kararları iletmeniz gerekir.", body))

E.append(Paragraph("1) Şirket ve Hukuki Bilgiler", h2))
E += checks([
    "Veri sorumlusu şirketin tam unvanı, adresi ve vergi no nedir?",
    "VERBİS kaydınız var mı? Varsa kayıt no nedir?",
    "Veri koruma / irtibat sorumlusu kim? (kişi + e-posta?)",
    "İşleme amaçlarını onaylıyor musunuz? (randevu, tedavi, pazarlama vb.?)",
])

E.append(Paragraph("2) Saklama ve Silme Politikası", h2))
E += checks([
    "Tıbbi kayıtların saklama süresi ne olsun? (yasal minimum uzundur)",
    "Silme yaklaşımı ne olsun: hasta talebiyle mi, süre sonunda arşiv/inceleme mi?",
])

E.append(Paragraph("3) Hedef Pazar ve Sunucu (HIPAA’yı belirler)", h2))
E += checks([
    "Hedef pazar: yalnız TR/EU mı, yoksa ABD de mi?",
    "Sunucu bölgesi tercihiniz nedir? (EU / TR / ABD?)",
    "Bulut sağlayıcı tercihiniz nedir? (HIPAA için BAA imzalayan olmalı)",
])
E.append(Paragraph(
    "Not: ABD pazarı seçildi. HIPAA için ABD’de barındırma + sağlayıcıyla imzalı BAA sözleşmesi "
    "şarttır; BAA’yı veri sorumlusu olarak sizin imzalamanız gerekir.", note))

E.append(Paragraph("4) Yasal Metinler ve Sözleşmeler", h2))
E += checks([
    "KVKK/GDPR aydınlatma + açık rıza metinleri avukat onayından geçti mi?",
    "3. taraf hizmetlerle (hosting, e-posta, SMS, ödeme) DPA imzalandı mı?",
    "İhlal bildirim süreci belirli mi? (yetkili kişi + bildirim kanalı?)",
])

E.append(Spacer(1, 8))
E.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#d1d5db")))
E.append(Spacer(1, 4))
E.append(Paragraph(
    "<b>En kritik 3 karar:</b> (1) hedef pazar TR/EU + ABD mi, (2) sunucu bölgesi + bulut sağlayıcı, "
    "(3) saklama süresi. Bunlar gelmeden veri işleme envanteri ve HIPAA adımları başlayamaz. "
    "Yazılım tarafı (belge şifreleme, erişim logu, rıza kaydı) beklemeden ilerleyebilir.", note))

doc.build(E)
print("OK docs/Mevzuat_Uyum_Iletilmesi_Gerekenler.pdf")
