"""Cars of Перекупчино from his car channel "Перекупчино Авто" (153K, private, invite only).

Input: a folder with posts.json + photos collected from the channel (one post per message):
  {mid: {mid, text, time, views, files: [{f, w, h}]}}
Each car goes "СКОРО В ПРОДАЖЕ" (teaser) -> "ВИДЕО ОБЗОР" -> "В ПРОДАЖЕ" (listing with album, price, phone, Автотека link).
Takes the newest N listings; the last `sold` of them are shown as sold.

usage: python3 tools/build_perekupchino.py <posts_dir> [active=15] [sold=2]
Writes assets/js/cars-perekupchino.js (appended to window.CARS) and assets/img/cars/pk-*/.
"""
import json, os, re, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_data import clean, BODY, TECH, HIST  # same text cleanup as Lex Auto

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img', 'cars')
INVITE = 'https://t.me/+MOTvSB1R7pw3MjE6'

MAKES = {'AUDI': 'Audi', 'FORD': 'Ford', 'GREAT WALL': 'Great Wall', 'HYUNDAI': 'Hyundai', 'MITSUBISHI': 'Mitsubishi',
         'TOYOTA': 'Toyota', 'KIA': 'Kia', 'VOLKSWAGEN': 'Volkswagen', 'VW': 'Volkswagen', 'SKODA': 'Skoda', 'BMW': 'BMW',
         'MERCEDES': 'Mercedes', 'MERCEDES-BENZ': 'Mercedes', 'NISSAN': 'Nissan', 'RENAULT': 'Renault', 'LADA': 'Lada',
         'CHEVROLET': 'Chevrolet', 'MAZDA': 'Mazda', 'HONDA': 'Honda', 'LEXUS': 'Lexus', 'OPEL': 'Opel', 'PEUGEOT': 'Peugeot',
         'CITROEN': 'Citroen', 'SUZUKI': 'Suzuki', 'SUBARU': 'Subaru', 'VOLVO': 'Volvo', 'LAND ROVER': 'Land Rover',
         'RANGE ROVER': 'Land Rover', 'CHERY': 'Chery', 'HAVAL': 'Haval', 'GEELY': 'Geely', 'INFINITI': 'Infiniti',
         'PORSCHE': 'Porsche', 'JEEP': 'Jeep', 'DAEWOO': 'Daewoo', 'SSANGYONG': 'SsangYong', 'UAZ': 'УАЗ', 'УАЗ': 'УАЗ', 'YAZ': 'УАЗ',
         'CHRYSLER': 'Chrysler', 'DODGE': 'Dodge', 'FIAT': 'Fiat', 'SEAT': 'Seat', 'DATSUN': 'Datsun', 'ZOTYE': 'Zotye', 'LIFAN': 'Lifan'}

is_listing = lambda t: bool(re.match(r'\s*В ПРОДАЖЕ', t or '', re.I))
is_teaser = lambda t: bool(re.match(r'\s*СКОРО В ПРОДАЖЕ', t or '', re.I))


def rub(s):
    """'1.700.000 ₽' / '650.000₽' / '460 000' -> int"""
    m = re.search(r'(\d{1,3}(?:[.\s ]\d{3})+|\d{4,})', s)
    return int(re.sub(r'\D', '', m.group(1))) if m else None


def model_case(w):
    if re.search(r'\d', w) or len(w) <= 2 or w.upper() in ('GT', 'SUV', 'AMG', 'RS', 'GTI', 'TDI', 'CX'):
        return w.upper() if len(w) <= 3 else w
    return w.capitalize()


def parse_title(lines):
    """first meaningful line(s) after the header -> make, model, year"""
    for i, l in enumerate(lines[:6]):
        u = clean(l).upper()
        mk = next((k for k in sorted(MAKES, key=len, reverse=True) if u.startswith(k)), None)
        if not mk:
            continue
        rest = re.sub(r'[,]', ' ', u[len(mk):])
        y = re.search(r'(19[89]\d|20[0-2]\d)', ' '.join(lines[i:i + 3]))
        rest = re.sub(r'(19[89]\d|20[0-2]\d)\s*Г?\.?', ' ', rest)
        words = []
        for w in rest.split():
            if w in ('Г', 'Г.') or re.match(r'^\d[.,]\d|^(MT|AT|АТ|МТ|4WD|AWD|CVT|DSG|ЛС)$', w):
                if words: break
                continue
            words.append(w)
        model = ' '.join(model_case(w) for w in words)
        return MAKES[mk], model.strip(), int(y.group(1)) if y else None, i
    return None, None, None, 0


