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

const loadingMessages = [
    "당신의 일기가 한 편의 소설로 변신하는 중이에요…",
    "마법사가 당신의 이야기를 엮고 있어요. 잠시만 기다려주세요!",
    "소설의 세계를 상상하는 중… 조금만 기다려주세요!",
    "주인공이 모험을 시작할 준비를 하고 있어요!",
    "감동적인 한 주의 이야기를 소설로 빚는 중입니다…",
    "AI 작가가 열심히 집필 중입니다. 잠시만 기다려주세요!",
    "여러분의 일기가 소설로 태어나는 중이에요!",
    "스토리 포션이 마법을 부리는 중입니다…"
];

const potionImages = [
    { genre: '로맨스', src: '/potion/romance.png', label: '로맨스' },
    { genre: '역사', src: '/potion/historical.png', label: '역사' },
    { genre: '추리', src: '/potion/mystery.png', label: '추리' },
    { genre: '공포', src: '/potion/horror.png', label: '공포' },
    { genre: '동화', src: '/potion/fairytale.png', label: '동화' },
    { genre: '판타지', src: '/potion/fantasy.png', label: '판타지' },
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
    const { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle } = location.state || {};
    
    console.log('=== NovelCreate 컴포넌트 마운트 ===', new Date().toISOString());
    console.log('전달받은 데이터:', { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle });
    const [content, setContent] = useState('');
    const [weekDiaries, setWeekDiaries] = useState([]); // 내부 fetch용으로 복구
    const [isLoading, setIsLoading] = useState(false);
    const [isNovelGenerated, setIsNovelGenerated] = useState(false);
    const [selectedPotion, setSelectedPotion] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl);
    const [title, setTitle] = useState(initialTitle || '나의 소설');
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [isNovelSaved, setIsNovelSaved] = useState(false);
    const [currentPoints, setCurrentPoints] = useState(0);
    const [ownedPotions, setOwnedPotions] = useState({});
    const selectedGenre = selectedPotion !== null ? potionImages[selectedPotion].genre : null;

    // 뒤로가기 방지 로직 - 소설 생성 중일 때 뒤로가기 방지
    usePrompt(isLoading, (location, callback) => {
        if (window.confirm('소설 생성 중입니다. 정말 나가시겠습니까?')) {
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
            e.returnValue = '소설 생성 중입니다. 정말 나가시겠습니까?';
            return '소설 생성 중입니다. 정말 나가시겠습니까?';
        };

        const handlePopState = (e) => {
            if (isLoading) {
                e.preventDefault();
                if (window.confirm('소설 생성 중입니다. 정말 나가시겠습니까?')) {
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
            toast.showToast('이미 소설 생성 중이거나 생성이 완료되었습니다.', 'error');
            return;
        }

        if (!selectedGenre) {
            console.log('포션(장르) 미선택');
            toast.showToast('포션(장르)을 선택해주세요!', 'error');
            return;
        }
        if (!weekDiaries || weekDiaries.length === 0) {
            console.log('일기 데이터 없음:', weekDiaries);
            toast.showToast('소설을 생성할 일기가 없습니다.', 'error');
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
            toast.showToast('해당 포션이 부족합니다. 포션 상점에서 구매해주세요.', 'error');
            // 포션 상점으로 이동
            setTimeout(() => {
                navigate('/my/potion-shop');
            }, 1500);
            return;
        }

        console.log('소설 생성 함수 호출 준비');
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        setIsLoading(true);
        const functions = getFunctions();
        const generateNovel = httpsCallable(functions, 'generateNovel');
        const diaryContents = weekDiaries.map(d => `${d.date}:\n${d.content}`).join('\n\n');
        console.log('일기 내용 길이:', diaryContents.length);
        console.log('소설 생성 파라미터:', { diaryContents: diaryContents.substring(0, 100) + '...', genre: selectedGenre, userName: user.displayName || '주인공' });
        
        try {
            console.log('소설 생성 함수 호출 중...');
            console.log('전송할 데이터:', {
                diaryContentsLength: diaryContents.length,
                genre: selectedGenre,
                userName: user.displayName || '주인공',
                diaryContentsPreview: diaryContents.substring(0, 200)
            });
            
            const result = await generateNovel({
                diaryContents,
                genre: selectedGenre,
                userName: user.displayName || '주인공'
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
                toast.showToast('포션 차감에 실패했습니다.', 'error');
                console.error('포션 차감 에러:', potionError);
            }
            toast.showToast('소설이 저장되었습니다! 소설을 확인해보세요.', 'success');
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
            console.error('소설 생성 실패:', error);
            console.error('에러 전체 객체:', JSON.stringify(error, null, 2));
            console.error('에러 상세:', {
                code: error.code,
                message: error.message,
                details: error.details,
                stack: error.stack,
                customData: error.customData,
                toString: error.toString()
            });
            
            // Rate limit 에러 확인
            if (error.details?.status === 429 || error.message?.includes('요청 한도')) {
                toast.showToast('OpenAI API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.', 'error');
                return;
            }
            
            // 네트워크 에러인지 확인
            if (error.code === 'functions/unknown' || error.code === 'internal') {
                console.error('서버 내부 에러 발생. Firebase 콘솔에서 Functions 로그를 확인하세요.');
            }
            
            // Firebase Functions 에러 메시지 추출
            let errorMessage = '알 수 없는 오류';

            // 서버에서 전달한 details에 메시지가 있는 경우 우선 사용
            if (error.details && typeof error.details === 'object') {
                if (error.details.message) {
                    errorMessage = error.details.message;
                }
            } else if (typeof error.details === 'string') {
                errorMessage = error.details;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.toString) {
                errorMessage = error.toString();
            }

            toast.showToast(`소설 생성 실패: ${errorMessage}`, 'error');
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
                toast.showToast('포인트 차감에 실패했습니다.', 'error');
                console.error('포인트 차감 에러:', pointError);
            }
            setIsNovelSaved(true);
            toast.showToast('소설이 저장되었습니다!', 'success');
        } catch (error) {
            toast.showToast('소설 저장에 실패했습니다.', 'error');
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
                        <span style={{ fontSize: '12px' }}>보유 포션:</span>
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
                                                    alt={potion.label}
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
                                                    alt={potion.label}
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
                                        보유한 포션이 없습니다
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#666',
                                        marginBottom: '16px'
                                    }}>
                                        포션 상점에서 포션을 구매해주세요
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
                                        포션 상점 가기
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
                                            ? `${potionImages[selectedPotion].label} 소설 만들기`
                                            : '소설 만들기'}
                                    {selectedPotion !== null && !isLoading && (
                                        <div style={{ fontSize: 14, marginTop: 4, opacity: 0.9 }}>
                                            포션 1개 사용
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
                            소설 저장하기
                        </Button>
                    )}
                    {isNovelSaved && (
                        <div style={{ color: '#4caf50', marginTop: 16 }}>저장 완료!</div>
                    )}
                </div>
            )}
            <Navigation />
        </Container>
    );
}

export default NovelCreate;