// CarMarket SPB service worker: pages network-first (fresh prices), assets cache-first (photos don't change)
const V = 'cm-v1';
const CORE = ['index.html', 'car.html', 'seller.html', 'bloggers.html', 'assets/css/style.css', 'assets/js/app.js',
  'assets/js/cars.js', 'assets/js/cars-perekupchino.js', 'assets/js/sellers.js', 'assets/img/favicon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || /\.(html|js|css)$/.test(url.pathname);
  if (isPage) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: url.pathname.endsWith('.html') })));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); }
      return r;
    })));
  }
});
