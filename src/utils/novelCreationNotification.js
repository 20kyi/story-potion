/**
 * 소설 생성 알림 유틸리티
 * 소설을 생성할 수 있는 주가 있는지 확인하고 푸시 알림을 보냅니다.
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import pushNotificationManager from './pushNotification';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * 한 달의 주차 정보를 가져옵니다
 */
const getWeeksInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks = [];
    let currentWeekStart = new Date(firstDay);

    // 첫 주의 시작일을 월요일로 맞춤
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(firstDay.getDate() - daysToMonday);

    let weekNum = 1;
    while (currentWeekStart <= lastDay) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);

        // 주의 시작일이 해당 월의 마지막 날보다 작거나 같으면 포함
        if (currentWeekStart <= lastDay) {
            weeks.push({
                weekNum,
                start: new Date(currentWeekStart),
                end: weekEnd > lastDay ? new Date(lastDay) : new Date(weekEnd)
            });
            weekNum++;
        }

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * 사용자의 일기를 가져옵니다
 */
const getUserDiaries = async (userId, year, month) => {
    try {
        const diariesRef = collection(db, 'users', userId, 'diaries');
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        const q = query(
            diariesRef,
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('일기 조회 실패:', error);
        return [];
    }
};

/**
 * 사용자의 소설을 가져옵니다
 */
const getUserNovels = async (userId, year, month) => {
    try {
        const novelsRef = collection(db, 'novels');
        const q = query(
            novelsRef,
            where('userId', '==', userId),
            where('year', '==', year),
            where('month', '==', month),
            where('deleted', '!=', true)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('소설 조회 실패:', error);
        return [];
    }
};

/**
 * 주차별 진행률을 계산합니다
 */
const calculateWeeklyProgress = (diaries, weeks) => {
    const progress = {};

    weeks.forEach(week => {
        const weekStartStr = formatDate(week.start);
        const weekEndStr = formatDate(week.end);

        const weekDiaries = diaries.filter(diary => {
            return diary.date >= weekStartStr && diary.date <= weekEndStr;
        });

        const weekDateCount = 7;
        const weekProgress = Math.min(100, (weekDiaries.length / weekDateCount) * 100);
        progress[week.weekNum] = weekProgress;
    });

    return progress;
};

/**
 * 소설을 생성할 수 있는 주가 있는지 확인합니다
 */
export const checkNovelCreationAvailable = async (userId) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // 이번 달과 지난 달 확인
        const monthsToCheck = [
            { year, month },
            { year: month === 1 ? year - 1 : year, month: month === 1 ? 12 : month - 1 }
        ];

        for (const { year: checkYear, month: checkMonth } of monthsToCheck) {
            const weeks = getWeeksInMonth(checkYear, checkMonth - 1);
            const diaries = await getUserDiaries(userId, checkYear, checkMonth);
            const novels = await getUserNovels(userId, checkYear, checkMonth);
            const weeklyProgress = calculateWeeklyProgress(diaries, weeks);

            // 소설을 생성할 수 있는 주 찾기
            for (const week of weeks) {
                const progress = weeklyProgress[week.weekNum] || 0;

                // 진행률이 100%이고, 아직 소설이 생성되지 않은 주 찾기
                if (progress >= 100) {
                    const weekKey = `${checkYear}년 ${checkMonth}월 ${week.weekNum}주차`;
                    const novelsForWeek = novels.filter(novel => {
                        const novelWeek = novel.week || '';
                        return novelWeek.includes(`${checkMonth}월 ${week.weekNum}주차`);
                    });

                    // 모든 장르의 소설이 생성되지 않은 경우
                    const allGenres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
                    const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);
                    const hasAvailableGenre = !allGenres.every(genre => existingGenres.includes(genre));

                    if (hasAvailableGenre) {
                        return {
                            available: true,
                            week: weekKey,
                            weekNum: week.weekNum,
                            year: checkYear,
                            month: checkMonth
                        };
                    }
                }
            }
        }

        return { available: false };
    } catch (error) {
        console.error('소설 생성 가능 여부 확인 실패:', error);
        return { available: false };
    }
};

/**
 * 소설 생성 알림을 보냅니다 (FCM을 통한 실제 푸시 알림)
 */
export const sendNovelCreationNotification = async (userId, weekInfo) => {
    try {
        // 사용자 알림 설정 확인
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            return false;
        }

        const userData = userDocSnap.data();

        // 소설 생성 알림이 활성화되어 있는지 확인
        if (!userData.novelCreationEnabled) {
            return false;
        }

        const title = '소설을 생성할 수 있어요! 📖';
        const message = `${weekInfo.week}에 소설을 만들어보세요!`;

        // Firebase Functions를 통해 FCM 푸시 알림 전송
        try {
            const functions = getFunctions(undefined, 'us-central1');
            const sendPushNotification = httpsCallable(functions, 'sendPushNotificationToUser');

            const result = await sendPushNotification({
                userId,
                title,
                message,
                data: {
                    type: 'novel_creation',
                    week: weekInfo.week,
                    weekNum: weekInfo.weekNum,
                    year: weekInfo.year,
                    month: weekInfo.month,
                    timestamp: Date.now().toString()
                }
            });

            if (result.data.success) {
                console.log('소설 생성 FCM 푸시 알림 전송 성공:', result.data);
                return true;
            } else {
                console.error('소설 생성 FCM 푸시 알림 전송 실패:', result.data);
            }
        } catch (fcmError) {
            console.error('FCM 푸시 알림 전송 실패, fallback 시도:', fcmError);

            // Fallback: 웹 환경에서는 로컬 알림 시도
            if (Capacitor.getPlatform() === 'web') {
                if (pushNotificationManager.isPushSupported() &&
                    pushNotificationManager.getPermissionStatus() === 'granted') {
                    await pushNotificationManager.showLocalNotification(title, {
                        body: message,
                        icon: '/app_logo/logo.png',
                        badge: '/app_logo/logo.png',
                        tag: 'novel-creation-notification',
                        requireInteraction: false
                    });
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('소설 생성 알림 전송 실패:', error);
        return false;
    }
};

/**
 * 소설 생성 알림을 스케줄링합니다
 * 매일 지정된 시간에 소설 생성 가능 여부를 확인하고 알림을 보냅니다
 */
export const scheduleNovelCreationNotification = async (userId, notificationTime = '21:00') => {
    try {
        // 알림 시간 파싱
        const [hours, minutes] = notificationTime.split(':').map(Number);

        // 오늘 알림 시간 계산
        const now = new Date();
        const notificationDate = new Date();
        notificationDate.setHours(hours, minutes, 0, 0);

        // 이미 지난 시간이면 내일로 설정
        if (notificationDate <= now) {
            notificationDate.setDate(notificationDate.getDate() + 1);
        }

        // 소설 생성 가능 여부 확인
        const result = await checkNovelCreationAvailable(userId);

        if (result.available) {
            // 알림 예약
            const delay = notificationDate.getTime() - now.getTime();

            setTimeout(async () => {
                await sendNovelCreationNotification(userId, result);
            }, delay);

            console.log(`소설 생성 알림이 ${notificationDate.toLocaleString()}에 예약되었습니다.`);
        }
    } catch (error) {
        console.error('소설 생성 알림 스케줄링 실패:', error);
    }
};

