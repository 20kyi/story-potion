import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
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

function NovelCreate({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { year, month, weekNum, week, dateRange, imageUrl, title } = location.state || {};
  const [content, setContent] = useState('');
  const [weekDiaries, setWeekDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNovelGenerated, setIsNovelGenerated] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState(imageUrl);
  const [isCoverLoading, setIsCoverLoading] = useState(false);

  const genres = ['로맨스', '사극', '추리', '공포', '동화', '판타지'];

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
      alert('소설을 생성할 일기가 없습니다.');
      return;
    }
    if (!selectedGenre) {
      alert('장르를 선택해주세요.');
      return;
    }

    setIsLoading(true);

    const diaryContents = weekDiaries
      .map(diary => `날짜: ${diary.date}\n제목: ${diary.title}\n내용: ${diary.content}`)
      .join('\n\n---\n\n');

    try {
      const functions = getFunctions();
      const generateNovel = httpsCallable(functions, 'generateNovel');
      const result = await generateNovel({
        diaryContents,
        genre: selectedGenre,
        userName: user.displayName || '나'
      });

      const novelContent = result.data.content;
      setContent(novelContent);
      setIsNovelGenerated(true);
    } catch (error) {
      console.error("Error generating novel: ", error);
      alert('소설 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCover = async () => {
    setIsCoverLoading(true);
    try {
      const functions = getFunctions();
      const generateNovelCover = httpsCallable(functions, 'generateNovelCover');
      const result = await generateNovelCover({ novelContent: content, title, genre: selectedGenre });

      const newImageUrl = result.data.imageUrl;
      if (newImageUrl) {
        setGeneratedImageUrl(newImageUrl);
      } else {
        throw new Error("이미지 URL을 받아오지 못했습니다.");
      }
    } catch (error) {
      console.error("Error generating cover: ", error);
      alert('표지 이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsCoverLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isNovelGenerated) {
      alert('먼저 소설을 생성해주세요.');
      return;
    }
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 예: 2023-10-4
    const novelId = `${year}-${month}-${weekNum}`;
    const novelRef = doc(db, 'novels', novelId);

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
      };
      await setDoc(novelRef, newNovel);
      alert('소설이 저장되었습니다.');
      navigate(`/novel/${novelId}`);
    } catch (error) {
      console.error("소설 저장 중 오류 발생: ", error);
      alert('소설 저장에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Header user={user} />
        <div>일기를 불러오는 중입니다...</div>
        <Navigation />
      </Container>
    );
  }

  return (
    <Container>
      <Header user={user} />
      <NovelHeader>
        <NovelCover src={generatedImageUrl} alt={title} />
        <NovelInfo>
          <NovelTitle>{title}</NovelTitle>
          <NovelDate>{week} ({dateRange})</NovelDate>
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
          <NovelContent>
            {content}
          </NovelContent>
          {isCoverLoading ? (
            <Button disabled>표지 생성 중...</Button>
          ) : (
            generatedImageUrl === imageUrl && (
              <Button onClick={handleGenerateCover}>AI로 표지 생성하기</Button>
            )
          )}
          <Button onClick={handleSave}>소설 저장하기</Button>
        </>
      )}

      <Navigation />
    </Container>
  );
}

export default NovelCreate;