import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNovelUrl } from '../utils/novelUtils';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import PencilIcon from '../components/icons/PencilIcon';
import NotificationModal from '../components/NotificationModal';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, increment, updateDoc, addDoc } from 'firebase/firestore';
import dailyTopics from '../data/topics.json';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { toast } from '../components/ui/Toast';
import { getPointPolicy } from '../utils/appConfig';
import { checkWeeklyBonus } from '../utils/weeklyBonus';
import { useTranslation } from '../LanguageContext';
import { motion } from 'framer-motion';
import { getTutorialNovel } from '../utils/tutorialNovel';


const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  // padding-top: 30px;
  padding-bottom: 30px;
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

/* 일기 최근 미리보기 영역 */
const MainButtonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  align-items: stretch;

  // @media (min-width: 768px) {
  //   flex-direction: column;
  //   gap: 16px;
  //   margin-bottom: 0;
  //   flex-grow: 1;
  //   min-height: 280px;
  // }
`;
/* 일기 최근 미리보기 영역 */
const RecentDiaryCard = styled.div`
  flex: 1;
  min-width: 0;
  background: ${({ theme }) => theme.cardGradient || 'linear-gradient(135deg, #B8D9F5 0%, #A8D0F0 50%, #9AC8EB 100%)'};
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  height: 256px;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.13); }
  padding: 16px;
  overflow: hidden;

  // @media (min-width: 768px) {
  //   height: auto;
  // }
`;
/* 일기 쓰기 버튼 */
const WriteDiaryButton = styled.div`
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.writeCardGradient || 'linear-gradient(135deg, #E8D5D3 0%, #D4A5A5 50%, #C99A9A 100%)'};
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(201, 154, 154, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.2s;
  gap: 10px;
  &:hover { box-shadow: 0 6px 20px rgba(201, 154, 154, 0.4); }
`;
/* 일기 쓰기 버튼 텍스트 */
const MainButtonText = styled.div`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 6px rgba(0,0,0,0.08);
  // @media (min-width: 768px) {
  //   font-size: 20px;
  // }
`;
/* 일기 최근 미리보기 */
const DiaryPreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
`;
/* 일기 최근 미리보기 이미지 */
const DiaryPreviewImage = styled.img`
  width: 100%;
  max-height: 100px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
`;

/* 일기 최근 미리보기 이미지 대체 영역 */
const DiaryPreviewImagePlaceholder = styled.div`
  width: 100%;
  max-height: 100px;
  min-height: 80px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed rgba(44, 62, 80, 0.3);
  flex-shrink: 0;
`;

const DiaryPreviewImagePlaceholderIcon = styled.div`
  font-size: 32px;
  opacity: 0.6;
`;

const DiaryPreviewImagePlaceholderText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.cardSubText || theme.text};
  opacity: 0.7;
  text-align: center;
  font-weight: 500;
`;
/* 일기 최근 미리보기 텍스트 */
const DiaryPreviewTextContainer = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
/* 일기 최근 미리보기 날짜 */
const DiaryPreviewDate = styled.div`
  font-size: 11px;
  opacity: 0.8;
  color: ${({ theme }) => theme.cardSubText || theme.text};
  margin-bottom: 4px;
  flex-shrink: 0;
  // @media (min-width: 768px) {
  //   font-size: 14px;
  // }
`;
/* 일기 최근 미리보기 제목 */
const DiaryPreviewTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.cardText || theme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  flex-shrink: 0;
  // @media (min-width: 768px) {
  //   font-size: 22px;
  // }
`;
/* 일기 최근 미리보기 내용 */
const DiaryPreviewContent = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.cardSubText || theme.diaryContent || theme.text};
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.lineClamp || 3};
  -webkit-box-orient: vertical;
  line-height: 1.3;
  width: 100%;
  word-break: keep-all;
  overflow-wrap: break-word;
  white-space: normal;
  flex: 1;
  min-height: 0;
  // @media (min-width: 768px) {
  //   font-size: 16px;
  // }
`;
/* 일기 쓰기 버튼 텍스트 */
const WriteButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;
/* 일기 최근 미리보기 영역 */
const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;

  // @media (min-width: 768px) {
  //   flex-direction: row;
  //   gap: 20px;
  // }
`;
/* 일기 최근 미리보기 영역 */
// const LeftSection = styled.div`
//   @media (min-width: 768px) {
//     flex: 2;
//     min-width: 400px;
//     display: flex;
//     flex-direction: column;
//   }
// `;
/* 일기 최근 미리보기 영역 */
// const RightSection = styled.div`
//   flex: 1;
// `;
/* 일기 최근 미리보기 영역 */
const SectionLabel = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 10px;
  margin-top: 10px;
  padding-left: 10px;
  // @media (min-width: 768px) {
  //   font-size: 24px;
  // }