def parse(text):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    body = lines[1:]
    make, model, year, ti = parse_title(body)
    T = text.upper()
    d = dict(make=make, model=model, year=year)
    d['gearbox'] = 'DSG' if 'DSG' in T else 'Вариатор' if re.search(r'ВАРИАТОР|CVT', T) else 'Робот' if 'РОБОТ' in T \
        else 'Механика' if re.search(r'МЕХАНИК|\bМКПП\b|\bМТ\b', T) else 'Автомат' if re.search(r'АВТОМАТ|\bАКПП\b|\bАТ\b', T) else None
    d['fuel'] = 'Дизель' if 'ДИЗЕЛ' in T else 'Бензин' if re.search(r'БЕНЗ', T) else None
    v = re.search(r'\b([0-6][.,]\d)\b', text); d['volume'] = v.group(1).replace(',', '.') if v else None
    hp = re.search(r'(\d{2,3})\s*л\.?\s*с', text, re.I); d['hp'] = int(hp.group(1)) if hp else None
    d['awd'] = bool(re.search(r'ПОЛНЫЙ ПРИВОД|4WD|4Х4|4X4|QUATTRO|XDRIVE|4MATIC', T))
    o = re.search(r'(\d)\s*(?:владел|хозя|регистрац)', text, re.I) or re.search(r'владел\w*\s*[:-]?\s*(\d)', text, re.I)
    d['owners'] = int(o.group(1)) if o else (1 if re.search(r'1 ВЛАДЕЛЕЦ|ОДИН ВЛАДЕЛЕЦ|1 ХОЗЯИН', T) else None)
    mil = None
    NUM = r'(\d{1,3}(?:[.\s\u00a0]\d{3})+|\d{2,6})'
    for l in lines:
        if not re.search(r'пробег|пообег', l, re.I):
            continue
        m = re.search(r'(?:пробег|пообег)\w*[^\d\n]{0,30}?' + NUM + r'\s*(тыс|т\.?\s?км|км)?', l, re.I) or \
            re.search(NUM + r'\s*(тыс|т\.?\s?км|км)?\s*(?:[а-яё]+\s){0,2}(?:пробег|пообег)', l, re.I)
        if not m:
            continue
        n = int(re.sub(r'\D', '', m.group(1))); unit = (m.group(2) or '').lower()
        if 1980 <= n <= 2030 and not unit:
            continue
        mil = n * 1000 if (n < 1000 or unit.startswith('тыс')) and n < 1000 else n
        break
    d['mileage'] = mil
    d['mileage_native'] = bool(re.search(r'родн|оригинал|честн', ' '.join(l for l in lines if re.search('пробег|пообег', l, re.I)), re.I))
    d['pts'] = bool(re.search(r'ПТС ОРИГИНАЛ|ОРИГИНАЛ\w* ПТС', T))
    d['keys2'] = '2 КЛЮЧ' in T
    d['not_taxi'] = 'НЕ ТАКСИ' in T
    d['no_accidents'] = bool(re.search(r'БЕЗ ДТП|ДТП[^\n]{0,12}НЕТ', T))
    d['direct_owner'] = bool(re.search(r'ОТ СОБСТВЕННИК|ОТ ВЛАДЕЛЬЦ|В МОЕЙ СЕМЬЕ', T))
    a = re.search(r'(зел[её]н\w*|кристально зел[её]н\w*|хорош\w*)\s+автотек|автотек\w*\s+(зел[её]н\w*|хорош\w*|чист\w*)', text, re.I)
    d['autoteka'] = (a.group(1) or a.group(2)).lower().replace('ё', 'е') if a else None
    link = re.search(r'https://autoteka\.ru/\S+', text)
    d['autoteka_url'] = link.group(0) if link else None
    price = None
    for l in lines:
        if re.search(r'цена|₽|💰', l, re.I) and not re.search(r'первые цены|цены до|оценк|рынок|рынк', l, re.I):
            price = rub(l) or price
    d['price'] = price
    ph = re.search(r'(8|\+7)[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})(?:\s+([А-ЯЁ][а-яё]+))?', text)
    d['phone'] = f'+7{ph.group(2)}{ph.group(3)}{ph.group(4)}{ph.group(5)}' if ph else None
    d['phoneLabel'] = f'+7 {ph.group(2)} {ph.group(3)}-{ph.group(4)}-{ph.group(5)}' if ph else None
    d['manager'] = ph.group(6) if ph and ph.group(6) else None
    # description lines -> groups (skip header, title, price/phone/links/boilerplate)
    skip = re.compile(r'^(В ПРОДАЖЕ|СКОРО)|цена|звони|http|наш канал|доставим|кредит|подробности у менеджера|смотреть автотеку|автотека здесь|санкт-петербург|выезжайте на осмотр', re.I)
    groups = {'body': [], 'tech': [], 'history': [], 'equipment': []}
    for l in lines[ti + 3:]:
        c = clean(l.replace('✅', ''))
        if not c or len(c) < 4 or skip.search(c) or (make and c.upper().startswith(make.upper())):
            continue
        if re.search(r'комплектац|климат|кондей|кондиц|подогрев|мультируль|круиз|carplay|монитор|навигац|кожа|литье|резин|диск', c, re.I):
            groups['equipment'].append(c)
        elif (HIST.search(c) or re.search(r'пообег|ключ|документ|штраф|запрет', c, re.I)) and not BODY.search(c): groups['history'].append(c)
        elif BODY.search(c) or re.search(r'днище|порог|стакан|окрас|кузов|коррози|салон', c, re.I): groups['body'].append(c)
        elif TECH.search(c) or re.search(r'двигател|ходов|рейк|сцеплен|троит|стучит|ошибок', c, re.I): groups['tech'].append(c)
        else: groups['body'].append(c)
    d['groups'] = {k: v[:10] for k, v in groups.items()}
    return d


