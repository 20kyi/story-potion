/**
 * 포션 선물 시스템 유틸리티
 * 
 * 주요 기능:
 * - 친구에게 포션 선물하기
 * - 포션 선물 내역 조회
 */

import { db } from '../firebase';
import {
    doc,
    getDoc,
    updateDoc,
    increment,
    addDoc,
    collection,
    Timestamp
} from 'firebase/firestore';
import { createPotionGiftNotification } from './notificationService';

/**
 * 친구에게 포션 선물하기
 * @param {string} fromUserId - 선물을 보내는 사용자 ID
 * @param {string} toUserId - 선물을 받는 사용자 ID
 * @param {string} potionId - 선물할 포션 ID (romance, historical, mystery, horror, fairytale, fantasy)
 * @param {string} potionName - 선물할 포션 이름 (표시용)
 * @returns {Promise<Object>} 선물 결과
 */
export const giftPotionToFriend = async (fromUserId, toUserId, potionId, potionName) => {
    try {
        // 1. 보내는 사람의 포션 확인
        const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
        if (!fromUserDoc.exists()) {
            return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
        }

        const fromUserData = fromUserDoc.data();
        const fromUserPotions = fromUserData.potions || {};
        const fromUserPotionCount = fromUserPotions[potionId] || 0;

        if (fromUserPotionCount <= 0) {
            return { success: false, error: `보유한 ${potionName} 포션이 없습니다.` };
        }

        // 2. 받는 사람 정보 확인
        const toUserDoc = await getDoc(doc(db, 'users', toUserId));
        if (!toUserDoc.exists()) {
            return { success: false, error: '친구 정보를 찾을 수 없습니다.' };
        }

        const toUserPotions = toUserDoc.data().potions || {};

        // 3. 보내는 사람의 포션 차감
        const newFromUserPotions = { ...fromUserPotions };
        newFromUserPotions[potionId] = Math.max(0, newFromUserPotions[potionId] - 1);

        await updateDoc(doc(db, 'users', fromUserId), {
            potions: newFromUserPotions
        });

        // 4. 받는 사람의 포션 추가
        const newToUserPotions = { ...toUserPotions };
        newToUserPotions[potionId] = (newToUserPotions[potionId] || 0) + 1;

        await updateDoc(doc(db, 'users', toUserId), {
            potions: newToUserPotions
        });

        // 5. 선물 내역 기록 (선택 사항 - 받는 사람의 포인트 히스토리에 기록)
        try {
            await addDoc(collection(db, 'users', toUserId, 'pointHistory'), {
                type: 'gift',
                amount: 0,
                desc: `${fromUserData.displayName || '친구'}님에게서 ${potionName} 포션을 받았습니다`,
                fromUserId: fromUserId,
                fromUserName: fromUserData.displayName || '친구',
                potionId: potionId,
                potionName: potionName,
                createdAt: Timestamp.now()
            });

            // 보내는 사람의 히스토리에도 기록 (선택 사항)
            await addDoc(collection(db, 'users', fromUserId, 'pointHistory'), {
                type: 'gift',
                amount: 0,
                desc: `${toUserDoc.data().displayName || '친구'}님에게 ${potionName} 포션을 선물했습니다`,
                toUserId: toUserId,
                toUserName: toUserDoc.data().displayName || '친구',
                potionId: potionId,
                potionName: potionName,
                createdAt: Timestamp.now()
            });
        } catch (historyError) {
            // 히스토리 기록 실패는 무시 (선물 자체는 성공)
            console.warn('선물 내역 기록 실패:', historyError);
        }

        // 6. 포션 선물 알림 생성 (받는 사람에게)
        try {
            await createPotionGiftNotification(toUserId, fromUserId, potionId, potionName);
        } catch (notificationError) {
            // 알림 생성 실패는 무시 (선물 자체는 성공)
            console.warn('포션 선물 알림 생성 실패:', notificationError);
        }

        return {
            success: true,
            message: `${potionName} 포션을 선물했습니다.`
        };
    } catch (error) {
        console.error('포션 선물 실패:', error);
        return { success: false, error: '포션 선물에 실패했습니다.' };
    }
};

/**
 * 포션 ID를 포션 이름으로 변환
 * @param {string} potionId - 포션 ID
 * @returns {string} 포션 이름
 */
export const getPotionName = (potionId) => {
    const potionNames = {
        'romance': '로맨스',
        'historical': '역사',
        'mystery': '추리',
        'horror': '공포',
        'fairytale': '동화',
        'fantasy': '판타지'
    };
    return potionNames[potionId] || potionId;
};

