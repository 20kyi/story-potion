import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
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

function NovelCreate({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle } = location.state || {};
    const [content, setContent] = useState('');
    const [weekDiaries, setWeekDiaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNovelGenerated, setIsNovelGenerated] = useState(false);
    const [selectedPotion, setSelectedPotion] = useState(0);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl);
    const [isCoverLoading, setIsCoverLoading] = useState(false);
    const [title, setTitle] = useState(initialTitle || '나의 소설');
    const [isTitleLoading, setIsTitleLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const selectedGenre = potionImages[selectedPotion].genre;

    useEffect(() => {
        if (!user || !dateRange) {
            setIsLoading(false);
            return;
        };

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
                console.error("Error fetching diaries: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiaries();
    }, [user, dateRange]);

    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const handleGenerateNovel = async () => {
        if (weekDiaries.length === 0) {
            alert("소설을 생성할 일기가 없습니다.");
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

        } catch (error) {
            alert("소설 생성에 실패했습니다. 다시 시도해주세요.");
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
            alert('소설이 저장되었습니다.');
            const dateKey = `${year}-${month}-${weekNum}`;
            navigate(`/novel/${dateKey}`);
        } catch (error) {
            alert('소설 저장에 실패했습니다.');
        }
    };

    const potionRadius = 110;
    const potionCenterX = 160;
    const potionCenterY = 140;

    if (isLoading) {
        return (
            <Container>
                <Header user={user} />
                <div>{loadingMessage}</div>
                <Navigation />
            </Container>
        );
    }

    return (
        <Container>
            <Header user={user} />
            <NovelHeader>
                <NovelCover src={generatedImageUrl || '/logo2.png'} alt="Novel Cover" />
                <NovelInfo>
                    {isNovelGenerated ? (
                        <TitleInput
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="소설 제목을 입력하세요"
                        />
                    ) : (
                        <NovelTitle>{title}</NovelTitle>
                    )}
                    <NovelDate>{dateRange}</NovelDate>
                </NovelInfo>
            </NovelHeader>

            <DiariesSection>
                <SectionTitle>이번 주 작성한 일기</SectionTitle>
                {weekDiaries.length > 0 ? (
                    weekDiaries.map(diary => (
                        <DiaryCard key={diary.id}>
                            <div className="date">{formatDisplayDate(diary.date)}</div>
                            <h3>{diary.title}</h3>
                            <p>{diary.content}</p>
                        </DiaryCard>
                    ))
                ) : (
                    <DiaryCard>
                        <p>이번 주에는 작성된 일기가 없습니다.</p>
                    </DiaryCard>
                )}
            </DiariesSection>

            {!isNovelGenerated && (
                <>
                    <SectionTitle>어떤 마법의 포션을 선택할까요?</SectionTitle>
                    <div style={{ position: 'relative', width: 320, height: 280, margin: '0 auto 24px' }}>
                        {potionImages.map((potion, idx) => {
                            const angle = ((idx - selectedPotion) * (360 / potionImages.length)) * (Math.PI / 180);
                            const x = potionCenterX + potionRadius * Math.sin(angle);
                            const y = potionCenterY - potionRadius * Math.cos(angle);
                            return (
                                <img
                                    key={potion.genre}
                                    src={potion.src}
                                    alt={potion.label}
                                    style={{
                                        position: 'absolute',
                                        left: x - 40,
                                        top: y - 40,
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        boxShadow: idx === selectedPotion ? '0 0 16px #fff' : 'none',
                                        opacity: idx === selectedPotion ? 1 : 0.7,
                                        zIndex: idx === selectedPotion ? 2 : 1,
                                        transform: idx === selectedPotion ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setSelectedPotion(idx)}
                                />
                            );
                        })}
                        <button
                            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', zIndex: 3 }}
                            onClick={() => setSelectedPotion((prev) => (prev - 1 + potionImages.length) % potionImages.length)}
                        >{'<'}</button>
                        <button
                            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', zIndex: 3 }}
                            onClick={() => setSelectedPotion((prev) => (prev + 1) % potionImages.length)}
                        >{'>'}</button>
                    </div>
                    <div style={{ fontSize: 20, marginBottom: 16, color: '#e97ec7', fontWeight: 600 }}>{potionImages[selectedPotion].label} 포션</div>
                    <div className="desc" style={{ marginBottom: 24, color: '#333', fontSize: 16 }}>당신의 하루를 {potionImages[selectedPotion].label}하게 풀어드립니다.</div>
                </>
            )}

            {!isNovelGenerated ? (
                <Button onClick={handleGenerateNovel} disabled={isLoading}>
                    {isLoading ? '소설 생성 중...' : `${potionImages[selectedPotion].label} 포션 선택`}
                </Button>
            ) : (
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