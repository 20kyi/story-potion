import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { useLocation, useNavigate } from 'react-router-dom';

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
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  
  &:hover {
    background: #d45252;
  }
`;

function NovelCreate({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { week, dateRange, imageUrl, title } = location.state || {};
  const [content, setContent] = useState('');
  const [weekDiaries, setWeekDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNovelGenerated, setIsNovelGenerated] = useState(false);

  useEffect(() => {
    // 해당 주의 일기들을 가져오기
    const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');

    console.log('Date Range:', dateRange);
    // dateRange 형식: "2024-03-01 ~ 2024-03-07"
    const [startStr, endStr] = dateRange.split(' ~ ');
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    endDate.setHours(23, 59, 59, 999); // 종료일의 끝시간으로 설정

    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('All Diaries:', diaries);

    const filteredDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      console.log('Diary Date:', diary.date, 'Parsed:', diaryDate);
      const isWithinRange = diaryDate >= startDate && diaryDate <= endDate;
      console.log('Is within range:', isWithinRange);
      return isWithinRange;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('Filtered Diaries:', filteredDiaries);
    setWeekDiaries(filteredDiaries);
    setIsLoading(false);
  }, [dateRange]);

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const handleGenerateNovel = () => {
    if (weekDiaries.length > 0) {
      // 일기들의 내용을 하나로 합치고 소설 형식으로 변환
      const storyContent = weekDiaries
        .map(diary => diary.content)
        .join('\n\n')
        .replace(/나는/g, '주인공은')
        .replace(/내가/g, '그가')
        .replace(/나의/g, '그의')
        .replace(/나를/g, '그를')
        .replace(/내/g, '그의');

      const novelContent = `${title}\n\n${storyContent}`;
      setContent(novelContent);
      setIsNovelGenerated(true);
    }
  };

  const handleSave = () => {
    if (!isNovelGenerated) {
      alert('먼저 소설을 생성해주세요.');
      return;
    }

    // 소설 저장
    const novels = JSON.parse(localStorage.getItem('novels') || '[]');
    const newNovel = {
      id: Date.now().toString(),
      title,
      imageUrl,
      week,
      dateRange,
      content,
      date: new Date().toISOString()
    };
    novels.push(newNovel);
    localStorage.setItem('novels', JSON.stringify(novels));

    // 소설 상세 페이지로 이동
    navigate('/novel/' + newNovel.id);
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
        <NovelCover src={imageUrl} alt={title} />
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

      {!isNovelGenerated ? (
        <Button onClick={handleGenerateNovel}>일기로 소설 만들기</Button>
      ) : (
        <>
          <NovelContent>
            {content}
          </NovelContent>
          <Button onClick={handleSave}>소설 저장하기</Button>
        </>
      )}

      <Navigation />
    </Container>
  );
}

export default NovelCreate;