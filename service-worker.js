self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('dl-cache-v1').then(cache => cache.addAll([
    './', './index.html', './styles.css', './manifest.json',
    './register.html','./home.html','./record.html','./settings.html',
    './scripts/role.js','./scripts/register.js','./scripts/home.js','./scripts/record.js','./scripts/settings.js'
  ])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
