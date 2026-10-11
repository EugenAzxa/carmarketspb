"""Turn scraped Telegram posts of a seller into assets/js/data.js + resized photos.

Usage:
  python3 tools/build_data.py <posts.json> <photos_dir>

posts.json comes from tools/parse_tg.py, photos_dir/<listing_id>/NN.jpg holds
the main gallery and x<postid>_<n>.jpg the teaser / follow-up photos.
"""
import json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_IMG = os.path.join(ROOT, 'assets', 'img', 'cars')
SELLER = 'lex-auto'

# listing post id -> teaser post id (hero shot), extra report screenshots
LISTINGS = {
    162509: dict(cover=162495, reports=[162498]),
    162536: dict(cover=162522),
    162578: dict(cover=162564),
    162602: dict(cover=162588),
    162631: dict(cover=162615, proof=[162616]),
    162656: dict(cover=162641),
    162683: dict(cover=162669),
    162707: dict(cover=162693),
    162732: dict(cover=162718),
    162757: dict(cover=162743),
    162783: dict(cover=162766),
    162807: dict(cover=162793, reports=[162796]),
    162833: dict(cover=162819),
    162860: dict(cover=162846),
    162884: dict(cover=162870),
    162908: dict(cover=162894, reports=[162897]),
    162932: dict(cover=162918),
    162960: dict(cover=162945),
    163049: dict(cover=163035),
    163075: dict(cover=163060),
    163095: dict(cover=163081),
    163120: dict(cover=163106),
}
# Demo-only marketplace state (not from the channel): statuses and bargaining
DEMO_STATE = {162509: 'sold', 162536: 'sold', 162602: 'reserved', 162783: 'reserved'}
NO_BARGAIN_GAP = 300_000  # big gap = price is already final

FIX_PRICE = {(163075, 'avito'): 1_150_000}  # "1.50к" typo in the post

EMOJI = re.compile(
    '[\U0001F000-\U0001FFFF☀-➿⬀-⯿️‍←-⇿‼⁉™ℹ⌚-⏿▪-◾]+')


def clean(s):
    s = EMOJI.sub('', s).strip()
    s = s.replace('—', '-').replace('–', '-')
    s = re.sub(r'\s+', ' ', s)
    s = s.strip(' !').rstrip('.')
    keep = {'ПТС', 'ДТП', 'ВИН', 'CVT', 'DSG', 'МТ', 'АТ', 'BT', 'TV', 'AMG', 'RR', 'X5M', 'М-БАМПЕР', 'LONG-КУЗОВ'}
    words = []
    for w in s.split(' '):
        core = re.sub(r'[^\w\-]', '', w)
        if core.upper() in keep or not re.search('[А-ЯЁ]{2,}', core):
            words.append(w)
        elif core.isupper() or re.fullmatch(r'[А-ЯЁ\-/]+', core):
            words.append(w.lower())
        else:
            words.append(w)
    s = ' '.join(words)
    s = re.sub(r'(?<=[а-яё,/] )([ИВСК])(?= )', lambda m: m.group(1).lower(), s)
    if s:
        s = s[0].upper() + s[1:]
    return s


def money(t):
    t = t.replace('🍋', '.000к').replace(' ', '')
    m = re.search(r'(\d+(?:\.\d+)?)к', t)
    if not m:
        return None
    v = m.group(1)
    if '.' in v:
        a, b = v.split('.')
        return int(a) * 1_000_000 + int(b.ljust(3, '0')[:3]) * 1000
    return int(v) * 1000


def km(t):
    m = re.search(r'(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*(?:км)?', t)
    if not m:
        return None
    return int(re.sub(r'\D', '', m.group(1)))


BODY = re.compile(r'кузов|краск|окрас|гнил|ржав|проем|жук|арк|низ|цвет|вмятин|царап|шпакл|бронеп|бита|крыш', re.I)
TECH = re.compile(r'работает|цокает|едет|электрик|мотор|коробк|автомат|dsg|вариатор|подвеск|техни|обслуж|ошибк|кондей|рефриж|вложен|дым|пина|затяг', re.I)
HIST = re.compile(r'владел|птс|ключ|пробег|автотек|дтп|такси|каршер|авито|страхов|хоз|вин|руках|американ|расчет|дилер', re.I)

MAKES = ['Mercedes', 'BMW', 'Toyota', 'Lexus', 'Haval', 'Hyundai', 'Chevrolet', 'VW', 'Lada', 'Skoda',
         'Mazda', 'Kia', 'Chery', 'Grand Vitara']
MAKE_NAME = {'VW': 'Volkswagen', 'Grand Vitara': 'Suzuki'}


