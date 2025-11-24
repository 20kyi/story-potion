import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createNovelUrl } from '../../utils/novelUtils';
import styled from 'styled-components';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import { useLanguage, useTranslation } from '../../LanguageContext';
import { useTheme } from '../../ThemeContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Container = styled.div`
  display: flex;
  flex-direction: column;
//   min-height: 100vh;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
//   padding-top: 40px;
//   padding-bottom: 100px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;


const GenreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  margin-bottom: 20px;
  gap: 0;
  max-width: 450px;
  margin-left: auto;
  margin-right: auto;
`;

const GenreCard = styled.div`
  width: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }
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
  font-family: inherit;
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

const NovelListModal = styled.div`
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

const NovelListContent = styled.div`
  background-color: ${({ theme }) => theme.card || 'white'};
  padding: 20px;
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  overflow-y: auto;
`;

const NovelListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const NovelListTitle = styled.h3`
  color: #cb6565;
  margin: 0;
  font-size: 20px;
`;

const NovelListClose = styled.button`
  background: none;
  border: none;
  color: #cb6565;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
`;

const NovelListItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 10px;
  background-color: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9f9f9'};
  &:hover {
    background-color: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f0f0f0'};
  }
  &:last-child {
    margin-bottom: 0;
  }
`;

const NovelListCover = styled.img`
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
`;

const NovelListInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
`;

const NovelListNovelTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NovelListGenre = styled.div`
  font-size: 14px;
  color: #cb6565;
  font-weight: 500;
`;

const WeeklySection = styled.div`
  margin-top: 20px;
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
  padding: 20px 16px;
  flex: 0 0 240px;
  color: ${({ theme }) => theme.cardText};
  min-width: 70px;
  // max-width: 200px;
  box-sizing: border-box;
`;


const WeekTitle = styled.h3`
  color: #cb6565;
  font-size: 18px;
//   margin: 0 0 10px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 32px;
  line-height: 1.2;
  span {
    display: flex;
    align-items: flex-start;
    line-height: 1.2;
  }
`;
// 일기 진행도 UI 컴포넌트
const DateRange = styled.p`
  color: #666;
  font-size: 11px;
  margin: 0 0 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProgressBar = styled.div`
  width: 100%;
  display: flex;
  gap: 4px;
  margin: 0 0 10px 0;
  justify-content: space-between;
`;

const DayIndicator = styled.div`
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ hasDiary, barColor, theme }) => {
        if (!hasDiary) {
            // 일기가 없으면 연한 회색
            if (barColor === 'fill') return theme.mode === 'dark' ? '#4A4A4A' : '#E5E5E5';
            return theme.mode === 'dark' ? '#3A3A3A' : '#E5E5E5';
        }
        // 일기가 있으면 버튼 텍스트 색상과 일치
        if (barColor === 'fill') return theme.mode === 'dark' ? '#BFBFBF' : '#868E96'; // 일기 채우기 버튼 텍스트 색상
        if (barColor === 'create') return theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e'; // 소설 만들기 버튼 텍스트 색상
        if (barColor === 'free') return '#e4a30d'; // 무료 버튼 텍스트 색상
        if (barColor === 'view') return theme.primary; // 소설 보기 버튼 배경 색상
        return '#cb6565'; // 기본값
    }};
  transition: background-color 0.3s ease;
`;