def save(src, dst, size, q):
    im = Image.open(src).convert('RGB'); im.thumbnail((size, size), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)
    return im.size


def main(src_dir, n_active=15, n_sold=2):
    posts = json.load(open(os.path.join(src_dir, 'posts.json'), encoding='utf-8'))
    ordered = sorted(posts.values(), key=lambda p: int(p['mid']))
    listings = [p for p in ordered if is_listing(p['text'])]
    chosen = listings[-(n_active + n_sold):]
    cars = []
    for idx, p in enumerate(reversed(chosen)):  # newest first
        d = parse(p['text'])
        if d['model']:
            m = re.sub(r'\s*\S*-?ОЙ\b.*|\s*РЕСТАЙЛ\w*.*', '', d['model'], flags=re.I).strip()
            m = m.replace('С', 'C') if re.fullmatch(r'\d+С', m) else m
            m = {'E-klasse': 'E-Class', 'Rav4': 'RAV4'}.get(m, m)
            if d['make'] == 'BMW' and re.match(r'^\d(\s|$)', m): m = re.sub(r'^(\d)', r'\1-series', m)
            d['model'] = m
        if not d['make'] or not d['price']:
            print('skip, could not parse', p['mid'], p['text'][:80].replace('\n', ' '))
            continue
        # teaser right before the listing often carries the market estimate ("ВЫСОКАЯ ОЦЕНКА")
        prev = [q for q in ordered if int(q['mid']) < int(p['mid'])][-4:]
        teaser = next((q for q in reversed(prev) if is_teaser(q['text'])), None)
        est = re.search(r'ОЦЕНКА\s*([\d.\s ]+)', teaser['text'], re.I) if teaser else None
        d['avito'] = rub(est.group(1)) if est else None
        d['market'] = None
        d['gap'] = d['avito'] - d['price'] if d['avito'] and d['avito'] > d['price'] else None
        mid = int(p['mid'])
        d['id'] = mid - 4294967296
        d['slug'] = 'pk-' + re.sub(r'[^a-z0-9]+', '-', f"{d['make']} {d['model']} {d['year'] or ''}".lower()).strip('-') + f'-{d["id"]}'
        d.update(seller='perekupchino', restyle=bool(re.search(r'рестайл', p['text'], re.I)), mileage_base=None,
                 not_on_avito=False, bargain=True, paint={}, painted_count=0, reports=[], proof=[], tg_posts=[],
                 notes=[], engine_line='', invite=INVITE, source=INVITE, views=p['views'],
                 status='sold' if idx >= n_active else 'active')
        d['date'] = p.get('date') or ''
        out = os.path.join(OUT, d['slug']); os.makedirs(out, exist_ok=True)
        gal = []
        files = [f for f in p['files'] if f['w'] >= 500 or f['h'] >= 500]
        for k, f in enumerate(files):
            w, h = save(os.path.join(src_dir, f['f']), os.path.join(out, f'{k:02d}.jpg'), 1200, 76)
            gal.append({'src': f'assets/img/cars/{d["slug"]}/{k:02d}.jpg', 'w': w, 'h': h})
        if not gal:
            print('skip, no photos', p['mid']); continue
        save(os.path.join(src_dir, files[0]['f']), os.path.join(out, 'card.jpg'), 640, 72)
        d['card'] = f'assets/img/cars/{d["slug"]}/card.jpg'
        d['gallery'] = gal
        cars.append(d)
    js = '// Generated by tools/build_perekupchino.py - do not edit by hand\nwindow.CARS = (window.CARS || []).concat(' + \
         json.dumps(cars, ensure_ascii=False, indent=1) + ');\n'
    open(os.path.join(ROOT, 'assets', 'js', 'cars-perekupchino.js'), 'w', encoding='utf-8').write(js)
    print(len(cars), 'cars')
    for c in cars:
        print(f"{c['status']:<7}{c['make']:<11}{c['model']:<22}{c['year']!s:<5} {c['gearbox']!s:<9} {c['mileage']!s:>7} own={c['owners']} price={c['price']} avito={c['avito']} phone={c['phoneLabel']} imgs={len(c['gallery'])} teka={'yes' if c['autoteka_url'] else '-'}")


if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 15, int(sys.argv[3]) if len(sys.argv) > 3 else 2)
