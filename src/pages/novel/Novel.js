import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styled from 'styled-components';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
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
  background-color: ${({ theme }) => theme.progressCard};
  border-radius: 15px;
  padding: 20px;
  flex: 0 0 240px;
  color: ${({ theme }) => theme.cardText};
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
  font-size: 12px;
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
  background-color: ${({ children, completed, theme }) => {
        if (children === '일기 채우기') return '#F5F6FA'; // 연회색
        if (children === '소설 만들기 🪙50p') return '#f5f5f5';
        if (children === '소설 보기') return theme.primary; // 분홍
        return theme.primary;
    }};
  color: ${({ children, completed, theme }) => {
        if (children === '일기 채우기') return '#868E96';
        if (children === '소설 만들기 🪙50p') return '#e07e7e';
        if (children === '소설 보기') return '#fff';
        return '#fff';
    }};
  border: ${({ children, theme }) => {
        if (children === '일기 채우기') return '2px solid #868E96';
        if (children === '소설 만들기 🪙50p') return '2px solid #e07e7e';
        if (children === '소설 보기') return 'none';
        return 'none';
    }};
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  cursor: pointer;
  opacity: 1;
  transition: all 0.2s ease;
  font-weight: 700;
  box-shadow: ${({ children }) =>
        (children === '소설 보기') ? '0 2px 8px rgba(228,98,98,0.08)' : 'none'};
  &:hover {
    background-color: ${({ children, theme }) => {
        if (children === '일기 채우기') return '#E9ECEF';
        if (children === '소설 만들기 🪙50p') return '#C3CAD6'; // hover 저채도 블루
        if (children === '소설 보기') return theme.secondary;
        return theme.secondary;
    }};
    color: #fff;
    opacity: 0.96;
  }
