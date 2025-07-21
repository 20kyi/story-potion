/**
 * 친구 요청 알림 시스템
 * 
 * 친구 요청을 받았을 때 푸시 알림을 보내는 기능
 */

import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';

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
            userId: toUserId,
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

        // 알림 저장
        await addDoc(collection(db, 'notifications'), notificationData);

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
            userId: toUserId,
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

        // 알림 저장
        await addDoc(collection(db, 'notifications'), notificationData);

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
            userId: toUserId,
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

        // 알림 저장
        await addDoc(collection(db, 'notifications'), notificationData);

        console.log('친구 삭제 알림 전송 완료:', notificationData);
        return true;

    } catch (error) {
        console.error('친구 삭제 알림 전송 실패:', error);
        return false;
    }
}; 