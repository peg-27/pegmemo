const CACHE_NAME = 'pegmemo-v5';
const FILES_TO_CACHE = [
  '/pegmemo/',
  '/pegmemo/manifest.json',
  '/pegmemo/icon-192.png',
  '/pegmemo/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // skipWaiting を削除 → 新SWはユーザーが許可するまで待機する
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// メッセージを受け取ったらskipWaitingを実行（ユーザーが更新ボタンを押した時）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 共有ファイルの受け取り（Share Target API）
  if (event.request.method === 'POST' && url.pathname === '/pegmemo/') {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const file = formData.get('file');
      if (file) {
        const fileName = file.name || '共有ファイル';
        const cache = await caches.open('share-target-temp');
        await cache.put('shared-file', new Response(file));
        return Response.redirect('/pegmemo/?shared=true&name=' + encodeURIComponent(fileName), 303);
      }
      return Response.redirect('/pegmemo/?shared=true', 303);
    })());
    return;
  }

  // 通常のキャッシュ処理
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});