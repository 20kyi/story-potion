/**
 * 알림 서비스 유틸리티
 * 포인트 적립, 소설 구매 등의 알림을 생성하고 관리합니다.
 */

import { db } from '../firebase';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import pushNotificationManager from './pushNotification';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * 알림 생성
 * @param {string} userId - 알림을 받을 사용자 ID
 * @param {string} type - 알림 타입 ('point_earn', 'novel_purchase')
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 * @param {Object} data - 추가 데이터 (novelId, buyerName, amount 등)
 * @returns {Promise<boolean>} 알림 생성 성공 여부
 */
export const createNotification = async (userId, type, title, message, data = {}) => {
    try {
        const notificationData = {
            type,
            title,
            message,
            data,
            isRead: false,
            createdAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'users', userId, 'notifications'), notificationData);
        console.log('알림 생성 완료:', notificationData);
        return true;
    } catch (error) {
        console.error('알림 생성 실패:', error);
        return false;
    }
};

/**
 * 포인트 적립 알림 생성
 * @param {string} userId - 알림을 받을 사용자 ID
 * @param {number} amount - 적립된 포인트
 * @param {string} reason - 적립 사유
 * @returns {Promise<boolean>} 알림 생성 성공 여부
 */
export const createPointEarnNotification = async (userId, amount, reason) => {
    return await createNotification(
        userId,
        'point_earn',
        '포인트 적립',
        `${amount}포인트가 적립되었습니다. (${reason})`,
        { amount, reason }
    );
};

/**
 * 소설 구매 알림 생성 (소설 저자에게)
 * @param {string} authorId - 소설 저자 ID
 * @param {string} buyerId - 구매자 ID
 * @param {string} novelId - 소설 ID
 * @param {string} novelTitle - 소설 제목
 * @returns {Promise<boolean>} 알림 생성 성공 여부
 */
export const createNovelPurchaseNotification = async (authorId, buyerId, novelId, novelTitle) => {
    try {
        // 구매자 정보 조회
        const buyerDoc = await getDoc(doc(db, 'users', buyerId));
        const buyerName = buyerDoc.exists() 
            ? (buyerDoc.data().displayName || buyerDoc.data().nickname || buyerDoc.data().nick || '알 수 없는 사용자')
            : '알 수 없는 사용자';

        const title = '소설 구매 알림';
        const message = `${buyerName}님이 "${novelTitle}"을(를) 구매했습니다.`;

        const result = await createNotification(
            authorId,
            'novel_purchase',
            title,
            message,
            { buyerId, buyerName, novelId, novelTitle }
        );

        // 푸시 알림 전송 (사용자 설정 확인)
        const authorDoc = await getDoc(doc(db, 'users', authorId));
        if (authorDoc.exists() && authorDoc.data().friendEnabled) {
            await sendPushNotificationToUser(authorId, title, message);
        }

        return result;
    } catch (error) {
        console.error('소설 구매 알림 생성 실패:', error);
        return false;
    }
};

/**
 * 사용자에게 푸시 알림을 보냅니다
 * @param {string} userId - 알림을 받을 사용자 ID
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 * @returns {Promise<boolean>} 알림 전송 성공 여부
 */
const sendPushNotificationToUser = async (userId, title, message) => {
    try {
        // 웹 환경
        if (Capacitor.getPlatform() === 'web') {
            if (pushNotificationManager.isPushSupported() && 
                pushNotificationManager.getPermissionStatus() === 'granted') {
                await pushNotificationManager.showLocalNotification(title, {
                    body: message,
                    icon: '/app_logo/logo.png',
                    badge: '/app_logo/logo.png',
                    tag: 'novel-purchase-notification',
                    requireInteraction: false
                });
                return true;
            }
        } else {
            // 모바일 환경
            try {
                const permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive === 'granted') {
                    await LocalNotifications.schedule({
                        notifications: [{
                            title,
                            body: message,
                            id: Date.now(),
                            schedule: { at: new Date() },
                            sound: 'default',
                            attachments: undefined
                        }]
                    });
                    return true;
                }
            } catch (error) {
                console.error('모바일 알림 전송 실패:', error);
            }
        }
        
        return false;
    } catch (error) {
        console.error('푸시 알림 전송 실패:', error);
        return false;
    }
};

/**
 * 포션 선물 알림 생성 (포션을 받은 사용자에게)
 * @param {string} receiverId - 포션을 받은 사용자 ID
 * @param {string} giverId - 포션을 선물한 사용자 ID
 * @param {string} potionId - 포션 ID
 * @param {string} potionName - 포션 이름
 * @returns {Promise<boolean>} 알림 생성 성공 여부
 */
export const createPotionGiftNotification = async (receiverId, giverId, potionId, potionName) => {
    try {
        // 선물한 사용자 정보 조회
        const giverDoc = await getDoc(doc(db, 'users', giverId));
        const giverName = giverDoc.exists() 
            ? (giverDoc.data().displayName || giverDoc.data().nickname || giverDoc.data().nick || '친구')
            : '친구';

        return await createNotification(
            receiverId,
            'potion_gift',
            '포션 선물 받음',
            `${giverName}님이 ${potionName} 포션을 선물했습니다.`,
            { giverId, giverName, potionId, potionName }
        );
    } catch (error) {
        console.error('포션 선물 알림 생성 실패:', error);
        return false;
    }
};