const CreateButton = styled.button`
  width: 100%;
  margin: 0;
  margin-top: 2px;
  background-color: ${({ children, completed, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#2A2A2A' : '#E5E5E5';
        if (isFree) return 'transparent';
        if (children === '일기 채우기') return theme.mode === 'dark' ? '#3A3A3A' : '#F5F6FA'; // 다크모드에서는 어두운 회색
        if (children === '소설 만들기' || children === '다른 소설 생성' || children === '완성 ✨') return theme.mode === 'dark' ? '#3A3A3A' : '#f5f5f5'; // 다크모드에서는 어두운 회색
        if (children === '소설 보기') return theme.primary; // 분홍
        return theme.primary;
    }};
  color: ${({ children, completed, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#666666' : '#999999';
        if (isFree) return '#e4a30d';
        if (children === '일기 채우기') return theme.mode === 'dark' ? '#BFBFBF' : '#868E96';
        if (children === '소설 만들기' || children === '다른 소설 생성' || children === '완성 ✨') return theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e';
        if (children === '소설 보기') return '#fff';
        return '#fff';
    }};
  border: ${({ children, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '2px solid #3A3A3A' : '2px solid #CCCCCC';
        if (isFree) return '2px solid #e4a30d';
        if (children === '일기 채우기') return theme.mode === 'dark' ? '2px solid #BFBFBF' : '2px solid #868E96';
        if (children === '소설 만들기' || children === '다른 소설 생성' || children === '완성 ✨') return theme.mode === 'dark' ? '2px solid #FFB3B3' : '2px solid #e07e7e';
        if (children === '소설 보기') return 'none';
        return 'none';
    }};
  border-radius: 10px;
  padding: 8px;
  font-size: ${({ isFree }) => isFree ? '12px' : '12px'};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  transition: all 0.2s ease;
  font-weight: 700;
  font-family: inherit;
  white-space: nowrap;
  overflow: visible;
  box-shadow: ${({ children }) =>
        (children === '소설 보기') ? '0 2px 8px rgba(228,98,98,0.08)' : 'none'};
  &:hover {
    background-color: ${({ children, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#2A2A2A' : '#E5E5E5';
        if (isFree) return 'rgba(228, 163, 13, 0.1)';
        if (children === '일기 채우기') return theme.mode === 'dark' ? '#4A4A4A' : '#E9ECEF';
        if (children === '소설 만들기' || children === '다른 소설 생성') return theme.mode === 'dark' ? '#4A4A4A' : '#C3CAD6'; // hover 저채도 블루
        if (children === '소설 보기') return theme.secondary;
        return theme.secondary;
    }};
    color: ${({ children, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#666666' : '#999999';
        if (isFree) return '#e4a30d';
        if (children === '일기 채우기' || children === '소설 만들기' || children === '다른 소설 생성') return theme.mode === 'dark' ? '#FFB3B3' : '#fff';
        return '#fff';
    }};
    opacity: ${({ disabled }) => disabled ? 0.6 : 0.96};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const PremiumFreeNovelStatus = styled.div`
  margin: 16px 0;
  padding: 12px 16px;
  background: ${({ available, theme }) =>
        available
            ? 'linear-gradient(135deg, rgba(228, 163, 13, 0.15) 0%, rgba(255, 226, 148, 0.15) 100%)'
            : theme.card};
  border-radius: 12px;
  border: ${({ available }) =>
        available
            ? '2px solid rgba(228, 163, 13, 0.4)'
            : '1px solid rgba(0,0,0,0.1)'};
  text-align: center;
  font-size: 14px;
`;

const CreateOptionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const CreateOptionContent = styled.div`
  background: ${({ theme }) => theme.mode === 'dark' ? '#2A2A2A' : '#FFFFFF'};
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  opacity: 1;
`;

const CreateOptionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 16px 0;
  text-align: center;
`;

const CreateOptionButton = styled.button`
  width: 100%;
  padding: 16px;
  margin-bottom: 4px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ isFree, theme }) =>
        isFree
            ? 'linear-gradient(135deg, rgba(228, 163, 13, 0.2) 0%, rgba(255, 226, 148, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(228, 98, 98, 0.15) 0%, rgba(203, 101, 101, 0.15) 100%)'};
  color: ${({ isFree }) => isFree ? '#e4a30d' : '#e46262'};
  border: ${({ isFree }) => isFree ? '2px solid #e4a30d' : '2px solid #e46262'};
  box-shadow: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ isFree }) =>
        isFree
            ? '0 4px 12px rgba(0,0,0,0.15)'
            : '0 4px 12px rgba(228, 98, 98, 0.2)'};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CreateOptionDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#666'};
  margin-bottom: 8px;
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  padding: 4px 8px;
`;

