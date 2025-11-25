import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 월간 프리미엄 구독 갱신일 확인 및 자동 갱신
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} - 갱신이 발생했는지 여부
 */
export const checkAndRenewMonthlyPremium = async (userId) => {
    try {
        if (!userId) {
            console.log('사용자 ID가 없습니다.');
            return false;
        }

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            console.log('사용자 문서가 존재하지 않습니다.');
            return false;
        }

        const userData = userDoc.data();

        // 월간 프리미엄 회원이 아니면 갱신하지 않음
        if (!userData.isMonthlyPremium) {
            return false;
        }

        // premiumCancelled가 true이고 갱신일이 지났으면 해지 처리
        if (userData.premiumCancelled === true) {
            // 갱신일이 지났는지 확인
            let renewalDate;
            if (userData.premiumRenewalDate.seconds) {
                renewalDate = new Date(userData.premiumRenewalDate.seconds * 1000);
            } else if (userData.premiumRenewalDate.toDate) {
                renewalDate = userData.premiumRenewalDate.toDate();
            } else {
                renewalDate = new Date(userData.premiumRenewalDate);
            }

            const now = new Date();
            // 갱신일이 지났으면 실제 해지 처리
            if (renewalDate <= now) {
                await updateDoc(userRef, {
                    isMonthlyPremium: false,
                    isYearlyPremium: false,
                    premiumType: null,
                    premiumStartDate: null,
                    premiumRenewalDate: null,
                    premiumFreeNovelCount: 0,
                    updatedAt: new Date()
                });
                return false;
            }
            // 갱신일이 아직 지나지 않았으면 구독 유지 (해지일까지 혜택 제공)
        }

        // premiumRenewalDate 확인
        if (!userData.premiumRenewalDate) {
            console.log('갱신일 정보가 없습니다.');
            return false;
        }

        // 갱신일을 Date 객체로 변환
        let renewalDate;
        if (userData.premiumRenewalDate.seconds) {
            renewalDate = new Date(userData.premiumRenewalDate.seconds * 1000);
        } else if (userData.premiumRenewalDate.toDate) {
            renewalDate = userData.premiumRenewalDate.toDate();
        } else {
            renewalDate = new Date(userData.premiumRenewalDate);
        }

        const now = new Date();

        // 갱신일이 지났는지 확인
        if (renewalDate <= now) {
            // 다음 갱신일 계산 (1개월 후)
            const nextRenewalDate = new Date(renewalDate);
            nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);

            // 갱신일 업데이트
            await updateDoc(userRef, {
                premiumRenewalDate: nextRenewalDate,
                premiumStartDate: now,
                updatedAt: new Date()
            });

            console.log('월간 프리미엄 자동 갱신 완료:', {
                userId,
                previousRenewalDate: renewalDate.toISOString(),
                nextRenewalDate: nextRenewalDate.toISOString()
            });

            return true;
        }

        return false;
    } catch (error) {
        console.error('월간 프리미엄 갱신 확인 중 오류:', error);
        return false;
    }
};