def parse(post):
    lines = [l for l in post['text'].split('\n')]
    nonempty = [l.strip() for l in lines if l.strip()]
    d = {'id': post['id']}
    head = nonempty[0]
    d['gap'] = money(head) if 'Зазор' in head else None
    # title line = first line with a year
    ti = next(i for i, l in enumerate(nonempty) if re.search(r'(19|20)\d\d', l) and 'Зазор' not in l)
    title = clean(nonempty[ti])
    d['year'] = int(re.search(r'(19|20)\d\d', title).group(0))
    model = title.replace(str(d['year']), '').strip()
    model = re.sub(r'\bрест\b', 'рестайлинг', model)
    restyle = 'рестайлинг' in model
    model = model.replace('рестайлинг', '').strip()
    make = next((m for m in MAKES if model.startswith(m)), model.split()[0])
    d['make'] = MAKE_NAME.get(make, make)
    d['model'] = (model if make == 'Grand Vitara' else model[len(make):].strip()).replace('Rav 4', 'RAV4')
    d['model'] = re.sub(r'\bSPRINTER\b', 'Sprinter', d['model'])
    d['restyle'] = restyle
    eng = clean(nonempty[ti + 1])
    d['engine_line'] = eng
    vol = re.search(r'(\d\.\d)', eng)
    d['volume'] = vol.group(1) if vol else None
    hp = re.search(r'(\d{2,3})\s*лс', eng)
    d['hp'] = int(hp.group(1)) if hp else None
    e = eng.lower()
    d['fuel'] = 'Дизель' if 'дизел' in e else 'Бензин'
    if 'dsg' in e: d['gearbox'] = 'DSG'
    elif 'cvt' in e: d['gearbox'] = 'Вариатор'
    elif 'амт' in e: d['gearbox'] = 'Робот'
    elif 'мт' in e.split(): d['gearbox'] = 'Механика'
    else: d['gearbox'] = 'Автомат'
    txt = post['text']
    d['awd'] = 'ПОЛНЫЙ ПРИВОД' in txt.upper()
    o = re.search(r'(\d+)\s*В\w{0,2}дел', txt)
    d['owners'] = int(o.group(1)) if o else None
    d['pts'] = 'Оригинальный ПТС' in txt
    d['keys2'] = '2 ключа' in txt
    d['not_taxi'] = 'ТАКСИ' in txt.upper() and 'НЕ ТАКСИ' in txt.upper()
    d['not_on_avito'] = 'НЕ ПРОДАВАЛСЯ НА АВИТО' in txt.upper()
    d['no_accidents'] = 'БЕЗ ДТП' in txt.upper()
    d['direct_owner'] = 'напрямую от хоза' in txt
    mil = base = None
    for l in nonempty:
        L = l.lower()
        if 'пробег в базе' in L:
            base = km(L.split('базе')[1])
        elif 'пробег' in L and ('щиток' in L or 'родной' in L or 'всего' in L or re.match(r'пробег \d', L)):
            mil = km(L)
            if 'родной' in L:
                d['mileage_native'] = True
        elif 'пробег' in L and ('подтвержд' in L or 'без расхожд' in L):
            d['mileage_confirmed'] = True
    if mil is None and base:
        mil = base
    d['mileage'] = mil
    d['mileage_base'] = base
    a = re.search(r'Автотека\s+([^\n]+)', txt, re.I)
    d['autoteka'] = clean(a.group(1)).lower() if a else None
    for l in nonempty:
        if 'Старт рынка' in l: d['market'] = money(l)
        if 'Авито оценка' in l or 'АВИТО ОЦЕНКА' in l: d['avito'] = money(l)
        if 'цена всего' in l: d['price'] = money(l)
    for k in ('market', 'avito'):
        d.setdefault(k, None)
        if (post['id'], k) in FIX_PRICE: d[k] = FIX_PRICE[(post['id'], k)]
    ref = max(x for x in (d['market'], d['avito'], (d['price'] or 0) + (d['gap'] or 0)) if x)
    d['gap'] = d['gap'] or (ref - d['price'] if ref > d['price'] else None)
    # body text groups
    groups = {'body': [], 'tech': [], 'history': [], 'equipment': []}
    skip = ('Зазор', 'Старт рынка', 'Авито оценка', 'АВИТО ОЦЕНКА', 'цена всего', '☎', 'Живейший ларгус')
    in_equip = False
    for i, l in enumerate(nonempty):
        if i <= ti + 1 or any(s in l for s in skip):
            continue
        c = clean(l)
        if not c:
            continue
        if re.search(r'комплектац', c, re.I):
            in_equip = True
            groups['equipment'].append(c)
            continue
        if in_equip:
            groups['equipment'].append(c)
            continue
        if HIST.search(c) and not BODY.search(c): groups['history'].append(c)
        elif BODY.search(c): groups['body'].append(c)
        elif TECH.search(c): groups['tech'].append(c)
        else: groups['equipment' if re.search(r'диск|резин|тормоз|колпак', c, re.I) else 'body'].append(c)
    d['groups'] = groups
    d['views'] = post['views']
    d['date'] = post['date']
    d['source'] = f"https://t.me/lexautospb13/{post['id']}"
    return d


