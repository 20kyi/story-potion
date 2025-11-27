import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { createNovelUrl } from '../../utils/novelUtils';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc, Timestamp, updateDoc, increment, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '../../components/ui/ToastProvider';
import { motion } from 'framer-motion';
import PointIcon from '../../components/icons/PointIcon';
import { usePrompt } from '../../hooks/usePrompt';
import { useLanguage, useTranslation } from '../../LanguageContext';
import { useTheme } from '../../ThemeContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  padding-top: 40px;
  padding-bottom: 100px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const NovelHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
`;

const NovelCover = styled.img`
  width: 120px;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: none;
`;

const NovelInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const NovelTitle = styled.h1`
  font-size: 24px;
  color: ${({ theme }) => theme.primary};
  margin: 0 0 8px 0;
  font-weight: 600;
`;

const TitleInput = styled.input`
  font-size: 24px;
  color: ${({ theme }) => theme.primary};
  margin: 0 0 8px 0;
  font-weight: 600;
  border: none;
  background: transparent;
  width: 100%;
  border-bottom: 2px solid ${({ theme }) => theme.border};
  padding: 5px;
  &:focus {
    outline: none;
    border-bottom: 2px solid ${({ theme }) => theme.primary};
  }
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: #999;
`;

const DiariesSection = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  color: ${({ theme }) => theme.text};
  margin: 0 0 15px 0;
`;

const DiaryCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 15px;

  h3 {
    font-size: 16px;
    color: ${({ theme }) => theme.primary};
    margin: 0 0 10px 0;
  }

  p {
    font-size: 14px;
    color: ${({ theme }) => theme.cardText};
    margin: 0;
    white-space: pre-line;
  }

  .date {
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
  }
`;

const NovelContent = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.cardText};
  white-space: pre-line;
  padding: 20px;
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  margin-bottom: 10px;
  &:hover {
    background: ${({ theme }) => theme.secondary};
  }
`;

const loadingMessagesKeys = [
    'novel_loading_msg_1',
    'novel_loading_msg_2',
    'novel_loading_msg_3',
    'novel_loading_msg_4',
    'novel_loading_msg_5',
    'novel_loading_msg_6',
    'novel_loading_msg_7',
    'novel_loading_msg_8',
];

const potionImages = [
    { genre: '로맨스', key: 'novel_genre_romance', src: '/potion/romance.png' },
    { genre: '역사', key: 'novel_genre_historical', src: '/potion/historical.png' },
    { genre: '추리', key: 'novel_genre_mystery', src: '/potion/mystery.png' },
    { genre: '공포', key: 'novel_genre_horror', src: '/potion/horror.png' },
    { genre: '동화', key: 'novel_genre_fairytale', src: '/potion/fairytale.png' },
    { genre: '판타지', key: 'novel_genre_fantasy', src: '/potion/fantasy.png' },
];

const PotionSelectSection = styled.div`
  position: relative;
  width: 100%;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const PotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px 18px;
  justify-items: center;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  margin-top: 78px;
  margin-bottom: 40px;
  z-index: 2;
  position: relative;
  @media (min-width: 600px) {
    max-width: 540px;
    margin-top: 110px;
  }
`;

const PotionItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  transition: none;
  padding: 0;
  margin: 0;
  min-width: 0;
  min-height: 0;
  position: relative;
  border: none !important;
  box-shadow: none !important;
  background: none !important;
`;

const StyledPotionImg = styled(motion.img)`
  width: 80px;
  height: 80px;
  max-width: 90px;
  max-height: 90px;
  object-fit: contain;
  margin: 0;
  padding: 0;
  border: none !important;
  box-shadow: none !important;
  background: none !important;
`;

const PotionLabel = styled.div``;

const CreateOptionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const CreateOptionContent = styled.div`
  background: ${({ theme }) => theme.mode === 'dark' ? '#2A2A2A' : '#FFFFFF'};
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  opacity: 1;
  position: relative;
`;

const CreateOptionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 16px 0;
  text-align: center;
`;

const CreateOptionButton = styled.button`
  width: 100%;
  padding: 16px;
  margin-bottom: 4px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ isFree, theme }) =>
        isFree
            ? 'linear-gradient(135deg, rgba(228, 163, 13, 0.2) 0%, rgba(255, 226, 148, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(228, 98, 98, 0.15) 0%, rgba(203, 101, 101, 0.15) 100%)'};
  color: ${({ isFree }) => isFree ? '#e4a30d' : '#e46262'};
  border: ${({ isFree }) => isFree ? '2px solid #e4a30d' : '2px solid #e46262'};
  box-shadow: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ isFree }) =>
        isFree
            ? '0 4px 12px rgba(0,0,0,0.15)'
            : '0 4px 12px rgba(228, 98, 98, 0.2)'};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CreateOptionDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#666'};
  margin-bottom: 8px;
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  padding: 4px 8px;
`;


