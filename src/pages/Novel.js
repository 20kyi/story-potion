import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
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


const CarouselContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 5px;
  margin-bottom: 20px;
  .slick-dots {
    bottom: -35px;
    li {
      margin: 0 4px;
      button:before {
        color: #fdd2d2;
        opacity: 0.5;
        font-size: 8px;
      }
      &.slick-active button:before {
        color: #cb6565;
        opacity: 1;
      }
    }
  }
  .slick-slide {
    padding: 0 5px;
  }
  .slick-list {
    margin: 0 -5px;
  }
`;

const CarouselSlide = styled.div`
  width: 100%;
  min-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border-radius: 0;
  padding: 0;
`;

const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const MonthButton = styled.button`
  background: none;
  border: none;
  color: #cb6565;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  &:hover {
    transform: scale(1.1);
  }
`;

const CurrentMonth = styled.h2`
  color: #cb6565;
  font-size: 24px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DatePickerModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const DatePickerContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  width: 300px;
  max-width: 90%;
`;

const DatePickerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DatePickerTitle = styled.h3`
  color: #cb6565;
  margin: 0;
  font-size: 20px;
`;

const DatePickerClose = styled.button`
  background: none;
  border: none;
  color: #cb6565;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
`;

const DatePickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const DatePickerButton = styled.button`
  background-color: ${props => props.selected ? '#cb6565' : '#fff2f2'};
  color: ${props => props.selected ? 'white' : '#cb6565'};
  border: 1px solid #fdd2d2;
  border-radius: 8px;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background-color: ${props => props.selected ? '#cb6565' : '#fdd2d2'};
  }
`;

const WeeklySection = styled.div`
  margin-top: 60px;
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  color: #cb6565;
  font-size: 24px;
  margin-bottom: 20px;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
  span {
    font-size: 20px;
    opacity: 0.8;
  }
`;

const WeeklyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 10px 0;
  width: 100%;
`;

const WeeklyCard = styled.div`
  background-color: #fff2f2;
  border-radius: 15px;
  padding: 20px;
  flex: 0 0 240px;
  min-width: 70px;
  // max-width: 200px;
  box-sizing: border-box;
`;


const WeekTitle = styled.h3`
  color: #cb6565;
  font-size: 18px;
  margin-bottom: 10px;
`;

const DateRange = styled.p`
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color:rgb(233, 219, 219);
  border-radius: 4px;
  margin-bottom: 15px;
  overflow: hidden;
  div {
    width: ${props => props.progress}%;
    height: 100%;
    background-color: #cb6565;
    transition: width 0.3s ease;
  }
`;

const CreateButton = styled.button`
  width: 100%;
  background-color: ${props => props.completed ? '#cb6565' : '#fdd2d2'};
  color: ${props => props.completed ? 'white' : '#e46262'};
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  cursor: pointer;
  opacity: 1;
  transition: all 0.2s ease;
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`;

const bannerData = [
  { genre: '로맨스', src: process.env.PUBLIC_URL + '/novel_banner/romance.png' },
  { genre: '추리', src: process.env.PUBLIC_URL + '/novel_banner/mystery.png' },
  { genre: '역사', src: process.env.PUBLIC_URL + '/novel_banner/historical.png' },
  { genre: '동화', src: process.env.PUBLIC_URL + '/novel_banner/fairytale.png' },
  { genre: '판타지', src: process.env.PUBLIC_URL + '/novel_banner/fantasy.png' },
];

