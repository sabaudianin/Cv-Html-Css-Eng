const CACHE = "rb-portfolio-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./favicon.ico",
  "./apple-touch-icon.png",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./avatar.jpg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  e.respondWith(
    (async () => {
      // 1) Cache-first
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const resp = await fetch(request);
        // 2) Tylko odpowiedzi typu "basic" (tej samej domeny) i 200 — keszujemy
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          const c = await caches.open(CACHE);
          c.put(request, copy);
        }
        return resp;
      } catch (err) {
        // 3) Fallback TYLKO dla nawigacji (czyli żądań dokumentu)
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }
        // dla np. favicony — brak fallbacku do HTML
        return new Response("", { status: 504, statusText: "Offline" });
      }
    })()
  );
});
