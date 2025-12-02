/**
 * 친구 요청 알림 시스템
 * 
 * 친구 요청을 받았을 때 푸시 알림을 보내는 기능
 */

import { db, app } from '../firebase';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import pushNotificationManager from './pushNotification';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * 친구 요청 알림 보내기
 * @param {string} fromUserId - 요청을 보낸 사용자 ID
 * @param {string} toUserId - 요청을 받은 사용자 ID
 * @returns {Promise<boolean>} 알림 전송 성공 여부
 */
export const sendFriendRequestNotification = async (fromUserId, toUserId) => {
    try {
        // 요청을 보낸 사용자 정보 조회
        const fromUserRef = doc(db, 'users', fromUserId);
        const fromUserSnap = await getDoc(fromUserRef);

        if (!fromUserSnap.exists()) {
            console.error('요청을 보낸 사용자를 찾을 수 없습니다:', fromUserId);
            return false;
        }

        const fromUser = fromUserSnap.data();

        // 알림 데이터 생성
        const notificationData = {
            type: 'friend_request',
            title: '새로운 친구 요청',
            message: `${fromUser.displayName || '사용자'}님이 친구 요청을 보냈습니다.`,
            data: {
                fromUserId: fromUserId,
                fromUserName: fromUser.displayName || '사용자',
                fromUserEmail: fromUser.email
            },
            isRead: false,
            createdAt: Timestamp.now()
        };

        // 알림 저장 (users/{userId}/notifications 서브컬렉션에 저장)
        await addDoc(collection(db, 'users', toUserId, 'notifications'), notificationData);

        // 푸시 알림 전송 (사용자 설정 확인)
        const toUserDoc = await getDoc(doc(db, 'users', toUserId));
        if (toUserDoc.exists() && toUserDoc.data().friendEnabled) {
            await sendPushNotificationToUser(toUserId, notificationData.title, notificationData.message);
        }

        console.log('친구 요청 알림 전송 완료:', notificationData);
        return true;

    } catch (error) {
        console.error('친구 요청 알림 전송 실패:', error);
        return false;
    }
};

/**
 * 친구 요청 수락 알림 보내기
 * @param {string} fromUserId - 요청을 받은 사용자 ID
 * @param {string} toUserId - 요청을 보낸 사용자 ID
 * @returns {Promise<boolean>} 알림 전송 성공 여부
 */
export const sendFriendRequestAcceptedNotification = async (fromUserId, toUserId) => {
    try {
        // 요청을 받은 사용자 정보 조회
        const fromUserRef = doc(db, 'users', fromUserId);
        const fromUserSnap = await getDoc(fromUserRef);

        if (!fromUserSnap.exists()) {
            console.error('요청을 받은 사용자를 찾을 수 없습니다:', fromUserId);
            return false;
        }

        const fromUser = fromUserSnap.data();

        // 알림 데이터 생성
        const notificationData = {
            type: 'friend_accepted',
            title: '친구 요청이 수락되었습니다',
            message: `${fromUser.displayName || '사용자'}님이 친구 요청을 수락했습니다.`,
            data: {
                fromUserId: fromUserId,
                fromUserName: fromUser.displayName || '사용자',
                fromUserEmail: fromUser.email
            },
            isRead: false,
            createdAt: Timestamp.now()
        };

        // 알림 저장 (users/{userId}/notifications 서브컬렉션에 저장)
        await addDoc(collection(db, 'users', toUserId, 'notifications'), notificationData);

        // 푸시 알림 전송 (사용자 설정 확인)
        const toUserDoc = await getDoc(doc(db, 'users', toUserId));
        if (toUserDoc.exists() && toUserDoc.data().friendEnabled) {
            await sendPushNotificationToUser(toUserId, notificationData.title, notificationData.message, {
                type: 'friend_accepted',
                ...notificationData.data
            });
        }

        console.log('친구 요청 수락 알림 전송 완료:', notificationData);
        return true;

    } catch (error) {
        console.error('친구 요청 수락 알림 전송 실패:', error);
        return false;
    }
};

/**
 * 친구 삭제 알림 보내기
 * @param {string} fromUserId - 삭제를 요청한 사용자 ID
 * @param {string} toUserId - 삭제된 사용자 ID
 * @returns {Promise<boolean>} 알림 전송 성공 여부
 */
export const sendFriendRemovedNotification = async (fromUserId, toUserId) => {
    try {
        // 삭제를 요청한 사용자 정보 조회
        const fromUserRef = doc(db, 'users', fromUserId);
        const fromUserSnap = await getDoc(fromUserRef);

        if (!fromUserSnap.exists()) {
            console.error('삭제를 요청한 사용자를 찾을 수 없습니다:', fromUserId);
            return false;
        }

        const fromUser = fromUserSnap.data();

        // 알림 데이터 생성
        const notificationData = {
            type: 'friend_removed',
            title: '친구가 삭제되었습니다',
            message: `${fromUser.displayName || '사용자'}님이 친구 목록에서 삭제되었습니다.`,
            data: {
                fromUserId: fromUserId,
                fromUserName: fromUser.displayName || '사용자',
                fromUserEmail: fromUser.email
            },
            isRead: false,
            createdAt: Timestamp.now()
        };

        // 알림 저장 (users/{userId}/notifications 서브컬렉션에 저장)
        await addDoc(collection(db, 'users', toUserId, 'notifications'), notificationData);

        console.log('친구 삭제 알림 전송 완료:', notificationData);
        return true;

    } catch (error) {
        console.error('친구 삭제 알림 전송 실패:', error);
        return false;
    }
};

/**
 * 사용자에게 푸시 알림을 보냅니다 (FCM을 통한 실제 푸시 알림)
 * @param {string} userId - 알림을 받을 사용자 ID
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 * @param {Object} data - 추가 데이터
 * @returns {Promise<boolean>} 알림 전송 성공 여부
 */
const sendPushNotificationToUser = async (userId, title, message, data = {}) => {
    try {
        // Firebase Functions를 통해 FCM 푸시 알림 전송
        const functions = getFunctions(app, 'us-central1');
        const sendPushNotification = httpsCallable(functions, 'sendPushNotificationToUser');

        const result = await sendPushNotification({
            userId,
            title,
            message,
            data: {
                ...data,
                timestamp: Date.now().toString()
            }
        });

        if (result.data.success) {
            console.log('FCM 푸시 알림 전송 성공:', result.data);
            return true;
        } else {
            console.error('FCM 푸시 알림 전송 실패:', result.data);
            return false;
        }
    } catch (error) {
        console.error('푸시 알림 전송 실패:', error);
        // Fallback: 웹 환경에서는 로컬 알림 시도
        if (Capacitor.getPlatform() === 'web') {
            if (pushNotificationManager.isPushSupported() &&
                pushNotificationManager.getPermissionStatus() === 'granted') {
                try {
                    await pushNotificationManager.showLocalNotification(title, {
                        body: message,
                        icon: '/app_logo/logo.png',
                        badge: '/app_logo/logo.png',
                        tag: 'friend-notification',
                        requireInteraction: false
                    });
                    return true;
                } catch (fallbackError) {
                    console.error('로컬 알림 fallback 실패:', fallbackError);
                }
            }
        }
        return false;
    }
}; 