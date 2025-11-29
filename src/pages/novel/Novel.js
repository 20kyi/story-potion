import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createNovelUrl } from '../../utils/novelUtils';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import { useLanguage, useTranslation } from '../../LanguageContext';
import { useTheme } from '../../ThemeContext';
import GridIcon from '../../components/icons/GridIcon';
import ListIcon from '../../components/icons/ListIcon';
import { inAppPurchaseService } from '../../utils/inAppPurchase';
import './Novel.css';

// Helper functions for dynamic styles
const getDayIndicatorBackground = (hasDiary, barColor, theme, isCompleted) => {
    const themeMode = theme?.mode || 'light';
    if (!hasDiary) {
        if (barColor === 'fill') return themeMode === 'dark' ? '#4A4A4A' : '#E5E5E5';
        return themeMode === 'dark' ? '#3A3A3A' : '#E5E5E5';
    }
    if (isCompleted && hasDiary) {
        return 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)';
    }
    if (barColor === 'fill') return themeMode === 'dark' ? '#BFBFBF' : '#868E96';
    if (barColor === 'create') return themeMode === 'dark' ? '#FFB3B3' : '#e07e7e';
    if (barColor === 'free') return '#e4a30d';
    if (barColor === 'view') {
        const primaryColor = theme?.primary;
        if (primaryColor) return primaryColor;
        return '#cb6565';
    }
    return hasDiary ? (themeMode === 'dark' ? '#FFB3B3' : '#e07e7e') : (themeMode === 'dark' ? '#3A3A3A' : '#E5E5E5');
};

const getCreateButtonStyle = (children, completed, theme, isFree, disabled, isListMode) => {
    const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));
    const style = {
        width: isListMode ? '130px' : '100%',
        minWidth: isListMode ? '130px' : 'auto',
        margin: 0,
        marginTop: isListMode ? '0' : '2px',
        padding: isListMode ? '6px 12px' : '8px',
        fontSize: isListMode ? '11px' : '12px',
        whiteSpace: 'nowrap',
        borderRadius: '10px',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: childrenStr.includes('다른 장르') ? 'opacity 0.2s ease, color 0.2s ease, border-color 0.2s ease' : 'all 0.2s ease',
        overflow: 'visible',
        boxShadow: children === '소설 보기' ? '0 2px 8px rgba(228,98,98,0.08)' : 'none'
    };

    if (disabled) {
        style.background = theme.mode === 'dark' ? '#2A2A2A' : '#E5E5E5';
        style.color = theme.mode === 'dark' ? '#666666' : '#999999';
        style.border = theme.mode === 'dark' ? '2px solid #3A3A3A' : '2px solid #CCCCCC';
    } else if (isFree) {
        style.background = 'transparent';
        style.color = '#e4a30d';
        style.border = '2px solid #e4a30d';
    } else if (childrenStr.includes('PREMIUM')) {
        style.background = theme.premiumBannerBg || 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)';
        style.color = theme.premiumBannerText || '#8B4513';
        style.border = 'none';
    } else if (children === '일기 채우기') {
        style.background = theme.mode === 'dark' ? '#3A3A3A' : '#F5F6FA';
        style.color = theme.mode === 'dark' ? '#BFBFBF' : '#868E96';
        style.border = theme.mode === 'dark' ? '2px solid #BFBFBF' : '2px solid #868E96';
    } else if (childrenStr.includes('다른 장르')) {
        style.background = 'transparent';
        style.color = '#C99A9A';
        style.border = '2px solid #C99A9A';
    } else if (children === 'AI 소설 쓰기' || children === '완성 ✨') {
        style.background = theme.mode === 'dark' ? '#3A3A3A' : '#f5f5f5';
        style.color = theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e';
        style.border = theme.mode === 'dark' ? '2px solid #FFB3B3' : '2px solid #e07e7e';
    } else if (children === '소설 보기') {
        style.background = theme.primary;
        style.color = '#fff';
        style.border = 'none';
    } else {
        style.background = theme.primary;
        style.color = '#fff';
        style.border = 'none';
    }

    return style;
};

const getWeeklyCardTransform = (isDiaryTheme, index) => {
    if (!isDiaryTheme) return 'none';
    const rotations = [0.2, -0.3, 0.1, -0.2, 0.3, -0.1];
    return `rotate(${rotations[index % rotations.length] || 0}deg)`;
};

