import sys,zipfile,re,shutil,os
src=sys.argv[1]; tmp=src+'.tmp'
with zipfile.ZipFile(src) as z, zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED) as o:
    for it in z.infolist():
        d=z.read(it.filename)
        if it.filename=='word/document.xml':
            x=d.decode('utf8')
            def f(m):
                r=m.group(0)
                rpr='<w:rPr><w:b/><w:color w:val="1E8E3E"/><w:sz w:val="28"/></w:rPr>'
                if '<w:rPr>' in r: r=r.replace('<w:rPr>','<w:rPr><w:b/><w:color w:val="1E8E3E"/><w:sz w:val="28"/>',1)
                else: r=r.replace('<w:r>','<w:r>'+rpr,1)
                return r
            x=re.sub(r'<w:r>(?:<w:rPr>(?:(?!</w:rPr>).)*</w:rPr>)?<w:t(?: [^>]*)?>✓</w:t></w:r>',f,x)
            d=x.encode('utf8')
        o.writestr(it,d)
shutil.move(tmp,src)