const AddButton = styled.button`
  background-color: transparent;
  color: ${({ theme, disabled }) => disabled ? theme.mode === 'dark' ? '#666666' : '#999999' : theme.primary};
  border: none;
  padding: 0;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
  &:hover {
    color: ${({ theme, disabled }) => disabled ? theme.mode === 'dark' ? '#666666' : '#999999' : theme.secondary};
    opacity: ${({ disabled }) => disabled ? 0.5 : 0.96};
    background-color: ${({ theme, disabled }) => disabled ? 'transparent' : theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
  }
  &:active {
    transform: ${({ disabled }) => disabled ? 'none' : 'scale(0.95)'};
  }
  
  font-size: 18px;
  line-height: 1;
`;

const CarouselContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  margin-bottom: 20px;
  position: relative;
  .slick-dots {
    position: relative;
    bottom: 0;
    margin-top: 12px;
    padding-top: 0;
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

// home_banner용 데이터
const homeBannerData = [
    { src: process.env.PUBLIC_URL + '/home_banner/home1.png' },
    { src: process.env.PUBLIC_URL + '/home_banner/home2.png' },
    { src: process.env.PUBLIC_URL + '/home_banner/home3.png' },
];

const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: false,
    arrows: false,
    cssEase: 'linear',
};

const Novel = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const toast = useToast();
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weeks, setWeeks] = useState([]);
    const [weeklyProgress, setWeeklyProgress] = useState({});
    const [monthProgress, setMonthProgress] = useState(0);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const [diaries, setDiaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [novelsMap, setNovelsMap] = useState({});
    const [selectedWeekNovels, setSelectedWeekNovels] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [premiumFreeNovelAvailable, setPremiumFreeNovelAvailable] = useState(false);
    const [premiumFreeNovelCount, setPremiumFreeNovelCount] = useState(0);
    const [premiumFreeNovelNextChargeDate, setPremiumFreeNovelNextChargeDate] = useState(null);
    const [ownedPotions, setOwnedPotions] = useState({});
    const [showCreateOptionModal, setShowCreateOptionModal] = useState(false);
    const [selectedWeekForCreate, setSelectedWeekForCreate] = useState(null);
    const [timeUntilNextCharge, setTimeUntilNextCharge] = useState('');



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
                    // year, month, weekNum이 모두 있는 경우에만 맵에 추가
                    if (novel.year && novel.month && novel.weekNum) {
                        const weekKey = `${novel.year}년 ${novel.month}월 ${novel.weekNum}주차`;
                        // 같은 주차에 여러 소설이 있을 수 있으므로 배열로 저장
                        if (!newNovelsMap[weekKey]) {
                            newNovelsMap[weekKey] = [];
                        }
                        newNovelsMap[weekKey].push({ id: doc.id, ...novel });
                    }
                });
                setNovelsMap(newNovelsMap);
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
            }

            // 3. Fetch premium free novel status and potions
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const isPremiumUser = userData.isMonthlyPremium || userData.isYearlyPremium || false;
                    setIsPremium(isPremiumUser);
                    setOwnedPotions(userData.potions || {});

                    if (isPremiumUser) {
                        const now = new Date();
                        let nextChargeDate = null;

                        // premiumFreeNovelNextChargeDate 확인
                        if (userData.premiumFreeNovelNextChargeDate) {
                            if (userData.premiumFreeNovelNextChargeDate.seconds) {
                                nextChargeDate = new Date(userData.premiumFreeNovelNextChargeDate.seconds * 1000);
                            } else if (userData.premiumFreeNovelNextChargeDate.toDate) {
                                nextChargeDate = userData.premiumFreeNovelNextChargeDate.toDate();
                            } else {
                                nextChargeDate = new Date(userData.premiumFreeNovelNextChargeDate);
                            }
                        }

                        // premiumFreeNovelCount 확인
                        let freeNovelCount = userData.premiumFreeNovelCount || 0;

                        setPremiumFreeNovelNextChargeDate(nextChargeDate);
                        setPremiumFreeNovelCount(freeNovelCount);
                        setPremiumFreeNovelAvailable(freeNovelCount > 0);
                    } else {
                        setPremiumFreeNovelCount(0);
                        setPremiumFreeNovelAvailable(false);
                        setPremiumFreeNovelNextChargeDate(null);
                    }
                }
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
                console.error('프리미엄 무료권 상태 조회 실패:', error);
            }

            // 4. Calculate progress
            calculateAllProgress(year, month, fetchedDiaries);
            setIsLoading(false);
        };

        fetchAllData();
    }, [user, currentDate]);

    // 다음 충전까지 남은 시간 계산 및 업데이트
    useEffect(() => {
        if (!premiumFreeNovelNextChargeDate || !isPremium) {
            setTimeUntilNextCharge('');
            return;
        }

        const updateTimeUntilNextCharge = () => {
            const now = new Date();
            let nextChargeDate;

            if (premiumFreeNovelNextChargeDate.seconds) {
                nextChargeDate = new Date(premiumFreeNovelNextChargeDate.seconds * 1000);
            } else if (premiumFreeNovelNextChargeDate.toDate) {
                nextChargeDate = premiumFreeNovelNextChargeDate.toDate();
            } else {
                nextChargeDate = new Date(premiumFreeNovelNextChargeDate);
            }

            const diff = nextChargeDate - now;

            if (diff <= 0) {
                setTimeUntilNextCharge('사용 가능');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeUntilNextCharge(`${days}일 ${hours}시간 후`);
            } else if (hours > 0) {
                setTimeUntilNextCharge(`${hours}시간 ${minutes}분 후`);
            } else {
                setTimeUntilNextCharge(`${minutes}분 후`);
            }
        };

        updateTimeUntilNextCharge();
        const interval = setInterval(updateTimeUntilNextCharge, 60000); // 1분마다 업데이트

        return () => clearInterval(interval);
    }, [premiumFreeNovelNextChargeDate, isPremium]);

    // location state에서 소설 삭제 알림을 받으면 데이터 다시 가져오기
    useEffect(() => {
        if (location.state?.novelDeleted && user) {
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
                        // year, month, weekNum이 모두 있는 경우에만 맵에 추가
                        if (novel.year && novel.month && novel.weekNum) {
                            const weekKey = `${novel.year}년 ${novel.month}월 ${novel.weekNum}주차`;
                            // 같은 주차에 여러 소설이 있을 수 있으므로 배열로 저장
                            if (!newNovelsMap[weekKey]) {
                                newNovelsMap[weekKey] = [];
                            }
                            newNovelsMap[weekKey].push({ id: doc.id, ...novel });
                        }
                    });
                    setNovelsMap(newNovelsMap);
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                }

                // 3. Fetch premium free novel status and potions
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const isPremiumUser = userData.isMonthlyPremium || userData.isYearlyPremium || false;
                        setIsPremium(isPremiumUser);
                        setOwnedPotions(userData.potions || {});

                        if (isPremiumUser) {
                            const now = new Date();
                            let nextChargeDate = null;

                            // premiumFreeNovelNextChargeDate 확인
                            if (userData.premiumFreeNovelNextChargeDate) {
                                if (userData.premiumFreeNovelNextChargeDate.seconds) {
                                    nextChargeDate = new Date(userData.premiumFreeNovelNextChargeDate.seconds * 1000);
                                } else if (userData.premiumFreeNovelNextChargeDate.toDate) {
                                    nextChargeDate = userData.premiumFreeNovelNextChargeDate.toDate();
                                } else {
                                    nextChargeDate = new Date(userData.premiumFreeNovelNextChargeDate);
                                }
                            }

                            // premiumFreeNovelCount 확인
                            let freeNovelCount = userData.premiumFreeNovelCount || 0;

                            setPremiumFreeNovelNextChargeDate(nextChargeDate);
                            setPremiumFreeNovelCount(freeNovelCount);
                            setPremiumFreeNovelAvailable(freeNovelCount > 0);
                        } else {
                            setPremiumFreeNovelCount(0);
                            setPremiumFreeNovelAvailable(false);
                            setPremiumFreeNovelNextChargeDate(null);
                        }
                    }
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                    console.error('프리미엄 무료권 상태 조회 실패:', error);
                }

                // 4. Calculate progress
                calculateAllProgress(year, month, fetchedDiaries);
                setIsLoading(false);
            };
            fetchAllData();
            // location state 초기화
            navigate(location.pathname, { replace: true });
        }
    }, [location.state?.novelDeleted, user, currentDate, navigate, location.pathname]);


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
        // 모바일에서 공간 절약을 위해 더 짧은 형식 사용
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    const handleCreateNovel = (week, useFree = false) => {
        const weekProgress = weeklyProgress[week.weekNum] || 0;
        if (weekProgress < 100) {
            alert(t('novel_all_diaries_needed'));
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const weekKey = `${year}년 ${month}월 ${week.weekNum}주차`;
        const novelsForWeek = novelsMap[weekKey] || [];
        const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

        const novelTitle = language === 'en'
            ? t('novel_list_by_genre_title', { genre: t('novel_title') }) // simple fallback
            : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

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
                week: weekKey,
                dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                imageUrl: imageUrl,
                title: novelTitle,
                existingGenres: existingGenres,
                returnPath: location.pathname || '/novel',
                useFree: useFree
            }
        });
    };

    const handleCreateNovelClick = (week) => {
        const weekProgress = weeklyProgress[week.weekNum] || 0;
        if (weekProgress < 100) {
            alert(t('novel_all_diaries_needed'));
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const weekKey = `${year}년 ${month}월 ${week.weekNum}주차`;
        const novelsForWeek = novelsMap[weekKey] || [];

        // 무료권 사용 가능 여부와 포션 보유 여부 확인
        const hasPotions = Object.values(ownedPotions).some(count => count > 0);
        const canUseFree = premiumFreeNovelCount > 0 && isPremium && novelsForWeek.length === 0;

        // 무료권과 포션이 모두 가능한 경우에만 모달 표시
        if (canUseFree && hasPotions) {
            setSelectedWeekForCreate(week);
            setShowCreateOptionModal(true);
        } else {
            // 나머지 경우는 모두 포션 사용 (useFree: false)
            handleCreateNovel(week, false);
        }
    };

    // 주차가 미래인지 확인하는 함수
    const isFutureWeek = (week) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStartDate = new Date(week.start);
        weekStartDate.setHours(0, 0, 0, 0);
        return weekStartDate > today;
    };

    // 오늘에 해당하는 주차에서 오늘의 일기가 작성되었는지 확인하는 함수
    const hasTodayDiary = (week) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStartDate = new Date(week.start);
        weekStartDate.setHours(0, 0, 0, 0);
        const weekEndDate = new Date(week.end);
        weekEndDate.setHours(23, 59, 59, 999);

        // 오늘이 이 주차에 포함되는지 확인
        if (today < weekStartDate || today > weekEndDate) {
            return false;
        }

        // 오늘의 일기가 작성되었는지 확인
        const todayStr = formatDate(today);
        return diaries.some(diary => diary.date === todayStr);
    };

    const handleWriteDiary = (week) => {
        // 미래 주차이거나 오늘의 일기가 이미 작성된 경우 처리하지 않음
        if (isFutureWeek(week) || hasTodayDiary(week)) {
            return;
        }

        // 해당 주차에서 작성하지 않은 첫 번째 날짜 찾기
        const weekStartDate = new Date(week.start);
        const weekEndDate = new Date(week.end);

        // 해당 주차의 모든 날짜 생성
        const weekDates = [];
        const currentDate = new Date(weekStartDate);
        while (currentDate <= weekEndDate) {
            weekDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 해당 주차의 일기들 찾기
        const weekDiaries = diaries.filter(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= weekStartDate && diaryDate <= weekEndDate;
        });

        // 작성하지 않은 첫 번째 날짜 찾기
        const writtenDates = weekDiaries.map(diary => formatDate(diary.date));
        const unwrittenDate = weekDates.find(date => {
            const dateStr = formatDate(date);
            return !writtenDates.includes(dateStr);
        });

        if (unwrittenDate) {
            // 일기 작성 페이지로 이동 (해당 날짜와 함께)
            navigate('/write', {
                state: {
                    selectedDate: formatDate(unwrittenDate),
                    year: unwrittenDate.getFullYear(),
                    month: unwrittenDate.getMonth() + 1,
                    weekNum: week.weekNum
                }
            });
        } else {
            // 모든 날짜가 작성된 경우 (이론적으로는 발생하지 않음)
            navigate('/write');
        }
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
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('novel_title')} />
            {/* <Title>Novel</Title> */}

            <CarouselContainer>
                <Slider {...sliderSettings}>
                    {homeBannerData.map((banner, idx) => (
                        <CarouselSlide key={idx}>
                            <img
                                src={banner.src}
                                alt={`배너${idx + 1}`}
                                style={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    height: 'auto',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    display: 'block',
                                    margin: '0 auto',
                                }}
                            />
                        </CarouselSlide>
                    ))}
                </Slider>
            </CarouselContainer>

            {/* 프리미엄 무료권 상태 표시 */}
            {isPremium && (
                <PremiumFreeNovelStatus available={premiumFreeNovelCount > 0} theme={theme}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: premiumFreeNovelCount > 0 ? '#e4a30d' : theme.text,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <span>🪄</span>
                        <span>프리미엄 전용 무료 소설</span>
                        <span>🪄</span>
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: theme.subText || '#666',
                        marginBottom: '4px'
                    }}>
                        <span style={{
                            color: premiumFreeNovelCount > 0 ? '#e4a30d' : theme.subText || '#666',
                            fontWeight: '600',
                            marginBottom: '8px',
                            display: 'block'
                        }}>
                            {premiumFreeNovelCount}개 보유
                        </span>
                    </div>
                    {timeUntilNextCharge && (
                        <div style={{
                            fontSize: '12px',
                            color: theme.subText || '#888',
                            marginTop: '4px'
                        }}>
                            {premiumFreeNovelCount > 0 ? (
                                <span>다음 충전: {timeUntilNextCharge}</span>
                            ) : (
                                <span>다음 충전까지: {timeUntilNextCharge}</span>
                            )}
                        </div>
                    )}
                </PremiumFreeNovelStatus>
            )}

            <WeeklySection>
                <MonthSelector>
                    <MonthButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>‹</MonthButton>
                    <CurrentMonth onClick={() => setIsPickerOpen(true)}>
                        {language === 'en'
                            ? currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                            : `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
                    </CurrentMonth>
                    <MonthButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>›</MonthButton>
                </MonthSelector>
                {isPickerOpen && (
                    <DatePickerModal onClick={() => setIsPickerOpen(false)}>
                        <DatePickerContent onClick={(e) => e.stopPropagation()}>
                            <DatePickerHeader>
                                <DatePickerTitle>{t('novel_month_label')}</DatePickerTitle>
                                <DatePickerClose onClick={() => setIsPickerOpen(false)}>×</DatePickerClose>
                            </DatePickerHeader>
                            <DatePickerTitle>{t('year')}</DatePickerTitle>
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
                            <DatePickerTitle>{t('month')}</DatePickerTitle>
                            <DatePickerGrid>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <DatePickerButton
                                        key={month}
                                        selected={month === currentDate.getMonth() + 1}
                                        onClick={() => handleMonthChange(month)}
                                    >
                                        {language === 'en' ? month : `${month}월`}
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
                        const weekKey = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${week.weekNum}주차`;
                        const novelsForWeek = novelsMap[weekKey] || [];
                        const firstNovel = novelsForWeek.length > 0 ? novelsForWeek[0] : null;
                        const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

                        // 모든 장르 목록
                        const allGenres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
                        // 모든 장르의 소설이 생성되었는지 확인
                        const allGenresCreated = allGenres.every(genre => existingGenres.includes(genre));

                        const handleAddNovel = () => {
                            // 모든 장르의 소설이 이미 생성된 경우 처리하지 않음
                            if (allGenresCreated) {
                                return;
                            }

                            const weekProgress = weeklyProgress[week.weekNum] || 0;
                            if (weekProgress < 100) {
                                alert(t('novel_all_diaries_needed'));
                                return;
                            }

                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth() + 1;
                            const novelTitle = language === 'en'
                                ? t('novel_list_by_genre_title', { genre: t('novel_title') })
                                : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

                            const weekStartDate = new Date(week.start);
                            const weekEndDate = new Date(week.end);

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
                                    week: weekKey,
                                    dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                                    imageUrl: imageUrl,
                                    title: novelTitle,
                                    existingGenres: existingGenres,
                                    returnPath: location.pathname || '/novel'
                                }
                            });
                        };

                        const handleViewNovel = () => {
                            // 소설이 2개 이상이면 목록 모달 표시
                            if (novelsForWeek.length > 1) {
                                setSelectedWeekNovels(novelsForWeek);
                            } else {
                                // 소설이 1개면 바로 이동
                                const novelKey = createNovelUrl(
                                    currentDate.getFullYear(),
                                    currentDate.getMonth() + 1,
                                    week.weekNum,
                                    firstNovel.genre
                                );
                                navigate(`/novel/${novelKey}`);
                            }
                        };

                        return (
                            <WeeklyCard key={week.weekNum}>
                                <WeekTitle>
                                    <span>{t('week_num', { num: week.weekNum })}</span>
                                    {firstNovel && isCompleted && (
                                        <AddButton
                                            onClick={handleViewNovel}
                                            title="소설 보기"
                                        >
                                            ☰
                                        </AddButton>
                                    )}
                                </WeekTitle>
                                <DateRange>{formatDisplayDate(week.start)} - {formatDisplayDate(week.end)}</DateRange>
                                <ProgressBar
                                    barColor={
                                        firstNovel
                                            ? 'view'
                                            : isCompleted
                                                ? 'create'
                                                : 'fill'
                                    }
                                >
                                    {(() => {
                                        // 주의 시작일부터 7일간의 날짜 생성
                                        const weekStart = new Date(week.start);
                                        const weekDays = [];
                                        for (let i = 0; i < 7; i++) {
                                            const date = new Date(weekStart);
                                            date.setDate(weekStart.getDate() + i);
                                            weekDays.push(date);
                                        }

                                        // 해당 주의 일기 날짜 목록
                                        const weekStartStr = formatDate(week.start);
                                        const weekEndStr = formatDate(week.end);
                                        const weekDiaries = diaries.filter(diary => {
                                            return diary.date >= weekStartStr && diary.date <= weekEndStr;
                                        });
                                        const writtenDates = new Set(weekDiaries.map(diary => diary.date));

                                        return weekDays.map((day, idx) => {
                                            const dayStr = formatDate(day);
                                            const hasDiary = writtenDates.has(dayStr);
                                            return (
                                                <DayIndicator
                                                    key={idx}
                                                    hasDiary={hasDiary}
                                                    barColor={
                                                        firstNovel
                                                            ? 'view'
                                                            : isCompleted
                                                                ? 'create'
                                                                : 'fill'
                                                    }
                                                />
                                            );
                                        });
                                    })()}
                                </ProgressBar>
                                {firstNovel ? (
                                    <CreateButton
                                        completed={true}
                                        onClick={handleAddNovel}
                                        disabled={allGenresCreated}
                                    >
                                        {allGenresCreated ? "완성 ✨" : "다른 소설 생성"}
                                    </CreateButton>
                                ) : (
                                    <CreateButton
                                        completed={false}
                                        isFree={false}
                                        disabled={!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))}
                                        onClick={() => {
                                            if (!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))) {
                                                return;
                                            }
                                            isCompleted ? handleCreateNovelClick(week) : handleWriteDiary(week);
                                        }}
                                    >
                                        {isCompleted
                                            ? t('novel_create')
                                            : t('novel_fill_diary')}
                                    </CreateButton>
                                )}
                            </WeeklyCard>
                        );
                    })}
                </WeeklyGrid>
            </WeeklySection>

            {/* 소설 생성 옵션 모달 */}
            {showCreateOptionModal && selectedWeekForCreate && (
                <CreateOptionModal onClick={() => setShowCreateOptionModal(false)}>
                    <CreateOptionContent onClick={(e) => e.stopPropagation()} theme={theme}>
                        <CloseButton onClick={() => setShowCreateOptionModal(false)} theme={theme}>×</CloseButton>
                        <CreateOptionTitle theme={theme}>소설 생성 방법 선택</CreateOptionTitle>
                        <CreateOptionButton
                            isFree={true}
                            onClick={() => {
                                handleCreateNovel(selectedWeekForCreate, true);
                                setShowCreateOptionModal(false);
                            }}
                            theme={theme}
                        >
                            🪄 프리미엄 무료권 사용
                        </CreateOptionButton>
                        <CreateOptionDesc theme={theme} style={{ marginBottom: '12px' }}>
                            무료로 소설을 생성합니다 (7일 후 자동 충전)
                        </CreateOptionDesc>
                        <CreateOptionButton
                            isFree={false}
                            onClick={() => {
                                handleCreateNovel(selectedWeekForCreate, false);
                                setShowCreateOptionModal(false);
                            }}
                            theme={theme}
                        >
                            🔮 포션 사용
                        </CreateOptionButton>
                        <CreateOptionDesc theme={theme}>
                            보유한 포션 1개를 사용합니다
                        </CreateOptionDesc>
                    </CreateOptionContent>
                </CreateOptionModal>
            )}

            {/* 소설 목록 모달 */}
            {selectedWeekNovels && (
                <NovelListModal onClick={() => setSelectedWeekNovels(null)}>
                    <NovelListContent onClick={(e) => e.stopPropagation()}>
                        <NovelListHeader>
                            <NovelListTitle>소설 선택</NovelListTitle>
                            <NovelListClose onClick={() => setSelectedWeekNovels(null)}>×</NovelListClose>
                        </NovelListHeader>
                        {selectedWeekNovels.map((novel) => {
                            const genreKey = novel.genre === '로맨스' ? 'romance' :
                                novel.genre === '역사' ? 'historical' :
                                    novel.genre === '추리' ? 'mystery' :
                                        novel.genre === '공포' ? 'horror' :
                                            novel.genre === '동화' ? 'fairytale' :
                                                novel.genre === '판타지' ? 'fantasy' : null;

                            return (
                                <NovelListItem
                                    key={novel.id}
                                    onClick={() => {
                                        const novelKey = createNovelUrl(
                                            novel.year,
                                            novel.month,
                                            novel.weekNum,
                                            novel.genre
                                        );
                                        navigate(`/novel/${novelKey}`);
                                        setSelectedWeekNovels(null);
                                    }}
                                >
                                    <NovelListCover
                                        src={novel.imageUrl || '/novel_banner/default.png'}
                                        alt={novel.title}
                                    />
                                    <NovelListInfo>
                                        <NovelListNovelTitle>{novel.title}</NovelListNovelTitle>
                                        <NovelListGenre>
                                            {genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}
                                        </NovelListGenre>
                                    </NovelListInfo>
                                </NovelListItem>
                            );
                        })}
                    </NovelListContent>
                </NovelListModal>
            )}

            <Navigation />
        </Container>
    );
};

export default Novel; 