const Novel = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const toast = useToast();
    const theme = useTheme();
    const { actualTheme } = useTheme();
    const isDiaryTheme = actualTheme === 'diary';
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weeks, setWeeks] = useState([]);
    const [weeklyProgress, setWeeklyProgress] = useState({});
    const [monthProgress, setMonthProgress] = useState(0);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const [diaries, setDiaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [novelsMap, setNovelsMap] = useState({});
    const [selectedWeekNovels, setSelectedWeekNovels] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [ownedPotions, setOwnedPotions] = useState({});
    const [showCreateOptionModal, setShowCreateOptionModal] = useState(false);
    const [selectedWeekForCreate, setSelectedWeekForCreate] = useState(null);
    const [myNovels, setMyNovels] = useState([]);
    const [purchasedNovels, setPurchasedNovels] = useState([]);
    const weekRefs = useRef({});
    const [showCurrentWeekDiaryModal, setShowCurrentWeekDiaryModal] = useState(false);
    const [currentWeekDiaries, setCurrentWeekDiaries] = useState([]);
    const [currentWeekDiariesForProgress, setCurrentWeekDiariesForProgress] = useState([]);
    const progressSectionRef = useRef(null);
    const [weeklyViewMode, setWeeklyViewMode] = useState(() => {
        const saved = localStorage.getItem('novel_weekly_view_mode');
        return saved || 'card'; // 'card' or 'list'
    });



    useEffect(() => {
        localStorage.setItem('novel_weekly_view_mode', weeklyViewMode);
    }, [weeklyViewMode]);

    // 상단 CTA 카드용 현재 주의 일기 가져오기 (항상 현재 날짜 기준)
    useEffect(() => {
        if (!user) {
            setCurrentWeekDiariesForProgress([]);
            return;
        }

        const fetchCurrentWeek = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 현재 주의 시작일과 종료일 계산
            const dayOfWeek = today.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일까지의 차이
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            // formatDate 함수 사용 (컴포넌트 내부에 정의되어 있음)
            const formatDateForQuery = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const weekStartStr = formatDateForQuery(weekStart);
            const weekEndStr = formatDateForQuery(weekEnd);

            try {
                const diariesRef = collection(db, 'diaries');
                const diariesQuery = query(diariesRef,
                    where('userId', '==', user.uid),
                    where('date', '>=', weekStartStr),
                    where('date', '<=', weekEndStr),
                    orderBy('date')
                );
                const diarySnapshot = await getDocs(diariesQuery);
                const fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
                setCurrentWeekDiariesForProgress(fetchedDiaries);
            } catch (error) {
                setCurrentWeekDiariesForProgress([]);
            }
        };

        fetchCurrentWeek();
    }, [user]);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        };

        const fetchAllData = async () => {
            setIsLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // 표시되는 월의 주차 정보를 먼저 가져옴
            const monthWeeks = getWeeksInMonth(year, month);

            // 주차 정보가 없으면 데이터를 불러오지 않음
            if (monthWeeks.length === 0) {
                setDiaries([]);
                setNovelsMap({});
                calculateAllProgress(year, month, []);
                setIsLoading(false);
                return;
            }

            // 표시되는 모든 주차를 포함하는 날짜 범위 설정
            // 표시되는 모든 주차를 포함하는 날짜 범위 설정
            const startDate = monthWeeks[0].start;
            const endDate = monthWeeks[monthWeeks.length - 1].end;

            // 1. 확장된 날짜 범위로 일기 가져오기
            const diariesRef = collection(db, 'diaries');
            const diariesQuery = query(diariesRef,
                where('userId', '==', user.uid),
                where('date', '>=', formatDate(startDate)),
                where('date', '<=', formatDate(endDate)),
                orderBy('date')
            );

            let fetchedDiaries = [];
            try {
                const diarySnapshot = await getDocs(diariesQuery);
                fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
                setDiaries(fetchedDiaries);
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
            }

            // 2. Fetch all Novels for the user to create a map
            const novelsRef = collection(db, 'novels');
            const novelsQuery = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            try {
                const novelSnapshot = await getDocs(novelsQuery);
                const newNovelsMap = {};
                const allMyNovels = [];
                novelSnapshot.forEach(doc => {
                    const novel = doc.data();
                    // 삭제되지 않은 소설만 추가
                    if (novel.deleted !== true) {
                        allMyNovels.push({ id: doc.id, ...novel });
                    }
                    // year, month, weekNum이 모두 있고 삭제되지 않은 경우에만 맵에 추가
                    if (novel.year && novel.month && novel.weekNum && novel.deleted !== true) {
                        const weekKey = `${novel.year}년 ${novel.month}월 ${novel.weekNum}주차`;
                        // 같은 주차에 여러 소설이 있을 수 있으므로 배열로 저장
                        if (!newNovelsMap[weekKey]) {
                            newNovelsMap[weekKey] = [];
                        }
                        newNovelsMap[weekKey].push({ id: doc.id, ...novel });
                    }
                });

                // 같은 주차, 같은 장르의 소설이 여러 개 있을 때 최신 것만 유지
                Object.keys(newNovelsMap).forEach(weekKey => {
                    const novels = newNovelsMap[weekKey];
                    // 장르별로 그룹화
                    const novelsByGenre = {};
                    novels.forEach(novel => {
                        const genreKey = novel.genre || 'default';
                        if (!novelsByGenre[genreKey]) {
                            novelsByGenre[genreKey] = [];
                        }
                        novelsByGenre[genreKey].push(novel);
                    });
                    // 각 장르별로 최신 것만 유지 (이미 createdAt desc로 정렬되어 있음)
                    const filteredNovels = Object.values(novelsByGenre).map(genreNovels => {
                        // createdAt 기준으로 정렬 (최신순)
                        return genreNovels.sort((a, b) => {
                            const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
                            const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
                            return bTime - aTime;
                        })[0]; // 가장 최신 것만
                    });
                    newNovelsMap[weekKey] = filteredNovels;
                });
                setNovelsMap(newNovelsMap);
                // 최근 5개만 표시
                setMyNovels(allMyNovels.slice(0, 5));
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
            }

            // 3. Fetch purchased novels
            try {
                const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                const viewedSnapshot = await getDocs(viewedNovelsRef);

                if (viewedSnapshot.empty) {
                    setPurchasedNovels([]);
                } else {
                    // viewedNovels 문서에서 novelId와 viewedAt 정보 추출
                    // 문서 ID가 novelId입니다
                    const viewedNovelsData = viewedSnapshot.docs.map(doc => ({
                        novelId: doc.id,
                        viewedAt: doc.data().viewedAt || doc.data().createdAt || null
                    }));

                    // novelId로 novels 컬렉션에서 데이터 fetch
                    const novelsRef = collection(db, 'novels');
                    const novelDocs = await Promise.all(
                        viewedNovelsData.map(item => getDoc(doc(novelsRef, item.novelId)))
                    );

                    let purchased = novelDocs
                        .map((snap, idx) => {
                            if (!snap.exists()) return null;
                            const novelData = snap.data();
                            // 삭제되지 않고 공개된 소설만 추가
                            if (novelData.deleted === true || novelData.isPublic === false) {
                                return null;
                            }
                            return {
                                ...novelData,
                                id: snap.id,
                                purchasedAt: viewedNovelsData[idx].viewedAt
                            };
                        })
                        .filter(novel => novel !== null);

                    // 구매일 기준 최신순 정렬
                    purchased = purchased.sort((a, b) => {
                        const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                        const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                        return bDate - aDate;
                    });

                    // 각 소설의 userId로 닉네임/아이디 조회
                    const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
                    const userDocs = await Promise.all(
                        ownerIds.map(uid => getDoc(doc(db, 'users', uid)))
                    );
                    const ownerMap = {};
                    userDocs.forEach((snap, idx) => {
                        if (snap.exists()) {
                            const data = snap.data();
                            ownerMap[ownerIds[idx]] = data.nickname || data.nick || data.displayName || ownerIds[idx];
                        } else {
                            ownerMap[ownerIds[idx]] = ownerIds[idx];
                        }
                    });

                    // novel에 ownerName 필드 추가
                    purchased = purchased.map(novel => ({
                        ...novel,
                        ownerName: ownerMap[novel.userId] || novel.userId
                    }));

                    // 최근 5개만 표시
                    setPurchasedNovels(purchased.slice(0, 5));
                }
            } catch (error) {
                console.error('구매한 소설 목록 가져오기 실패:', error);
                setPurchasedNovels([]);
            }

            // 4. Fetch premium free novel status and potions
            try {
                // 구독 상태 동기화
                try {
                    await inAppPurchaseService.syncSubscriptionStatus(user.uid);
                } catch (syncError) {
                    console.error('구독 상태 동기화 실패:', syncError);
                }

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const isPremiumUser = userData.isMonthlyPremium || userData.isYearlyPremium || false;
                    setIsPremium(isPremiumUser);
                    setOwnedPotions(userData.potions || {});

                }
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
                console.error('프리미엄 무료권 상태 조회 실패:', error);
            }

            // 5. Calculate progress
            calculateAllProgress(year, month, fetchedDiaries);
            setIsLoading(false);
        };

        fetchAllData();
    }, [user, currentDate]);


    // location state에서 소설 삭제 알림을 받으면 데이터 다시 가져오기
    useEffect(() => {
        if (location.state?.novelDeleted && user) {
            const fetchAllData = async () => {
                setIsLoading(true);
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();

                // 표시되는 월의 주차 정보를 먼저 가져옴
                const monthWeeks = getWeeksInMonth(year, month);

                // 주차 정보가 없으면 데이터를 불러오지 않음
                if (monthWeeks.length === 0) {
                    setDiaries([]);
                    setNovelsMap({});
                    calculateAllProgress(year, month, []);
                    setIsLoading(false);
                    return;
                }

                // 표시되는 모든 주차를 포함하는 날짜 범위 설정
                // 지난주도 포함하기 위해 시작 날짜를 7일 앞으로 확장
                const startDate = new Date(monthWeeks[0].start);
                startDate.setDate(startDate.getDate() - 7);
                const endDate = monthWeeks[monthWeeks.length - 1].end;

                // 1. 확장된 날짜 범위로 일기 가져오기 (지난주 포함)
                const diariesRef = collection(db, 'diaries');
                const diariesQuery = query(diariesRef,
                    where('userId', '==', user.uid),
                    where('date', '>=', formatDate(startDate)),
                    where('date', '<=', formatDate(endDate)),
                    orderBy('date')
                );

                let fetchedDiaries = [];
                try {
                    const diarySnapshot = await getDocs(diariesQuery);
                    fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
                    setDiaries(fetchedDiaries);
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                }

                // 2. Fetch all Novels for the user to create a map
                const novelsRef = collection(db, 'novels');
                const novelsQuery = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                try {
                    const novelSnapshot = await getDocs(novelsQuery);
                    const newNovelsMap = {};
                    const allMyNovels = [];
                    novelSnapshot.forEach(doc => {
                        const novel = doc.data();
                        // 삭제되지 않은 소설만 추가
                        if (novel.deleted !== true) {
                            allMyNovels.push({ id: doc.id, ...novel });
                        }
                        // year, month, weekNum이 모두 있고 삭제되지 않은 경우에만 맵에 추가
                        if (novel.year && novel.month && novel.weekNum && novel.deleted !== true) {
                            const weekKey = `${novel.year}년 ${novel.month}월 ${novel.weekNum}주차`;
                            // 같은 주차에 여러 소설이 있을 수 있으므로 배열로 저장
                            if (!newNovelsMap[weekKey]) {
                                newNovelsMap[weekKey] = [];
                            }
                            newNovelsMap[weekKey].push({ id: doc.id, ...novel });
                        }
                    });

                    // 같은 주차, 같은 장르의 소설이 여러 개 있을 때 최신 것만 유지
                    Object.keys(newNovelsMap).forEach(weekKey => {
                        const novels = newNovelsMap[weekKey];
                        // 장르별로 그룹화
                        const novelsByGenre = {};
                        novels.forEach(novel => {
                            const genreKey = novel.genre || 'default';
                            if (!novelsByGenre[genreKey]) {
                                novelsByGenre[genreKey] = [];
                            }
                            novelsByGenre[genreKey].push(novel);
                        });
                        // 각 장르별로 최신 것만 유지 (이미 createdAt desc로 정렬되어 있음)
                        const filteredNovels = Object.values(novelsByGenre).map(genreNovels => {
                            // createdAt 기준으로 정렬 (최신순)
                            return genreNovels.sort((a, b) => {
                                const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
                                const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
                                return bTime - aTime;
                            })[0]; // 가장 최신 것만
                        });
                        newNovelsMap[weekKey] = filteredNovels;
                    });

                    setNovelsMap(newNovelsMap);
                    // 최근 5개만 표시
                    setMyNovels(allMyNovels.slice(0, 5));
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                }

                // 3. Fetch purchased novels
                try {
                    const purchasedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                    const purchasedQuery = query(purchasedNovelsRef, orderBy('viewedAt', 'desc'), limit(5));
                    const purchasedSnapshot = await getDocs(purchasedQuery);
                    const purchasedList = [];

                    for (const purchasedDoc of purchasedSnapshot.docs) {
                        const purchasedData = purchasedDoc.data();
                        if (purchasedData.novelId) {
                            try {
                                const novelDoc = await getDoc(doc(db, 'novels', purchasedData.novelId));
                                if (novelDoc.exists()) {
                                    const novelData = novelDoc.data();
                                    // 삭제되지 않고 공개된 소설만 추가
                                    if (novelData.deleted !== true && novelData.isPublic !== false) {
                                        purchasedList.push({
                                            id: novelDoc.id,
                                            ...novelData,
                                            ownerName: purchasedData.ownerName || novelData.ownerName
                                        });
                                    }
                                }
                            } catch (err) {
                                // 개별 소설 조회 실패는 무시
                            }
                        }
                    }
                    setPurchasedNovels(purchasedList);
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                }

                // 4. Fetch premium free novel status and potions
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const isPremiumUser = userData.isMonthlyPremium || userData.isYearlyPremium || false;
                        setIsPremium(isPremiumUser);
                        setOwnedPotions(userData.potions || {});

                    }
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                    console.error('프리미엄 무료권 상태 조회 실패:', error);
                }

                // 4. Fetch purchased novels
                try {
                    const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                    const viewedSnapshot = await getDocs(viewedNovelsRef);

                    if (viewedSnapshot.empty) {
                        setPurchasedNovels([]);
                    } else {
                        // viewedNovels 문서에서 novelId와 viewedAt 정보 추출
                        // 문서 ID가 novelId입니다
                        const viewedNovelsData = viewedSnapshot.docs.map(doc => ({
                            novelId: doc.id,
                            viewedAt: doc.data().viewedAt || doc.data().createdAt || null
                        }));

                        // novelId로 novels 컬렉션에서 데이터 fetch
                        const novelsRef = collection(db, 'novels');
                        const novelDocs = await Promise.all(
                            viewedNovelsData.map(item => getDoc(doc(novelsRef, item.novelId)))
                        );

                        let purchased = novelDocs
                            .map((snap, idx) => {
                                if (!snap.exists()) return null;
                                const novelData = snap.data();
                                // 삭제되지 않고 공개된 소설만 추가
                                if (novelData.deleted === true || novelData.isPublic === false) {
                                    return null;
                                }
                                return {
                                    ...novelData,
                                    id: snap.id,
                                    purchasedAt: viewedNovelsData[idx].viewedAt
                                };
                            })
                            .filter(novel => novel !== null);

                        // 구매일 기준 최신순 정렬
                        purchased = purchased.sort((a, b) => {
                            const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                            const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                            return bDate - aDate;
                        });

                        // 각 소설의 userId로 닉네임/아이디 조회
                        const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
                        const userDocs = await Promise.all(
                            ownerIds.map(uid => getDoc(doc(db, 'users', uid)))
                        );
                        const ownerMap = {};
                        userDocs.forEach((snap, idx) => {
                            if (snap.exists()) {
                                const data = snap.data();
                                ownerMap[ownerIds[idx]] = data.nickname || data.nick || data.displayName || ownerIds[idx];
                            } else {
                                ownerMap[ownerIds[idx]] = ownerIds[idx];
                            }
                        });

                        // novel에 ownerName 필드 추가
                        purchased = purchased.map(novel => ({
                            ...novel,
                            ownerName: ownerMap[novel.userId] || novel.userId
                        }));

                        // 최근 5개만 표시
                        setPurchasedNovels(purchased.slice(0, 5));
                    }
                } catch (error) {
                    console.error('구매한 소설 목록 가져오기 실패:', error);
                    setPurchasedNovels([]);
                }

                // 5. Calculate progress
                calculateAllProgress(year, month, fetchedDiaries);
                setIsLoading(false);
            };
            fetchAllData();
            // location state 초기화
            navigate(location.pathname, { replace: true });
        }
    }, [location.state?.novelDeleted, user, currentDate, navigate, location.pathname]);

    // 홈화면에서 진행도 구역으로 스크롤
    useEffect(() => {
        if (location.state?.scrollToProgress && progressSectionRef.current && !isLoading) {
            setTimeout(() => {
                progressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // state 초기화
                navigate(location.pathname, { replace: true });
            }, 500);
        }
    }, [location.state?.scrollToProgress, isLoading, navigate, location.pathname]);


    const getWeeksInMonth = (year, month) => {
        const weeks = [];
        const firstDayOfMonth = new Date(year, month, 1);

        // 주의 시작인 월요일을 찾기 위해, 해당 월의 첫 날이 속한 주의 월요일부터 시작
        let currentMonday = new Date(firstDayOfMonth);
        const dayOfWeek = currentMonday.getDay(); // 0=일, 1=월, ..., 6=토
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        currentMonday.setDate(currentMonday.getDate() - diff);

        let weekNum = 1;

        // 주의 마지막 날(일요일)이 현재 달에 속하는 주차들을 계산
        while (true) {
            const weekStart = new Date(currentMonday);
            const weekEnd = new Date(currentMonday);
            weekEnd.setDate(weekEnd.getDate() + 6); // 주의 마지막 날 (일요일)

            // 주의 마지막 날이 현재 달에 속하면 해당 월의 주차로 포함
            if (weekEnd.getMonth() === month && weekEnd.getFullYear() === year) {
                weeks.push({
                    weekNum: weekNum++,
                    start: weekStart,
                    end: weekEnd,
                });
            } else if (weeks.length > 0) {
                // 이미 해당 월의 주차 계산이 끝났고, 다음 달로 넘어갔으므로 중단
                break;
            }

            // 다음 주 월요일로 이동
            currentMonday.setDate(currentMonday.getDate() + 7);

            // 무한 루프 방지를 위한 안전 장치
            if (currentMonday.getFullYear() > year || (currentMonday.getFullYear() === year && currentMonday.getMonth() > month + 1)) {
                break;
            }
        }

        setWeeks(weeks);
        return weeks;
    };

    const calculateAllProgress = (year, month, fetchedDiaries) => {
        const currentWeeks = getWeeksInMonth(year, month);
        let totalWrittenDaysInMonth = 0;
        const newWeeklyProgress = {};

        currentWeeks.forEach(week => {
            const weekStartStr = formatDate(week.start);
            const weekEndStr = formatDate(week.end);

            const weekDiaries = fetchedDiaries.filter(diary => {
                return diary.date >= weekStartStr && diary.date <= weekEndStr;
            });

            // 한 주는 7일이므로, 7일 기준으로 진행률 계산
            const weekDateCount = 7;
            const progress = Math.min(100, (weekDiaries.length / weekDateCount) * 100);

            newWeeklyProgress[week.weekNum] = progress;
        });

        // 월간 진행률은 현재 '월'에 해당하는 일기만 카운트
        fetchedDiaries.forEach(diary => {
            const diaryDate = new Date(diary.date);
            if (diaryDate.getFullYear() === year && diaryDate.getMonth() === month) {
                totalWrittenDaysInMonth++;
            }
        });

        setWeeklyProgress(newWeeklyProgress);

        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        setMonthProgress(totalDaysInMonth > 0 ? (totalWrittenDaysInMonth / totalDaysInMonth) * 100 : 0);
    };


    const getFirstWeekOfMonth = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDayOfWeek = new Date(firstDay);
        lastDayOfWeek.setDate(firstDay.getDate() + (6 - firstDay.getDay()));

        return {
            start: firstDay,
            end: lastDayOfWeek
        };
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        // 모바일에서 공간 절약을 위해 더 짧은 형식 사용
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    const handleCreateNovel = (week) => {
        const weekProgress = weeklyProgress[week.weekNum] || 0;
        if (weekProgress < 100) {
            alert(t('novel_all_diaries_needed'));
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const weekKey = `${year}년 ${month}월 ${week.weekNum}주차`;
        const novelsForWeek = novelsMap[weekKey] || [];
        const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

        const novelTitle = language === 'en'
            ? t('novel_list_by_genre_title', { genre: t('novel_title') }) // simple fallback
            : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

        const weekStartDate = new Date(week.start);
        const weekEndDate = new Date(week.end);

        // 이 주의 일기 중 첫 번째 이미지 URL을 대표 이미지로 사용 (없으면 기본값)
        const firstDiaryWithImage = diaries.find(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= weekStartDate &&
                diaryDate <= weekEndDate &&
                diary.imageUrls && diary.imageUrls.length > 0;
        });
        const imageUrl = firstDiaryWithImage ? firstDiaryWithImage.imageUrls[0] : '/novel_banner/romance.png';

        navigate('/novel/create', {
            state: {
                year: year,
                month: month,
                weekNum: week.weekNum,
                week: weekKey,
                dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                imageUrl: imageUrl,
                title: novelTitle,
                existingGenres: existingGenres,
                returnPath: location.pathname || '/novel'
            }
        });
    };

    const handleCreateNovelClick = async (week) => {
        const weekProgress = weeklyProgress[week.weekNum] || 0;
        if (weekProgress < 100) {
            alert(t('novel_all_diaries_needed'));
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const weekKey = `${year}년 ${month}월 ${week.weekNum}주차`;
        const novelsForWeek = novelsMap[weekKey] || [];

        // 일반 회원인 경우 같은 주차에 이미 다른 장르의 소설이 있는지 확인
        if (!isPremium && novelsForWeek.length > 0) {
            const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);
            if (existingGenres.length > 0) {
                toast.showToast('일반 회원은 한 주에 한 장르의 소설만 생성할 수 있습니다.', 'error');
                return;
            }
        }

        // 포션 보유 여부 확인
        const hasPotions = Object.values(ownedPotions).some(count => count > 0);

        if (hasPotions) {
            // 포션이 있으면 바로 소설 생성 페이지로 이동
            handleCreateNovel(week, false);
        } else {
            // 포션이 없으면 포션 상점으로 안내
            toast.showToast('포션이 필요합니다. 포션 상점에서 구매해주세요.', 'error');
            setTimeout(() => {
                navigate('/my/potion-shop');
            }, 1500);
        }
    };

    // 주차가 미래인지 확인하는 함수
    const isFutureWeek = (week) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStartDate = new Date(week.start);
        weekStartDate.setHours(0, 0, 0, 0);
        return weekStartDate > today;
    };

    // 오늘에 해당하는 주차에서 오늘의 일기가 작성되었는지 확인하는 함수
    const hasTodayDiary = (week) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStartDate = new Date(week.start);
        weekStartDate.setHours(0, 0, 0, 0);
        const weekEndDate = new Date(week.end);
        weekEndDate.setHours(23, 59, 59, 999);

        // 오늘이 이 주차에 포함되는지 확인
        if (today < weekStartDate || today > weekEndDate) {
            return false;
        }

        // 오늘의 일기가 작성되었는지 확인
        const todayStr = formatDate(today);
        return diaries.some(diary => diary.date === todayStr);
    };

    const handleWriteDiary = (week) => {
        // 미래 주차이거나 오늘의 일기가 이미 작성된 경우 처리하지 않음
        if (isFutureWeek(week) || hasTodayDiary(week)) {
            return;
        }

        // 해당 주차에서 작성하지 않은 첫 번째 날짜 찾기
        const weekStartDate = new Date(week.start);
        const weekEndDate = new Date(week.end);

        // 해당 주차의 모든 날짜 생성
        const weekDates = [];
        const currentDate = new Date(weekStartDate);
        while (currentDate <= weekEndDate) {
            weekDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 해당 주차의 일기들 찾기
        const weekDiaries = diaries.filter(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= weekStartDate && diaryDate <= weekEndDate;
        });

        // 작성하지 않은 첫 번째 날짜 찾기
        const writtenDates = weekDiaries.map(diary => formatDate(diary.date));
        const unwrittenDate = weekDates.find(date => {
            const dateStr = formatDate(date);
            return !writtenDates.includes(dateStr);
        });

        if (unwrittenDate) {
            // 일기 작성 페이지로 이동 (해당 날짜와 함께)
            navigate('/write', {
                state: {
                    selectedDate: formatDate(unwrittenDate),
                    year: unwrittenDate.getFullYear(),
                    month: unwrittenDate.getMonth() + 1,
                    weekNum: week.weekNum
                }
            });
        } else {
            // 모든 날짜가 작성된 경우 (이론적으로는 발생하지 않음)
            navigate('/write');
        }
    };

    const handleYearChange = (year) => {
        setCurrentDate(new Date(year, currentDate.getMonth()));
    };

    const handleMonthChange = (month) => {
        setCurrentDate(new Date(currentDate.getFullYear(), month - 1));
        setIsPickerOpen(false);
    };

    // 소설을 만들 수 있는 주차 찾기 (일기 7개 모두 작성된 주차)
    const findCreatableWeek = () => {
        // 모든 주차를 확인하여 소설을 만들 수 있는 주차 찾기
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const progress = weeklyProgress[week.weekNum] || 0;
            const isCompleted = progress >= 100;

            if (isCompleted) {
                return week;
            }
        }
        return null;
    };

    // 오늘이 속한 주차 찾기
    const getCurrentWeek = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 현재 표시된 월의 주차들 확인
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const weekStart = new Date(week.start);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(week.end);
            weekEnd.setHours(23, 59, 59, 999);

            if (today >= weekStart && today <= weekEnd) {
                return week;
            }
        }

        // 현재 표시된 월에 없으면 오늘이 속한 월 확인
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // 오늘이 속한 월이 현재 표시된 월과 다를 때만 계산
        if (currentYear !== currentDate.getFullYear() || currentMonth !== currentDate.getMonth()) {
            // getWeeksInMonth를 호출하지 않고 직접 계산
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            let currentMonday = new Date(firstDayOfMonth);
            const dayOfWeek = currentMonday.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            currentMonday.setDate(currentMonday.getDate() - diff);

            let weekNum = 1;
            while (true) {
                const weekStart = new Date(currentMonday);
                const weekEnd = new Date(currentMonday);
                weekEnd.setDate(weekEnd.getDate() + 6);

                if (today >= weekStart && today <= weekEnd) {
                    return {
                        weekNum: weekNum,
                        start: weekStart,
                        end: weekEnd
                    };
                }

                if (weekEnd.getMonth() !== currentMonth || weekEnd.getFullYear() !== currentYear) {
                    if (weekNum > 1) break;
                }

                currentMonday.setDate(currentMonday.getDate() + 7);
                weekNum++;

                if (currentMonday.getFullYear() > currentYear || (currentMonday.getFullYear() === currentYear && currentMonday.getMonth() > currentMonth + 1)) {
                    break;
                }
            }
        }

        return null;
    };


    // 이번주 일기 진행도 계산 (항상 현재 날짜 기준)
    const getCurrentWeekProgress = () => {
        const count = currentWeekDiariesForProgress.length;
        const total = 7;
        const progress = Math.min(100, (count / total) * 100);

        return { progress, count, total };
    };

    // 이번주 일기 목록 가져오기 (모달용, 항상 현재 날짜 기준)
    const getCurrentWeekDiaries = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 현재 주의 시작일과 종료일 계산
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일까지의 차이
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // formatDate 함수 사용 (컴포넌트 내부에 정의되어 있음)
        const formatDateForQuery = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const weekStartStr = formatDateForQuery(weekStart);
        const weekEndStr = formatDateForQuery(weekEnd);

        if (!user) {
            setCurrentWeekDiaries([]);
            return;
        }

        try {
            const diariesRef = collection(db, 'diaries');
            const diariesQuery = query(diariesRef,
                where('userId', '==', user.uid),
                where('date', '>=', weekStartStr),
                where('date', '<=', weekEndStr),
                orderBy('date')
            );
            const diarySnapshot = await getDocs(diariesQuery);
            const fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());

            // 날짜순으로 정렬
            fetchedDiaries.sort((a, b) => {
                return a.date.localeCompare(b.date);
            });

            setCurrentWeekDiaries(fetchedDiaries);
        } catch (error) {
            setCurrentWeekDiaries([]);
        }
    };

    // 이번주 일기 목록 모달 열기
    const openCurrentWeekDiaryModal = async () => {
        await getCurrentWeekDiaries();
        setShowCurrentWeekDiaryModal(true);
    };

    // 일기 상세 보기로 이동
    const handleDiaryClick = (diary) => {
        navigate('/diary/view', {
            state: {
                date: diary.date,
                diary: diary
            }
        });
    };

    // 소설을 만들 수 있는 주차로 스크롤
    const scrollToCreatableWeek = () => {
        const creatableWeek = findCreatableWeek();

        if (creatableWeek) {
            const weekKey = `${creatableWeek.weekNum}`;
            const weekRef = weekRefs.current[weekKey];

            if (weekRef) {
                // 해당 주차가 현재 표시된 월에 있는지 확인
                const weekYear = new Date(creatableWeek.start).getFullYear();
                const weekMonth = new Date(creatableWeek.start).getMonth();
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth();

                // 다른 월에 있으면 해당 월로 이동
                if (weekYear !== currentYear || weekMonth !== currentMonth) {
                    setCurrentDate(new Date(weekYear, weekMonth));
                    // 상태 업데이트 후 스크롤 (약간의 지연 필요)
                    setTimeout(() => {
                        const updatedWeekRef = weekRefs.current[weekKey];
                        if (updatedWeekRef) {
                            updatedWeekRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 300);
                } else {
                    // 같은 월에 있으면 바로 스크롤
                    weekRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // ref가 없으면 해당 월로 이동
                const weekYear = new Date(creatableWeek.start).getFullYear();
                const weekMonth = new Date(creatableWeek.start).getMonth();
                setCurrentDate(new Date(weekYear, weekMonth));
            }
        } else {
            // 소설을 만들 수 있는 주차가 없으면 토스트 메시지 표시
            toast.show(t('novel_no_creatable_week') || '소설을 만들 수 있는 주차가 없습니다. 일기를 더 작성해주세요.');
        }
    };

    return (
        <div
            className={`novel-container ${isDiaryTheme ? 'diary-theme' : ''}`}
            style={{
                background: isDiaryTheme ? '#faf8f3' : theme.background,
                color: isDiaryTheme ? '#5C4B37' : theme.text
            }}
        >
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('novel_title')} />
            {/* <Title>Novel</Title> */}

            {/* 소설 만들기 CTA */}
            <div
                className={`novel-cta-card ${isDiaryTheme ? 'diary-theme' : ''}`}
                onClick={openCurrentWeekDiaryModal}
                style={{
                    background: isDiaryTheme ? '#fffef9' : (theme.novelProgressCardBg || '#FFFFFF'),
                    border: isDiaryTheme ? '2px solid rgba(139, 111, 71, 0.25)' : `1px solid ${theme.novelProgressCardBorder || '#E5E5E5'}`,
                    transform: isDiaryTheme ? 'rotate(-0.3deg)' : 'none'
                }}
            >
                <div
                    className={`novel-cta-content ${isDiaryTheme ? 'diary-theme' : ''}`}
                    style={{
                        color: isDiaryTheme ? '#5C4B37' : theme.text
                    }}
                >
                    <div className="novel-cta-progress">
                        <div className="novel-cta-progress-text" style={{ color: theme.subText || '#888' }}>
                            <span>{t('novel_this_week_progress') || '이번주 일기 진행도'}</span>
                            <span>{(() => {
                                const { count, total } = getCurrentWeekProgress();
                                return `${count}/${total}`;
                            })()}</span>
                        </div>
                        <div className="novel-cta-progress-bar" style={{ background: theme.novelProgressBarBg || '#E5E5E5' }}>
                            <div
                                className="novel-cta-progress-fill"
                                style={{
                                    width: `${getCurrentWeekProgress().progress}%`,
                                    background: theme.novelProgressBarFill || 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 내 소설 섹션 */}
            <div className="novel-library-section">
                <div className="novel-section-header">
                    <h2 className={`novel-section-title ${isDiaryTheme ? 'diary-theme' : ''}`}>📚 {t('home_my_novel') || '내 소설'}</h2>
                    {myNovels.length > 0 && (
                        <button
                            className={`novel-more-link ${isDiaryTheme ? 'diary-theme' : ''}`}
                            onClick={() => navigate('/my/completed-novels')}
                        >
                            더보기 →
                        </button>
                    )}
                </div>
                {myNovels.length > 0 ? (
                    <div className="novel-row">
                        {myNovels.map(novel => (
                            <div
                                key={novel.id}
                                className="novel-box"
                                onClick={() => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}`)}
                            >
                                <img
                                    className="novel-cover-image"
                                    src={novel.imageUrl || '/novel_banner/default.png'}
                                    alt={novel.title}
                                />
                                <div className="novel-title" style={{ color: theme.text }}>{novel.title}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="novel-empty-state" style={{ color: theme.subText || '#888' }}>
                        아직 작성한 소설이 없습니다.<br />
                        일기를 작성하고 소설을 만들어보세요!
                    </div>
                )}
            </div>

            {/* 내 서재 섹션 */}
            <div className="novel-library-section">
                <div className="novel-section-header">
                    <h2 className={`novel-section-title ${isDiaryTheme ? 'diary-theme' : ''}`}>🛍️ {t('home_purchased_novel') || '내 서재'}</h2>
                    {purchasedNovels.length > 0 && (
                        <button
                            className={`novel-more-link ${isDiaryTheme ? 'diary-theme' : ''}`}
                            onClick={() => navigate('/purchased-novels')}
                        >
                            더보기 →
                        </button>
                    )}
                </div>
                {purchasedNovels.length > 0 ? (
                    <div className="novel-row">
                        {purchasedNovels.map(novel => (
                            <div
                                key={novel.id}
                                className="novel-box"
                                onClick={() => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}?userId=${novel.userId}`, {
                                    state: { returnPath: '/novel' }
                                })}
                            >
                                <img
                                    className="novel-cover-image"
                                    src={novel.imageUrl || '/novel_banner/default.png'}
                                    alt={novel.title}
                                />
                                <div className="novel-title" style={{ color: theme.text }}>{novel.title}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="novel-empty-state" style={{ color: theme.subText || '#888' }}>
                        아직 구매한 소설이 없습니다.<br />
                        다른 사람의 소설을 구매해보세요!
                    </div>
                )}
            </div>

            <div className="novel-divider" />


            <div className="novel-weekly-section" ref={progressSectionRef}>
                <div className="novel-month-selector">
                    <button
                        className={`novel-month-button ${isDiaryTheme ? 'diary-theme' : ''}`}
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    >
                        ‹
                    </button>
                    <h2
                        className={`novel-current-month ${isDiaryTheme ? 'diary-theme' : ''}`}
                        onClick={() => setIsPickerOpen(true)}
                    >
                        {language === 'en'
                            ? currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                            : `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
                    </h2>
                    <button
                        className={`novel-month-button ${isDiaryTheme ? 'diary-theme' : ''}`}
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    >
                        ›
                    </button>
                </div>
                <div className="novel-view-toggle-container">
                    <button
                        className={`novel-view-toggle-button ${weeklyViewMode === 'card' ? 'active' : ''}`}
                        onClick={() => setWeeklyViewMode('card')}
                        title="카드형"
                        style={{
                            background: weeklyViewMode === 'card' ? (theme.primary || '#cb6565') : 'transparent',
                            borderColor: weeklyViewMode === 'card' ? (theme.primary || '#cb6565') : (theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#ddd')
                        }}
                    >
                        <GridIcon width={20} height={20} />
                    </button>
                    <button
                        className={`novel-view-toggle-button ${weeklyViewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setWeeklyViewMode('list')}
                        title="목록형"
                        style={{
                            background: weeklyViewMode === 'list' ? (theme.primary || '#cb6565') : 'transparent',
                            borderColor: weeklyViewMode === 'list' ? (theme.primary || '#cb6565') : (theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#ddd')
                        }}
                    >
                        <ListIcon width={20} height={20} />
                    </button>
                </div>
                {isPickerOpen && (
                    <div className="novel-date-picker-modal" onClick={() => setIsPickerOpen(false)}>
                        <div className="novel-date-picker-content" onClick={(e) => e.stopPropagation()}>
                            <div className="novel-date-picker-header">
                                <h3 className="novel-date-picker-title">{t('novel_month_label')}</h3>
                                <button className="novel-date-picker-close" onClick={() => setIsPickerOpen(false)}>×</button>
                            </div>
                            <h3 className="novel-date-picker-title">{t('year')}</h3>
                            <div className="novel-date-picker-grid">
                                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((year) => (
                                    <button
                                        key={year}
                                        className={`novel-date-picker-button ${year === currentDate.getFullYear() ? 'selected' : ''}`}
                                        onClick={() => handleYearChange(year)}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                            <h3 className="novel-date-picker-title">{t('month')}</h3>
                            <div className="novel-date-picker-grid">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <button
                                        key={month}
                                        className={`novel-date-picker-button ${month === currentDate.getMonth() + 1 ? 'selected' : ''}`}
                                        onClick={() => handleMonthChange(month)}
                                    >
                                        {language === 'en' ? month : `${month}월`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {weeklyViewMode === 'card' ? (
                    <div className="novel-weekly-grid">
                        {weeks.map((week, index) => {
                            const progress = weeklyProgress[week.weekNum] || 0;
                            const isCompleted = progress >= 100;
                            const weekKey = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${week.weekNum}주차`;
                            const novelsForWeek = novelsMap[weekKey] || [];
                            const firstNovel = novelsForWeek.length > 0 ? novelsForWeek[0] : null;
                            const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

                            // 모든 장르 목록
                            const allGenres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
                            // 모든 장르의 소설이 생성되었는지 확인
                            const allGenresCreated = allGenres.every(genre => existingGenres.includes(genre));

                            const handleAddNovel = () => {
                                // 모든 장르의 소설이 이미 생성된 경우 처리하지 않음
                                if (allGenresCreated) {
                                    return;
                                }

                                const weekProgress = weeklyProgress[week.weekNum] || 0;
                                if (weekProgress < 100) {
                                    alert(t('novel_all_diaries_needed'));
                                    return;
                                }

                                // 포션 보유 여부 확인
                                const hasPotions = Object.values(ownedPotions).some(count => count > 0);

                                // 바로 소설 생성 페이지로 이동
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth() + 1;
                                const novelTitle = language === 'en'
                                    ? t('novel_list_by_genre_title', { genre: t('novel_title') })
                                    : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

                                const weekStartDate = new Date(week.start);
                                const weekEndDate = new Date(week.end);

                                const firstDiaryWithImage = diaries.find(diary => {
                                    const diaryDate = new Date(diary.date);
                                    return diaryDate >= weekStartDate &&
                                        diaryDate <= weekEndDate &&
                                        diary.imageUrls && diary.imageUrls.length > 0;
                                });
                                const imageUrl = firstDiaryWithImage ? firstDiaryWithImage.imageUrls[0] : '/novel_banner/romance.png';

                                navigate('/novel/create', {
                                    state: {
                                        year: year,
                                        month: month,
                                        weekNum: week.weekNum,
                                        week: `${year}년 ${month}월 ${week.weekNum}주차`,
                                        dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                                        imageUrl: imageUrl,
                                        title: novelTitle,
                                        existingGenres: novelsForWeek.map(n => n.genre).filter(Boolean),
                                        returnPath: location.pathname || '/novel'
                                    }
                                });
                            };

                            const handleViewNovel = () => {
                                // 소설이 2개 이상이면 목록 모달 표시
                                if (novelsForWeek.length > 1) {
                                    setSelectedWeekNovels(novelsForWeek);
                                } else {
                                    // 소설이 1개면 바로 이동
                                    const novelKey = createNovelUrl(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() + 1,
                                        week.weekNum,
                                        firstNovel.genre,
                                        firstNovel.id
                                    );
                                    navigate(`/novel/${novelKey}`);
                                }
                            };

                            const barColor = firstNovel ? 'view' : isCompleted ? 'create' : 'fill';

                            return (
                                <div
                                    key={week.weekNum}
                                    className={`novel-weekly-card ${isDiaryTheme ? 'diary-theme' : ''}`}
                                    ref={(el) => {
                                        if (el) {
                                            weekRefs.current[week.weekNum] = el;
                                        }
                                    }}
                                    style={{
                                        background: isDiaryTheme ? '#fffef9' : theme.progressCard,
                                        borderRadius: isDiaryTheme ? '14px 18px 16px 15px' : '15px',
                                        border: isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.2)' : 'none',
                                        boxShadow: isDiaryTheme ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)' : 'none',
                                        transform: getWeeklyCardTransform(isDiaryTheme, index),
                                        color: theme.cardText
                                    }}
                                >
                                    <h3 className={`novel-week-title ${isDiaryTheme ? 'diary-theme' : ''}`}>
                                        <span>{t('week_num', { num: week.weekNum })}</span>
                                        {firstNovel && isCompleted && (
                                            <button
                                                className="novel-add-button"
                                                onClick={handleViewNovel}
                                                title="소설 보기"
                                                style={{
                                                    color: theme.primary
                                                }}
                                            >
                                                ☰
                                            </button>
                                        )}
                                    </h3>
                                    <p className="novel-date-range">{formatDisplayDate(week.start)} - {formatDisplayDate(week.end)}</p>
                                    <div className="novel-progress-bar">
                                        {(() => {
                                            // 주의 시작일부터 7일간의 날짜 생성
                                            const weekStart = new Date(week.start);
                                            const weekDays = [];
                                            for (let i = 0; i < 7; i++) {
                                                const date = new Date(weekStart);
                                                date.setDate(weekStart.getDate() + i);
                                                weekDays.push(date);
                                            }

                                            // 해당 주의 일기 날짜 목록
                                            const weekStartStr = formatDate(week.start);
                                            const weekEndStr = formatDate(week.end);
                                            const weekDiaries = diaries.filter(diary => {
                                                return diary.date >= weekStartStr && diary.date <= weekEndStr;
                                            });
                                            const writtenDates = new Set(weekDiaries.map(diary => diary.date));

                                            return weekDays.map((day, idx) => {
                                                const dayStr = formatDate(day);
                                                const hasDiary = writtenDates.has(dayStr);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="novel-day-indicator"
                                                        style={{
                                                            background: getDayIndicatorBackground(hasDiary, barColor, theme, isCompleted)
                                                        }}
                                                    />
                                                );
                                            });
                                        })()}
                                    </div>
                                    {firstNovel ? (
                                        <button
                                            className="novel-create-button"
                                            onClick={handleAddNovel}
                                            disabled={allGenresCreated}
                                            style={getCreateButtonStyle(
                                                allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : "+ 다른 장르 👑"),
                                                true,
                                                theme,
                                                false,
                                                allGenresCreated,
                                                false
                                            )}
                                        >
                                            {allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : "+ 다른 장르 👑")}
                                        </button>
                                    ) : (
                                        <button
                                            className="novel-create-button"
                                            disabled={!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))}
                                            onClick={() => {
                                                if (!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))) {
                                                    return;
                                                }
                                                isCompleted ? handleCreateNovelClick(week) : handleWriteDiary(week);
                                            }}
                                            style={getCreateButtonStyle(
                                                isCompleted ? t('novel_create') : t('novel_fill_diary'),
                                                false,
                                                theme,
                                                false,
                                                !isCompleted && (isFutureWeek(week) || hasTodayDiary(week)),
                                                false
                                            )}
                                        >
                                            {isCompleted
                                                ? t('novel_create')
                                                : t('novel_fill_diary')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="novel-weekly-list">
                        {weeks.map((week, index) => {
                            const progress = weeklyProgress[week.weekNum] || 0;
                            const isCompleted = progress >= 100;
                            const weekKey = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${week.weekNum}주차`;
                            const novelsForWeek = novelsMap[weekKey] || [];
                            const firstNovel = novelsForWeek.length > 0 ? novelsForWeek[0] : null;
                            const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

                            // 모든 장르 목록
                            const allGenres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
                            // 모든 장르의 소설이 생성되었는지 확인
                            const allGenresCreated = allGenres.every(genre => existingGenres.includes(genre));

                            const handleAddNovel = () => {
                                // 일반 회원이고 이미 소설이 있는 경우 프리미엄 페이지로 이동
                                if (!isPremium && novelsForWeek.length > 0) {
                                    navigate('/my/premium');
                                    return;
                                }

                                // 모든 장르의 소설이 이미 생성된 경우 처리하지 않음
                                if (allGenresCreated) {
                                    return;
                                }

                                const weekProgress = weeklyProgress[week.weekNum] || 0;
                                if (weekProgress < 100) {
                                    alert(t('novel_all_diaries_needed'));
                                    return;
                                }

                                // 포션 보유 여부 확인
                                const hasPotions = Object.values(ownedPotions).some(count => count > 0);

                                // 바로 소설 생성 페이지로 이동
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth() + 1;
                                const novelTitle = language === 'en'
                                    ? t('novel_list_by_genre_title', { genre: t('novel_title') })
                                    : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

                                const weekStartDate = new Date(week.start);
                                const weekEndDate = new Date(week.end);

                                const firstDiaryWithImage = diaries.find(diary => {
                                    const diaryDate = new Date(diary.date);
                                    return diaryDate >= weekStartDate &&
                                        diaryDate <= weekEndDate &&
                                        diary.imageUrls && diary.imageUrls.length > 0;
                                });
                                const imageUrl = firstDiaryWithImage ? firstDiaryWithImage.imageUrls[0] : '/novel_banner/romance.png';

                                navigate('/novel/create', {
                                    state: {
                                        year: year,
                                        month: month,
                                        weekNum: week.weekNum,
                                        week: `${year}년 ${month}월 ${week.weekNum}주차`,
                                        dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                                        imageUrl: imageUrl,
                                        title: novelTitle,
                                        existingGenres: novelsForWeek.map(n => n.genre).filter(Boolean),
                                        returnPath: location.pathname || '/novel'
                                    }
                                });
                            };

                            const handleViewNovel = () => {
                                // 소설이 2개 이상이면 목록 모달 표시
                                if (novelsForWeek.length > 1) {
                                    setSelectedWeekNovels(novelsForWeek);
                                } else {
                                    // 소설이 1개면 바로 이동
                                    const novelKey = createNovelUrl(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() + 1,
                                        week.weekNum,
                                        firstNovel.genre,
                                        firstNovel.id
                                    );
                                    navigate(`/novel/${novelKey}`);
                                }
                            };

                            const barColor = firstNovel ? 'view' : isCompleted ? 'create' : 'fill';

                            return (
                                <div
                                    key={week.weekNum}
                                    className={`novel-weekly-card list-mode ${isDiaryTheme ? 'diary-theme' : ''}`}
                                    ref={(el) => {
                                        if (el) {
                                            weekRefs.current[week.weekNum] = el;
                                        }
                                    }}
                                    style={{
                                        background: isDiaryTheme ? '#fffef9' : theme.progressCard,
                                        borderRadius: isDiaryTheme ? '14px 18px 16px 15px' : '15px',
                                        border: isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.2)' : 'none',
                                        boxShadow: isDiaryTheme ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)' : 'none',
                                        transform: getWeeklyCardTransform(isDiaryTheme, index),
                                        color: theme.cardText
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: 0 }}>
                                        <h3 className={`novel-week-title list-mode ${isDiaryTheme ? 'diary-theme' : ''}`}>
                                            <span>{t('week_num', { num: week.weekNum })}</span>
                                            {firstNovel && isCompleted && (
                                                <button
                                                    className="novel-add-button"
                                                    onClick={handleViewNovel}
                                                    title="소설 보기"
                                                    style={{
                                                        color: theme.primary
                                                    }}
                                                >
                                                    ☰
                                                </button>
                                            )}
                                        </h3>
                                        <p className="novel-date-range list-mode">{formatDisplayDate(week.start)} - {formatDisplayDate(week.end)}</p>
                                        <div className="novel-progress-bar list-mode">
                                            {(() => {
                                                // 주의 시작일부터 7일간의 날짜 생성
                                                const weekStart = new Date(week.start);
                                                const weekDays = [];
                                                for (let i = 0; i < 7; i++) {
                                                    const date = new Date(weekStart);
                                                    date.setDate(weekStart.getDate() + i);
                                                    weekDays.push(date);
                                                }

                                                // 해당 주의 일기 날짜 목록
                                                const weekStartStr = formatDate(week.start);
                                                const weekEndStr = formatDate(week.end);
                                                const weekDiaries = diaries.filter(diary => {
                                                    return diary.date >= weekStartStr && diary.date <= weekEndStr;
                                                });
                                                const writtenDates = new Set(weekDiaries.map(diary => diary.date));

                                                return weekDays.map((day, idx) => {
                                                    const dayStr = formatDate(day);
                                                    const hasDiary = writtenDates.has(dayStr);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="novel-day-indicator list-mode"
                                                            style={{
                                                                background: getDayIndicatorBackground(hasDiary, barColor, theme, isCompleted)
                                                            }}
                                                        />
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                        {firstNovel ? (
                                            <button
                                                className="novel-create-button list-mode"
                                                onClick={handleAddNovel}
                                                disabled={allGenresCreated}
                                                style={getCreateButtonStyle(
                                                    allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : "+ 다른 장르 👑"),
                                                    true,
                                                    theme,
                                                    false,
                                                    allGenresCreated,
                                                    true
                                                )}
                                            >
                                                {allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : "+ 다른 장르 👑")}
                                            </button>
                                        ) : (
                                            <button
                                                className="novel-create-button list-mode"
                                                disabled={!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))}
                                                onClick={() => {
                                                    if (!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))) {
                                                        return;
                                                    }
                                                    isCompleted ? handleCreateNovelClick(week) : handleWriteDiary(week);
                                                }}
                                                style={getCreateButtonStyle(
                                                    isCompleted ? t('novel_create') : t('novel_fill_diary'),
                                                    false,
                                                    theme,
                                                    false,
                                                    !isCompleted && (isFutureWeek(week) || hasTodayDiary(week)),
                                                    true
                                                )}
                                            >
                                                {isCompleted
                                                    ? t('novel_create')
                                                    : t('novel_fill_diary')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 소설 생성 옵션 모달 */}
            {showCreateOptionModal && selectedWeekForCreate && (
                <div className="novel-create-option-modal" onClick={() => setShowCreateOptionModal(false)}>
                    <div className="novel-create-option-content" onClick={(e) => e.stopPropagation()}>
                        <button className="novel-close-button" onClick={() => setShowCreateOptionModal(false)} style={{ color: theme.text }}>×</button>
                        <h3 className="novel-create-option-title" style={{ color: theme.text }}>소설 생성 방법 선택</h3>
                        <button
                            className="novel-create-option-button free"
                            onClick={() => {
                                handleCreateNovel(selectedWeekForCreate, true);
                                setShowCreateOptionModal(false);
                            }}
                        >
                            🪄 프리미엄 무료권 사용
                        </button>
                        <div className="novel-create-option-desc" style={{ color: theme.subText || '#666', marginBottom: '12px' }}>
                            무료로 소설을 생성합니다 (매월 자동 충전)
                        </div>
                        <button
                            className="novel-create-option-button"
                            onClick={() => {
                                handleCreateNovel(selectedWeekForCreate, false);
                                setShowCreateOptionModal(false);
                            }}
                        >
                            🔮 포션 사용
                        </button>
                        <div className="novel-create-option-desc" style={{ color: theme.subText || '#666' }}>
                            보유한 포션 1개를 사용합니다
                        </div>
                    </div>
                </div>
            )}

            {/* 소설 목록 모달 */}
            {selectedWeekNovels && (
                <div className="novel-list-modal" onClick={() => setSelectedWeekNovels(null)}>
                    <div className="novel-list-content" onClick={(e) => e.stopPropagation()}>
                        <div className="novel-list-header">
                            <h3 className="novel-list-title">소설 선택</h3>
                            <button className="novel-list-close" onClick={() => setSelectedWeekNovels(null)}>×</button>
                        </div>
                        {selectedWeekNovels.map((novel) => {
                            const genreKey = novel.genre === '로맨스' ? 'romance' :
                                novel.genre === '역사' ? 'historical' :
                                    novel.genre === '추리' ? 'mystery' :
                                        novel.genre === '공포' ? 'horror' :
                                            novel.genre === '동화' ? 'fairytale' :
                                                novel.genre === '판타지' ? 'fantasy' : null;

                            return (
                                <div
                                    key={novel.id}
                                    className="novel-list-item"
                                    onClick={() => {
                                        const novelKey = createNovelUrl(
                                            novel.year,
                                            novel.month,
                                            novel.weekNum,
                                            novel.genre,
                                            novel.id
                                        );
                                        navigate(`/novel/${novelKey}`);
                                        setSelectedWeekNovels(null);
                                    }}
                                >
                                    <img
                                        className="novel-list-cover"
                                        src={novel.imageUrl || '/novel_banner/default.png'}
                                        alt={novel.title}
                                    />
                                    <div className="novel-list-info">
                                        <div className="novel-list-novel-title" style={{ color: theme.text }}>{novel.title}</div>
                                        <div className={`novel-list-genre ${isDiaryTheme ? 'diary-theme' : ''}`}>
                                            {genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 이번주 일기 목록 모달 */}
            {showCurrentWeekDiaryModal && (
                <div className="novel-current-week-diary-modal" onClick={() => setShowCurrentWeekDiaryModal(false)}>
                    <div className="novel-current-week-diary-content" onClick={(e) => e.stopPropagation()}>
                        <div className="novel-current-week-diary-header">
                            <h3 className="novel-current-week-diary-title" style={{ color: theme.text }}>
                                {t('novel_this_week_diaries') || '이번주 일기 목록'}
                            </h3>
                            <button className="novel-current-week-diary-close" onClick={() => setShowCurrentWeekDiaryModal(false)} style={{ color: theme.text }}>
                                ×
                            </button>
                        </div>
                        <div className="novel-current-week-diary-list">
                            {currentWeekDiaries.length === 0 ? (
                                <div className="novel-current-week-diary-empty" style={{ color: theme.subText || '#888' }}>
                                    {t('novel_no_this_week_diaries') || '이번주에 작성한 일기가 없습니다.'}
                                </div>
                            ) : (
                                currentWeekDiaries.map((diary, index) => {
                                    const diaryDate = new Date(diary.date);
                                    const dateStr = `${diaryDate.getFullYear()}년 ${diaryDate.getMonth() + 1}월 ${diaryDate.getDate()}일`;

                                    // 이미지가 있으면 첫 번째 이미지 사용, 없으면 이모티콘 표시
                                    const hasImage = diary.imageUrls && diary.imageUrls.length > 0;
                                    const imageUrl = hasImage ? diary.imageUrls[0] : null;

                                    return (
                                        <div
                                            key={index}
                                            className="novel-current-week-diary-item"
                                        >
                                            {imageUrl ? (
                                                <img className="novel-current-week-diary-image" src={imageUrl} alt="일기 이미지" />
                                            ) : (
                                                <div className="novel-current-week-diary-image-placeholder">
                                                    📝
                                                </div>
                                            )}
                                            <div className="novel-current-week-diary-info">
                                                <div className="novel-current-week-diary-date" style={{ color: theme.subText || '#888' }}>{dateStr}</div>
                                                <div className="novel-current-week-diary-title-text" style={{ color: theme.text }}>
                                                    {diary.title || t('diary_no_title') || '제목 없음'}
                                                </div>
                                                {diary.content && (
                                                    <div className="novel-current-week-diary-preview" style={{ color: theme.subText || '#888' }}>
                                                        {diary.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Navigation />
        </div>
    );
};

export default Novel; 