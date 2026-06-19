const CACHE = 'shichu-suimei-v3';
const ASSETS = [
  './', './index.html', './css/style.css',
  './js/vendor/lunar.js', './js/app/main.mjs', './js/app/viewModel.mjs',
  './js/app/storage.mjs', './js/app/shareImage.mjs',
  './js/engine/meishiki.mjs', './js/engine/pillars.mjs', './js/engine/tenStar.mjs',
  './js/engine/twelveStage.mjs', './js/engine/fiveElements.mjs', './js/engine/tables.mjs',
  './js/data/interpret.mjs',
  './js/engine/shinStrength.mjs', './js/app/radarChart.mjs',
  './js/engine/luck.mjs', './js/app/luckView.mjs',
  './js/data/interpretations.mjs', './manifest.json',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
