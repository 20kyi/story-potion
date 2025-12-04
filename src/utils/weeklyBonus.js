import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { createPointEarnNotification } from './notificationService';

// 해당 주의 시작일(월요일)과 끝일(일요일)을 계산
const getWeekRange = (date) => {
    // 원본 date 객체를 수정하지 않도록 복사
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);
    
    const day = dateCopy.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    // 월요일까지의 차이 계산
    const diff = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(dateCopy);
    monday.setDate(dateCopy.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

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

// 해당 주에 이미 보너스를 받았는지 확인
export const hasReceivedWeeklyBonus = async (userId, currentDate) => {
    try {
        const { monday, sunday } = getWeekRange(currentDate);
        
        const bonusHistoryRef = collection(db, 'users', userId, 'pointHistory');
        const bonusQuery = query(
            bonusHistoryRef,
            where('desc', '==', '일주일 연속 일기 작성 보너스'),
            where('createdAt', '>=', monday),
            where('createdAt', '<=', sunday)
        );

        const bonusSnapshot = await getDocs(bonusQuery);
        return !bonusSnapshot.empty;
    } catch (error) {
        console.error('보너스 수령 여부 확인 실패:', error);
        return false;
    }
};

// 특정 주의 완료 여부와 보너스 수령 여부 확인
export const checkWeekBonusStatus = async (userId, targetDate) => {
    try {
        const { monday, sunday } = getWeekRange(targetDate);
        const weekDates = getWeekDates(monday);
        const mondayStr = formatDateToString(monday);
        const sundayStr = formatDateToString(sunday);

        console.log('주간 보너스 상태 확인:', {
            targetDate: formatDateToString(targetDate),
            monday: mondayStr,
            sunday: sundayStr,
            weekDates
        });

        // 해당 주의 일기들을 조회 (범위 쿼리 사용)
        const diariesRef = collection(db, 'diaries');
        const weekQuery = query(
            diariesRef,
            where('userId', '==', userId),
            where('date', '>=', mondayStr),
            where('date', '<=', sundayStr)
        );

        const querySnapshot = await getDocs(weekQuery);
        const writtenDates = new Set();

        // 오늘이 속한 주인지 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = formatDateToString(today);
        const isCurrentWeek = weekDates.includes(todayStr);

        querySnapshot.forEach(doc => {
            const diary = doc.data();
            const diaryDate = diary.date;
            
            // 해당 주의 날짜 범위에 포함되는지 확인
            if (weekDates.includes(diaryDate)) {
                if (isCurrentWeek) {
                    // 현재 주인 경우: createdAt이 해당 날짜인지 확인 (당일 작성된 일기만)
                    const createdAt = diary.createdAt?.toDate?.() || new Date(diary.createdAt);
                    const createdAtStr = formatDateToString(createdAt);
                    
                    if (createdAtStr === diaryDate) {
                        writtenDates.add(diaryDate);
                    }
                } else {
                    // 지난 주이거나 과거 주인 경우: date 필드만 확인
                    writtenDates.add(diaryDate);
                }
            }
        });

        console.log('일기 작성 현황:', {
            totalDiaries: querySnapshot.size,
            writtenDates: Array.from(writtenDates).sort(),
            weekDates,
            count: writtenDates.size
        });

        const isCompleted = writtenDates.size === 7;

        // 이미 보너스를 받았는지 확인
        let hasReceived = false;
        try {
            const bonusHistoryRef = collection(db, 'users', userId, 'pointHistory');
            // desc만으로 먼저 필터링하고, 클라이언트에서 날짜 범위 확인
            const bonusQuery = query(
                bonusHistoryRef,
                where('desc', '==', '일주일 연속 일기 작성 보너스')
            );

            const bonusSnapshot = await getDocs(bonusQuery);
            
            // 클라이언트에서 날짜 범위 확인
            bonusSnapshot.forEach(doc => {
                const history = doc.data();
                const historyDate = history.createdAt?.toDate?.() || new Date(history.createdAt);
                if (historyDate >= monday && historyDate <= sunday) {
                    hasReceived = true;
                }
            });
        } catch (error) {
            console.error('보너스 수령 여부 확인 실패:', error);
            // 인덱스 오류 등으로 실패해도 계속 진행
            hasReceived = false;
        }

        const result = {
            isCompleted,
            hasReceived,
            canClaim: isCompleted && !hasReceived,
            count: writtenDates.size,
            total: 7
        };

        console.log('보너스 상태 결과:', result);
        return result;
    } catch (error) {
        console.error('주간 보너스 상태 확인 실패:', error);
        return {
            isCompleted: false,
            hasReceived: false,
            canClaim: false,
            count: 0,
            total: 7
        };
    }
};

// 지난 주 보너스 상태 확인
export const checkLastWeekBonusStatus = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 현재 주의 월요일 계산
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const currentWeekMonday = new Date(today);
        currentWeekMonday.setDate(today.getDate() + diffToMonday);
        currentWeekMonday.setHours(0, 0, 0, 0);
        
        // 지난 주의 일요일 계산 (현재 주 월요일 - 1일)
        const lastWeekSunday = new Date(currentWeekMonday);
        lastWeekSunday.setDate(currentWeekMonday.getDate() - 1);
        lastWeekSunday.setHours(23, 59, 59, 999);
        
        console.log('지난 주 보너스 확인:', {
            today: formatDateToString(today),
            dayOfWeek,
            currentWeekMonday: formatDateToString(currentWeekMonday),
            lastWeekSunday: formatDateToString(lastWeekSunday)
        });
        
        const result = await checkWeekBonusStatus(userId, lastWeekSunday);
        console.log('지난 주 보너스 결과:', result);
        return result;
    } catch (error) {
        console.error('지난 주 보너스 상태 확인 실패:', error);
        return {
            isCompleted: false,
            hasReceived: false,
            canClaim: false,
            count: 0,
            total: 7
        };
    }
};

// 수동으로 일주일 연속 일기 작성 보너스 포인트 받기
export const claimWeeklyBonus = async (userId, targetDate) => {
    try {
        const { monday, sunday } = getWeekRange(targetDate);
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

            // 날짜가 같고, 작성일이 해당 날짜인 경우만 카운트
            if (formatDateToString(createdAt) === diary.date) {
                writtenDates.add(diary.date);
            }
        });

        // 7일 모두 작성되었는지 확인
        if (writtenDates.size !== 7) {
            throw new Error('7일 모두 작성하지 않았습니다.');
        }

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
            throw new Error('이미 보너스를 받았습니다.');
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
        return { success: true, amount: 10 };
    } catch (error) {
        console.error('일주일 연속 일기 작성 보너스 지급 실패:', error);
        throw error;
    }
}; 