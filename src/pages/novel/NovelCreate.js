import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc, Timestamp, updateDoc, increment, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '../../components/ui/ToastProvider';
import { motion } from 'framer-motion';
import PointIcon from '../../components/icons/PointIcon';
import { usePrompt } from '../../hooks/usePrompt';
import { useLanguage, useTranslation } from '../../LanguageContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  padding-top: 40px;
  padding-bottom: 100px;
  margin: 40px auto;
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


function NovelCreate({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle } = location.state || {};

    console.log('=== NovelCreate 컴포넌트 마운트 ===', new Date().toISOString());
    console.log('전달받은 데이터:', { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle });
    const [content, setContent] = useState('');
    const [weekDiaries, setWeekDiaries] = useState([]); // 내부 fetch용으로 복구
    const [isLoading, setIsLoading] = useState(false);
    const [isNovelGenerated, setIsNovelGenerated] = useState(false);
    const [selectedPotion, setSelectedPotion] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl);
    const [title, setTitle] = useState(initialTitle || t('novel_default_title'));
    const [loadingMessage, setLoadingMessage] = useState(t(loadingMessagesKeys[0]));
    const [isNovelSaved, setIsNovelSaved] = useState(false);
    const [currentPoints, setCurrentPoints] = useState(0);
    const [ownedPotions, setOwnedPotions] = useState({});
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
                }
            } catch (error) {
                console.error('사용자 데이터 조회 실패:', error);
            }
        };
        fetchUserData();
    }, [user?.uid]);

    // 이미 생성된 소설이 있는지 확인하고 있다면 해당 소설 페이지로 리다이렉트
    useEffect(() => {
        if (!user?.uid || !year || !month || !weekNum) {
            console.log('기존 소설 확인 스킵:', { hasUser: !!user?.uid, year, month, weekNum });
            return;
        }

        console.log('기존 소설 확인 useEffect 실행:', { userId: user.uid, year, month, weekNum });

        const checkExistingNovel = async () => {
            try {
                console.log('기존 소설 확인 중:', { userId: user.uid, year, month, weekNum });
                const novelsRef = collection(db, 'novels');
                const q = query(
                    novelsRef,
                    where('userId', '==', user.uid),
                    where('year', '==', year),
                    where('month', '==', month),
                    where('weekNum', '==', weekNum)
                );
                const querySnapshot = await getDocs(q);

                console.log('조회된 소설 개수:', querySnapshot.size);

                if (!querySnapshot.empty) {
                    // 이미 소설이 존재하면 해당 소설 페이지로 이동
                    const existingNovel = querySnapshot.docs[0];
                    const dateKey = `${year}-${month}-${weekNum}`;
                    console.log('기존 소설 발견, 이동:', dateKey);
                    toast.showToast('이미 생성된 소설이 있습니다.', 'info');
                    navigate(`/novel/${dateKey}`);
                } else {
                    console.log('기존 소설 없음, 생성 가능');
                }
            } catch (error) {
                console.error('기존 소설 확인 실패:', error);
            }
        };

        checkExistingNovel();
    }, [user?.uid, year, month, weekNum]); // navigate, toast 제거

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
        const generateNovel = httpsCallable(functions, 'generateNovel');
        const diaryContents = weekDiaries.map(d => `${d.date}:\n${d.content}`).join('\n\n');
        console.log('일기 내용 길이:', diaryContents.length);
        console.log('소설 생성 파라미터:', {
            diaryContents: diaryContents.substring(0, 100) + '...',
            genre: selectedGenre,
            userName: user.displayName || '주인공',
            language,
        });

        try {
            console.log('소설 생성 함수 호출 중...');
            console.log('전송할 데이터:', {
                diaryContentsLength: diaryContents.length,
                genre: selectedGenre,
                userName: user.displayName || '주인공',
                language,
                diaryContentsPreview: diaryContents.substring(0, 200)
            });

            const result = await generateNovel({
                diaryContents,
                genre: selectedGenre,
                userName: user.displayName || '주인공',
                language,
            });
            console.log('소설 생성 완료:', {
                title: result.data.title,
                contentLength: result.data.content?.length,
                imageUrl: result.data.imageUrl
            });

            setContent(result.data.content);
            setTitle(result.data.title);
            setGeneratedImageUrl(result.data.imageUrl);
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
            };
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
                const dateKey = `${year}-${month}-${weekNum}`;
                console.log('소설 보기 페이지로 이동 중...', dateKey);
                // 히스토리에서 현재 페이지(소설 생성 페이지)를 소설 보기 페이지로 교체
                window.history.replaceState(null, '', `/novel/${dateKey}`);
                navigate(`/novel/${dateKey}`, { replace: true });
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
        // undefined/null/함수 등 비정상 값 제거 및 안전한 값 할당
        const newNovel = {
            userId: user?.uid || '',
            title: title || '',
            imageUrl: generatedImageUrl || '',
            week: week || '',
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
            {/* 포션 정보 표시 - 소설이 완성되지 않았을 때만 표시 */}
            {!isNovelGenerated && (
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

                                    // 보유한 포션이 없으면 표시하지 않음
                                    if (!potionId || !ownedPotions[potionId] || ownedPotions[potionId] <= 0) {
                                        return null;
                                    }

                                    return (
                                        <motion.div
                                            key={potion.genre}
                                            as={PotionItem}
                                            selected={selectedPotion === idx}
                                            onClick={() => setSelectedPotion(idx)}
                                            whileHover={{ scale: 1.03, rotate: -4 }}
                                            whileTap={{ scale: 0.97, rotate: 2 }}
                                            animate={selectedPotion === idx ? { scale: 1.04, rotate: 1 } : { scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            style={{ zIndex: selectedPotion === idx ? 2 : 1 }}
                                        >
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <StyledPotionImg
                                                    src={potion.src}
                                                    alt={t(potion.key)}
                                                    selected={selectedPotion === idx}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    whileHover={{ scale: 1.2 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                                />
                                                {/* 포션 개수 표시 */}
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

                                    // 보유한 포션이 없으면 표시하지 않음
                                    if (!potionId || !ownedPotions[potionId] || ownedPotions[potionId] <= 0) {
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
                                                {/* 포션 개수 표시 */}
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
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </PotionGrid>
                            {/* 두 번째 선반 */}
                            <img src="/shelf.png" alt="shelf" style={{ width: '90%', maxWidth: 420, marginTop: -10, marginBottom: 30, zIndex: 1, position: 'relative' }} />

                            {/* 포션이 없을 때 안내 */}
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
                            <div
                                style={{
                                    position: 'relative',
                                    width: '60%',
                                    maxWidth: 260,
                                    margin: '24px auto 0 auto',
                                    display: 'block',
                                    zIndex: 1,
                                    cursor: selectedPotion !== null && !isLoading ? 'pointer' : 'default',
                                    opacity: selectedPotion === null || isLoading ? 0.5 : 1,
                                }}
                                onClick={selectedPotion !== null && !isLoading ? handleGenerateNovel : undefined}
                                aria-disabled={selectedPotion === null || isLoading}
                            >
                                <img src="/book.png" alt="book" style={{ width: '100%', display: 'block' }} />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, width: '100%', height: '100%',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 18, color: '#fff', textShadow: '0 2px 8px #0008',
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    }}
                                >
                                    {isLoading
                                        ? loadingMessage
                                        : selectedPotion !== null
                                            ? t('novel_generate_button_with_genre', { genre: t(potionImages[selectedPotion].key) })
                                            : t('novel_generate_button')}
                                    {selectedPotion !== null && !isLoading && (
                                        <div style={{ fontSize: 14, marginTop: 4, opacity: 0.9 }}>
                                            {t('novel_generate_potion_use')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PotionSelectSection>
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
            <Navigation />
        </Container>
    );
}

export default NovelCreate;