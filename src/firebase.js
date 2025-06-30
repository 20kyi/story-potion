// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCaK3OBCexXBSLi4NqFT1Fv3MzzTBEhG-8",
    authDomain: "story-potion.firebaseapp.com",
    projectId: "story-potion",
    storageBucket: "story-potion.firebasestorage.app",
    messagingSenderId: "607033226027",
    appId: "1:607033226027:web:f0c9d3541ae35e04370b6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// FCM Messaging 초기화
export const messaging = getMessaging(app);

// FCM 토큰 발급 함수
export const getFcmToken = async () => {
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: "BFDL5rz8nGVoprOdvbju27kQGMosdu3IQirWzehuInorEhMZ0Qgei5vk2og0ITVVUuwP3SRmqL-a65nEwet9beM"
        });
        return currentToken;
    } catch (err) {
        console.error('FCM 토큰 발급 실패:', err);
        return null;
    }
};

// FCM 메시지 수신 리스너
export const onFcmMessage = (callback) => {
    return onMessage(messaging, callback);
}; 