import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';

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

const bannerImages = [
  process.env.PUBLIC_URL + '/novel_banner/romance.png',
  process.env.PUBLIC_URL + '/novel_banner/mystery.png',
  process.env.PUBLIC_URL + '/novel_banner/historical.png',
  process.env.PUBLIC_URL + '/novel_banner/fairytale.png',
  process.env.PUBLIC_URL + '/novel_banner/fantasy.png',
];

const Novel = ({ user }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyProgress, setMonthlyProgress] = useState({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
    cssEase: "linear"
  };

  useEffect(() => {
    calculateMonthProgress(currentYear, currentMonth);
  }, [currentMonth, currentYear]);

  const getWeeksInMonth = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weeks = [];
    let firstWeekStart = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay();
    const diff = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    firstWeekStart.setDate(firstWeekStart.getDate() + diff);
    let firstWeekEnd = new Date(firstWeekStart);
    firstWeekEnd.setDate(firstWeekStart.getDate() + 6);
    if (firstWeekEnd.getMonth() === month - 1) {
      weeks.push({
        weekNum: 1,
        start: new Date(firstWeekStart),
        end: new Date(firstWeekEnd)
      });
    }
    let currentDate = new Date(firstWeekStart);
    currentDate.setDate(currentDate.getDate() + 7);
    let weekIdx = 2;
    while (currentDate <= lastDay) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() + 6);
      if (weekStart.getMonth() !== month - 1) {
        currentDate.setDate(currentDate.getDate() + 7);
        continue;
      }
      if (weekEnd.getMonth() !== month - 1) {
        break;
      }
      weeks.push({
        weekNum: weekIdx++,
        start: new Date(weekStart),
        end: new Date(weekEnd)
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return weeks;
  };

  const getFirstWeekOfMonth = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();
    const diff = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    const firstMonday = new Date(firstDay);
    firstMonday.setDate(firstMonday.getDate() + diff);
    return firstMonday;
  };

  const calculateMonthProgress = (year, month) => {
    const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
    const weeksInMonth = getWeeksInMonth(year, month);
    const progress = {};
    const lastDay = new Date(year, month, 0);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const firstMondayNextMonth = getFirstWeekOfMonth(nextYear, nextMonth);
    const firstWeekNextMonthEnd = new Date(firstMondayNextMonth);
    firstWeekNextMonthEnd.setDate(firstMondayNextMonth.getDate() + 6);
    weeksInMonth.forEach((week, idx) => {
      let weekEnd = week.end;
      if (week.end.getTime() === lastDay.getTime() && week.end.getDay() !== 0) {
        weekEnd = new Date(lastDay);
        weekEnd.setDate(lastDay.getDate() - (lastDay.getDay() === 0 ? 6 : lastDay.getDay()));
      }
      const weekDates = [];
      let d = new Date(week.start);
      while (d <= week.end && d <= lastDay) {
        if (week.end.getTime() === lastDay.getTime() && week.end.getDay() !== 0 && d.getTime() === lastDay.getTime()) {
          break;
        }
        weekDates.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      const weekDiaries = diaries.filter(diary => {
        const diaryDate = new Date(diary.date);
        return weekDates.some(date => diaryDate.toDateString() === date.toDateString());
      });
      const progressPercentage = (weekDiaries.length / weekDates.length) * 100;
      progress[idx + 1] = {
        dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
        progress: Math.min(progressPercentage, 100),
        completed: progressPercentage >= 100,
        weekTitle: `${month}월 ${idx + 1}주차`
      };
    });
    if (lastDay >= firstMondayNextMonth && lastDay <= firstWeekNextMonthEnd) {
      const weekDates = [];
      let d = new Date(firstMondayNextMonth);
      while (d <= firstWeekNextMonthEnd) {
        if (d.getMonth() === lastDay.getMonth() && d.getDate() === lastDay.getDate()) {
          weekDates.push(new Date(d));
        }
        d.setDate(d.getDate() + 1);
      }
      const weekDiaries = diaries.filter(diary => {
        const diaryDate = new Date(diary.date);
        return weekDates.some(date => diaryDate.toDateString() === date.toDateString());
      });
      const progressPercentage = (weekDiaries.length / weekDates.length) * 100;
    }
    setMonthlyProgress(progress);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleCreateNovel = (weekNum) => {
    if (monthlyProgress[weekNum].completed) {
      const genreImages = [
        {
          imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&h=540',
          title: '바람의 나라',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&h=540',
          title: '사랑의 계절',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=540',
          title: '미스터리의 밤',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=facearea&w=400&h=540',
          title: '성장의 시간',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=facearea&w=400&h=540',
          title: '일상의 기록',
        },
      ];
      const genreIdx = (weekNum - 1) % genreImages.length;
      const { imageUrl, title } = genreImages[genreIdx];

      // 완성된 소설 정보를 localStorage에 저장
      const novels = JSON.parse(localStorage.getItem('novels') || '[]');
      const newNovel = {
        id: Date.now().toString(),
        title,
        imageUrl,
        week: monthlyProgress[weekNum].weekTitle,
        dateRange: monthlyProgress[weekNum].dateRange,
        date: new Date().toISOString(),
        year: currentYear,
        month: currentMonth
      };
      novels.push(newNovel);
      localStorage.setItem('novels', JSON.stringify(novels));

      navigate('/novel/create', {
        state: {
          week: monthlyProgress[weekNum].weekTitle,
          dateRange: monthlyProgress[weekNum].dateRange,
          imageUrl,
          title,
        },
      });
    }
  };

  const handleWriteDiary = () => {
    navigate('/write');
  };

  const handleYearChange = (year) => {
    setCurrentYear(year);
  };

  const handleMonthChange = (month) => {
    setCurrentMonth(month);
    setIsDatePickerOpen(false);
  };

  return (
    <Container>
      <Header user={user} />
      {/* <Title>Novel</Title> */}

      <CarouselContainer>
        <Slider {...settings}>
          {bannerImages.map((img, idx) => (
            <CarouselSlide key={idx}>
              <img
                src={img}
                alt={`배너${idx + 1}`}
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
          <MonthButton onClick={handlePrevMonth}>‹</MonthButton>
          <CurrentMonth onClick={() => setIsDatePickerOpen(true)}>
            {currentYear}년 {currentMonth}월
          </CurrentMonth>
          <MonthButton onClick={handleNextMonth}>›</MonthButton>
        </MonthSelector>
        {isDatePickerOpen && (
          <DatePickerModal onClick={() => setIsDatePickerOpen(false)}>
            <DatePickerContent onClick={(e) => e.stopPropagation()}>
              <DatePickerHeader>
                <DatePickerTitle>날짜 선택</DatePickerTitle>
                <DatePickerClose onClick={() => setIsDatePickerOpen(false)}>×</DatePickerClose>
              </DatePickerHeader>
              <DatePickerTitle>년도</DatePickerTitle>
              <DatePickerGrid>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <DatePickerButton
                    key={year}
                    selected={year === currentYear}
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
                    selected={month === currentMonth}
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
          {Object.entries(monthlyProgress).map(([weekNum, week]) => (
            <WeeklyCard key={weekNum}>
              <WeekTitle>
                {week.weekTitle}
              </WeekTitle>
              <DateRange>{week.dateRange}</DateRange>
              <ProgressBar progress={week.progress}>
                <div />
              </ProgressBar>
              <CreateButton
                completed={week.completed}
                onClick={() => week.completed ? handleCreateNovel(weekNum) : handleWriteDiary()}
              >
                {week.completed ? '소설 만들기' : '일기 쓰러가기'}
              </CreateButton>
            </WeeklyCard>
          ))}
        </WeeklyGrid>
      </WeeklySection>
      <Navigation />
    </Container>
  );
};

export default Novel; 