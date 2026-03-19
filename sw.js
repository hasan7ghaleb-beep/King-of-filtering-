const CACHE='malik-filtering-v1';
const ASSETS=['/','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  if(e.request.url.includes('firebase')||e.request.url.includes('googleapis')) return;
  e.respondWith(
    fetch(e.request).then(res=>{
      if(res&&res.status===200&&res.type==='basic'){const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}
      return res;
    }).catch(()=>caches.match(e.request).then(cached=>cached||caches.match('./index.html')))
  );
});

self.addEventListener('push',e=>{
  const data=e.data?.json()||{title:'ملك الفلترة',body:'لديك إشعار جديد'};
  e.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/icon-192.png',badge:'/icon-192.png',dir:'rtl',lang:'ar',vibrate:[200,100,200]}));
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
