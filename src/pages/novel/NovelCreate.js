import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '../../components/ui/ToastProvider';
import { motion } from 'framer-motion';

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
    { genre: '추리', src: '/potion/mystery.png', label: '미스터리' },
    { genre: '공포', src: '/potion/horror.png', label: '공포' },
    { genre: '동화', src: '/potion/fairytale.png', label: '동화' },
    { genre: '판타지', src: '/potion/fantasy.png', label: '판타지' },
];

const PotionSelectSection = styled.div`
  position: relative;
  width: 100%;
  min-height: 480px;
  background: url('/bg_shelf_diary.png') center top/cover no-repeat;
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
    const [content, setContent] = useState('');
    const [weekDiaries, setWeekDiaries] = useState([]); // 내부 fetch용으로 복구
    const [isLoading, setIsLoading] = useState(false);
    const [isNovelGenerated, setIsNovelGenerated] = useState(false);
    const [selectedPotion, setSelectedPotion] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl);
    const [title, setTitle] = useState(initialTitle || '나의 소설');
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const selectedGenre = selectedPotion !== null ? potionImages[selectedPotion].genre : null;

    // 내부적으로만 일기 fetch (UI에는 노출 X)
    useEffect(() => {
        if (!user || !dateRange) {
            setWeekDiaries([]);
            return;
        }
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
                setWeekDiaries(sortedDiaries);
            } catch (error) {
                setWeekDiaries([]);
            }
        };
        fetchDiaries();
    }, [user, dateRange]);

    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const handleGenerateNovel = async () => {
        if (!selectedGenre) {
            toast.showToast('포션(장르)을 선택해주세요!', 'error');
            return;
        }
        if (!weekDiaries || weekDiaries.length === 0) {
            toast.showToast('소설을 생성할 일기가 없습니다.', 'error');
            return;
        }
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        setIsLoading(true);
        const functions = getFunctions();
        const generateNovel = httpsCallable(functions, 'generateNovel');
        const diaryContents = weekDiaries.map(d => `${d.date}:\n${d.content}`).join('\n\n');
        try {
            const result = await generateNovel({
                diaryContents,
                genre: selectedGenre,
                userName: user.displayName || '주인공'
            });
            setContent(result.data.content);
            setTitle(result.data.title);
            setGeneratedImageUrl(result.data.imageUrl);
            setIsNovelGenerated(true);
            toast.showToast('소설이 성공적으로 생성되었습니다!', 'success');
        } catch (error) {
            toast.showToast('소설 생성에 실패했습니다. 다시 시도해주세요.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!isNovelGenerated) {
            alert('먼저 소설을 생성해주세요.');
            return;
        }

        try {
            const newNovel = {
                userId: user.uid,
                title,
                imageUrl: generatedImageUrl,
                week,
                dateRange,
                genre: selectedGenre,
                content,
                createdAt: new Date(),
                year,
                month,
                weekNum,
            };
            await addDoc(collection(db, 'novels'), newNovel);
            toast.showToast('소설이 저장되었습니다!', 'success');
            const dateKey = `${year}-${month}-${weekNum}`;
            navigate(`/novel/${dateKey}`);
        } catch (error) {
            toast.showToast('소설 저장에 실패했습니다.', 'error');
        }
    };

    return (
        <Container>
            <Header user={user} />
            <PotionSelectSection>
                <PotionGrid>
                    {potionImages.map((potion, idx) => (
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
                            <StyledPotionImg
                                src={potion.src}
                                alt={potion.label}
                                selected={selectedPotion === idx}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.2 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                            />
                            {selectedPotion === idx && (
                                <motion.div
                                    as={PotionLabel}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                >
                                    {potion.label}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </PotionGrid>
                {!isNovelGenerated && (
                    <Button
                        onClick={handleGenerateNovel}
                        disabled={selectedPotion === null || isLoading}
                        style={{
                            opacity: selectedPotion === null ? 0.5 : 1,
                            margin: '0 auto',
                            marginTop: 40,
                            position: 'relative',
                            zIndex: 3,
                            maxWidth: 220,
                        }}
                    >
                        {isLoading ? loadingMessage : '소설 생성하기'}
                    </Button>
                )}
            </PotionSelectSection>
            {isNovelGenerated && (
                <>
                    <NovelContent>{content}</NovelContent>
                    <Button onClick={handleSave}>소설 저장하기</Button>
                </>
            )}
            <Navigation />
        </Container>
    );
}

export default NovelCreate;