`;

const bannerData = [
    { genre: '로맨스', src: process.env.PUBLIC_URL + '/novel_banner/romance.png' },
    { genre: '추리', src: process.env.PUBLIC_URL + '/novel_banner/mystery.png' },
    { genre: '역사', src: process.env.PUBLIC_URL + '/novel_banner/historical.png' },
    { genre: '동화', src: process.env.PUBLIC_URL + '/novel_banner/fairytale.png' },
    { genre: '판타지', src: process.env.PUBLIC_URL + '/novel_banner/fantasy.png' },
    { genre: '공포', src: process.env.PUBLIC_URL + '/novel_banner/horror.png' },

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

            // 표시되는 월의 주차 정보를 먼저 가져옴
            const monthWeeks = getWeeksInMonth(year, month);

            // 주차 정보가 없으면 데이터를 불러오지 않음
            if (monthWeeks.length === 0) {
                setDiaries([]);
                setNovelsMap({});
                calculateAllProgress(year, month, []);
                setIsLoading(false);
                return;
            }

            // 표시되는 모든 주차를 포함하는 날짜 범위 설정
            const startDate = monthWeeks[0].start;
            const endDate = monthWeeks[monthWeeks.length - 1].end;

            // 1. 확장된 날짜 범위로 일기 가져오기
            const diariesRef = collection(db, 'diaries');
            const diariesQuery = query(diariesRef,
                where('userId', '==', user.uid),
                where('date', '>=', formatDate(startDate)),
                where('date', '<=', formatDate(endDate)),
                orderBy('date')
            );

            let fetchedDiaries = [];
            try {
                const diarySnapshot = await getDocs(diariesQuery);
                fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
                setDiaries(fetchedDiaries);
            } catch (error) {
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
                // 오류가 나도 UI는 계속 진행되도록 함
            }

            // 3. Calculate progress
            calculateAllProgress(year, month, fetchedDiaries);
            setIsLoading(false);
        };

        fetchAllData();
    }, [user, currentDate]);


    const getWeeksInMonth = (year, month) => {
        const weeks = [];
        const firstDayOfMonth = new Date(year, month, 1);

        // 주의 시작인 월요일을 찾기 위해, 해당 월의 첫 날이 속한 주의 월요일부터 시작
        let currentMonday = new Date(firstDayOfMonth);
        const dayOfWeek = currentMonday.getDay(); // 0=일, 1=월, ..., 6=토
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        currentMonday.setDate(currentMonday.getDate() - diff);

        let weekNum = 1;

        // 주의 마지막 날(일요일)이 현재 달에 속하는 주차들을 계산
        while (true) {
            const weekStart = new Date(currentMonday);
            const weekEnd = new Date(currentMonday);
            weekEnd.setDate(weekEnd.getDate() + 6); // 주의 마지막 날 (일요일)

            // 주의 마지막 날이 현재 달에 속하면 해당 월의 주차로 포함
            if (weekEnd.getMonth() === month && weekEnd.getFullYear() === year) {
                weeks.push({
                    weekNum: weekNum++,
                    start: weekStart,
                    end: weekEnd,
                });
            } else if (weeks.length > 0) {
                // 이미 해당 월의 주차 계산이 끝났고, 다음 달로 넘어갔으므로 중단
                break;
            }

            // 다음 주 월요일로 이동
            currentMonday.setDate(currentMonday.getDate() + 7);

            // 무한 루프 방지를 위한 안전 장치
            if (currentMonday.getFullYear() > year || (currentMonday.getFullYear() === year && currentMonday.getMonth() > month + 1)) {
                break;
            }
        }

        setWeeks(weeks);
        return weeks;
    };

    const calculateAllProgress = (year, month, fetchedDiaries) => {
        const currentWeeks = getWeeksInMonth(year, month);
        let totalWrittenDaysInMonth = 0;
        const newWeeklyProgress = {};

        currentWeeks.forEach(week => {
            const weekStartStr = formatDate(week.start);
            const weekEndStr = formatDate(week.end);

            const weekDiaries = fetchedDiaries.filter(diary => {
                return diary.date >= weekStartStr && diary.date <= weekEndStr;
            });

            // 한 주는 7일이므로, 7일 기준으로 진행률 계산
            const weekDateCount = 7;
            const progress = Math.min(100, (weekDiaries.length / weekDateCount) * 100);

            newWeeklyProgress[week.weekNum] = progress;
        });

        // 월간 진행률은 현재 '월'에 해당하는 일기만 카운트
        fetchedDiaries.forEach(diary => {
            const diaryDate = new Date(diary.date);
            if (diaryDate.getFullYear() === year && diaryDate.getMonth() === month) {
                totalWrittenDaysInMonth++;
            }
        });

        setWeeklyProgress(newWeeklyProgress);

        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        setMonthProgress(totalDaysInMonth > 0 ? (totalWrittenDaysInMonth / totalDaysInMonth) * 100 : 0);
    };


    const getFirstWeekOfMonth = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDayOfWeek = new Date(firstDay);
        lastDayOfWeek.setDate(firstDay.getDate() + (6 - firstDay.getDay()));

        return {
            start: firstDay,
            end: lastDayOfWeek
        };
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getMonth() + 1}월 ${d.getDate()}일`;
    }

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
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="소설" />
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
                    {weeks.map((week) => {
                        const progress = weeklyProgress[week.weekNum] || 0;
                        const isCompleted = progress >= 100;
                        const novelKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${week.weekNum}`;
                        const novelId = novelsMap[`${currentDate.getMonth() + 1}월 ${week.weekNum}주차`];

                        return (
                            <WeeklyCard key={week.weekNum}>
                                <WeekTitle>{week.weekNum}주차</WeekTitle>
                                <DateRange>{formatDisplayDate(week.start)} - {formatDisplayDate(week.end)}</DateRange>
                                <ProgressBar progress={progress}>
                                    <div />
                                </ProgressBar>
                                {novelId ? (
                                    <CreateButton completed={true} onClick={() => navigate(`/novel/${novelKey}`)}>
                                        소설 보기
                                    </CreateButton>
                                ) : (
                                    <CreateButton completed={false} onClick={() => handleCreateNovel(week)}>
                                        {isCompleted ? '소설 만들기 🪙50p' : '일기 채우기'}
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