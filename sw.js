var CACHE = "radio-poder-v1";

var PRECACHE = [
  ".",
  "index.html",
  "manifest.json",
  "icon.svg"
];

self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (evt) {
  var url = evt.request.url;

  // Nunca cachear el stream ni las llamadas dinámicas (RSS / Sheets)
  if (url.indexOf("streamingecuador.net") > -1 ||
      url.indexOf("allorigins") > -1 ||
      url.indexOf("rss2json") > -1 ||
      url.indexOf("corsproxy") > -1 ||
      url.indexOf("docs.google.com") > -1 ||
      url.indexOf("fonts.") > -1) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  evt.respondWith(
    caches.match(evt.request).then(function (hit) {
      return hit || fetch(evt.request).then(function (resp) {
        if (resp && resp.ok && resp.type === "basic") {
          var copy = resp.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(evt.request, copy);
          });
        }
        return resp;
      }).catch(function () {
        return new Response("Sin conexión", { status: 503 });
      });
    })
  );
});