function NovelCreate({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useTranslation();
    const { language } = useLanguage();
    const theme = useTheme();
    const { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle, existingGenres = [], returnPath, novelDeleted, useFree } = location.state || {};
    // 이전 페이지 경로 저장 (없으면 기본값으로 '/novel')
    const previousPath = returnPath || '/novel';

    console.log('=== NovelCreate 컴포넌트 마운트 ===', new Date().toISOString());
    console.log('전달받은 데이터:', { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle, useFree });
    const [content, setContent] = useState('');
    const [weekDiaries, setWeekDiaries] = useState([]); // 내부 fetch용으로 복구
    const [isLoading, setIsLoading] = useState(false);
    const [isNovelGenerated, setIsNovelGenerated] = useState(false);
    const [selectedPotion, setSelectedPotion] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl);
    const [title, setTitle] = useState(initialTitle || t('novel_default_title'));
    const [loadingMessage, setLoadingMessage] = useState(t(loadingMessagesKeys[0]));
    const [isNovelSaved, setIsNovelSaved] = useState(false);
    const [narrativeSummary, setNarrativeSummary] = useState(''); // 서사 요약표 상태 추가
    const [currentPoints, setCurrentPoints] = useState(0);
    const [ownedPotions, setOwnedPotions] = useState({});
    const [isPremium, setIsPremium] = useState(false);
    const [showCreateOptionModal, setShowCreateOptionModal] = useState(false);
    const selectedGenre = selectedPotion !== null ? potionImages[selectedPotion].genre : null;

    // 뒤로가기 방지 로직 - 소설 생성 중일 때 뒤로가기 방지
    usePrompt(isLoading, (location, callback) => {
        if (window.confirm(t('novel_generate_confirm_leave'))) {
            callback();
        }
    });

    // 소설이 완성된 후 뒤로가기 방지 - useEffect에서의 자동 이동은 제거하고 handleGenerateNovel에서 직접 처리

    // 브라우저 뒤로가기 버튼 방지
    useEffect(() => {
        if (!isLoading) {
            console.log('뒤로가기 방지 비활성화');
            return;
        }

        console.log('뒤로가기 방지 활성화');

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = t('novel_generate_confirm_leave');
            return t('novel_generate_confirm_leave');
        };

        const handlePopState = (e) => {
            if (isLoading) {
                e.preventDefault();
                if (window.confirm(t('novel_generate_confirm_leave'))) {
                    window.history.back();
                } else {
                    window.history.pushState(null, '', window.location.href);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        // 히스토리에 현재 상태 추가
        window.history.pushState(null, '', window.location.href);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isLoading]);

    // 내부적으로만 일기 fetch (UI에는 노출 X)
    useEffect(() => {
        if (!user?.uid || !dateRange) {
            console.log('일기 fetch 스킵:', { hasUser: !!user?.uid, dateRange });
            setWeekDiaries([]);
            return;
        }

        console.log('일기 fetch useEffect 실행:', { userId: user.uid, dateRange });

        const fetchDiaries = async () => {
            const [startStr, endStr] = dateRange.split(' ~ ');
            const diariesRef = collection(db, 'diaries');
            const q = query(diariesRef,
                where('userId', '==', user.uid),
                where('date', '>=', startStr),
                where('date', '<=', endStr)
            );
            try {
                const querySnapshot = await getDocs(q);
                const diaries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const sortedDiaries = diaries.sort((a, b) => new Date(a.date) - new Date(b.date));
                console.log('일기 fetch 완료:', sortedDiaries.length);
                setWeekDiaries(sortedDiaries);
            } catch (error) {
                console.error('일기 fetch 실패:', error);
                setWeekDiaries([]);
            }
        };
        fetchDiaries();
    }, [user?.uid, dateRange]);

    // 포인트와 보유 포션 조회
    useEffect(() => {
        if (!user?.uid) {
            console.log('사용자 데이터 fetch 스킵: 사용자 없음');
            return;
        }

        console.log('사용자 데이터 fetch useEffect 실행:', { userId: user.uid });

        const fetchUserData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log('사용자 데이터 fetch 완료:', { point: userData.point, potions: userData.potions });
                    setCurrentPoints(userData.point || 0);
                    setOwnedPotions(userData.potions || {});
                    const isPremiumUser = userData.isMonthlyPremium || userData.isYearlyPremium || false;
                    setIsPremium(isPremiumUser);
                }
            } catch (error) {
                console.error('사용자 데이터 조회 실패:', error);
            }
        };
        fetchUserData();
    }, [user?.uid, novelDeleted]);

    // 이미 생성된 소설이 있는지 확인 (같은 장르인 경우에만 리다이렉트)
    // 이제는 여러 장르의 소설을 만들 수 있으므로, 같은 장르가 아닌 경우에는 리다이렉트하지 않음
    // 이 useEffect는 제거하거나 주석 처리 (기존 로직과 충돌)

    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };


    // 1) 소설 저장하기 버튼 및 handleSave 함수 제거
    // 2) handleGenerateNovel 함수에서 소설 생성 후 자동 저장 및 이동
    const handleGenerateNovel = async () => {
        console.log('=== 소설 생성 시작 ===');
        console.log('현재 상태:', { isLoading, isNovelGenerated, selectedGenre, weekDiaries: weekDiaries?.length });

        // 중복 생성 방지 - 이미 생성 중이거나 생성된 상태라면 중단
        if (isLoading || isNovelGenerated) {
            console.log('중복 생성 방지됨:', { isLoading, isNovelGenerated });
            toast.showToast(t('novel_generate_in_progress'), 'error');
            return;
        }

        if (!selectedGenre) {
            console.log('포션(장르) 미선택');
            toast.showToast(t('novel_select_potion'), 'error');
            return;
        }
        if (!weekDiaries || weekDiaries.length === 0) {
            console.log('일기 데이터 없음:', weekDiaries);
            toast.showToast(t('novel_generate_need_diary'), 'error');
            return;
        }

        // 일반 회원인 경우 같은 주차에 다른 장르 소설이 있는지 확인 (소설 생성 전에 체크)
        if (!isPremium && year && month && weekNum) {
            try {
                const existingNovelsQuery = query(
                    collection(db, 'novels'),
                    where('userId', '==', user.uid),
                    where('year', '==', year),
                    where('month', '==', month),
                    where('weekNum', '==', weekNum),
                    where('deleted', '!=', true)
                );
                const existingNovelsSnapshot = await getDocs(existingNovelsQuery);

                if (!existingNovelsSnapshot.empty) {
                    const existingNovels = existingNovelsSnapshot.docs.map(doc => doc.data());
                    const differentGenreNovel = existingNovels.find(novel => novel.genre !== selectedGenre);

                    if (differentGenreNovel) {
                        toast.showToast('일반 회원은 한 주에 한 장르의 소설만 생성할 수 있습니다.', 'error');
                        return;
                    }
                }
            } catch (error) {
                console.error('기존 소설 확인 실패:', error);
                // 에러가 나도 계속 진행 (서버에서도 체크하므로)
            }
        }

        // 포션 체크
        const selectedPotionId = potionImages[selectedPotion].genre === '로맨스' ? 'romance' :
            potionImages[selectedPotion].genre === '역사' ? 'historical' :
                potionImages[selectedPotion].genre === '추리' ? 'mystery' :
                    potionImages[selectedPotion].genre === '공포' ? 'horror' :
                        potionImages[selectedPotion].genre === '동화' ? 'fairytale' :
                            potionImages[selectedPotion].genre === '판타지' ? 'fantasy' : null;

        console.log('포션 체크:', { selectedPotionId, ownedPotions, selectedPotion });

        if (!selectedPotionId || !ownedPotions[selectedPotionId] || ownedPotions[selectedPotionId] <= 0) {
            console.log('포션 부족:', { selectedPotionId, ownedPotions: ownedPotions[selectedPotionId] });
            toast.showToast(t('novel_generate_need_potion'), 'error');
            // 포션 상점으로 이동
            setTimeout(() => {
                navigate('/my/potion-shop');
            }, 1500);
            return;
        }

        console.log('소설 생성 함수 호출 준비');
        const randomKey = loadingMessagesKeys[Math.floor(Math.random() * loadingMessagesKeys.length)];
        setLoadingMessage(t(randomKey));
        setIsLoading(true);
        const functions = getFunctions();
        // 타임아웃을 10분(600초)으로 설정 (Cloud Functions는 최대 540초이지만 클라이언트 타임아웃을 늘림)
        const generateNovel = httpsCallable(functions, 'generateNovel', { timeout: 600000 });
        // 일기 데이터를 구조화하여 전달 (내용, 날짜, 감정 포함)
        const diaryData = weekDiaries
            .filter(d => d.content && d.content.trim())
            .map(d => ({
                date: d.date,
                content: d.content,
                emotion: d.emotion || null,
            }));
        // 날짜 정보 없이 일기 내용만 추출 (기존 호환성 유지)
        const diaryContents = diaryData.map(d => d.content).join('\n\n');
        console.log('일기 내용 길이:', diaryContents.length);
        console.log('일기 데이터 개수:', diaryData.length);
        console.log('소설 생성 파라미터:', {
            diaryContents: diaryContents.substring(0, 100) + '...',
            diaryDataCount: diaryData.length,
            genre: selectedGenre,
            userName: user.displayName || '주인공',
            language,
        });

        try {
            console.log('소설 생성 함수 호출 중...');
            console.log('전송할 데이터:', {
                diaryContentsLength: diaryContents.length,
                diaryDataCount: diaryData.length,
                genre: selectedGenre,
                userName: user.displayName || '주인공',
                language,
                diaryContentsPreview: diaryContents.substring(0, 200)
            });

            const result = await generateNovel({
                diaryContents,
                diaryData, // 구조화된 일기 데이터 전달
                genre: selectedGenre,
                userName: user.displayName || '주인공',
                language,
            });
            console.log('소설 생성 완료:', {
                title: result.data.title,
                contentLength: result.data.content?.length,
                imageUrl: result.data.imageUrl,
                narrativeSummaryLength: result.data.narrativeSummary?.length
            });

            setContent(result.data.content);
            setTitle(result.data.title);
            setGeneratedImageUrl(result.data.imageUrl);
            setNarrativeSummary(result.data.narrativeSummary || ''); // 요약표 설정
            setIsNovelGenerated(true);
            // 소설 자동 저장 및 이동
            const newNovel = {
                userId: user.uid,
                title: result.data.title,
                imageUrl: result.data.imageUrl,
                week,
                dateRange,
                genre: selectedGenre,
                content: result.data.content,
                createdAt: new Date(),
                year,
                month,
                weekNum,
                isPublic: true, // 기본값: 공개
            };
            // 일반 회원인 경우 같은 주차에 다른 장르 소설이 있는지 확인 (저장 전 최종 체크)
            if (!isPremium && year && month && weekNum) {
                try {
                    const existingNovelsQuery = query(
                        collection(db, 'novels'),
                        where('userId', '==', user.uid),
                        where('year', '==', year),
                        where('month', '==', month),
                        where('weekNum', '==', weekNum),
                        where('deleted', '!=', true)
                    );
                    const existingNovelsSnapshot = await getDocs(existingNovelsQuery);

                    if (!existingNovelsSnapshot.empty) {
                        const existingNovels = existingNovelsSnapshot.docs.map(doc => doc.data());
                        const differentGenreNovel = existingNovels.find(novel => novel.genre !== selectedGenre);

                        if (differentGenreNovel) {
                            toast.showToast('일반 회원은 한 주에 한 장르의 소설만 생성할 수 있습니다.', 'error');
                            setIsLoading(false);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('기존 소설 확인 실패:', error);
                    // 에러가 나도 계속 진행
                }
            }

            console.log('저장할 소설 데이터:', newNovel);
            console.log('Firestore에 소설 저장 중...');
            const docRef = await addDoc(collection(db, 'novels'), newNovel);
            console.log('소설 저장 완료, 문서 ID:', docRef.id);

            // 소설 저장 성공 시 포션 1개 차감
            try {
                console.log('포션 차감 시도:', user?.uid, selectedPotionId);
                const newPotions = { ...ownedPotions };
                newPotions[selectedPotionId] = Math.max(0, newPotions[selectedPotionId] - 1);
                console.log('포션 차감 후 상태:', newPotions);

                await updateDoc(doc(db, "users", user.uid), {
                    potions: newPotions
                });

                // 포션 사용은 포인트를 차감하지 않으므로 포인트 내역에 기록하지 않음

                // 상태 업데이트
                setOwnedPotions(newPotions);
                console.log('포션 차감 성공');
            } catch (potionError) {
                toast.showToast(t('novel_point_deduct_failed'), 'error');
                console.error('포션 차감 에러:', potionError);
            }

            toast.showToast(t('novel_saved'), 'success');
            console.log('소설 생성 및 저장 완료, 소설 보기 페이지로 이동 예정');
            // 소설이 완성되면 소설 보기 페이지로 이동하고 히스토리에서 소설 생성 페이지 제거
            setTimeout(() => {
                const novelUrl = createNovelUrl(year, month, weekNum, selectedGenre, docRef.id);
                console.log('소설 보기 페이지로 이동 중...', novelUrl);
                // 이전 페이지 경로를 전달하여 뒤로가기 시 포션 선택 페이지를 건너뛰고 이전 페이지로 이동
                navigate(`/novel/${novelUrl}`, { state: { skipCreatePage: true, returnPath: previousPath } });
            }, 1000);
        } catch (error) {
            console.error('=== 소설 생성 실패 ===');
            console.error('에러 코드:', error.code);
            console.error('에러 메시지:', error.message);
            console.error('에러 details:', error.details);
            console.error('에러 전체 객체:', error);

            // 에러 상세 정보 추출
            let errorMessage = t('unknown_error');
            let shouldShowToast = true;

            // Firebase Functions 에러 메시지 추출
            if (error.message && error.message !== 'INTERNAL') {
                // HttpsError의 message는 직접 사용 가능
                errorMessage = error.message;
            } else if (error.details) {
                // details가 객체인 경우
                if (typeof error.details === 'object' && error.details.message) {
                    errorMessage = error.details.message;
                } else if (typeof error.details === 'string') {
                    errorMessage = error.details;
                }
            }

            // Deadline exceeded 에러 확인 (타임아웃)
            if (error.code === 'functions/deadline-exceeded' ||
                error.code === 'deadline-exceeded' ||
                error.message?.includes('deadline-exceeded') ||
                error.message?.includes('deadline')) {
                errorMessage = '소설 생성 시간이 초과되었습니다. 일기 내용이 많거나 서버가 바쁠 수 있습니다. 잠시 후 다시 시도해주세요.';
                shouldShowToast = true;
                setIsLoading(false);
                setIsNovelGenerated(false);
                toast.showToast(errorMessage, 'error');
                return;
            }

            // Rate limit 에러 확인
            if (error.details?.statusCode === 429 ||
                error.details?.status === 429 ||
                error.message?.includes('요청 한도') ||
                error.message?.includes('rate limit')) {
                errorMessage = t('openai_rate_limit_exceeded');
                toast.showToast(errorMessage, 'error');
                return;
            }

            // API 키 관련 에러
            if (error.message?.includes('API 키') || error.details?.message?.includes('API 키')) {
                errorMessage = 'OpenAI API 키 설정에 문제가 있습니다. 관리자에게 문의하세요.';
            }

            // 서버 내부 에러인 경우
            if (error.code === 'functions/internal' || error.code === 'functions/unknown') {
                console.error('서버 내부 에러 발생. Firebase 콘솔에서 Functions 로그를 확인하세요.');
                console.error('에러 원인 파악을 위한 추가 정보:');
                console.error('- 에러 코드:', error.code);
                console.error('- 에러 메시지:', error.message);
                console.error('- 에러 details:', error.details);
                console.error('- 에러 전체:', error);

                // 에러 메시지가 'INTERNAL'만 있는 경우 더 자세한 메시지로 교체
                if (errorMessage === t('unknown_error') || errorMessage === 'INTERNAL' || !errorMessage || errorMessage.trim() === '') {
                    errorMessage = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.';
                }

                // 에러 메시지에 원인 정보가 포함되어 있으면 그대로 사용
                if (error.message && error.message.includes('원인:')) {
                    errorMessage = error.message;
                }
            }

            // 최종 에러 메시지 표시
            if (shouldShowToast) {
                toast.showToast(`${t('novel_creation_fail')}: ${errorMessage}`, 'error');
            }
        } finally {
            console.log('소설 생성 프로세스 종료, 로딩 상태 해제');
            setIsLoading(false);
        }
    };

    // 소설 저장하기 함수 추가
    const handleSaveNovel = async () => {
        if (!isNovelGenerated || isNovelSaved) return;

        // 일반 회원인 경우 같은 주차에 다른 장르 소설이 있는지 확인
        if (!isPremium && year && month && weekNum) {
            try {
                const existingNovelsQuery = query(
                    collection(db, 'novels'),
                    where('userId', '==', user.uid),
                    where('year', '==', year),
                    where('month', '==', month),
                    where('weekNum', '==', weekNum),
                    where('deleted', '!=', true)
                );
                const existingNovelsSnapshot = await getDocs(existingNovelsQuery);

                if (!existingNovelsSnapshot.empty) {
                    const existingNovels = existingNovelsSnapshot.docs.map(doc => doc.data());
                    const differentGenreNovel = existingNovels.find(novel => novel.genre !== selectedGenre);

                    if (differentGenreNovel) {
                        toast.showToast('일반 회원은 한 주에 한 장르의 소설만 저장할 수 있습니다.', 'error');
                        return;
                    }
                }
            } catch (error) {
                console.error('기존 소설 확인 실패:', error);
                // 에러가 나도 계속 진행
            }
        }

        // week 필드에 년도 포함 (year, month, weekNum이 모두 있는 경우)
        const weekValue = (year && month && weekNum)
            ? `${year}년 ${month}월 ${weekNum}주차`
            : (week || '');
        // undefined/null/함수 등 비정상 값 제거 및 안전한 값 할당
        const newNovel = {
            userId: user?.uid || '',
            title: title || '',
            imageUrl: generatedImageUrl || '',
            week: weekValue,
            dateRange: dateRange || '',
            genre: selectedGenre || '',
            content: content || '',
            createdAt: Timestamp.now(), // Firestore Timestamp로 저장
            year: year || 0,
            month: month || 0,
            weekNum: weekNum || 0,
        };
        console.log('저장 시도 데이터:', newNovel);
        try {
            await addDoc(collection(db, 'novels'), newNovel);
            // 소설 저장 성공 시 포인트 50p 차감 (에러 발생 시 안내)
            try {
                console.log('포인트 차감 시도:', user?.uid);
                await updateDoc(doc(db, "users", user.uid), {
                    point: increment(-50)
                });
                console.log('포인트 차감 성공');
            } catch (pointError) {
                toast.showToast(t('novel_point_deduct_failed'), 'error');
                console.error('포인트 차감 에러:', pointError);
            }
            setIsNovelSaved(true);
            toast.showToast(t('novel_saved'), 'success');
        } catch (error) {
            toast.showToast(t('novel_save_failed'), 'error');
            console.error('Firestore 저장 에러:', error);
        }
    };

    // 소설 결과 화면에서 저장 버튼 추가
    return (
        <Container>
            <Header user={user} />
            {/* 무료 생성 모드일 때는 프리미엄 카드 표시, 아닐 때는 포션 정보 표시 */}
            {!isNovelGenerated && (
                <>
                    {/* 포션 정보 표시 */}
                    {useFree !== true && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '12px 20px',
                            background: 'rgba(52, 152, 243, 0.1)',
                            borderRadius: '25px',
                            margin: '0 auto 20px auto',
                            width: 'fit-content',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#3498f3'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <PointIcon width={16} height={16} color="#3498f3" />
                                {currentPoints.toLocaleString()}p
                            </div>
                            <div style={{ width: '1px', height: '20px', background: '#3498f3', opacity: 0.3 }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '12px' }}>보유 포션 </span>
                                {Object.values(ownedPotions).reduce((sum, count) => sum + (count || 0), 0)}개
                            </div>
                        </div>
                    )}
                </>
            )}
            {isLoading ? (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(255,255,255,0.97)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <img src="/app_logo/logo3.png" alt="로딩" style={{ width: 120, marginBottom: 32, animation: 'spin 1.5s linear infinite' }} />
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#e46262', marginBottom: 12, fontFamily: 'inherit' }}>
                        소설을 만드는 중입니다...
                    </div>
                    <div style={{ fontSize: 16, color: '#888' }}>{loadingMessage}</div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : (
                <>
                    {!isNovelGenerated ? (
                        <>
                            <PotionSelectSection>
                                {/* 첫 번째 줄 포션 */}
                                <PotionGrid style={{ marginTop: 40, marginBottom: 0 }}>
                                    {potionImages.slice(0, 3).map((potion, idx) => {
                                        const potionId = potion.genre === '로맨스' ? 'romance' :
                                            potion.genre === '역사' ? 'historical' :
                                                potion.genre === '추리' ? 'mystery' :
                                                    potion.genre === '공포' ? 'horror' :
                                                        potion.genre === '동화' ? 'fairytale' :
                                                            potion.genre === '판타지' ? 'fantasy' : null;

                                        // 무료 생성 모드는 useFree가 true일 때만 (프리미엄 무료권 기능 제거)
                                        // useFree가 false로 명시된 경우는 무료 모드를 사용하지 않음
                                        const isFreeMode = useFree === true;
                                        if (!isFreeMode && (!potionId || !ownedPotions[potionId] || ownedPotions[potionId] <= 0)) {
                                            return null;
                                        }

                                        // 일반 회원이고 이미 다른 장르의 소설이 있는 경우 비활성화
                                        const isDisabled = !isPremium && existingGenres.length > 0 && !existingGenres.includes(potion.genre);

                                        // 프리미엄 회원이 아니고 이미 생성된 장르는 표시하지 않음 (같은 장르는 표시)
                                        if (!isPremium && existingGenres.includes(potion.genre)) {
                                            return null;
                                        }

                                        return (
                                            <motion.div
                                                key={potion.genre}
                                                as={PotionItem}
                                                selected={selectedPotion === idx}
                                                onClick={isDisabled ? undefined : () => setSelectedPotion(idx)}
                                                whileHover={isDisabled ? {} : { scale: 1.03, rotate: -4 }}
                                                whileTap={isDisabled ? {} : { scale: 0.97, rotate: 2 }}
                                                animate={selectedPotion === idx ? { scale: 1.04, rotate: 1 } : { scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                style={{
                                                    zIndex: selectedPotion === idx ? 2 : 1,
                                                    opacity: isDisabled ? 0.5 : 1,
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <StyledPotionImg
                                                        src={potion.src}
                                                        alt={t(potion.key)}
                                                        selected={selectedPotion === idx}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        whileHover={isDisabled ? {} : { scale: 1.2 }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                                        style={{ opacity: isDisabled ? 0.5 : 1 }}
                                                    />
                                                    {/* 일반 회원이고 비활성화된 경우 PREMIUM 표시 */}
                                                    {isDisabled && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                            background: 'linear-gradient(135deg, rgba(228, 163, 13, 0.95) 0%, rgba(255, 226, 148, 0.95) 100%)',
                                                            color: '#fff',
                                                            borderRadius: '8px',
                                                            padding: '4px 8px',
                                                            fontSize: '10px',
                                                            fontWeight: '700',
                                                            border: '2px solid #e4a30d',
                                                            boxShadow: '0 2px 8px rgba(228, 163, 13, 0.5)',
                                                            zIndex: 20,
                                                            whiteSpace: 'nowrap',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            <span>👑</span>
                                                            <span>PREMIUM</span>
                                                        </div>
                                                    )}
                                                    {/* 포션 개수 표시 (무료 모드가 아닐 때만) */}
                                                    {!isFreeMode && !isDisabled && potionId && ownedPotions[potionId] > 0 && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '-6px',
                                                            right: '-6px',
                                                            background: 'linear-gradient(135deg, #e46262 0%, #cb6565 100%)',
                                                            color: 'white',
                                                            borderRadius: '12px',
                                                            minWidth: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            fontWeight: '700',
                                                            border: '2px solid white',
                                                            boxShadow: '0 3px 8px rgba(228, 98, 98, 0.4), 0 1px 3px rgba(0,0,0,0.1)',
                                                            zIndex: 10,
                                                            padding: '0 4px'
                                                        }}>
                                                            {ownedPotions[potionId]}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </PotionGrid>
                                {/* 첫 번째 선반 */}
                                <img src="/shelf.png" alt="shelf" style={{ width: '90%', maxWidth: 420, marginTop: -10, marginBottom: 0, zIndex: 1, position: 'relative' }} />
                                {/* 두 번째 줄 포션 */}
                                <PotionGrid style={{ marginTop: 10, marginBottom: 0 }}>
                                    {potionImages.slice(3, 6).map((potion, idx) => {
                                        const potionId = potion.genre === '로맨스' ? 'romance' :
                                            potion.genre === '역사' ? 'historical' :
                                                potion.genre === '추리' ? 'mystery' :
                                                    potion.genre === '공포' ? 'horror' :
                                                        potion.genre === '동화' ? 'fairytale' :
                                                            potion.genre === '판타지' ? 'fantasy' : null;

                                        // 무료 생성 모드는 useFree가 true일 때만 (프리미엄 무료권 기능 제거)
                                        // useFree가 false로 명시된 경우는 무료 모드를 사용하지 않음
                                        const isFreeMode = useFree === true;
                                        if (!isFreeMode && (!potionId || !ownedPotions[potionId] || ownedPotions[potionId] <= 0)) {
                                            return null;
                                        }

                                        // 이미 생성된 장르는 선택할 수 없도록 필터링
                                        if (existingGenres.includes(potion.genre)) {
                                            return null;
                                        }

                                        return (
                                            <motion.div
                                                key={potion.genre}
                                                as={PotionItem}
                                                selected={selectedPotion === idx + 3}
                                                onClick={() => setSelectedPotion(idx + 3)}
                                                whileHover={{ scale: 1.03, rotate: -4 }}
                                                whileTap={{ scale: 0.97, rotate: 2 }}
                                                animate={selectedPotion === idx + 3 ? { scale: 1.04, rotate: 1 } : { scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                style={{ zIndex: selectedPotion === idx + 3 ? 2 : 1 }}
                                            >
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <StyledPotionImg
                                                        src={potion.src}
                                                        alt={t(potion.key)}
                                                        selected={selectedPotion === idx + 3}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        whileHover={{ scale: 1.2 }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                                    />
                                                    {/* 포션 개수 표시 (무료 모드가 아닐 때만) */}
                                                    {!isFreeMode && potionId && ownedPotions[potionId] > 0 && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '-6px',
                                                            right: '-6px',
                                                            background: 'linear-gradient(135deg, #e46262 0%, #cb6565 100%)',
                                                            color: 'white',
                                                            borderRadius: '12px',
                                                            minWidth: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            fontWeight: '700',
                                                            border: '2px solid white',
                                                            boxShadow: '0 3px 8px rgba(228, 98, 98, 0.4), 0 1px 3px rgba(0,0,0,0.1)',
                                                            zIndex: 10,
                                                            padding: '0 4px'
                                                        }}>
                                                            {ownedPotions[potionId]}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </PotionGrid>
                                {/* 두 번째 선반 */}
                                <img src="/shelf.png" alt="shelf" style={{ width: '90%', maxWidth: 420, marginTop: -10, marginBottom: 30, zIndex: 1, position: 'relative' }} />

                                {/* 포션이 없을 때 안내 (useFree가 false이거나 무료권이 없고 포션이 없을 때) */}
                                {Object.values(ownedPotions).every(count => !count || count <= 0) && (
                                    <div style={{
                                        textAlign: 'center',
                                        marginTop: '20px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{
                                            fontSize: '16px',
                                            color: '#e46262',
                                            marginBottom: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {t('no_potions_available')}
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#666',
                                            marginBottom: '16px'
                                        }}>
                                            {t('buy_potions_from_shop')}
                                        </div>
                                        <button
                                            onClick={() => navigate('/my/potion-shop')}
                                            style={{
                                                background: '#3498f3',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '25px',
                                                padding: '12px 24px',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(52, 152, 243, 0.3)'
                                            }}
                                        >
                                            {t('go_to_potion_shop')}
                                        </button>
                                    </div>
                                )}


                                {/* 소설 생성 버튼 및 책 이미지 */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 24 }}>
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: '80%',
                                            maxWidth: 360,
                                            display: 'block',
                                            zIndex: 1,
                                            cursor: selectedPotion !== null && !isLoading ? 'pointer' : 'default',
                                            opacity: selectedPotion === null || isLoading ? 0.5 : 1,
                                        }}
                                        onClick={selectedPotion !== null && !isLoading ? () => {
                                            // useFree가 false로 명시된 경우 포션만 사용
                                            if (useFree === false) {
                                                const hasPotions = selectedPotion !== null && (() => {
                                                    const potionId = potionImages[selectedPotion].genre === '로맨스' ? 'romance' :
                                                        potionImages[selectedPotion].genre === '역사' ? 'historical' :
                                                            potionImages[selectedPotion].genre === '추리' ? 'mystery' :
                                                                potionImages[selectedPotion].genre === '공포' ? 'horror' :
                                                                    potionImages[selectedPotion].genre === '동화' ? 'fairytale' :
                                                                        potionImages[selectedPotion].genre === '판타지' ? 'fantasy' : null;
                                                    return potionId && ownedPotions[potionId] && ownedPotions[potionId] > 0;
                                                })();
                                                if (hasPotions) {
                                                    handleGenerateNovel(false);
                                                } else {
                                                    toast.showToast(t('novel_generate_need_potion'), 'error');
                                                }
                                                return;
                                            }

                                            // 포션 사용만 가능 (프리미엄 무료권 기능 제거)
                                            const hasPotions = selectedPotion !== null && (() => {
                                                const potionId = potionImages[selectedPotion].genre === '로맨스' ? 'romance' :
                                                    potionImages[selectedPotion].genre === '역사' ? 'historical' :
                                                        potionImages[selectedPotion].genre === '추리' ? 'mystery' :
                                                            potionImages[selectedPotion].genre === '공포' ? 'horror' :
                                                                potionImages[selectedPotion].genre === '동화' ? 'fairytale' :
                                                                    potionImages[selectedPotion].genre === '판타지' ? 'fantasy' : null;
                                                return potionId && ownedPotions[potionId] && ownedPotions[potionId] > 0;
                                            })();

                                            if (hasPotions) {
                                                // 포션이 있으면 포션 사용
                                                handleGenerateNovel(false);
                                            } else {
                                                // 포션이 없으면 에러 메시지
                                                toast.showToast(t('novel_generate_need_potion'), 'error');
                                            }
                                        } : undefined}
                                        aria-disabled={selectedPotion === null || isLoading}
                                    >
                                        <img src="/book.png" alt="book" style={{ width: '100%', display: 'block' }} />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0, width: '100%', height: '100%',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 16, color: '#fff', textShadow: '0 2px 8px #0008',
                                                pointerEvents: 'none',
                                                userSelect: 'none',
                                                whiteSpace: 'nowrap',
                                                padding: '0 8px',
                                            }}
                                        >
                                            {isLoading
                                                ? loadingMessage
                                                : selectedPotion !== null
                                                    ? t('novel_generate_button_with_genre', { genre: t(potionImages[selectedPotion].key) })
                                                    : t('novel_generate_button')}
                                            {selectedPotion !== null && !isLoading && (() => {
                                                // useFree가 false로 명시된 경우 포션 사용만 표시
                                                if (useFree === false) {
                                                    const hasPotions = (() => {
                                                        const potionId = potionImages[selectedPotion].genre === '로맨스' ? 'romance' :
                                                            potionImages[selectedPotion].genre === '역사' ? 'historical' :
                                                                potionImages[selectedPotion].genre === '추리' ? 'mystery' :
                                                                    potionImages[selectedPotion].genre === '공포' ? 'horror' :
                                                                        potionImages[selectedPotion].genre === '동화' ? 'fairytale' :
                                                                            potionImages[selectedPotion].genre === '판타지' ? 'fantasy' : null;
                                                        return potionId && ownedPotions[potionId] && ownedPotions[potionId] > 0;
                                                    })();
                                                    if (hasPotions) {
                                                        return (
                                                            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9, whiteSpace: 'nowrap' }}>
                                                                {t('novel_generate_potion_use')}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }


                                                const hasPotions = (() => {
                                                    const potionId = potionImages[selectedPotion].genre === '로맨스' ? 'romance' :
                                                        potionImages[selectedPotion].genre === '역사' ? 'historical' :
                                                            potionImages[selectedPotion].genre === '추리' ? 'mystery' :
                                                                potionImages[selectedPotion].genre === '공포' ? 'horror' :
                                                                    potionImages[selectedPotion].genre === '동화' ? 'fairytale' :
                                                                        potionImages[selectedPotion].genre === '판타지' ? 'fantasy' : null;
                                                    return potionId && ownedPotions[potionId] && ownedPotions[potionId] > 0;
                                                })();

                                                // 포션 사용만 가능 (프리미엄 무료권 기능 제거)
                                                if (hasPotions) {
                                                    return (
                                                        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9, whiteSpace: 'nowrap' }}>
                                                            {t('novel_generate_potion_use')}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </PotionSelectSection>
                        </>
                    ) : null}
                </>
            )}
            {isNovelGenerated && (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '60vh', width: '100%',
                }}>
                    {/* 소설 표지 */}
                    {generatedImageUrl && (
                        <img src={generatedImageUrl} alt="소설 표지" style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }} />
                    )}
                    {/* 소설 제목 */}
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e46262', marginBottom: 18, textAlign: 'center', fontFamily: 'inherit' }}>{title}</h2>

                    {/* 서사 요약표 표시 */}
                    {narrativeSummary && (
                        <div style={{
                            width: '100%',
                            maxWidth: 480,
                            marginBottom: 24,
                            background: 'linear-gradient(135deg, rgba(228, 98, 98, 0.08) 0%, rgba(203, 101, 101, 0.08) 100%)',
                            borderRadius: 16,
                            padding: 24,
                            border: '2px solid rgba(228, 98, 98, 0.25)',
                            boxShadow: '0 4px 12px rgba(228, 98, 98, 0.15)',
                        }}>
                            <h3 style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: '#e46262',
                                marginBottom: 16,
                                textAlign: 'center',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}>
                                <span>📊</span>
                                <span>7일간의 서사 요약표</span>
                            </h3>
                            <div style={{
                                fontSize: 14,
                                color: '#444',
                                lineHeight: 1.9,
                                whiteSpace: 'pre-line',
                                textAlign: 'left',
                                background: '#fff',
                                borderRadius: 10,
                                padding: 20,
                                maxHeight: '500px',
                                overflowY: 'auto',
                                border: '1px solid rgba(228, 98, 98, 0.1)',
                            }}>
                                {narrativeSummary}
                            </div>
                        </div>
                    )}

                    {/* 소설 내용 */}
                    <div style={{ fontSize: 16, color: '#333', background: '#fff', borderRadius: 12, padding: 24, maxWidth: 480, width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'left', whiteSpace: 'pre-line' }}>
                        {content}
                    </div>
                    {/* 저장하기 버튼 */}
                    {!isNovelSaved && (
                        <Button onClick={handleSaveNovel} style={{ marginTop: 24 }}>
                            {t('novel_save')}
                        </Button>
                    )}
                    {isNovelSaved && (
                        <div style={{ color: '#4caf50', marginTop: 16 }}>{t('novel_save_done')}</div>
                    )}
                </div>
            )}

            {/* 소설 생성 방법 선택 모달 */}
            {showCreateOptionModal && (
                <CreateOptionModal onClick={() => setShowCreateOptionModal(false)}>
                    <CreateOptionContent onClick={(e) => e.stopPropagation()} theme={theme}>
                        <CloseButton onClick={() => setShowCreateOptionModal(false)} theme={theme}>×</CloseButton>
                        <CreateOptionTitle theme={theme}>소설 생성 방법 선택</CreateOptionTitle>
                        <CreateOptionButton
                            isFree={true}
                            onClick={() => {
                                handleGenerateNovel(true);
                                setShowCreateOptionModal(false);
                            }}
                            theme={theme}
                        >
                            🪄 프리미엄 무료권 사용
                        </CreateOptionButton>
                        <CreateOptionDesc theme={theme} style={{ marginBottom: '12px' }}>
                            무료로 소설을 생성합니다 (매월 자동 충전)
                        </CreateOptionDesc>
                        <CreateOptionButton
                            isFree={false}
                            onClick={() => {
                                handleGenerateNovel(false);
                                setShowCreateOptionModal(false);
                            }}
                            theme={theme}
                        >
                            🧪 포션 사용
                        </CreateOptionButton>
                        <CreateOptionDesc theme={theme}>
                            보유한 포션 1개를 사용합니다
                        </CreateOptionDesc>
                    </CreateOptionContent>
                </CreateOptionModal>
            )}

            <Navigation />
        </Container>
    );
}

export default NovelCreate;