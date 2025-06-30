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
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID
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