`;

const MyNovelRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 0;
  overflow-x: auto;
  justify-content: flex-start;
  // padding-bottom: 8px;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const PotionSection = styled.div`
  // margin-top: 10px;
`;

const PotionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px 0;
`;

const PotionCard = styled.div`
  width: 100%;
  height: 110px;
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.95);
    background: ${({ theme }) => theme.cardHover || '#f8f9fa'};
  }
`;

const PotionImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 6px;
`;

const PotionCount = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const PotionName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const EmptyPotionCard = styled.div`
  width: 100%;
  height: 110px;
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  opacity: 0.5;
  grid-column: 1 / -1;
`;

const EmptyPotionText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#888'};
  text-align: center;
`;

const EmptyStateContainer = styled.div`
  width: 100%;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
`;

const EmptyStateIcon = styled.div`
  font-size: 36px;
  opacity: 0.6;
  margin-bottom: 4px;
`;

const EmptyStateTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin-bottom: 2px;
`;

const EmptyStateDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#888'};
  text-align: center;
  line-height: 1.5;
  opacity: 0.8;
`;

const MyNovelBox = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 18px;
  margin-bottom: 10px;
`;

const MoreButton = styled.button`
  width: 100%;
  padding: 0;
  background-color: transparent;
  color: ${({ theme }) => theme.primary || '#cb6565'};
  border: none;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  margin-top: 12px;
  margin-bottom: 12px;
  text-align: center;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    transform: scale(0.98);
  }
`;



const MyNovelTitle = styled.div`
  // margin-top: 10px;
  font-size: 15px;
  color: #cb6565;
  font-weight: 600;
  text-align: center;
  word-break: keep-all;
  // @media (min-width: 768px) {
  //   font-size: 18px;
  // }
`;

const NovelCover = styled.img`
  width: 100%;
  max-width: 180px;
  aspect-ratio: 2/3;
  height: auto;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  background: #fdd2d2;
  display: block;
  margin-left: auto;
  margin-right: auto;
`;

const TutorialCover = styled.div`
  width: 100%;
  max-width: 180px;
  aspect-ratio: 2/3;
  height: auto;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid #e0e0e0;
`;

const TutorialCoverTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #cb6565;
  text-align: center;
  word-break: keep-all;
  line-height: 1.4;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 120px;
  flex-shrink: 0;

  // @media (min-width: 768px) {
  //   flex-direction: row;
  //   width: 100%;
  //   align-items: stretch;
  // }
`;
/* 일기 최근 미리보기 영역 */
const TopicSection = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
`;

const TopicCard = styled.div`
  background-color: ${({ theme }) => theme.progressCard};
  border-radius: 20px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const PotionShopButton = styled.div`
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 50%, #A5B4FC 100%);
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(165, 180, 252, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.2s;
  gap: 10px;
  &:hover { 
    box-shadow: 0 6px 20px rgba(165, 180, 252, 0.4); 
  }
`;

const PotionShopContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const PotionShopIcon = styled.div`
  font-size: 32px;
`;

const PotionShopText = styled.div`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 6px rgba(0,0,0,0.08);
`;
/* 일기 최근 미리보기 영역 */
const TopicTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.cardText};
  margin-bottom: 8px;
`;
/* 일기 최근 미리보기 영역 */
const RecommendationIntro = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.cardSubText};
  line-height: 1.4;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const RecommendationTopic = styled.p`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.cardSubText};
  line-height: 1.4;
  margin-top: 4px;
  word-break: keep-all;
  overflow-wrap: anywhere;
  letter-spacing: -0.3px;
`;

const CarouselContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  // padding: 0;
  margin-bottom: 50px;
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

const PremiumBanner = styled(motion.div)`
  background: linear-gradient(135deg, #ffe29f 0%, #ffc371 100%);
  border-radius: 20px;
  padding: 20px;
  margin-top: 12px;
  margin-bottom: 20px;
  color: #8B4513;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 226, 159, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -25%;
    right: -25%;
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 40%, transparent 70%);
    animation: shimmer 4s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PremiumBannerContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
`;

const PremiumBannerLeft = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  @media (max-width: 480px) {
    flex: 1;
  }
`;

const PremiumBannerTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  word-break: keep-all;
  overflow-wrap: break-word;
  
  @media (max-width: 480px) {
    font-size: 16px;
    gap: 4px;
    margin-bottom: 4px;
  }
`;

const PremiumBannerDesc = styled.div`
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.4;
  color: #8B4513;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-align: center;
  
  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 1.3;
  }
`;

const PremiumBannerButton = styled.div`
  background: white;
  color: #8B4513;
  padding: 12px 40px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.2s;
  align-self: center;
  text-align: center;
  min-width: 200px;
  
  @media (max-width: 480px) {
    padding: 10px 32px;
    font-size: 14px;
    min-width: 180px;
  }
  
  ${PremiumBanner}:hover & {
    transform: scale(1.05);
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

const AICreateCard = styled(motion.div)`
  background: linear-gradient(135deg, #FFF5F3 0%, #FFEBE8 50%, #FFE0DB 100%);
  border: 2px solid #FFD4CC;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 10px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 180, 170, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 70%);
    animation: shimmer 4s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 180, 170, 0.3);
    border-color: #FFC4B8;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const AICreateContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #8B3E2E;
`;

const AICreateIcon = styled.div`
  font-size: 40px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(139, 62, 46, 0.2));
  color: #8B3E2E;
`;

const AICreateText = styled.div`
  flex: 1;
  min-width: 0;
`;

const AICreateTitle = styled.div`
  font-size: 32px !important;
  font-weight: 700;
  margin-bottom: 6px;
  color: #8B3E2E;
  line-height: 1.3;
  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-line;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 480px) {
    font-size: 30px !important;
  }
`;

const AICreateDesc = styled.div`
  font-size: 14px;
  color: #A05245;
  line-height: 1.4;
  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-line;
  
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const AICreateArrow = styled.div`
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
  color: #8B3E2E;
  opacity: 0.8;
  transition: all 0.2s;
  
  ${AICreateCard}:hover & {
    transform: translateX(4px);
    opacity: 1;
  }
`;

// home_banner용 데이터
const bannerData = [
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

// 탭 버튼 스타일 추가
const TabBar = styled.div`
  display: flex;
  gap: 0;
  margin: 0;
  border-bottom: 1.5px solid #f0caca;
`;
const TabButton = styled.button`
  flex: 1;
  padding: 12px 0 10px 0;
  background: none;
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#cb6565' : 'transparent'};
  color: ${props => props.$active ? '#cb6565' : '#888'};
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: border-bottom 0.2s, color 0.2s;
  font-family: inherit;
`;

function Home({ user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [recentDiaries, setRecentDiaries] = useState([]);
  const [recentNovels, setRecentNovels] = useState([]);
  const [purchasedNovels, setPurchasedNovels] = useState([]); // 추가
  const [ownedPotions, setOwnedPotions] = useState({});
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [premiumStatus, setPremiumStatus] = useState(null); // 프리미엄 상태 (null: 로딩 중, 객체: 로드 완료)
  const [userCreatedAt, setUserCreatedAt] = useState(null); // 사용자 가입일


  // 포션 데이터 (표시는 locale로)
  const potionData = [
    { id: 'romance', key: 'novel_genre_romance', image: '/potion/romance.png' },
    { id: 'historical', key: 'novel_genre_historical', image: '/potion/historical.png' },
    { id: 'mystery', key: 'novel_genre_mystery', image: '/potion/mystery.png' },
    { id: 'horror', key: 'novel_genre_horror', image: '/potion/horror.png' },
    { id: 'fairytale', key: 'novel_genre_fairytale', image: '/potion/fairytale.png' },
    { id: 'fantasy', key: 'novel_genre_fantasy', image: '/potion/fantasy.png' },
  ];

  // 오늘의 글감 선택 로직
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const topicIndex = dayOfYear % dailyTopics.length;
  const todayTopic = dailyTopics[topicIndex];

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleWriteDiaryClick = async () => {
    if (!user) return;
    const todayDate = getTodayDate();
    const diariesRef = collection(db, 'diaries');
    const q = query(diariesRef, where('userId', '==', user.uid), where('date', '==', todayDate));

    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alert('오늘의 일기를 이미 작성했습니다.');
      } else {
        navigate('/write');
      }
    } catch (error) {
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };



  // 사용자 가입일 가져오기
  useEffect(() => {
    if (!user) return;

    const fetchUserCreatedAt = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserCreatedAt(userData.createdAt || null);
        }
      } catch (error) {
        console.error('사용자 가입일 조회 실패:', error);
      }
    };

    fetchUserCreatedAt();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchRecentData = async () => {
      // Fetch recent diaries
      const diariesRef = collection(db, 'diaries');
      const diariesQuery = query(diariesRef, where('userId', '==', user.uid), orderBy('date', 'desc'), limit(1));
      const diarySnapshot = await getDocs(diariesQuery);
      setRecentDiaries(diarySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

      // Fetch recent novels
      const novelsRef = collection(db, 'novels');
      const novelsQuery = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(3));
      const novelSnapshot = await getDocs(novelsQuery);
      setRecentNovels(novelSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

      // Fetch purchased novels
      try {
        const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
        const viewedSnapshot = await getDocs(viewedNovelsRef);

        if (viewedSnapshot.empty) {
          setPurchasedNovels([]);
        } else {
          // viewedNovels 문서에서 novelId와 viewedAt 정보 추출
          const viewedNovelsData = viewedSnapshot.docs.map(doc => ({
            novelId: doc.id,
            viewedAt: doc.data().viewedAt || doc.data().createdAt || null
          }));

          // novelId로 novels 컬렉션에서 데이터 fetch
          const novelsRef = collection(db, 'novels');
          const novelDocs = await Promise.all(
            viewedNovelsData.map(item => getDoc(doc(novelsRef, item.novelId)))
          );

          let purchased = novelDocs
            .map((snap, idx) => {
              if (!snap.exists()) return null;
              return {
                ...snap.data(),
                id: snap.id,
                purchasedAt: viewedNovelsData[idx].viewedAt
              };
            })
            .filter(novel => novel !== null);

          // 구매일 기준 최신순 정렬
          purchased = purchased.sort((a, b) => {
            const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
            const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
            return bDate - aDate;
          });

          // 각 소설의 userId로 닉네임/아이디 조회
          const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
          const userDocs = await Promise.all(ownerIds.map(uid => getDoc(doc(db, 'users', uid))));
          const ownerMap = {};
          userDocs.forEach((snap, idx) => {
            if (snap.exists()) {
              const data = snap.data();
              ownerMap[ownerIds[idx]] = data.nickname || data.nick || data.displayName || ownerIds[idx];
            } else {
              ownerMap[ownerIds[idx]] = ownerIds[idx];
            }
          });
          // novel에 ownerName 필드 추가
          purchased = purchased.map(novel => ({ ...novel, ownerName: ownerMap[novel.userId] }));
          // 최근 구매일 순으로 3개만 표시
          setPurchasedNovels(purchased.slice(0, 3));
        }
      } catch (e) {
        setPurchasedNovels([]);
      }

      // Fetch user's potions
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOwnedPotions(userData.potions || {});
          setPremiumStatus({
            isMonthlyPremium: userData.isMonthlyPremium || false,
            isYearlyPremium: userData.isYearlyPremium || false,
          });
        } else {
          // 문서가 없는 경우 기본값 설정
          setPremiumStatus({
            isMonthlyPremium: false,
            isYearlyPremium: false,
          });
        }
      } catch (error) {
        console.error('포션 정보 조회 실패:', error);
        // 에러 발생 시 기본값 설정
        setPremiumStatus({
          isMonthlyPremium: false,
          isYearlyPremium: false,
        });
      }
    };

    fetchRecentData();
  }, [user]);

  // 알림 개수 조회
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const notificationsRef = collection(db, 'users', user.uid, 'notifications');
        const q = query(notificationsRef, where('isRead', '==', false));
        const snapshot = await getDocs(q);
        setUnreadNotificationCount(snapshot.size);
      } catch (error) {
        console.error('읽지 않은 알림 개수 조회 실패:', error);
      }
    };

    fetchUnreadCount();

    // 실시간 업데이트를 위한 구독 (선택사항)
    const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 체크
    return () => clearInterval(interval);
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // 'YYYY-MM-DD' 형식을 로컬 시간대로 안전하게 파싱
    const date = new Date(dateString.replace(/-/g, '/'));
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Container>
      <Header
        user={user}
        onNotificationClick={() => setNotificationModalOpen(true)}
        hasUnreadNotifications={unreadNotificationCount > 0}
      />
      <NotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        user={user}
        onNotificationRead={(count) => setUnreadNotificationCount(count)}
      />

      <ContentGrid>
        {/* 캐러셀 배너 */}
        <CarouselContainer>
          <Slider {...sliderSettings}>
            {bannerData.map((banner, idx) => (
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

        {/* AI 소설 만들기 CTA */}
        <AICreateCard onClick={() => navigate('/novel', { state: { scrollToProgress: true } })}>
          <AICreateContent>
            {/* <AICreateIcon>✨</AICreateIcon> */}
            <AICreateText>
              <AICreateTitle>
                <span>{t('home_ai_create_title')}</span>
                <span style={{ fontSize: '32px', fontWeight: '700' }}>→</span>
              </AICreateTitle>
              <AICreateDesc>{t('home_ai_create_desc')}</AICreateDesc>
            </AICreateText>
          </AICreateContent>
        </AICreateCard>

        {/* 프리미엄 배너 - 프리미엄이 아닌 사용자에게만 표시 (데이터 로드 완료 후) */}
        {premiumStatus && !premiumStatus.isMonthlyPremium && !premiumStatus.isYearlyPremium && (
          <PremiumBanner
            onClick={() => navigate('/my/premium')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PremiumBannerContent>
              <PremiumBannerLeft>
                <PremiumBannerTitle>
                  👑 {t('premium_benefits')} 👑
                </PremiumBannerTitle>
                <PremiumBannerDesc>
                  {t('premium_benefits_desc')}
                </PremiumBannerDesc>
              </PremiumBannerLeft>
              <PremiumBannerButton>
                {t('premium_monthly_subscribe_button')}
              </PremiumBannerButton>
            </PremiumBannerContent>
          </PremiumBanner>
        )}

        {/* 오늘의 주제 섹션 */}
        <TopicSection>
          <SectionLabel style={{ marginTop: '0', marginBottom: '12px' }}>💡 {t('home_topic_title')}</SectionLabel>
          <TopicCard>
            {/* <RecommendationIntro>{t('home_topic_intro')}</RecommendationIntro> */}
            <RecommendationTopic>"{todayTopic}"</RecommendationTopic>
          </TopicCard>
        </TopicSection>

        {/* 일기 섹션 - 하단으로 이동 */}
        <SectionLabel style={{ marginTop: '10px' }}>📝 {t('home_recent_diary')}</SectionLabel>
        <MainButtonRow>
          <RecentDiaryCard onClick={() => recentDiaries.length > 0 && recentDiaries[0] && navigate(`/diary/date/${recentDiaries[0].date}`)}>
            {recentDiaries.length > 0 && recentDiaries[0] ? (
              <DiaryPreviewContainer>
                {recentDiaries[0].imageUrls && recentDiaries[0].imageUrls.length > 0 ? (
                  <DiaryPreviewImage src={recentDiaries[0].imageUrls[0]} alt="최근 일기 이미지" />
                ) : (
                  <DiaryPreviewImagePlaceholder>
                    <DiaryPreviewImagePlaceholderIcon>📷</DiaryPreviewImagePlaceholderIcon>
                    <DiaryPreviewImagePlaceholderText>오늘의 사진을 찍어보세요</DiaryPreviewImagePlaceholderText>
                  </DiaryPreviewImagePlaceholder>
                )}
                <DiaryPreviewTextContainer>
                  <DiaryPreviewDate>{formatDate(recentDiaries[0].date)}</DiaryPreviewDate>
                  <DiaryPreviewTitle>{recentDiaries[0].title}</DiaryPreviewTitle>
                  <DiaryPreviewContent lineClamp={3}>{recentDiaries[0].content}</DiaryPreviewContent>
                </DiaryPreviewTextContainer>
              </DiaryPreviewContainer>
            ) : (
              <DiaryPreviewContainer>
                <DiaryPreviewTitle>{t('home_no_diary_yet')}</DiaryPreviewTitle>
                <DiaryPreviewContent lineClamp={6}>{t('home_write_first_diary')}</DiaryPreviewContent>
              </DiaryPreviewContainer>
            )}
          </RecentDiaryCard>

          <RightColumn>
            <WriteDiaryButton onClick={handleWriteDiaryClick}>
              <WriteButtonContent>
                <PencilIcon width="32" height="32" />
                <MainButtonText>{t('home_write_diary')}</MainButtonText>
              </WriteButtonContent>
            </WriteDiaryButton>
            <PotionShopButton onClick={() => navigate('/my/potion-shop')}>
              <PotionShopContent>
                <PotionShopIcon>🧪</PotionShopIcon>
                <PotionShopText>{t('home_potion_buy')}</PotionShopText>
              </PotionShopContent>
            </PotionShopButton>
          </RightColumn>
        </MainButtonRow>
      </ContentGrid>

      <Navigation />
    </Container>
  );
}

export default Home; 