def paint_map(d):
    """Panels for the body diagram. 'n' native, 'p' painted, 'u' not stated."""
    panels = ['hood', 'roof', 'trunk', 'fbumper', 'rbumper', 'fl_fender', 'fr_fender',
              'fl_door', 'fr_door', 'rl_door', 'rr_door', 'rl_fender', 'rr_fender']
    t = ' '.join(sum(d['groups'].values(), [])).lower()
    m = {p: 'u' for p in panels}
    if re.search(r'вся в родной|не бита не крашена|все? в родной краске', t) and 'почти' not in t:
        return {p: 'n' for p in panels}, 0
    count = 0
    c = re.search(r'(\d)(?:-(\d))?\s*окрас', t)
    if c:
        count = int(c.group(2) or c.group(1))
    if re.search(r'почти|много родной|куча родной|без ремонтов', t):
        m = {p: 'n' for p in panels}
        # cosmetic repaints most often sit on bumpers and front fenders
        for p in ['fbumper', 'rbumper', 'fl_fender', 'fr_fender', 'hood'][:count]:
            m[p] = 'p'
    if 'крыша' in t: m['roof'] = 'n'
    if re.search(r'проем', t) and 'родн' in t:
        for p in ('fl_door', 'fr_door', 'rl_door', 'rr_door'):
            if m[p] == 'u': m[p] = 'n'
    return m, count


def resize(src, dst, size, q=74):
    im = Image.open(src).convert('RGB')
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)
    return im.size


def main(posts_path, photos):
    posts = {p['id']: p for p in json.load(open(posts_path, encoding='utf-8'))}
    ids = sorted(LISTINGS)
    cars = []
    for n, pid in enumerate(ids):
        d = parse(posts[pid])
        cfg = LISTINGS[pid]
        slug = re.sub(r'[^a-z0-9]+', '-', f"{d['make']} {d['model']} {d['year']}".lower()).strip('-')
        d['slug'] = f'{slug}-{pid}'
        d['seller'] = SELLER
        d['status'] = DEMO_STATE.get(pid, 'active')
        d['bargain'] = (d['gap'] or 0) < NO_BARGAIN_GAP
        d['paint'], d['painted_count'] = paint_map(d)
        # follow-up notes posted between the teaser and the listing
        notes = []
        for j in range(cfg['cover'] + 1, pid):
            p = posts.get(j)
            if not p or not p['text']:
                continue
            t = p['text']
            if re.search(r'приз|розыгр|наклейк|игры|Доброе утро|Публикация через|АНОНС|Далее в программе|Условия', t):
                continue
            if re.search(r'кузов|мотор|окрас|салон|автомат|подвеск|DSG|вариатор', t, re.I) and len(t) < 600:
                for para in re.split(r'\n\s*\n', t):
                    c = clean(para.replace('\n', ' '))
                    if len(c) > 15:
                        notes.append(c + ('.' if not c.endswith(('!', '?', '.')) else ''))
        d['notes'] = notes[:6]
        # every channel post about this car: teaser, video review, condition notes, report, listing
        tg = []
        for j in range(cfg['cover'], pid + 1):
            p = posts.get(j)
            if not p:
                continue
            if re.search(r'приз|розыгр|наклейк|игры|Доброе утро|Условия|стикер|MacBook|iPhone', p['text']):
                continue
            tg.append(j)
        d['tg_posts'] = tg
        # images
        out = os.path.join(OUT_IMG, d['slug'])
        os.makedirs(out, exist_ok=True)
        srcdir = os.path.join(photos, str(pid))
        gallery = []
        cover_src = os.path.join(srcdir, f"x{cfg['cover']}_0.jpg")
        mains = sorted(f for f in os.listdir(srcdir) if re.fullmatch(r'\d\d\.jpg', f))
        srcs = [cover_src] + [os.path.join(srcdir, f) for f in mains]
        for k, s in enumerate(srcs):
            if not os.path.exists(s):
                continue
            name = f'{k:02d}.jpg'
            w, h = resize(s, os.path.join(out, name), 1200)
            gallery.append({'src': f"assets/img/cars/{d['slug']}/{name}", 'w': w, 'h': h})
        resize(srcs[0], os.path.join(out, 'card.jpg'), 640, 72)
        d['card'] = f"assets/img/cars/{d['slug']}/card.jpg"
        d['gallery'] = gallery
        for key in ('reports', 'proof'):
            d[key] = []
            for j in cfg.get(key, []):
                for f in sorted(os.listdir(srcdir)):
                    if f.startswith(f'x{j}_'):
                        name = f'{key}-{f[1:]}'
                        resize(os.path.join(srcdir, f), os.path.join(out, name), 1200, 80)
                        d[key].append(f"assets/img/cars/{d['slug']}/{name}")
        cars.append(d)
    cars.sort(key=lambda c: c['date'], reverse=True)
    js = '// Generated by tools/build_data.py - do not edit by hand\nwindow.CARS = ' + \
         json.dumps(cars, ensure_ascii=False, indent=1) + ';\n'
    open(os.path.join(ROOT, 'assets', 'js', 'cars.js'), 'w', encoding='utf-8').write(js)
    print(len(cars), 'cars')
    for c in cars:
        print(f"{c['make']:<11}{c['model']:<16}{c['year']} {c['gearbox']:<9} {c['mileage']!s:>7}/{c['mileage_base']!s:>7} own={c['owners']} price={c['price']} avito={c['avito']} market={c['market']} gap={c['gap']} painted={c['painted_count']} notes={len(c['notes'])} imgs={len(c['gallery'])}")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
