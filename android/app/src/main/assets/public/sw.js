// 서비스 워커 - 푸시 알림 처리
const CACHE_NAME = 'story-potion-v1';
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/app_logo/logo.png'
];

// [FCM 연동] Firebase App 및 Messaging 초기화 (sw.js에서 별도 필요)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCaK3OBCexXBSLi4NqFT1Fv3MzzTBEhG-8",
    authDomain: "story-potion.firebaseapp.com",
    projectId: "story-potion",
    storageBucket: "story-potion.firebasestorage.app",
    messagingSenderId: "607033226027",
    appId: "1:607033226027:web:f0c9d3541ae35e04370b6e"
});

const messaging = firebase.messaging();

// FCM 백그라운드 메시지 처리
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);
    const notificationTitle = payload.notification?.title || 'Story Potion';
    const notificationOptions = {
        body: payload.notification?.body || '새로운 알림이 있습니다!',
        icon: '/app_logo/logo.png',
        badge: '/app_logo/logo.png',
        data: {
            url: payload.notification?.click_action || '/',
            ...payload.data
        }
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 서비스 워커 설치
self.addEventListener('install', (event) => {
    console.log('서비스 워커 설치 중...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시가 열렸습니다');
                return cache.addAll(urlsToCache);
            })
    );
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
    console.log('서비스 워커 활성화됨');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
    console.log('푸시 알림 수신:', event);

    let notificationData = {
        title: 'Story Potion',
        body: '새로운 알림이 있습니다!',
        icon: '/app_logo/logo.png',
        badge: '/app_logo/logo.png',
        tag: 'story-potion-notification',
        requireInteraction: false,
        silent: false
    };

    // 서버에서 전송된 데이터가 있으면 사용
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('푸시 데이터 파싱 실패:', error);
        }
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
        silent: notificationData.silent,
        data: {
            url: notificationData.url || '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: '열기',
                icon: '/app_logo/logo.png'
            },
            {
                action: 'close',
                title: '닫기'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    console.log('알림 클릭됨:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // 앱 열기
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // 이미 열린 창이 있으면 포커스
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }

                // 열린 창이 없으면 새 창 열기
                if (clients.openWindow) {
                    const url = event.notification.data?.url || '/';
                    return clients.openWindow(url);
                }
            })
    );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
    console.log('알림이 닫혔습니다:', event);
});

// 네트워크 요청 처리 (캐시 우선)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 있으면 캐시된 응답 반환
                if (response) {
                    return response;
                }

                // 캐시에 없으면 네트워크 요청
                return fetch(event.request);
            })
    );
}); 