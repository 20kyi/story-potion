import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { createPointEarnNotification } from './notificationService';

// 해당 주의 시작일(월요일)과 끝일(일요일)을 계산
const getWeekRange = (date) => {
    const day = date.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 월요일을 1로 맞춤

    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { monday, sunday };
};

// 날짜를 YYYY-MM-DD 형식으로 변환
const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 해당 주의 모든 날짜 배열 생성 (월~일)
const getWeekDates = (monday) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(formatDateToString(date));
    }
    return dates;
};

// 일주일 연속 일기 작성 보너스 체크 및 지급
export const checkWeeklyBonus = async (userId, currentDate) => {
    try {
        // 현재 날짜가 일요일인지 확인
        if (currentDate.getDay() !== 0) {
            return; // 일요일이 아니면 보너스 지급하지 않음
        }

        const { monday, sunday } = getWeekRange(currentDate);
        const weekDates = getWeekDates(monday);

        // 해당 주의 일기들을 조회
        const diariesRef = collection(db, 'diaries');
        const weekQuery = query(
            diariesRef,
            where('userId', '==', userId),
            where('date', 'in', weekDates)
        );

        const querySnapshot = await getDocs(weekQuery);
        const writtenDates = new Set();

        querySnapshot.forEach(doc => {
            const diary = doc.data();
            // 당일 작성된 일기만 카운트 (createdAt이 해당 날짜인지 확인)
            const createdAt = diary.createdAt?.toDate?.() || new Date(diary.createdAt);
            const diaryDate = new Date(diary.date);

            // 날짜가 같고, 작성일이 해당 날짜인 경우만 카운트
            if (formatDateToString(createdAt) === diary.date) {
                writtenDates.add(diary.date);
            }
        });

        // 7일 모두 작성되었는지 확인
        if (writtenDates.size === 7) {
            // 이미 보너스를 받았는지 확인 (중복 지급 방지)
            const bonusHistoryRef = collection(db, 'users', userId, 'pointHistory');
            const bonusQuery = query(
                bonusHistoryRef,
                where('desc', '==', '일주일 연속 일기 작성 보너스'),
                where('createdAt', '>=', monday),
                where('createdAt', '<=', sunday)
            );

            const bonusSnapshot = await getDocs(bonusQuery);
            if (!bonusSnapshot.empty) {
                return; // 이미 보너스를 받았음
            }

            // 보너스 지급
            await updateDoc(doc(db, 'users', userId), {
                point: increment(10)
            });

            await addDoc(collection(db, 'users', userId, 'pointHistory'), {
                type: 'earn',
                amount: 10,
                desc: '일주일 연속 일기 작성 보너스',
                createdAt: new Date()
            });
            // 포인트 적립 알림 생성
            await createPointEarnNotification(userId, 10, '일주일 연속 일기 작성 보너스');

            console.log('일주일 연속 일기 작성 보너스 지급 완료');
        }
    } catch (error) {
        console.error('일주일 연속 일기 작성 보너스 체크 실패:', error);
    }
};

// 해당 주의 일기 작성 현황 조회 (UI용)
export const getWeeklyDiaryStatus = async (userId, currentDate) => {
    try {
        const { monday } = getWeekRange(currentDate);
        const weekDates = getWeekDates(monday);

        const diariesRef = collection(db, 'diaries');
        const weekQuery = query(
            diariesRef,
            where('userId', '==', userId),
            where('date', 'in', weekDates)
        );

        const querySnapshot = await getDocs(weekQuery);
        const writtenDates = new Set();

        querySnapshot.forEach(doc => {
            const diary = doc.data();
            const createdAt = diary.createdAt?.toDate?.() || new Date(diary.createdAt);

            // 당일 작성된 일기만 카운트
            if (formatDateToString(createdAt) === diary.date) {
                writtenDates.add(diary.date);
            }
        });

        // 각 요일별 작성 여부 반환
        const weekStatus = weekDates.map(date => ({
            date,
            isWritten: writtenDates.has(date),
            dayName: ['월', '화', '수', '목', '금', '토', '일'][weekDates.indexOf(date)]
        }));

        return {
            weekStatus,
            totalWritten: writtenDates.size,
            totalDays: 7
        };
    } catch (error) {
        console.error('주간 일기 현황 조회 실패:', error);
        return {
            weekStatus: [],
            totalWritten: 0,
            totalDays: 7
        };
    }
}; 