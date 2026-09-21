import zipfile, re, sys, os
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
path = sys.argv[1]
z = zipfile.ZipFile(path)
doc = ET.fromstring(z.read('word/document.xml'))
body = doc.find(W + 'body')

def ptext(p):
    out = []
    for node in p.iter():
        tag = node.tag
        if tag == W + 't':
            out.append(node.text or '')
        elif tag == W + 'tab':
            out.append('\t')
        elif tag == W + 'br':
            out.append('\n')
        elif tag == W + 'drawing':
            out.append('[图片]')
    return ''.join(out)

def style_of(p):
    pPr = p.find(W + 'pPr')
    if pPr is None:
        return None
    ps = pPr.find(W + 'pStyle')
    return ps.get(W + 'val') if ps is not None else None

idx = 0
for el in body:
    if el.tag == W + 'p':
        idx += 1
        t = ptext(el)
        print('P%-3d [%s] %s' % (idx, style_of(el), t))
    elif el.tag == W + 'tbl':
        idx += 1
        print('T%-3d ==== TABLE ====' % idx)
        for r_i, tr in enumerate(el.findall(W + 'tr'), 1):
            cells = []
            for tc in tr.findall(W + 'tc'):
                cells.append(' '.join(ptext(p) for p in tc.findall(W + 'p')).strip())
            print('   R%-2d | %s' % (r_i, ' | '.join(cells)))