const Novel = ({ user }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weeks, setWeeks] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState({});
  const [monthProgress, setMonthProgress] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [diaries, setDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [novelsMap, setNovelsMap] = useState({});

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: false,
    arrows: false,
    cssEase: "linear"
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    };

    const fetchAllData = async () => {
      setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      // 1. Fetch Diaries for the month
      const diariesRef = collection(db, 'diaries');
      const diariesQuery = query(diariesRef,
        where('userId', '==', user.uid),
        where('date', '>=', formatDate(firstDayOfMonth)),
        where('date', '<=', formatDate(lastDayOfMonth)),
        orderBy('date')
      );

      let fetchedDiaries = [];
      try {
        const diarySnapshot = await getDocs(diariesQuery);
        fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
        setDiaries(fetchedDiaries);
      } catch (error) {
        console.error("Error fetching diaries: ", error);
        // 오류가 나도 UI는 계속 진행되도록 함
      }

      // 2. Fetch all Novels for the user to create a map
      const novelsRef = collection(db, 'novels');
      const novelsQuery = query(novelsRef, where('userId', '==', user.uid));
      try {
        const novelSnapshot = await getDocs(novelsQuery);
        const newNovelsMap = {};
        novelSnapshot.forEach(doc => {
          const novel = doc.data();
          if (novel.week) { // week 정보가 있는 소설만 맵에 추가
            newNovelsMap[novel.week] = doc.id;
          }
        });
        setNovelsMap(newNovelsMap);
      } catch (error) {
        console.error("Error fetching novels: ", error);
      }

      // 3. Calculate progress
      calculateAllProgress(year, month, fetchedDiaries);
      setIsLoading(false);
    };

    fetchAllData();
  }, [user, currentDate]);


  const getWeeksInMonth = (year, month) => {
    // month는 0-11 사이의 값입니다.
    const weeks = [];
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // 해당 월의 첫 날이 속한 주의 월요일을 찾습니다.
    let currentMonday = new Date(year, month, 1);
    currentMonday.setDate(currentMonday.getDate() - (currentMonday.getDay() === 0 ? 6 : currentMonday.getDay() - 1));

    let weekNum = 1;

    while (currentMonday <= lastDayOfMonth) {
      const weekEnd = new Date(currentMonday);
      weekEnd.setDate(currentMonday.getDate() + 6);

      // 주의 마지막 날(weekEnd)이 다음 달로 넘어가지 않는 주만 포함시킵니다.
      // 단, 첫 주가 이전 달에서 시작하는 경우는 포함해야 합니다.
      if (weekEnd.getMonth() === month || weekEnd < lastDayOfMonth) {
        weeks.push({
          weekNum: weekNum++,
          start: new Date(currentMonday),
          end: new Date(weekEnd),
        });
      }

      currentMonday.setDate(currentMonday.getDate() + 7);
    }
    return weeks;
  };

  const calculateAllProgress = (year, month, fetchedDiaries) => {
    const monthWeeks = getWeeksInMonth(year, month);
    setWeeks(monthWeeks);

    let totalDaysInMonth = 0;
    let writtenDaysInMonth = 0;
    const newWeeklyProgress = {};

    monthWeeks.forEach(week => {
      let writtenDays = 0;
      const daysInWeek = 7; // 한 주는 항상 7일입니다.

      for (let i = 0; i < 7; i++) {
        const day = new Date(week.start);
        day.setDate(day.getDate() + i);

        const dateString = formatDate(day);
        if (fetchedDiaries.some(d => d.date === dateString)) {
          writtenDays++;
        }
      }

      newWeeklyProgress[week.weekNum] = (writtenDays / daysInWeek) * 100;

      // 월 전체 진행률 계산 로직은 현재 달에 속한 날만 대상으로 유지합니다.
      for (let i = 0; i < 7; i++) {
        const day = new Date(week.start);
        day.setDate(day.getDate() + i);
        if (day.getMonth() === month) {
          totalDaysInMonth++;
          const dateString = formatDate(day);
          if (fetchedDiaries.some(d => d.date === dateString)) {
            writtenDaysInMonth++;
          }
        }
      }
    });

    setWeeklyProgress(newWeeklyProgress);
    if (totalDaysInMonth > 0) {
      setMonthProgress((writtenDaysInMonth / totalDaysInMonth) * 100);
    } else {
      setMonthProgress(0);
    }
  };


  const getFirstWeekOfMonth = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();
    const diff = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    const firstMonday = new Date(firstDay);
    firstMonday.setDate(firstMonday.getDate() + diff);
    return firstMonday;
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleCreateNovel = (week) => {
    const weekProgress = weeklyProgress[week.weekNum] || 0;
    if (weekProgress < 100) {
      alert('일기를 모두 작성해야 소설을 만들 수 있어요!');
      return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const novelTitle = `${year}년 ${month}월 ${week.weekNum}주차 소설`;

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
        week: `${month}월 ${week.weekNum}주차`,
        dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
        imageUrl: imageUrl,
        title: novelTitle
      }
    });
  };

  const handleWriteDiary = () => {
    navigate('/write');
  };

  const handleYearChange = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth()));
  };

  const handleMonthChange = (month) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month - 1));
    setIsPickerOpen(false);
  };

  return (
    <Container>
      <Header user={user} />
      {/* <Title>Novel</Title> */}

      <CarouselContainer>
        <Slider {...settings}>
          {bannerData.map((banner, idx) => (
            <CarouselSlide key={idx} onClick={() => navigate(`/novels/genre/${banner.genre}`)}>
              <img
                src={banner.src}
                alt={`배너 ${banner.genre}`}
                style={{
                  width: '80vw',
                  maxWidth: '280px',
                  minWidth: '120px',
                  height: 'auto',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  display: 'block',
                  margin: '0 auto',
                  marginTop: '10px',
                }}
              />
            </CarouselSlide>
          ))}
        </Slider>
      </CarouselContainer>
      <WeeklySection>
        <MonthSelector>
          <MonthButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>‹</MonthButton>
          <CurrentMonth onClick={() => setIsPickerOpen(true)}>
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </CurrentMonth>
          <MonthButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>›</MonthButton>
        </MonthSelector>
        {isPickerOpen && (
          <DatePickerModal onClick={() => setIsPickerOpen(false)}>
            <DatePickerContent onClick={(e) => e.stopPropagation()}>
              <DatePickerHeader>
                <DatePickerTitle>날짜 선택</DatePickerTitle>
                <DatePickerClose onClick={() => setIsPickerOpen(false)}>×</DatePickerClose>
              </DatePickerHeader>
              <DatePickerTitle>년도</DatePickerTitle>
              <DatePickerGrid>
                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((year) => (
                  <DatePickerButton
                    key={year}
                    selected={year === currentDate.getFullYear()}
                    onClick={() => handleYearChange(year)}
                  >
                    {year}
                  </DatePickerButton>
                ))}
              </DatePickerGrid>
              <DatePickerTitle>월</DatePickerTitle>
              <DatePickerGrid>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <DatePickerButton
                    key={month}
                    selected={month === currentDate.getMonth() + 1}
                    onClick={() => handleMonthChange(month)}
                  >
                    {month}월
                  </DatePickerButton>
                ))}
              </DatePickerGrid>
            </DatePickerContent>
          </DatePickerModal>
        )}
        <WeeklyGrid>
          {weeks.map(week => {
            const weekIdentifier = `${currentDate.getMonth() + 1}월 ${week.weekNum}주차`;
            const existingNovelId = novelsMap[weekIdentifier];
            const progress = weeklyProgress[week.weekNum] || 0;
            const isCompleted = progress === 100;

            return (
              <WeeklyCard key={week.weekNum}>
                <WeekTitle>{weekIdentifier}</WeekTitle>
                <DateRange>{formatDate(week.start)} ~ {formatDate(week.end)}</DateRange>
                <ProgressBar progress={progress}>
                  <div />
                </ProgressBar>

                {existingNovelId ? (
                  <CreateButton completed onClick={() => navigate(`/novel/${existingNovelId}`)}>
                    소설 읽기
                  </CreateButton>
                ) : (
                  <CreateButton
                    completed={isCompleted}
                    onClick={() => {
                      if (isCompleted) {
                        handleCreateNovel(week);
                      } else {
                        handleWriteDiary();
                      }
                    }}
                  >
                    {isCompleted ? '소설 만들기' : '일기 작성하기'}
                  </CreateButton>
                )}
              </WeeklyCard>
            );
          })}
        </WeeklyGrid>
      </WeeklySection>
      <Navigation />
    </Container>
  );
};

export default Novel; 