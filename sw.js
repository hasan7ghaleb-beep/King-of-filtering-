// ===== sw.js — ملك الفلترة =====
// يتم تحديث هذا الرقم عند كل نشر جديد على Vercel
const CACHE_VERSION = 'v' + Date.now();
const CACHE_NAME    = 'malik-filter-' + CACHE_VERSION;

// الملفات التي نخزّنها
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ── تثبيت: نخزّن الملفات الأساسية ──
self.addEventListener('install', event => {
  // تخطّى الانتظار وفعّل الـ SW الجديد فوراً
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // تجاهل أخطاء التخزين (مثلاً بيئة محدودة)
      });
    })
  );
});

// ── تفعيل: احذف الكاش القديم فوراً ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] حذف كاش قديم:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      // خذ السيطرة على جميع الصفحات المفتوحة فوراً
      return self.clients.claim();
    })
  );
});

// ── اعتراض الطلبات: Network First للتطبيق ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // تجاهل طلبات Firebase وخدمات خارجية — دعها تمر مباشرة
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('cloudflare') ||
    url.protocol === 'chrome-extension:'
  ) {
    return; // fetch عادي بدون تدخّل
  }

  // للـ HTML الرئيسي: Network First (ليضمن دائماً آخر إصدار)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // خزّن النسخة الجديدة
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // إذا فشل الشبكة، أرجع النسخة المخزّنة
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // لبقية الملفات: Network First أيضاً
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── رسائل من الصفحة ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
