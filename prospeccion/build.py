import csv, json, os, re

rows = list(csv.DictReader(open('prospeccion/leads-b2b-2026-09.csv')))

def grupo(r):
    x = r['rubro'].lower()
    if 'odonto' in x: return 'Odontología'
    if 'capilar' in x or 'tricolog' in x: return 'Clínica capilar'
    if 'estetic' in x or 'dermatolog' in x or 'cirugia' in x or 'spa' in x or 'wellness' in x or 'cosmetolog' in x or 'depilacion' in x or 'medico' in x: return 'Estética y dermatología'
    if 'real estate' in x or 'inmobiliaria' in x or 'desarrolladora' in x: return 'Real estate'
    if 'hotel' in x or 'hospitalidad' in x or 'rentas' in x: return 'Hotelería boutique'
    if 'contable' in x: return 'Estudio contable'
    return 'Otros'

def canal(r):
    c = r['canal_web']
    if 'SIN SITIO' in c: return ('Sin web', 'hot')
    if 'Solo Instagram' in c: return ('Solo Instagram', 'warm')
    if 'Solo Facebook' in c: return ('Solo Facebook', 'warm')
    if 'AgendaPro' in c: return ('Booking de terceros', 'warm')
    return ('Web propia', 'cool')

data = []
for r in rows:
    label, sev = canal(r)
    data.append({
        'id': int(r['id']), 'prio': r['prioridad'], 'score': int(r['score']),
        'pais': r['pais'], 'ciudad': r['ciudad_zona'], 'rubro': r['rubro'],
        'grupo': grupo(r), 'empresa': r['empresa'],
        'canal': r['canal_web'], 'canalLabel': label, 'sev': sev,
        'tel': r['telefono'], 'rating': r['rating'], 'resenas': r['resenas'],
        'reclamada': r['ficha_reclamada'], 'hook': r['hook_comercial'],
        'grado': r['grado_dato'], 'fuente': r['fuente'],
    })
data.sort(key=lambda d: -d['score'])

html = open('prospeccion/tablero.template.html').read()
html = html.replace('/*__DATA__*/', json.dumps(data, ensure_ascii=False))
open('prospeccion/tablero.html','w').write(html)
print('leads:', len(data))
