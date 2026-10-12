/* CarMarket SPB - shared UI + page logic. No build step, no dependencies. */
(function () {
  'use strict';

  const SELLERS = window.SELLERS || {};
  // only cars of sellers that are switched on (a seller file not included = seller hidden)
  const CARS = (window.CARS || []).filter(c => SELLERS[c.seller]);

  /* ---------------- derived specs: body, drive, steering, color ----------------
     body/drive come from the model when the post doesn't say it; color only when the seller wrote it */
  const BODY_BY_MODEL = [
    [/универсал|largus|octavia 2014|e90 универсал/i, 'Универсал'],
    [/sprinter/i, 'Фургон'],
    [/x5|gx|rav4|cx-5|grand vitara|f7|tiggo|qashqai|hover|yeti|patriot|range rover|discovery|land cruiser|l200/i, 'Внедорожник'],
    [/ceed|corsa|rio x-line|golf|focus 3/i, 'Хэтчбек'],
    [/octavia/i, 'Лифтбек'],
    [/camry|5-series|mazda 6|elantra|cruze|polo|corolla|lancer|k5|300c|e-class|lacetti|rio|solaris|optima|civic|a6/i, 'Седан']
  ];
  const REAR = /bmw (?!x)|cls|e-class|sprinter|300c/i, FRONT = /polo|rio|elantra|cruze|camry|corolla|lancer|ceed|corsa|largus|lacetti|k5|tiggo|octavia|mazda 6|solaris|optima|civic|focus/i;
  const COLORS = [['Чёрный', /черн/, '#111'], ['Белый', /бел|молочн/, '#f2f2f2'], ['Серый', /сер(?!еб)|мокрый асфальт|графит/, '#7b7f86'],
    ['Серебристый', /серебр/, '#c4c8cc'], ['Синий', /синем|синий|синего/, '#1f4fbf'], ['Голубой', /голуб/, '#6db7e8'],
    ['Красный', /красн/, '#c6262e'], ['Коричневый', /коричн/, '#6b4428'], ['Зелёный', /зел[её]н(?!ь)(?![^\s]*\s+автотек)/, '#2f7d4a']];
  function enrich(c) {
    const name = `${c.make} ${c.model} ${c.year || ''}`;
    const text = [...Object.values(c.groups || {}).flat(), ...(c.notes || [])].join(' \n ').toLowerCase().replace(/ё/g, 'е');
    c.body = c.body || (BODY_BY_MODEL.find(([re]) => re.test(name)) || [])[1] || null;
    c.drive = c.awd ? 'Полный' : REAR.test(name) ? 'Задний' : FRONT.test(name) ? 'Передний' : null;
    c.wheel = /правый руль|правор/.test(text) ? 'Правый' : 'Левый';
    const lines = text.split('\n').filter(l => !/автотек/.test(l));
    const col = COLORS.find(([, re]) => lines.some(l => re.test(l) && /цвет/.test(l)));
    c.color = col ? col[0] : null; c.colorHex = col ? col[2] : null;
    // sellers always call out diesel; a listed engine volume without it is petrol
    c.fuel = c.fuel || (/дизел/.test(text) ? 'Дизель' : /гибрид/.test(text) ? 'Гибрид' : /электро(мобил|кар)/.test(text) ? 'Электро' : c.volume ? 'Бензин' : null);
    return c;
  }
  CARS.forEach(enrich);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- icons (Lucide-style strokes) ---------------- */
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    down: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    hand: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
    sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    insta: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    report: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M9 15l2 2 4-4"/>',
    import: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    palette: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="8" r="1"/>',
    chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
    gauge: '<path d="m12 14 4-4M3.34 19a10 10 0 1 1 17.32 0"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    badge: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    paint: '<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5M2 13h15M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    sparkle: '<path d="M9.94 14.06 4 20M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>'
  };
  const ic = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------------- formatting ---------------- */
  const NB = ' ';
  const rub = n => n == null ? '' : Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽';
  const kRub = n => {
    if (n == null) return '';
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 2).replace(/\.?0+$/, '').replace('.', ',') + '\u00a0' + 'млн';
    return Math.round(n / 1000) + 'к';
  };
  const kmF = n => n == null ? null : n.toLocaleString('ru-RU').replace(/\s/g, NB) + NB + 'км';
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const dateF = iso => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const viewsN = v => { if (!v) return 0; const m = String(v).match(/([\d.]+)\s*([KM]?)/i); if (!m) return 0; return parseFloat(m[1]) * (m[2].toUpperCase() === 'K' ? 1e3 : m[2].toUpperCase() === 'M' ? 1e6 : 1); };
  const fullName = c => `${c.make} ${c.model}`;
  const title = c => fullName(c) + (c.year ? ' ' + c.year : '');
  const gone = c => c.status === 'sold' || c.status === 'archive';

  /* ---------------- local state ---------------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('cm_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cm_' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  let favs = new Set(store.get('favs', []));
  const toggleFav = id => { favs.has(id) ? favs.delete(id) : favs.add(id); store.set('favs', [...favs]); updateFavCount(); return favs.has(id); };
  const updateFavCount = () => $$('.fav-count').forEach(el => el.textContent = favs.size || '');

  // demand: derived from real channel views + what this visitor did
  const myBids = () => store.get('bids', {});
  const wantCount = c => Math.round(viewsN(c.views) / 1000 * 2.2) + (c.id % 5) + 3 + (myBids()[c.slug] ? 1 : 0);
  const watching = c => 2 + (c.id % 7);

  const seller = c => SELLERS[c.seller] || {};
  const themeStyle = s => `--seller-a:${s.colors.a};--seller-b:${s.colors.b};--seller-gold:${s.colors.gold}`;
  function applyTheme(s) {
    const r = document.documentElement.style;
    r.setProperty('--seller-a', s.colors.a); r.setProperty('--seller-b', s.colors.b); r.setProperty('--seller-gold', s.colors.gold);
  }

  /* ---------------- derived car facts ---------------- */
  const gb = c => c.gearbox === 'DSG' ? 'Робот DSG' : c.gearbox;
  function specLine(c) {
    const out = [c.year, kmF(c.mileage || c.mileage_base) || 'пробег по запросу', c.volume ? `${c.volume} л${c.hp ? ' / ' + c.hp + ' л.с.' : ''}` : null, gb(c), c.awd ? '4WD' : null, c.fuel === 'Дизель' ? 'дизель' : null];
    return out.filter(Boolean);
  }
  function quickTags(c, max = 3) {
    const t = [];
    if (c.owners === 1) t.push(['ok', '1 владелец']);
    if (allNative(c)) t.push(['ok', 'Родная краска']);
    if (c.not_on_avito) t.push(['hot', 'Не было на Авито']);
    if (c.no_accidents) t.push(['ok', 'Без ДТП']);
    if (c.direct_owner) t.push(['', 'От хозяина']);
    if (c.not_taxi) t.push(['', 'Не такси']);
    if (c.pts) t.push(['', 'Оригинал ПТС']);
    return t.slice(0, max);
  }
  const allNative = c => !!c.paint && Object.keys(c.paint).length > 0 && Object.values(c.paint).every(v => v === 'n');

  /* ---------------- chrome: header / footer ---------------- */
  const LOGO_MARK = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 6.5 6.5 4-4L21 17"/><path d="M15 17h6v-6"/></svg>`;
  function header(active) {
    const link = (href, label, key) => `<a href="${href}" class="${active === key ? 'on' : ''}">${label}</a>`;
    return `
    <header class="hdr"><div class="wrap hdr-in">
      <a class="logo" href="index.html" aria-label="CarMarket SPB - на главную">
        <span class="logo-mark">${LOGO_MARK}</span>
        <span>CARMARKET<small>SAINT-P</small></span>
      </a>
      <nav class="nav" id="nav">
        ${link('index.html#catalog', 'Каталог', 'catalog')}
        ${link('index.html#sellers', 'Продавцы', 'seller')}
        ${link('index.html#how', 'Как купить', 'how')}
        ${link('bloggers.html', 'Для блогеров', 'bloggers')}
      </nav>
      <div class="hdr-act">
        <a class="icon-btn" href="index.html?fav=1#catalog" aria-label="Избранное">${ic('heart')}<span class="count fav-count"></span></a>
        <a class="btn btn-accent btn-sm" href="bloggers.html#join">${ic('plus', 'sm')}Разместить авто</a>
        <button class="icon-btn burger" aria-label="Меню" aria-expanded="false">${ic('menu')}</button>
      </div>
    </div></header>`;
  }
  function footer() {
    return `
    <footer class="ftr"><div class="wrap">
      <div class="ftr-in">
        <div>
          <a class="logo" href="index.html"><span class="logo-mark">${LOGO_MARK}</span><span>CARMARKET<small>SAINT-P</small></span></a>
          <p style="max-width:380px;margin-top:14px">Маркет тачек от медийных перекупов Петербурга. Все машины из каналов в одной ленте, с реальной ценой и зазором до рынка.</p>
        </div>
        <div><h4>Покупателям</h4><ul>
          <li><a href="index.html#catalog">Каталог</a></li>
          <li><a href="index.html#how">Как работает задаток</a></li>
          <li><a href="index.html?fav=1#catalog">Избранное</a></li>
        </ul></div>
        <div><h4>Продавцам</h4><ul>
          ${Object.values(SELLERS).map(x => `<li><a href="seller.html?id=${x.id}">${esc(x.name)}</a></li>`).join('')}
          <li><a href="bloggers.html">Для блогеров</a></li>
          <li><a href="bloggers.html#join">Подключить канал</a></li>
        </ul></div>
      </div>
      <p class="note">Демо-версия. Машины, фото и цены взяты из Telegram-каналов ${Object.values(SELLERS).map(x => esc(x.name)).join(' и ')} (октябрь 2026). Счётчики спроса, статусы брони и схема окрасов показаны для примера, актуальное состояние уточняйте у продавца. Задаток в демо не списывается.</p>
    </div></footer>`;
  }
  function mountChrome(active) {
    document.body.insertAdjacentHTML('afterbegin', header(active));
    document.body.insertAdjacentHTML('beforeend', footer());
    const burger = $('.burger'), nav = $('#nav');
    burger && burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
    $$('#nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
    if (active !== 'car') document.body.insertAdjacentHTML('beforeend', tabbar(active));
    else document.body.classList.add('no-tabbar');
    updateFavCount();
    pwa();
  }

  /* ---------------- mobile: bottom tab bar (5 top-level screens, MD bottom-nav-limit) ---------------- */
  function tabbar(active) {
    const fav = new URLSearchParams(location.search).get('fav');
    const t = (href, icon, label, on) => `<a href="${href}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}>${ic(icon)}<span>${label}</span></a>`;
    return `<nav class="tabbar" aria-label="Разделы">
      ${t('index.html', 'car', 'Главная', active === 'catalog' && !fav)}
      ${t('index.html?focus=search#catalog', 'search', 'Поиск', false)}
      <a href="bloggers.html#join" class="tab-add" aria-label="Разместить авто"><span class="plus">${ic('plus')}</span><span>Продать</span></a>
      <a href="index.html?fav=1#catalog" class="${fav ? 'on' : ''}">${ic('heart')}<span>Избранное</span><i class="count fav-count"></i></a>
      ${t('index.html#sellers', 'users', 'Продавцы', active === 'seller')}
    </nav>`;
  }

  /* ---------------- PWA: install to home screen + offline cache ---------------- */
  let deferredInstall = null;
  function pwa() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone || store.get('installHidden', false) || innerWidth > 760) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const show = () => {
      if ($('#install')) return;
      document.body.insertAdjacentHTML('beforeend', `<div class="install" id="install" role="dialog" aria-label="Установить приложение">
        <span class="logo-mark">${LOGO_MARK}</span>
        <div><b>CarMarket на экран телефона</b><small>${ios ? 'Нажмите «Поделиться», затем «На экран Домой»' : 'Открывается как приложение, без браузера'}</small></div>
        ${ios ? '' : '<button class="btn btn-accent btn-sm" id="installGo">Установить</button>'}
        <button class="icon-btn" id="installX" aria-label="Не сейчас">${ic('x', 'sm')}</button>
      </div>`);
      $('#installX').onclick = () => { store.set('installHidden', true); $('#install').remove(); };
      $('#installGo') && ($('#installGo').onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#install')?.remove(); });
    };
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; setTimeout(show, 6000); });
    if (ios) setTimeout(show, 8000);
  }

  /* ---------------- car card ---------------- */
  function plate(s) {
    return `<span class="plate t-${s.theme}"><img src="${s.avatar}" alt="" loading="lazy">${esc(s.plate)}</span>`;
  }
  function card(c) {
    const s = seller(c);
    const status = c.status === 'sold' ? '<div class="status"><span>Продана</span></div>'
      : c.status === 'archive' ? '<div class="status"><span>Архив</span></div>'
      : c.status === 'reserved' ? '<div class="status reserved"><span>Задаток внесён</span></div>' : '';
    const ref = c.avito || c.market;
    return `
    <article class="card reveal t-${s.theme}" style="${themeStyle(s)}">
      <div class="card-media">
        <img src="${c.card}" alt="${esc(title(c))}" loading="lazy" width="640" height="480">
        ${c.gap ? `<span class="gap-badge">${ic('down', 'sm')}-${kRub(c.gap)} к рынку</span>` : ''}
        ${plate(s)}
        ${status}
        <button class="fav ${favs.has(c.slug) ? 'on' : ''}" data-fav="${c.slug}" aria-label="В избранное" aria-pressed="${favs.has(c.slug)}">${ic('heart')}</button>
      </div>
      <div class="card-body">
        <a class="card-title stretch" href="car.html?id=${c.slug}">${esc(fullName(c))}${c.restyle ? ' <span>рест.</span>' : ''}${c.year ? ` <span>${c.year}</span>` : ''}</a>
        <div class="card-price"><b>${rub(c.price)}</b>${ref ? `<s>${c.avito ? 'Авито' : 'рынок'} ${kRub(ref)}</s>` : ''}</div>
        <div class="card-specs">${(specLine(c).slice(1).length ? specLine(c).slice(1) : [c.invite ? 'Анонс из канала, детали у продавца' : 'Детали у продавца']).map(esc).join('<i>/</i>')}</div>
        <div class="card-tags">${quickTags(c).map(([k, t]) => `<span class="tag ${k}">${t}</span>`).join('')}</div>
        <div class="card-foot">
          <span title="Просмотры в Telegram">${ic('eye', 'sm')}${esc(c.views)}</span>
          ${gone(c) ? `<span class="bargain">${dateF(c.date)}</span>` : `<span class="want" title="Хотят купить">${ic('flame', 'sm')}${wantCount(c)} хотят</span>
          <span class="bargain">${c.bargain ? 'Торг' : 'Без торга'}</span>`}
        </div>
      </div>
    </article>`;
  }
  function bindFavs(root = document) {
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-fav]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const on = toggleFav(b.dataset.fav);
      $$(`[data-fav="${b.dataset.fav}"]`).forEach(x => { x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      toast(on ? 'Добавлено в избранное' : 'Убрано из избранного');
    });
  }

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%) translateY(20px);background:#f5f5f6;color:#0b0b0d;padding:12px 18px;border-radius:12px;font-weight:700;font-size:14px;z-index:200;opacity:0;transition:.3s;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.5)';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = 1; t.style.transform = 'translateX(-50%)';
    clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 2000);
  }

  /* ---------------- reveal on scroll ---------------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px' }) : null;
  const reveal = (root = document) => $$('.reveal:not(.in)', root).forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------------- modal ---------------- */
  function modal(html) {
    let m = $('#modal');
    if (!m) {
      m = document.createElement('div'); m.id = 'modal'; m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
      m.innerHTML = '<div class="modal-box"></div>';
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    }
    $('.modal-box', m).innerHTML = `<button class="icon-btn modal-x" data-close aria-label="Закрыть">${ic('x')}</button>` + html;
    requestAnimationFrame(() => m.classList.add('open'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = $('input:not([type=checkbox]):not([type=range])', m) || $('button:not(.modal-x)', m); f && f.focus({ preventScroll: true }); }, 50);
    return $('.modal-box', m);
  }
  function closeModal() { const m = $('#modal'); if (m) m.classList.remove('open'); document.body.style.overflow = ''; }

  const tgLink = (s, text) => `https://t.me/${s.contactHandle}?text=${encodeURIComponent(text)}`;
  const phoneMask = inp => inp.addEventListener('input', () => {
    let d = inp.value.replace(/\D/g, ''); if (d.startsWith('8')) d = '7' + d.slice(1); if (!d.startsWith('7')) d = '7' + d; d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    inp.value = '+7' + (p[0] ? ' ' + p[0] : '') + (p[1] ? ' ' + p[1] : '') + (p[2] ? '-' + p[2] : '') + (p[3] ? '-' + p[3] : '');
  });
  const markBid = (c, kind, extra) => { const b = myBids(); b[c.slug] = { kind, at: Date.now(), ...extra }; store.set('bids', b); };

  function depositModal(c) {
    const s = seller(c);
    let amount = 10000;
    const box = modal(`
      <h3>Забронировать задатком</h3>
      <p class="lead">${esc(title(c))} за ${rub(c.price)}. Машину снимают с продажи, пока вы едете смотреть.</p>
      <label>Сумма задатка</label>
      <div class="amounts">${[5000, 10000, 20000].map(a => `<button type="button" data-a="${a}" class="${a === amount ? 'on' : ''}">${kRub(a)}</button>`).join('')}</div>
      <form id="depForm">
        <label for="dName">Как вас зовут</label>
        <input class="field" id="dName" required autocomplete="name" placeholder="Имя">
        <label for="dPhone">Телефон</label>
        <input class="field" id="dPhone" required type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00">
        <div class="summary">
          <div><span>Бронь</span><b id="dHold">48 часов</b></div>
          <div><span>Задаток</span><b id="dAmt">${rub(amount)}</b></div>
          <div><span>Остаток при покупке</span><b id="dRest">${rub(c.price - amount)}</b></div>
        </div>
        <label class="check" style="margin-top:14px;color:var(--muted);font-weight:600"><input type="checkbox" required checked> Задаток вернётся, если машина не совпадёт с описанием</label>
        <button class="btn btn-accent btn-block" style="margin-top:16px">${ic('lock', 'sm')}Внести ${rub(amount)}</button>
      </form>
      <p class="demo-note">Демо: оплата не списывается. В рабочей версии - СБП или карта через безопасную сделку.</p>`);
    const btn = $('form .btn', box);
    $$('.amounts button', box).forEach(b => b.addEventListener('click', () => {
      amount = +b.dataset.a;
      $$('.amounts button', box).forEach(x => x.classList.toggle('on', x === b));
      $('#dAmt', box).textContent = rub(amount); $('#dRest', box).textContent = rub(c.price - amount);
      $('#dHold', box).textContent = amount >= 20000 ? '72 часа' : amount >= 10000 ? '48 часов' : '24 часа';
      btn.innerHTML = `${ic('lock', 'sm')}Внести ${rub(amount)}`;
    }));
    phoneMask($('#dPhone', box));
    $('#depForm', box).addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#dName', box).value.trim(), phone = $('#dPhone', box).value.trim();
      if (phone.replace(/\D/g, '').length < 11) { $('#dPhone', box).focus(); toast('Проверьте номер телефона'); return; }
      markBid(c, 'deposit', { amount });
      const msg = `Здравствуйте! Хочу забронировать ${title(c)} за ${rub(c.price)} задатком ${rub(amount)}. ${name}, ${phone}. Объявление: ${location.href}`;
      success(box, 'Заявка на бронь отправлена', `${esc(s.name)} свяжется с вами в течение 15 минут, чтобы подтвердить задаток и время осмотра.`, tgLink(s, msg));
      refreshDemand(c);
    });
  }

  function offerModal(c) {
    const s = seller(c);
    const min = Math.round(c.price * 0.85 / 10000) * 10000, max = c.price;
    let val = Math.round(c.price * 0.95 / 10000) * 10000;
    const box = modal(`
      <h3>Предложить свою цену</h3>
      <p class="lead">${c.bargain ? 'Продавец готов к разумному торгу.' : 'Продавец пишет, что цена уже ниже рынка. Но спросить можно.'}</p>
      <div class="offer-val" id="oVal">${rub(val)}</div>
      <div class="offer-diff" id="oDiff"></div>
      <input type="range" id="oRange" min="${min}" max="${max}" step="10000" value="${val}" aria-label="Ваша цена">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--dim)"><span>${rub(min)}</span><span>${rub(max)}</span></div>
      <form id="offForm">
        <label for="oPhone">Телефон для ответа</label>
        <input class="field" id="oPhone" required type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00">
        <button class="btn btn-accent btn-block" style="margin-top:16px">${ic('hand', 'sm')}Отправить предложение</button>
      </form>`);
    const upd = () => {
      val = +$('#oRange', box).value;
      $('#oVal', box).textContent = rub(val);
      const d = c.price - val;
      $('#oDiff', box).textContent = d ? `на ${rub(d)} ниже цены продавца` : 'по цене продавца';
      $('#oDiff', box).style.color = d / c.price > .08 ? 'var(--warn)' : 'var(--muted)';
    };
    $('#oRange', box).addEventListener('input', upd); upd();
    phoneMask($('#oPhone', box));
    $('#offForm', box).addEventListener('submit', e => {
      e.preventDefault();
      const phone = $('#oPhone', box).value.trim();
      if (phone.replace(/\D/g, '').length < 11) { toast('Проверьте номер телефона'); return; }
      markBid(c, 'offer', { amount: val });
      const msg = `Здравствуйте! По ${title(c)} (${rub(c.price)}) предлагаю ${rub(val)}. Мой телефон ${phone}. ${location.href}`;
      success(box, 'Предложение отправлено', `Продавец увидит вашу цену ${rub(val)} и ответит в Telegram или по телефону.`, tgLink(s, msg));
      refreshDemand(c);
    });
  }

  function success(box, title, text, tg) {
    box.innerHTML = `<button class="icon-btn modal-x" data-close aria-label="Закрыть">${ic('x')}</button>
      <div class="success">
        <div class="big">${ic('check')}</div>
        <h3 style="padding:0">${title}</h3>
        <p class="lead" style="margin-top:10px">${text}</p>
        <a class="btn btn-accent btn-block" href="${tg}" target="_blank" rel="noopener">${ic('send', 'sm')}Продублировать в Telegram</a>
        <button class="btn btn-ghost btn-block" style="margin-top:10px" data-close>Готово</button>
      </div>`;
  }

  /* ======================= HOME ======================= */
  function pageHome() {
    mountChrome('catalog');
    const active = CARS.filter(c => !gone(c));
    const gaps = active.filter(c => c.gap).map(c => c.gap);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const s = SELLERS['lex-auto'];

    // ticker
    const items = active.filter(c => c.gap).slice(0, 12).map(c => `<span class="ticker-item">${ic('zap', 'sm')}<b>${esc(title(c))}</b> ${rub(c.price)} <span class="g">-${kRub(c.gap)}</span></span>`).join('');
    $('#ticker').innerHTML = `<div class="ticker-track">${items}${items}</div>`;

    // hero brand card
    $('#featured').innerHTML = `
      <a class="brand-card" href="seller.html?id=${s.id}" style="--seller-a:${s.colors.a};--seller-b:${s.colors.b};--seller-gold:${s.colors.gold}">
        <span class="bc-label">Партнёр недели</span>
        <div class="bc-top">
          <img class="bc-ava" src="${s.avatar}" alt="Логотип ${esc(s.name)}" width="56" height="56">
          <div><div class="bc-name">${esc(s.name)}</div><div class="bc-sub">${ic('badge', 'sm verified')}${esc(s.person)}</div></div>
        </div>
        <div class="bc-word" aria-hidden="true">LEX AUTO</div>
        <img class="bc-person" src="${s.cutout}" alt="${esc(s.person)}">
        <div class="bc-bottom">
          <div class="bc-stats">
            <div><b>${Math.round(s.subscribers / 1000)}K</b><span>в Telegram</span></div>
            <div><b>${CARS.filter(c => c.seller === s.id && !gone(c)).length}</b><span>авто в продаже</span></div>
          </div>
          <span class="btn btn-gold">Витрина ${ic('arrow', 'sm')}</span>
        </div>
      </a>`;

    // stats
    const sum = gaps.reduce((a, b) => a + b, 0);
    $('#stats').innerHTML = `
      <div class="stat"><b>${active.length}</b><span>${plural(active.length, 'машина', 'машины', 'машин')} в продаже</span></div>
      <div class="stat"><b><span class="g">-${kRub(Math.round(avgGap / 10000) * 10000)}</span></b><span>средний зазор до рынка</span></div>
      <div class="stat"><b>${kRub(sum)}</b><span>₽ ниже рынка суммарно</span></div>
      <div class="stat"><b>${Math.round(Object.values(SELLERS).reduce((a, x) => a + x.subscribers, 0) / 1000)}K</b><span>аудитория продавцов</span></div>`;

    // sellers rail: every seller in their own brand, then open slots
    const tiles = Object.values(SELLERS).map(x => {
      const n = CARS.filter(c => c.seller === x.id && !gone(c)).length;
      return `
      <a class="seller-tile brand t-${x.theme} reveal" href="seller.html?id=${x.id}" style="${themeStyle(x)}">
        ${x.logo ? `<img class="tile-logo" src="${x.logo}" alt="" loading="lazy">` : `<img class="ava" src="${x.avatar}" alt="" width="64" height="64">`}
        <h3>${esc(x.name)}</h3>
        <p>${esc(x.tagline)}</p>
        <div class="meta">${x.subscribers ? `<span>${Math.round(x.subscribers / 1000)}K подписчиков</span>` : ''}<span>${n ? n + ' авто' : 'Скоро на маркете'}</span></div>
      </a>`;
    });
    const free = Math.max(1, 4 - tiles.length);
    $('#sellers').innerHTML = tiles.join('') + Array.from({ length: free }, () => `
      <a class="seller-tile soon reveal" href="bloggers.html#join">
        <span class="ava">${ic('plus')}</span>
        <h3>Твой канал</h3>
        <p>Место для следующего медийного перекупа Питера</p>
        <div class="meta"><span>Подключить ${ic('arrow', 'sm')}</span></div>
      </a>`).join('');

    // search
    $('#heroSearch').addEventListener('submit', e => {
      e.preventDefault();
      state.q = $('#q').value.trim(); $('#fq').value = state.q;
      render(); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    });
    $$('[data-quick]').forEach(b => b.addEventListener('click', () => {
      Object.assign(state, QUICK[b.dataset.quick]); syncFilters(); render();
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    }));

    catalog();
    reveal();
  }

  const QUICK = {
    gap300: { gapMin: 300000 }, cheap: { priceMax: 700000 }, awd: { drive: 'Полный' },
    owner: { owners12: true }, avito: { notAvito: true }, native: { native: true }
  };
  const DEF = { q: '', seller: '', body: '', fuel: '', drive: '', wheel: '', color: '', make: '', priceMin: '', priceMax: '', yearMin: '', gear: '', owners12: false, notAvito: false, native: false, noAcc: false, gapMin: 0, sold: false, fav: false, sort: 'gap' };
  let state = { ...DEF };

  function catalog() {
    const params = new URLSearchParams(location.search);
    if (params.get('fav')) state.fav = true;
    if (params.get('q')) state.q = params.get('q');
    if (params.get('make')) state.make = params.get('make');
    if (params.get('seller')) state.seller = params.get('seller');
    const makes = [...new Set(CARS.map(c => c.make))].sort();
    const count = f => CARS.filter(c => !gone(c) && f(c)).length;
    $('#filters').innerHTML = `
      <div class="f-group">
        <h3>Поиск</h3>
        <input class="field" id="fq" placeholder="Марка, модель, год" value="${esc(state.q)}">
      </div>
      <div class="f-group" ${Object.keys(SELLERS).length > 1 ? '' : 'hidden'}>
        <h3>Продавец</h3>
        <div class="seg" id="fseller"><button type="button" data-v="">Все</button>${Object.values(SELLERS).map(x => `<button type="button" data-v="${x.id}">${esc(x.name)}${count(c => c.seller === x.id) ? '' : ' · скоро'}</button>`).join('')}</div>
      </div>
      <div class="f-group">
        <h3>Марка</h3>
        <select class="field" id="fmake"><option value="">Все марки</option>${makes.map(m => `<option ${state.make === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
      </div>
      <div class="f-group">
        <h3>Цена, ₽</h3>
        <div class="f-row"><input class="field" id="fpmin" inputmode="numeric" placeholder="от"><input class="field" id="fpmax" inputmode="numeric" placeholder="до"></div>
      </div>
      <div class="f-group">
        <h3>Зазор до рынка</h3>
        <div class="seg" id="fgap">${[[0, 'Любой'], [150000, '150к+'], [200000, '200к+'], [300000, '300к+']].map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div>
      </div>
      <div class="f-group">
        <h3>Коробка</h3>
        <div class="seg" id="fgear">${[['', 'Любая'], ['Автомат', 'Автомат'], ['Механика', 'Механика'], ['Робот', 'Робот'], ['Вариатор', 'Вариатор']].map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div>
      </div>
      ${segGroup('fbody', 'Кузов', 'body', ['Седан', 'Хэтчбек', 'Лифтбек', 'Универсал', 'Внедорожник', 'Фургон'], count)}
      ${segGroup('ffuel', 'Двигатель', 'fuel', ['Бензин', 'Дизель', 'Гибрид', 'Электро'], count)}
      ${segGroup('fdrive', 'Привод', 'drive', ['Передний', 'Задний', 'Полный'], count)}
      ${segGroup('fwheel', 'Руль', 'wheel', ['Левый', 'Правый'], count)}
      <div class="f-group">
        <h3>Цвет</h3>
        <div class="swatches" id="fcolor">${COLORS.map(([n, , hex]) => { const k = count(c => c.color === n); return `<button type="button" data-v="${n}" title="${n}" aria-label="${n}" style="--sw:${hex}" ${k ? '' : 'disabled'}><span></span></button>`; }).join('')}</div>
      </div>
      <div class="f-group">
        <h3>Год от</h3>
        <select class="field" id="fyear"><option value="">Любой</option>${[2020, 2017, 2015, 2012, 2010, 2005].map(y => `<option value="${y}">${y}</option>`).join('')}</select>
      </div>
      <div class="f-group">
        <h3>Важно мне</h3>
        <label class="check"><input type="checkbox" id="fown">1-2 владельца<span class="n">${count(c => c.owners && c.owners <= 2)}</span></label>
        <label class="check"><input type="checkbox" id="fnat">Вся в родной краске<span class="n">${count(allNative)}</span></label>
        <label class="check"><input type="checkbox" id="favito">Не было на Авито<span class="n">${count(c => c.not_on_avito)}</span></label>
        <label class="check"><input type="checkbox" id="facc">Без ДТП по базе<span class="n">${count(c => c.no_accidents)}</span></label>
      </div>
      <div class="f-group">
        <label class="check"><input type="checkbox" id="ffav">Только избранное</label>
        <label class="check"><input type="checkbox" id="fsold">Показать проданные</label>
        <button class="btn btn-ghost btn-sm btn-block" id="freset" style="margin-top:10px">Сбросить фильтры</button>
      </div>
      <div class="f-actions"><button class="btn btn-ghost" id="fclose" style="flex:1">Закрыть</button><button class="btn btn-accent" id="fshow" style="flex:2">Показать</button></div>`;

    const F = $('#filters');
    const num = v => +String(v).replace(/\D/g, '') || '';
    const on = (id, ev, fn) => $(id).addEventListener(ev, () => { fn(); render(); });
    on('#fq', 'input', () => state.q = $('#fq').value.trim());
    on('#fmake', 'change', () => state.make = $('#fmake').value);
    on('#fpmin', 'input', () => state.priceMin = num($('#fpmin').value));
    on('#fpmax', 'input', () => state.priceMax = num($('#fpmax').value));
    on('#fyear', 'change', () => state.yearMin = +$('#fyear').value || '');
    [['#fown', 'owners12'], ['#fnat', 'native'], ['#favito', 'notAvito'], ['#facc', 'noAcc'], ['#ffav', 'fav'], ['#fsold', 'sold']]
      .forEach(([id, k]) => on(id, 'change', () => state[k] = $(id).checked));
    $('#fgap').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.gapMin = +b.dataset.v; syncFilters(); render(); });
    [['#fbody', 'body'], ['#ffuel', 'fuel'], ['#fdrive', 'drive'], ['#fwheel', 'wheel'], ['#fcolor', 'color']].forEach(([id, k]) =>
      $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; state[k] = state[k] === b.dataset.v ? '' : b.dataset.v; syncFilters(); render(); }));
    $('#fseller').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.seller = b.dataset.v; syncFilters(); render(); });
    $('#fgear').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.gear = b.dataset.v; syncFilters(); render(); });
    $('#freset').addEventListener('click', () => { state = { ...DEF, sort: state.sort }; syncFilters(); render(); });
    $('#sort').addEventListener('change', () => { state.sort = $('#sort').value; render(); });
    const openF = () => { F.classList.add('open'); document.body.style.overflow = 'hidden'; };
    const closeF = () => { F.classList.remove('open'); document.body.style.overflow = ''; };
    $('#filterBtn').addEventListener('click', openF);
    $('#fclose').addEventListener('click', closeF);
    $('#fshow').addEventListener('click', () => { closeF(); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' }); });
    bindFavs($('#grid'));
    // mobile: two-column compact tiles, like marketplace apps; remembered per visitor
    const vb = $('#viewBtn'), grid = $('#grid');
    const setView = v => { grid.classList.toggle('compact', v === 'compact'); vb.innerHTML = ic(v === 'compact' ? 'menu' : 'sliders'); vb.setAttribute('aria-label', v === 'compact' ? 'Крупные карточки' : 'Плитка в два ряда'); store.set('view', v); };
    setView(store.get('view', 'compact'));
    vb.addEventListener('click', () => setView(grid.classList.contains('compact') ? 'big' : 'compact'));
    if (params.get('focus') === 'search') setTimeout(() => { document.getElementById('catalog').scrollIntoView(); openF(); $('#fq').focus(); }, 300);
    syncFilters(); render();
  }

  function segGroup(id, title, key, values, count) {
    return `<div class="f-group"><h3>${title}</h3><div class="seg" id="${id}">${values.map(v => { const n = count(c => c[key] === v); return `<button type="button" data-v="${v}" ${n ? '' : 'disabled'}>${v}${n ? ` <small>${n}</small>` : ''}</button>`; }).join('')}</div></div>`;
  }

  function syncFilters() {
    if (!$('#filters')) return;
    $('#fq').value = state.q; $('#fmake').value = state.make;
    $('#fpmin').value = state.priceMin ? state.priceMin.toLocaleString('ru-RU') : '';
    $('#fpmax').value = state.priceMax ? state.priceMax.toLocaleString('ru-RU') : '';
    $('#fyear').value = state.yearMin || '';
    [['#fbody', 'body'], ['#ffuel', 'fuel'], ['#fdrive', 'drive'], ['#fwheel', 'wheel'], ['#fcolor', 'color']].forEach(([id, k]) =>
      $$(id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === state[k])));
    $('#fown').checked = state.owners12; $('#fnat').checked = state.native;
    $('#favito').checked = state.notAvito; $('#facc').checked = state.noAcc; $('#ffav').checked = state.fav; $('#fsold').checked = state.sold;
    $$('#fgap button').forEach(b => b.classList.toggle('on', +b.dataset.v === state.gapMin));
    $$('#fgear button').forEach(b => b.classList.toggle('on', b.dataset.v === state.gear));
    $$('#fseller button').forEach(b => b.classList.toggle('on', b.dataset.v === state.seller));
    $('#sort').value = state.sort;
  }

  function filtered() {
    const q = state.q.toLowerCase().replace('ё', 'е');
    let list = CARS.filter(c => {
      if (!state.sold && gone(c)) return false;
      if (q) {
        const hay = `${c.make} ${c.model} ${c.year} ${c.gearbox} ${c.fuel} ${c.body} ${c.drive} ${c.color} ${c.engine_line} ${seller(c).name}`.toLowerCase();
        if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
      }
      if (state.seller && c.seller !== state.seller) return false;
      if (state.make && c.make !== state.make) return false;
      if (state.priceMin && c.price < state.priceMin) return false;
      if (state.priceMax && c.price > state.priceMax) return false;
      if (state.yearMin && c.year < state.yearMin) return false;
      if (state.gear && !(state.gear === 'Робот' ? ['Робот', 'DSG'].includes(c.gearbox) : c.gearbox === state.gear)) return false;
      if (state.gapMin && (c.gap || 0) < state.gapMin) return false;
      if (state.body && c.body !== state.body) return false;
      if (state.fuel && c.fuel !== state.fuel) return false;
      if (state.drive && c.drive !== state.drive) return false;
      if (state.wheel && c.wheel !== state.wheel) return false;
      if (state.color && c.color !== state.color) return false;
      if (state.owners12 && !(c.owners && c.owners <= 2)) return false;
      if (state.native && !allNative(c)) return false;
      if (state.notAvito && !c.not_on_avito) return false;
      if (state.noAcc && !c.no_accidents) return false;
      if (state.fav && !favs.has(c.slug)) return false;
      return true;
    });
    const S = {
      gap: (a, b) => (b.gap || 0) - (a.gap || 0),
      cheap: (a, b) => a.price - b.price,
      expensive: (a, b) => b.price - a.price,
      year: (a, b) => b.year - a.year,
      fresh: (a, b) => b.date.localeCompare(a.date),
      hot: (a, b) => wantCount(b) - wantCount(a)
    };
    return list.sort((a, b) => gone(a) - gone(b) || S[state.sort](a, b));
  }

  function render() {
    const list = filtered();
    $('#found').innerHTML = `${list.length} <span>${plural(list.length, 'машина', 'машины', 'машин')}</span>`;
    $('#fshow') && ($('#fshow').textContent = `Показать ${list.length}`);
    $('#grid').innerHTML = list.length ? list.map(card).join('') :
      `<div class="empty"><b>${state.fav ? 'В избранном пусто' : state.seller && SELLERS[state.seller]?.onboarding ? SELLERS[state.seller].name + ' скоро на маркете' : 'Ничего не нашлось'}</b>${state.fav ? 'Жмите на сердце на карточке, чтобы сохранить машину.' : state.seller && SELLERS[state.seller]?.onboarding ? 'Канал подключается, машины появятся здесь автоматически.' : 'Попробуйте убрать пару фильтров.'}</div>`;
    reveal($('#grid'));
    const n = Object.keys(DEF).filter(k => k !== 'sort' && state[k] !== DEF[k]).length;
    $('#filterBtn').innerHTML = `${ic('sliders', 'sm')}Фильтры${n ? ' · ' + n : ''}`;
  }

  /* ======================= CAR ======================= */
  function bodySvg(paint) {
    const p = (k, d) => `<path class="p s-${paint[k] || 'u'}" d="${d}"><title>${PANEL_RU[k]}: ${PAINT_RU[paint[k] || 'u']}</title></path>`;
    return `<svg viewBox="0 0 200 400" role="img" aria-label="Схема кузова">
      ${p('fbumper', 'M52 14 Q100 2 148 14 L152 34 Q100 26 48 34 Z')}
      ${p('hood', 'M50 38 Q100 30 150 38 L146 112 Q100 104 54 112 Z')}
      ${p('fl_fender', 'M30 44 Q38 36 46 38 L50 112 L30 112 Q26 80 30 44 Z')}
      ${p('fr_fender', 'M170 44 Q162 36 154 38 L150 112 L170 112 Q174 80 170 44 Z')}
      <path class="glass" d="M56 116 Q100 108 144 116 L138 146 Q100 140 62 146 Z"/>
      ${p('roof', 'M62 150 Q100 144 138 150 L138 252 Q100 258 62 252 Z')}
      <path class="glass" d="M62 256 Q100 262 138 256 L142 280 Q100 288 58 280 Z"/>
      ${p('fl_door', 'M30 116 L52 116 L56 196 L30 196 Z')}
      ${p('fr_door', 'M170 116 L148 116 L144 196 L170 196 Z')}
      ${p('rl_door', 'M30 200 L56 200 L56 270 L30 270 Z')}
      ${p('rr_door', 'M170 200 L144 200 L144 270 L170 270 Z')}
      ${p('rl_fender', 'M30 274 L54 274 L52 346 Q36 348 30 336 Q26 306 30 274 Z')}
      ${p('rr_fender', 'M170 274 L146 274 L148 346 Q164 348 170 336 Q174 306 170 274 Z')}
      ${p('trunk', 'M56 286 Q100 294 144 286 L148 346 Q100 352 52 346 Z')}
      ${p('rbumper', 'M48 352 Q100 358 152 352 L148 378 Q100 390 52 378 Z')}
    </svg>`;
  }
  const PANEL_RU = { hood: 'Капот', roof: 'Крыша', trunk: 'Багажник', fbumper: 'Передний бампер', rbumper: 'Задний бампер', fl_fender: 'Крыло переднее левое', fr_fender: 'Крыло переднее правое', fl_door: 'Дверь передняя левая', fr_door: 'Дверь передняя правая', rl_door: 'Дверь задняя левая', rr_door: 'Дверь задняя правая', rl_fender: 'Крыло заднее левое', rr_fender: 'Крыло заднее правое' };
  const PAINT_RU = { n: 'родная краска', p: 'окрас', r: 'замена', u: 'не указано' };

  function historyChecks(c) {
    const L = [];
    const own = c.owners;
    if (own) L.push([own <= 2 ? 'ok' : own <= 4 ? 'info' : 'warn', `${own} ${plural(own, 'владелец', 'владельца', 'владельцев')} по ПТС`, own <= 2 ? 'Мало рук - понятная история' : 'Проверьте сроки владения в отчёте']);
    L.push(c.pts ? ['ok', 'Оригинальный ПТС', 'Не дубликат'] : ['info', 'ПТС', 'Тип не указан, уточните у продавца']);
    if (c.mileage_base === 0) L.push(['info', 'Пробега нет в базах', `По щитку ${kmF(c.mileage)}`]);
    else if (c.mileage_base && c.mileage && c.mileage > c.mileage_base) L.push(['ok', `Последний пробег в базе ${kmF(c.mileage_base)}`, `Сейчас ${kmF(c.mileage)} - скрутки нет, база отстаёт`]);
    else if (c.mileage_confirmed) L.push(['ok', 'Пробег подтверждён базой', kmF(c.mileage) || '']);
    const acc = [...(c.groups.history || [])].find(t => /дтп/i.test(t));
    if (c.no_accidents) L.push(['ok', 'Без ДТП и расчётов', 'По данным отчёта']);
    else if (acc) L.push(['warn', acc, 'Подробности в отчёте Автотеки']);
    if (c.autoteka) L.push([/зелен|нов|хорош|без жест/.test(c.autoteka) ? 'ok' : 'info', `Автотека: ${c.autoteka}`, 'Отчёт есть у продавца']);
    if (c.not_taxi) L.push(['ok', 'Не такси', 'Нет лицензий и следов работы в такси']);
    if (c.not_on_avito) L.push(['ok', 'Не продавалась на Авито', 'Свежая машина, не "пересиженная"']);
    if (c.direct_owner) L.push(['ok', 'Продажа от хозяина', 'Продавец сопровождает сделку']);
    if (c.keys2) L.push(['ok', '2 ключа', 'Полный комплект']);
    return L.slice(0, 8);
  }

  function pageCar() {
    mountChrome('car');
    const id = new URLSearchParams(location.search).get('id');
    const c = CARS.find(x => x.slug === id) || CARS[0];
    const s = seller(c);
    applyTheme(s);
    document.title = `${title(c)} за ${rub(c.price)} - ${s.name} | CarMarket SPB`;
    const meta = document.querySelector('meta[name=description]');
    meta && meta.setAttribute('content', `${title(c)}. Цена ${rub(c.price)}${c.gap ? ', на ' + kRub(c.gap) + ' ниже рынка' : ''}. Продаёт ${s.name}.`);

    const ref = Math.max(c.market || 0, c.avito || 0, c.price + (c.gap || 0));
    const lo = c.price * 0.92, hi = ref * 1.04;
    const pos = v => Math.max(3, Math.min(97, (v - lo) / (hi - lo) * 100));
    const sold = gone(c), reserved = c.status === 'reserved';
    const specs = [
      ['Год', c.year || 'Уточняйте'], ['Пробег', kmF(c.mileage) || (c.mileage_base ? kmF(c.mileage_base) + ' (база)' : {
        html: `<a class="ask" href="${tgLink(s, `Здравствуйте! Подскажите пробег ${title(c)} за ${rub(c.price)}: по приборке и по базе. ${location.href}`)}" target="_blank" rel="noopener">${ic('send', 'sm')}Запросить пробег</a>`
      })],
      ['Двигатель', [c.volume && c.volume + ' л', c.hp && c.hp + ' л.с.', c.fuel && c.fuel.toLowerCase()].filter(Boolean).join(', ') || 'Уточняйте'],
      ['Кузов', c.body || 'Уточняйте'], ['Коробка', gb(c) || 'Уточняйте'], ['Привод', c.drive || 'Уточняйте'], ['Руль', c.wheel],
      ['Цвет', c.color || 'Уточняйте'], ['Владельцы', c.owners || 'Уточняйте'],
      ['ПТС', c.pts ? 'Оригинал' : 'Уточняйте'], ['Ключи', c.keys2 ? '2 ключа' : 'Уточняйте'], ['Город', s.city]
    ];
    const painted = c.paint ? Object.values(c.paint).filter(v => v === 'p').length : 0;
    const native = c.paint ? Object.values(c.paint).filter(v => v === 'n').length : 0;
    const quotes = c.notes || [];
    const gallery = c.gallery;

    $('#car').innerHTML = `
      <nav class="crumbs wrap" aria-label="Хлебные крошки"><a href="index.html">Главная</a>/<a href="index.html#catalog">Каталог</a>/<a href="index.html?make=${encodeURIComponent(c.make)}#catalog">${esc(c.make)}</a>/<span>${esc(c.model)}</span></nav>
      <div class="wrap">
        <div class="car-head">
          <div>
            <h1>${esc(fullName(c))} <span>${c.restyle ? 'рестайлинг ' : ''}${c.year || ''}</span></h1>
            <div class="tags">
              ${c.status === 'archive' ? '<span class="tag">Архив продавца</span>' : sold ? '<span class="tag hot">Продана</span>' : reserved ? '<span class="tag warn">Задаток внесён</span>' : '<span class="tag ok">В продаже</span>'}
              ${quickTags(c, 5).map(([k, t]) => `<span class="tag ${k}">${t}</span>`).join('')}
              <span class="tag">${ic('clock', 'sm')}${dateF(c.date)}</span>
            </div>
          </div>
          <div class="acts">
            <button class="icon-btn fav ${favs.has(c.slug) ? 'on' : ''}" style="position:static;background:transparent" data-fav="${c.slug}" aria-label="В избранное">${ic('heart')}</button>
            <button class="icon-btn" id="share" aria-label="Поделиться">${ic('share')}</button>
          </div>
        </div>
        <div class="car-layout">
          <div>
            <div class="gallery">
              <div class="g-main">
                <div class="g-track" id="gTrack">${gallery.map((g, i) => `<img src="${g.src}" alt="${esc(fullName(c))}, фото ${i + 1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} width="${g.w}" height="${g.h}" data-i="${i}">`).join('')}</div>
                ${gallery.length > 1 ? `<button class="g-nav prev" aria-label="Предыдущее фото">${ic('left')}</button>
                <button class="g-nav next" aria-label="Следующее фото">${ic('right')}</button>` : ''}
                ${plate(s)}
                <span class="g-count" id="gCount">1 / ${gallery.length}</span>
              </div>
              <div class="g-thumbs" id="gThumbs" ${gallery.length > 1 ? '' : 'hidden'}>${gallery.map((g, i) => `<button class="${i ? '' : 'on'}" data-i="${i}" aria-label="Фото ${i + 1}"><img src="${g.src}" alt="" loading="lazy"></button>`).join('')}</div>
            </div>

            <section class="block"><h2>Характеристики</h2>
              <dl class="specs">${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v && v.html ? v.html : esc(v)}</dd></div>`).join('')}</dl>
            </section>

            ${c.tg_posts && c.tg_posts.length ? `
            <section class="block"><h2>${ic('send', 'lg')}Эта машина в канале ${esc(s.name)}</h2>
              <p style="color:var(--muted);margin:-6px 0 14px">Анонс, видеообзор, кузов, техника и отчёт - как продавец показал машину своим ${Math.round(s.subscribers / 1000)}K подписчикам.</p>
              <div class="tg-rail" id="tgRail"></div>
            </section>` : ''}

            ${(Object.keys(c.paint || {}).length || c.groups.body.length) ? `<section class="block"><h2>${ic('paint', 'lg')}Кузов и окрасы</h2>
              <div class="body-wrap ${Object.keys(c.paint || {}).length ? '' : 'no-svg'}">
                <div class="body-svg">
                  ${bodySvg(c.paint || {})}
                  <div class="legend"><span><i style="background:#2f6b45"></i>Родная ${native}</span><span><i style="background:var(--warn)"></i>Окрас ${painted}</span><span><i style="background:var(--surface-3)"></i>Не указано</span></div>
                </div>
                <div>
                  <p class="sub-hd">Со слов продавца</p>
                  <ul class="bullets">${(c.groups.body.length ? c.groups.body : ['Состояние кузова уточняйте у продавца']).map(t => `<li>${ic('check', 'sm')}${esc(t)}</li>`).join('')}</ul>
                  ${painted ? `<p style="color:var(--muted);font-size:13px;margin-top:14px">Схема ориентировочная: продавец указал ${painted} ${plural(painted, 'окрас', 'окраса', 'окрасов')} без расположения. Точные замеры толщиномером - на осмотре.</p>` : ''}
                </div>
              </div>
            </section>` : ''}

            ${(c.groups.tech.length || quotes.length) ? `
            <section class="block"><h2>${ic('wrench', 'lg')}Техника</h2>
              ${c.groups.tech.length ? `<ul class="bullets">${c.groups.tech.map(t => `<li>${ic('check', 'sm')}${esc(t)}</li>`).join('')}</ul>` : ''}
              ${quotes.length ? `<blockquote class="quote">${quotes.map(q => `<p>${esc(q)}</p>`).join('')}<footer><img src="${s.avatar}" alt="">${esc(s.person)}, из канала</footer></blockquote>` : ''}
            </section>` : ''}

            <section class="block"><h2>${ic('history', 'lg')}История и проверки</h2>
              ${c.autoteka_url ? `<a class="btn btn-ghost" style="margin-bottom:14px" href="${c.autoteka_url}" target="_blank" rel="noopener">${ic('report', 'sm')}Открыть отчёт Автотеки</a>` : ''}
              <ul class="checks">${historyChecks(c).map(([k, t, sub]) => `<li class="${k}"><span class="lamp">${ic(k === 'ok' ? 'check' : k === 'warn' ? 'alert' : 'info', 'sm')}</span><div><b>${esc(t)}</b><small>${esc(sub)}</small></div></li>`).join('')}</ul>
            </section>

            ${c.groups.equipment.length ? `
            <section class="block"><h2>${ic('sparkle', 'lg')}Комплектация</h2>
              <div class="equip">${c.groups.equipment.flatMap(t => t.split(/,\s*/)).map(t => t.replace(/\s*и тд$/, '')).filter(t => t.length > 2 && !/комплектац/i.test(t)).map(t => t[0].toUpperCase() + t.slice(1)).filter((t, i, a) => a.indexOf(t) === i).map(t => `<span>${esc(t[0].toUpperCase() + t.slice(1))}</span>`).join('')}</div>
            </section>` : ''}

            ${(c.reports.length || c.proof.length) ? `
            <section class="block"><h2>${ic('report', 'lg')}${c.proof.length ? 'Доказательство зазора' : 'Отчёт'}</h2>
              ${c.proof.length ? '<p style="color:var(--muted);margin:-6px 0 14px">Скриншоты похожих предложений на рынке, которые продавец приложил к посту.</p>' : ''}
              <div class="proof">${[...c.proof, ...c.reports].map(src => `<img src="${src}" alt="Скриншот" loading="lazy" data-lb="${src}">`).join('')}</div>
            </section>` : ''}

            <p class="block"><a class="source" href="${c.source}" target="_blank" rel="noopener">${ic('send', 'sm')}Оригинальный пост в Telegram-канале ${esc(s.name)}</a></p>
          </div>

          <aside class="buy">
            <div class="panel">
              <div class="price-row">
                <div class="price">${rub(c.price)}</div>
                ${c.gap ? `<span class="gap-pill">${ic('down', 'sm')}-${kRub(c.gap)}</span>` : ''}
              </div>
              ${(c.market || c.avito) ? `
              <div class="scale">
                <div class="scale-bar">
                  ${c.market ? `<span class="scale-pin mk" style="left:${pos(c.market)}%" title="Старт рынка"></span>` : ''}
                  ${c.avito ? `<span class="scale-pin av" style="left:${pos(c.avito)}%" title="Оценка Авито"></span>` : ''}
                  <span class="scale-pin me" style="left:${pos(c.price)}%" title="Цена продавца"></span>
                </div>
                <div class="scale-legend">
                  <div><i style="background:var(--accent)"></i>Здесь<b>${kRub(c.price)}</b></div>
                  ${c.avito ? `<div><i style="background:#ffe14d"></i>Авито оценка<b>${kRub(c.avito)}</b></div>` : '<div></div>'}
                  ${c.market ? `<div><i style="background:var(--hot)"></i>Старт рынка<b>${kRub(c.market)}+</b></div>` : '<div></div>'}
                </div>
              </div>` : `<p style="margin:14px 0 0;color:var(--muted);font-size:14px">Цена из объявления в канале продавца.</p>`}
            </div>

            ${sold ? '' : '<div class="demand" id="demand"></div>'}

            <div class="buy-actions">
              ${sold ? `<button class="btn btn-dark btn-block" disabled>${c.status === 'archive' ? 'Эта машина уже ушла' : 'Машина продана'}</button>
                <a class="btn btn-ghost btn-block" href="seller.html?id=${s.id}">Другие машины ${esc(s.name)}</a>` : `
              ${c.invite ? `<a class="btn btn-gold-s btn-block" href="${c.invite}" target="_blank" rel="noopener">${ic('send', 'sm')}Смотреть в канале ${esc(s.name)}</a>` : ''}
              <button class="btn btn-accent btn-block" id="depBtn">${ic('lock', 'sm')}${reserved ? 'Встать в очередь на бронь' : 'Забронировать задатком'}</button>
              <p class="deposit-note">${c.manager ? `Менеджер ${esc(c.manager)}, ${esc(c.phoneLabel)}. ` : ''}от 5 000 ₽, бронь до 72 часов, возврат если не совпало с описанием</p>
              <div class="row">
                <button class="btn btn-ghost" id="offBtn">${ic('hand', 'sm')}Торг</button>
                <a class="btn btn-ghost" href="tel:${c.phone || s.phone}">${ic('phone', 'sm')}Звонок</a>
              </div>
              <a class="btn btn-dark btn-block" href="${tgLink(s, `Здравствуйте! Интересует ${title(c)} за ${rub(c.price)}. ${location.href}`)}" target="_blank" rel="noopener">${ic('send', 'sm')}Написать в Telegram</a>`}
            </div>

            ${sold ? '' : `<div class="bargain-line ${c.bargain ? '' : 'no'}">${ic(c.bargain ? 'hand' : 'tag')}${c.bargain ? 'Торг уместен, у капота' : 'Без торга - цена уже ниже рынка'}</div>`}

            <a class="seller-mini t-${s.theme}" href="seller.html?id=${s.id}">
              <img src="${s.avatar}" alt="" width="52" height="52">
              <div><b>${esc(s.name)} ${ic('badge', 'sm verified')}</b><small>${Math.round(s.subscribers / 1000)}K подписчиков, ${CARS.filter(x => x.seller === s.id && !gone(x)).length} авто</small></div>
              <span class="btn btn-sm">Витрина</span>
            </a>
            ${socials(s)}
          </aside>
        </div>

        <section class="sec" style="padding-bottom:0">
          <div class="sec-hd"><div><h2>Ещё в этом ценнике</h2></div><a class="btn btn-ghost btn-sm" href="index.html#catalog">Весь каталог ${ic('arrow', 'sm')}</a></div>
          <div class="grid" id="similar"></div>
        </section>
      </div>
      ${sold ? '' : `<div class="mbar" id="mbar"><div><b>${rub(c.price)}</b><small>${c.gap ? '-' + kRub(c.gap) + ' к рынку' : esc(s.name)}</small></div><button class="btn btn-accent" id="mDep">${ic('lock', 'sm')}Задаток</button></div>`}`;

    // on phones the buy panel goes right under the photos, on desktop it is the sticky sidebar
    const buy = $('.buy'), side = buy.parentElement, gal = $('.gallery');
    const place = () => { if (matchMedia('(max-width: 1080px)').matches) { if (gal.nextElementSibling !== buy) gal.after(buy); } else if (buy.parentElement !== side) side.appendChild(buy); };
    place(); addEventListener('resize', place);
    refreshDemand(c);
    $('#tgRail') && tgEmbeds($('#tgRail'), c.tg_posts, channelOf(s));

    // similar by price
    const sim = CARS.filter(x => x.slug !== c.slug && !gone(x)).sort((a, b) => Math.abs(a.price - c.price) - Math.abs(b.price - c.price)).slice(0, 4);
    $('#similar').innerHTML = sim.map(card).join('');
    bindFavs(document);

    // gallery
    const track = $('#gTrack'), thumbs = $$('#gThumbs button');
    let cur = 0;
    const go = i => { cur = (i + gallery.length) % gallery.length; track.scrollTo({ left: track.clientWidth * cur, behavior: 'smooth' }); };
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== cur) cur = i;
      $('#gCount').textContent = `${i + 1} / ${gallery.length}`;
      thumbs.forEach((t, k) => t.classList.toggle('on', k === i));
      const t = thumbs[i]; t && t.parentElement.scrollTo({ left: t.offsetLeft - t.parentElement.clientWidth / 2 + t.clientWidth / 2, behavior: 'smooth' });
    }, { passive: true });
    $('.g-main .g-nav.prev')?.addEventListener('click', () => go(cur - 1));
    $('.g-main .g-nav.next')?.addEventListener('click', () => go(cur + 1));
    thumbs.forEach(t => t.addEventListener('click', () => go(+t.dataset.i)));
    track.addEventListener('click', e => { const im = e.target.closest('img'); im && lightbox(gallery.map(g => g.src), +im.dataset.i); });
    $$('[data-lb]').forEach((im, i, all) => im.addEventListener('click', () => lightbox(all.map(x => x.dataset.lb), i)));
    document.addEventListener('keydown', e => { if ($('#lb.open') || $('#modal.open')) return; if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });

    if (!sold) {
      $('#depBtn').addEventListener('click', () => depositModal(c));
      $('#mDep').addEventListener('click', () => depositModal(c));
      $('#offBtn').addEventListener('click', () => offerModal(c));
      const mbar = $('#mbar'), dep = $('#depBtn');
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => mbar.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(dep);
    }
    $('#share').addEventListener('click', async () => {
      const data = { title: document.title, url: location.href };
      try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast('Ссылка скопирована'); } } catch (e) { /* cancelled */ }
    });
    reveal();
  }

  function refreshDemand(c) {
    const el = $('#demand'); if (!el) return;
    const n = wantCount(c), mine = myBids()[c.slug];
    const colors = ['#c8ff2e', '#ffb020', '#7ad7ff', '#ff8ae9'];
    const letters = 'АДМСКИЕВ';
    el.innerHTML = `
      <div class="faces">${[0, 1, 2, 3].map(i => `<span style="background:${colors[i]}">${letters[(c.id + i * 3) % letters.length]}</span>`).join('')}</div>
      <p><b>${n} ${plural(n, 'человек хочет', 'человека хотят', 'человек хотят')} купить</b><br>
      ${mine ? `<span style="color:var(--accent);font-weight:700">Вы в списке: ${mine.kind === 'deposit' ? 'задаток ' + rub(mine.amount) : 'предложили ' + rub(mine.amount)}</span>` : `<span class="live">${watching(c)} смотрят сейчас</span> <span style="color:var(--dim)">· ${esc(c.views)} просмотров</span>`}</p>`;
  }

  /* ---------------- Telegram post embeds (official widget, lazy) ---------------- */
  function tgEmbeds(container, posts, channel) {
    const load = () => posts.forEach(id => {
      const slot = document.createElement('div'); slot.className = 'tg-slot';
      const sc = document.createElement('script');
      sc.async = true; sc.src = 'https://telegram.org/js/telegram-widget.js?22';
      sc.dataset.telegramPost = `${channel}/${id}`; sc.dataset.width = '100%'; sc.dataset.dark = '1';
      slot.appendChild(sc); container.appendChild(slot);
    });
    if (!('IntersectionObserver' in window)) return load();
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { o.disconnect(); load(); } }, { rootMargin: '400px' });
    o.observe(container);
  }
  const channelOf = s => (s.links.channel || '').split('/').pop();
  function socials(s, cls = '') {
    return `<div class="socials ${cls}">
      <a href="${s.links.channel}" target="_blank" rel="noopener" aria-label="Telegram-канал">${ic('send', 'sm')}<span>Канал</span></a>
      <a href="${s.links.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ic('insta', 'sm')}<span>Instagram</span></a>
      ${s.links.max ? `<a href="${s.links.max}" target="_blank" rel="noopener" aria-label="MAX"><b class="max">MAX</b><span>MAX</span></a>` : ''}
      <a href="tel:${s.phone}" aria-label="Позвонить">${ic('phone', 'sm')}<span>Звонок</span></a>
    </div>`;
  }

  /* ---------------- lightbox ---------------- */
  function lightbox(srcs, i) {
    let lb = $('#lb');
    if (!lb) {
      lb = document.createElement('div'); lb.id = 'lb'; lb.className = 'lb';
      lb.innerHTML = `<img alt=""><button class="icon-btn modal-x" aria-label="Закрыть">${ic('x')}</button><button class="g-nav prev" aria-label="Назад">${ic('left')}</button><button class="g-nav next" aria-label="Вперёд">${ic('right')}</button><span class="g-count"></span>`;
      document.body.appendChild(lb);
    }
    let cur = i;
    const show = () => { $('img', lb).src = srcs[cur]; $('.g-count', lb).textContent = `${cur + 1} / ${srcs.length}`; };
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; document.removeEventListener('keydown', key); };
    const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') { cur = (cur + 1) % srcs.length; show(); } if (e.key === 'ArrowLeft') { cur = (cur - 1 + srcs.length) % srcs.length; show(); } };
    $('.modal-x', lb).onclick = close;
    $('.prev', lb).onclick = () => { cur = (cur - 1 + srcs.length) % srcs.length; show(); };
    $('.next', lb).onclick = () => { cur = (cur + 1) % srcs.length; show(); };
    lb.onclick = e => { if (e.target === lb) close(); };
    let x0 = null;
    lb.ontouchstart = e => x0 = e.touches[0].clientX;
    lb.ontouchend = e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { cur = (cur + (dx < 0 ? 1 : -1) + srcs.length) % srcs.length; show(); } x0 = null; };
    document.addEventListener('keydown', key);
    show(); lb.classList.add('open'); document.body.style.overflow = 'hidden';
  }

  /* ======================= SELLER ======================= */
  function pageSeller() {
    mountChrome('seller');
    const id = new URLSearchParams(location.search).get('id') || 'lex-auto';
    const s = SELLERS[id] || SELLERS['lex-auto'];
    applyTheme(s);
    document.title = `${s.name} - витрина на CarMarket SPB`;
    const cars = CARS.filter(c => c.seller === s.id);
    const active = cars.filter(c => !gone(c));
    const avg = active.length ? active.reduce((a, c) => a + (c.gap || 0), 0) / active.length : 0;
    const maxGap = active.reduce((m, c) => (c.gap || 0) > ((m && m.gap) || 0) ? c : m, null);
    const L = s.links;
    const stats = active.length ? [
      s.subscribers ? [`${Math.round(s.subscribers / 1000)}K`, 'подписчиков в Telegram'] : null,
      [active.length, 'авто в продаже'],
      avg ? [`<span style="color:var(--accent)">-${kRub(Math.round(avg / 10000) * 10000)}</span>`, 'средний зазор к рынку'] : null,
      s.carsChannelSubs ? [`${Math.round(s.carsChannelSubs / 1000)}K`, 'в закрытом канале с машинами'] : null,
      s.media ? [s.media.photos, 'фото машин в канале'] : null
    ].filter(Boolean) : [
      ['Скоро', 'машины из канала на маркете'],
      ['Задаток', 'бронь онлайн с первого дня'],
      ['СПб', 'осмотр и сделка в Петербурге']
    ];

    $('#seller').innerHTML = `
      <section class="s-hero t-${s.theme}">
        <div class="word" aria-hidden="true">${esc(s.name.toUpperCase())}</div>
        <div class="wrap s-hero-in">
          <div>
            <img class="ava" src="${s.avatar}" alt="Логотип ${esc(s.name)}" width="104" height="104">
            <h1>${esc(s.title)}</h1>
            <div class="handle">
              <span>${ic('badge', 'sm verified')} ${esc(s.person)}</span>
              <span>${ic('pin', 'sm')} ${esc(s.city)}</span>
              ${s.rkn ? `<a href="${s.rkn}" target="_blank" rel="noopener">${ic('shield', 'sm')} Канал в реестре РКН</a>` : ''}
              ${s.onboarding ? `<span class="onb">${ic('clock', 'sm')} Подключается к маркету</span>` : ''}
            </div>
            <p class="tagline">${esc(s.tagline)}</p>
            <div class="s-links">
              ${L.channel ? `<a class="btn btn-gold" href="${L.channel}" target="_blank" rel="noopener">${ic('send', 'sm')}Канал в Telegram</a>` : ''}
              ${L.instagram ? `<a class="btn ${L.channel ? '' : 'btn-gold'}" href="${L.instagram}" target="_blank" rel="noopener">${ic('insta', 'sm')}Instagram</a>` : ''}
              ${L.contact ? `<a class="btn" href="${L.contact}" target="_blank" rel="noopener">${ic('msg', 'sm')}Написать</a>` : ''}
              ${s.phone ? `<a class="btn" href="tel:${s.phone}">${ic('phone', 'sm')}${esc(s.phoneLabel)}</a>` : ''}
              ${L.max ? `<a class="btn" href="${L.max}" target="_blank" rel="noopener"><b class="max">MAX</b>MAX</a>` : ''}
            </div>
          </div>
          <div class="s-person ${s.cutout ? '' : 'logo'}">
            ${maxGap ? `<a class="bubble" href="car.html?id=${maxGap.slug}"><small>Самый большой зазор сейчас</small>-${kRub(maxGap.gap)} на ${esc(fullName(maxGap))}</a>` : ''}
            <img src="${s.cutout || s.logo}" alt="${esc(s.cutout ? s.person : 'Логотип ' + s.name)}">
          </div>
        </div>
      </section>
      <div class="s-stats" style="grid-template-columns:repeat(${stats.length},1fr)">${stats.map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join('')}</div>
      <div class="wrap">
        ${s.upcoming && s.upcoming.length ? `
        <section class="sec" style="padding-bottom:0">
          <div class="sec-hd"><div><h2>Анонс</h2><p>Уже в канале, на маркет выйдет в ближайшее время. Подпишитесь, чтобы успеть первым.</p></div></div>
          ${s.upcoming.map(u => `
          <div class="anons reveal">
            <img src="${u.img}" alt="${esc(u.title)}" loading="lazy">
            <div class="anons-body">
              <span class="soon">${ic('clock', 'sm')}Скоро в продаже</span>
              <h3>${esc(u.title)}</h3>
              <div class="card-price"><b>${rub(u.price)}</b><s>Авито ${kRub(u.avito)}</s></div>
              <div class="card-specs">${u.specs.map(esc).join('<i>/</i>')}</div>
              <p style="margin:0;color:var(--muted)">${esc(u.note)}</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:auto">
                <button class="btn btn-accent" data-notify>${ic('zap', 'sm')}Сообщить о старте</button>
                <a class="btn btn-ghost" href="${u.source}" target="_blank" rel="noopener">Пост в канале</a>
              </div>
            </div>
          </div>`).join('')}
        </section>` : ''}
        <section class="sec" style="padding-bottom:0">
          ${L.channel && cars.length ? `
          <div class="sec-hd"><div><h2>Лента канала</h2><p>Свежие посты из Telegram ${esc(s.name)}: обзоры, анонсы и машины, которые только вышли.</p></div>
            <a class="btn btn-ghost btn-sm" href="${L.channel}" target="_blank" rel="noopener">${ic('send', 'sm')}Открыть канал</a></div>
          <div class="tg-rail" id="sFeed"></div>` : ''}
          ${L.instagram ? `
          <a class="ig-card reveal" href="${L.instagram}" target="_blank" rel="noopener">
            <span class="ig-ico">${ic('insta', 'lg')}</span>
            <div><b>@${esc(L.instagram.split('/').filter(Boolean).pop())}</b><small>Reels с осмотров, выдачи машин и закулисье в Instagram</small></div>
            <span class="btn btn-sm">Смотреть ${ic('arrow', 'sm')}</span>
          </a>` : ''}
        </section>
        <section class="sec">
          ${cars.length ? `
          <div class="sec-hd"><div><h2>${active.length ? 'В продаже' : 'Машины ' + esc(s.name)}</h2><p>${active.length} ${plural(active.length, 'машина', 'машины', 'машин')} сейчас${s.carsChannelSubs ? `. Полный сток - в закрытом канале продавца на ${Math.round(s.carsChannelSubs / 1000)}K подписчиков` : '. Отсортировано по зазору к рынку'}.</p></div></div>
          <div class="grid" id="sGrid"></div>
          ${cars.length > active.length ? `
          <div class="sec-hd" style="margin-top:56px"><div><h2>Архив: так продаёт ${esc(s.name)}</h2><p>Машины, которые уже были в канале. Чтобы понимать цены и уровень.</p></div></div>
          <div class="grid" id="sArch"></div>` : ''}` : `
          <div class="onboard t-${s.theme} reveal">
            <img src="${s.logo || s.avatar}" alt="" loading="lazy">
            <div>
              <h2>Машины ${esc(s.name)} скоро здесь</h2>
              <p>Подключаем канал: как только машина выходит в Telegram, она появится на маркете с фото, ценой и зазором до рынка. Можно забронировать задатком раньше всех.</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-accent" data-notify>${ic('zap', 'sm')}Сообщить о первой машине</button>
                <a class="btn btn-ghost" href="index.html#catalog">Смотреть другие тачки</a>
              </div>
            </div>
          </div>`}
        </section>
      </div>`;
    if (cars.length) {
      const byGap = (a, b) => (b.gap || 0) - (a.gap || 0) || b.price - a.price;
      $('#sGrid').innerHTML = active.sort(byGap).map(card).join('');
      $('#sArch') && ($('#sArch').innerHTML = cars.filter(gone).sort(byGap).map(card).join(''));
      bindFavs($('#seller'));
    }
    if ($('#sFeed')) {
      const feed = [...new Set([...cars].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).flatMap(c => c.tg_posts.slice().reverse()))].slice(0, 8);
      tgEmbeds($('#sFeed'), feed, channelOf(s));
    }
    $$('[data-notify]').forEach(b => b.addEventListener('click', () => { b.innerHTML = `${ic('check', 'sm')}Напомним`; b.disabled = true; toast('Пришлём, как только машина выйдет'); }));
    reveal();
  }

  /* ======================= BLOGGERS ======================= */
  function pageBloggers() {
    mountChrome('bloggers');
    const c = CARS.find(x => x.make === 'Mercedes' && /CLS/.test(x.model)) || CARS[0];
    const s = seller(c);
    $('#tgPost').innerHTML = `<div class="tg-h"><img src="${s.avatar}" alt="">ТАЧКИ ОТ ЛЕКС АВТО</div>${esc(window.CLS_POST || '')}`;
    $('#mkCard').innerHTML = card(c);
    phoneMask($('#jPhone'));
    $('#joinForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      f.innerHTML = `<div class="success full" style="grid-column:1/-1"><div class="big">${ic('check')}</div><h3>Заявка принята</h3><p class="lead" style="margin-top:10px">Свяжемся в Telegram, покажем вашу витрину на ваших же машинах и подключим импорт из канала.</p></div>`;
    });
    reveal();
  }

  /* ---------------- boot ---------------- */
  const page = document.body.dataset.page;
  ({ home: pageHome, car: pageCar, seller: pageSeller, bloggers: pageBloggers })[page]?.();
  window.CM = { ic, rub, kRub };
})();
