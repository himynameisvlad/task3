importScripts('./js/cache-polyfill.js');

var CACHE_NAME = 'shri-2016-task3-1';
var CACHE_PHOTOS = 'shri-2016-task3-2';
const ALL_CACHES = [
    CACHE_NAME,
    CACHE_PHOTOS
];

//Пути к файлам
var urlsToCache = [
  '/',
  '/css/index.css',//'/index.css' to '/css/index.css'
  '/js/index.js',//'/index.js' to '/js/index.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
    event.waitUntil(self.skipWaiting());
});

//добавил активацию воркера
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function(keys){
            return Promise.all(
                keys.filter(function (key) {
                        return key.startsWith('shri-') && !ALL_CACHES.includes(key);
                    }).map(function (key, i) {
                        return caches.delete(keys);
                    })
            )
        })
    );

});

self.addEventListener('fetch', function(event) {
    const req = event.request;
    const requestURL = new URL(req.url);

    if (/^\/api\/v1/.test(requestURL.pathname)
        && (req.method !== 'GET' && req.method !== 'HEAD')) {
         event.respondWith(fetch(req));
         return;
    }

    if (/^\/api\/v1/.test(requestURL.pathname)) {
        event.respondWith(
            Promise.race([
                fetchAndPutToCache(req),
                getFromCache(req)
            ])
        );
        return;
    }


    //Добавил обработчик для изображений, имеющих расширение
    if(requestURL.href.endsWith('png') || requestURL.href.endsWith('gif') || requestURL.href.endsWith('jpg')) {
        event.respondWith(servePhoto(req));
        return;
    }

    //Просто event.respond()
    event.respondWith(getFromCache(req));
});

//ф-ия для кэширования фото
function servePhoto(request) {
    var storageUrl = request.url.replace(/.(jpg||gif||png)$/, '');

    return caches.open(CACHE_PHOTOS).then(function(cache) {
      return cache.match(storageUrl).then(function(response) {
        if (response) return response;

        return fetch(request).then(function(networkResponse) {
          cache.put(storageUrl, networkResponse.clone());
          return networkResponse;
        });
      });
    });
}

function fetchAndPutToCache(request) {

    return fetch(request).then((response) => {

        // Проверка респонса на валидность
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        //должен не возвращать, а просто открывать кэш
        caches.open(CACHE_NAME)
            .then((cache) => {
                cache.put(request, responseToCache);
            })
            .then(() => response);
    })
    .catch(() => caches.match(request));
}

function getFromCache(request) {

    return caches.match(request)
        .then((response) => {

            if (response) {
                return response;
            }

            //Склоинровал запрос
             var fetchRequest = request.clone();

            return fetchAndPutToCache(fetchRequest);
        });

}
