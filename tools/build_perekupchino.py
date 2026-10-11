"""Cars of Перекупчино (@perekupchino_777) taken from his public channel.

His live stock sits in a private invite-only channel, so the public channel only gives:
- teasers "ЗАВТРА В ПРОДАЖЕ" (model + price + vertical video cover)
- a July post with 7 sold-style cards (model + price on the photo)
- an April Land Cruiser 80 listing with full text
Writes assets/js/cars-perekupchino.js (appended to window.CARS).
"""
import json, os
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'src', 'perekupchino')
OUT = os.path.join(ROOT, 'assets', 'img', 'cars')
CH = 'perekupchino_777'
posts = {p['id']: p for p in json.load(open(os.path.join(SRC, 'posts.json'), encoding='utf-8'))}

E = lambda: {'body': [], 'tech': [], 'history': [], 'equipment': []}
BASE = dict(seller='perekupchino', restyle=False, volume=None, hp=None, fuel=None, gearbox=None, awd=False, owners=None,
            pts=False, keys2=False, not_taxi=False, not_on_avito=False, no_accidents=False, direct_owner=False,
            mileage=None, mileage_base=None, autoteka=None, market=None, avito=None, gap=None, bargain=True,
            paint={}, painted_count=0, notes=[], reports=[], proof=[])

CARS = [
    # live teasers - bought through his private channel
    dict(pid=19240, img=0, make='Audi', model='A5 S-line', price=600000, status='active', invite='https://t.me/+fLbX22e4TQs3NTEy', reel=True),
    dict(pid=19133, img=0, make='Mazda', model='CX-5', price=865000, status='active', invite='https://t.me/+fLbX22e4TQs3NTEy', reel=True),
    dict(pid=19100, img=0, make='Land Rover', model='Range Rover', price=1300000, status='active', invite='https://t.me/+dOvh6eDY6U9hNjAy', reel=True),
    # April listing with full description
    dict(pid=17422, img=0, make='Toyota', model='Land Cruiser 80', year=1992, price=799999, status='archive', reel=True,
         volume='4.5', fuel='Дизель', gearbox='Автомат', awd=True, autoteka='шикарная', market=1000000,
         groups={'body': ['Рама и кузов не гнилые, в очень достойном состоянии для своих лет', 'Номер рамы читается'],
                 'tech': ['Вложено большое количество денег, техническое состояние изумительное', 'Двигатель часики',
                          'Коробка без нареканий, понижайка, блокировка, всё исправно работает', 'Новая раздатка'],
                 'history': ['Документы все', 'Юридически чистый авто', 'Шикарная автотека'],
                 'equipment': ['Лифт подвески', 'Тюнингованные бамперы', 'Экспедиционный багажник', 'Жирная резина']}),
    # July "вот за какие копейки у нас продаются автомобили" - 7 cards with model + price on the photo
    dict(pid=18209, img=0, make='Mitsubishi', model='L200', price=600000, status='archive'),
    dict(pid=18209, img=1, make='Land Rover', model='Discovery', price=780000, status='archive'),
    dict(pid=18209, img=2, make='Kia', model='Ceed', price=390000, status='archive'),
    dict(pid=18209, img=3, make='Kia', model='Optima GT', price=780000, status='archive'),
    dict(pid=18209, img=4, make='Hyundai', model='Solaris', price=350000, status='archive'),
    dict(pid=18209, img=5, make='Suzuki', model='Grand Vitara', price=440000, status='archive'),
    dict(pid=18209, img=6, make='Honda', model='Civic', price=300000, status='archive'),
]


def reel_card(src, dst, W=640, H=480):
    """Vertical video cover -> 4:3 card: blurred fill + sharp centered frame."""
    im = Image.open(src).convert('RGB')
    bg = im.resize((W, int(W * im.height / im.width))).crop((0, 0, W, H)).filter(ImageFilter.GaussianBlur(18))
    bg = ImageEnhance.Brightness(bg).enhance(.45)
    h = H; w = int(im.width * h / im.height)
    fg = im.resize((w, h), Image.LANCZOS)
    bg.paste(fg, ((W - w) // 2, 0))
    bg.save(dst, 'JPEG', quality=80, optimize=True, progressive=True)


def main():
    out = []
    for n, c in enumerate(CARS):
        p = posts[c['pid']]
        d = dict(BASE); d.update({k: v for k, v in c.items() if k not in ('pid', 'img', 'reel', 'invite')})
        d['groups'] = c.get('groups') or E()
        d['id'] = c['pid'] * 10 + c['img']
        d.setdefault('year', None)
        slug = f"{d['make']}-{d['model']}".lower().replace(' ', '-')
        d['slug'] = f"pk-{slug}-{d['id']}"
        d['views'] = p['views']; d['date'] = p['date']
        d['source'] = f'https://t.me/{CH}/{c["pid"]}'
        d['tg_posts'] = [c['pid']]
        d['invite'] = c.get('invite')
        d['engine_line'] = ''
        dst = os.path.join(OUT, d['slug']); os.makedirs(dst, exist_ok=True)
        src = os.path.join(SRC, f"{c['pid']}_{c['img']}.jpg")
        im = Image.open(src).convert('RGB')
        if c.get('reel'):
            reel_card(src, os.path.join(dst, 'card.jpg'))
            reel_card(src, os.path.join(dst, '00.jpg'), 1200, 900)
            g = {'src': f"assets/img/cars/{d['slug']}/00.jpg", 'w': 1200, 'h': 900}
        else:
            im.save(os.path.join(dst, '00.jpg'), 'JPEG', quality=82, optimize=True, progressive=True)
            c2 = im.copy(); c2.thumbnail((640, 640)); c2.save(os.path.join(dst, 'card.jpg'), 'JPEG', quality=76, optimize=True)
            g = {'src': f"assets/img/cars/{d['slug']}/00.jpg", 'w': im.width, 'h': im.height}
        d['card'] = f"assets/img/cars/{d['slug']}/card.jpg"
        d['gallery'] = [g]
        out.append(d)
    js = '// Generated by tools/build_perekupchino.py - do not edit by hand\nwindow.CARS = (window.CARS || []).concat(' + \
         json.dumps(out, ensure_ascii=False, indent=1) + ');\n'
    open(os.path.join(ROOT, 'assets', 'js', 'cars-perekupchino.js'), 'w', encoding='utf-8').write(js)
    print(len(out), 'cars')


if __name__ == '__main__':
    main()
