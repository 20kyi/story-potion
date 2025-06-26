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
  background-color: #fff;
  padding: 20px;
  padding-top: 70px;
  padding-bottom: 100px;
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
  color: #e46262;
  margin: 0 0 8px 0;
  font-weight: 600;
`;

const TitleInput = styled.input`
  font-size: 24px;
  color: #e46262;
  margin: 0 0 8px 0;
  font-weight: 600;
  border: none;
  background: transparent;
  width: 100%;
  border-bottom: 2px solid #f0f0f0;
  padding: 5px;
  &:focus {
    outline: none;
    border-bottom: 2px solid #e46262;
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
  color: #666;
  margin: 0 0 15px 0;
`;

const DiaryCard = styled.div`
  background: #fff8f8;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 15px;

  h3 {
    font-size: 16px;
    color: #e46262;
    margin: 0 0 10px 0;
  }

  p {
    font-size: 14px;
    color: #666;
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
  color: #333;
  white-space: pre-line;
  padding: 20px;
  background: #fff8f8;
  border-radius: 15px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background: #e46262;
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
    background: #d45252;
  }
`;

const GenreSelection = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const GenreButton = styled.button`
  background: ${({ selected }) => (selected ? '#e46262' : '#f0f0f0')};
  color: ${({ selected }) => (selected ? 'white' : '#333')};
  border: 1px solid ${({ selected }) => (selected ? '#e46262' : '#ddd')};
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #d45252;
    color: white;
  }
`;

const AiButton = styled(Button)`
  background: #6c81e7;
  width: auto;
  padding: 8px 15px;
  font-size: 14px;
  margin: 0 0 0 10px;

  &:hover {
    background: #5a6dbf;
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

function NovelCreate({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { year, month, weekNum, week, dateRange, imageUrl, title: initialTitle } = location.state || {};
    const [content, setContent] = useState('');
    const [weekDiaries, setWeekDiaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNovelGenerated, setIsNovelGenerated] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl);
    const [isCoverLoading, setIsCoverLoading] = useState(false);
    const [title, setTitle] = useState(initialTitle || '나의 소설');
    const [isTitleLoading, setIsTitleLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    const genres = ['로맨스', '역사', '추리', '공포', '동화', '판타지'];

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
        if (!selectedGenre) {
            alert("소설의 장르를 선택해주세요.");
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
            console.error("Error generating novel:", error);
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
            console.error("소설 저장 중 오류 발생: ", error);
            alert('소설 저장에 실패했습니다.');
        }
    };

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
                    <SectionTitle>어떤 장르의 소설을 만들어볼까요?</SectionTitle>
                    <GenreSelection>
                        {genres.map(genre => (
                            <GenreButton
                                key={genre}
                                selected={selectedGenre === genre}
                                onClick={() => setSelectedGenre(genre)}
                            >
                                {genre}
                            </GenreButton>
                        ))}
                    </GenreSelection>
                </>
            )}

            {!isNovelGenerated ? (
                <Button onClick={handleGenerateNovel} disabled={!selectedGenre || isLoading}>
                    {isLoading ? '소설 생성 중...' : (selectedGenre ? `'${selectedGenre}' 장르로 소설 만들기` : '장르를 선택해주세요')}
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