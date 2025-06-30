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

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'Story Potion';
    const notificationOptions = {
        body: payload.notification?.body || '새로운 알림이 있습니다!',
        icon: '/app_logo/logo.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
}); 