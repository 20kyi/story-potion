import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { db, storage } from '../../firebase';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastProvider';
import { usePrompt } from '../../hooks/usePrompt';
import { useTheme } from '../../ThemeContext';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { getPointPolicy } from '../../utils/appConfig';
import { checkWeeklyBonus } from '../../utils/weeklyBonus';

// 오늘 날짜를 yyyy-mm-dd 형식으로 반환하는 함수
const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Timezone-safe 날짜 포맷팅 함수
const formatDateToString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// formatDate 함수 추가 (DiaryView와 동일하게)
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// TopRow styled-component 추가
const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

// 다크모드 감지 함수
const isDarkMode = () => typeof document !== 'undefined' && document.body.classList.contains('dark');

const DiaryDate = styled.div`
  font-size: 18px;
//   margin-bottom: 20px;
  font-weight: 500;
//   margin-top: 40px;
  cursor: default;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  .date-number, .date-unit {
    color: ${({ theme }) => theme.text};
    font-family: inherit;
    font-size: 18px;
    font-weight: 500;
  }
`;
/* 오늘의 날씨, 내 기분 */
const DiaryMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
`;
/* 오늘의 날씨, 내 기분 라벨 */
const MetaLabel = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  min-width: 140px;
  min-height: 44px;
  padding: 0;
  font-family: inherit;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
`;
const ImagePreviewBox = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.mode === 'dark' ? '#4a4a4a' : '#fdd2d2'};
  background: ${({ theme }) => theme.mode === 'dark' ? '#2a2a2a' : '#fafafa'};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
`;
const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: #cb6565;
`;

// 스티커 관련 스타일 컴포넌트들

const StickerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const StickerHandle = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  background: #cb6565;
  border: 2px solid white;
  border-radius: 50%;
  cursor: ${props => props.cursor || 'pointer'};
  z-index: 10;
  pointer-events: auto;
  
  &:hover {
    background: #a54a4a;
    transform: scale(1.2);
  }
`;

const StickerDeleteButton = styled.button`
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border: none;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 6px rgba(255, 71, 87, 0.3);
  z-index: 15;
  transition: all 0.2s ease;
  
  &:hover {
    background: #ff3742;
    transform: scale(1.15);
    box-shadow: 0 4px 8px rgba(255, 71, 87, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const StickerPanel = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme.mode === 'dark' ? '#232323' : '#fff'};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 -2px 16px rgba(0,0,0,0.32)' : '0 -2px 16px rgba(0,0,0,0.12)'};
  padding: 24px;
  z-index: 1000;
  max-height: 60vh;
  overflow-y: auto;
  animation: slideUp 0.2s ease;
`;

const StickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 20px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(6, 1fr);
  }
`;

const StickerItem = styled.button`
  width: 50px;
  height: 50px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  padding: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${props => props.theme.mode === 'dark' ? '#333' : '#f5f5f5'};
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const StickerButton = styled.button`
  position: fixed;
  bottom: 120px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: #cb6565;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(203, 101, 101, 0.3);
  transition: all 0.2s ease;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #a54a4a;
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(203, 101, 101, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const StickerPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${({ theme }) => theme.mode === 'dark' ? '#aaa' : '#999'};
  font-size: 14px;
  
  .icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
`;

// 사진 추가하기 버튼 styled-component 추가
const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%);
  color: #555;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: background 0.2s, box-shadow 0.2s;
  font-family: inherit;
  &:hover {
    background: linear-gradient(135deg, #cccccc 0%, #e0e0e0 100%);
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  }
  & > .icon {
    font-size: 28px;
    margin-bottom: 6px;
  }
`;

// DiaryView와 동일한 스타일의 제목, 본문 인풋 스타일 적용
const TitleInput = styled.input`
  font-size: 25px;
  font-weight: 500;
  margin-bottom: 16px;
  margin-top: 30px;
  color: ${({ theme }) => theme.diaryText};
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  font-family: inherit;
`;
const ContentTextarea = styled.textarea`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.diaryContent};
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  resize: none;
  font-family: inherit;
  white-space: pre-wrap;
  position: relative;
  min-height: 300px;
  overflow-y: auto; /* 자동 스크롤 추가 */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: ${({ theme }) => theme.mode === 'dark' ? '#4a4a4a #2a2a2a' : '#fdd2d2 #fafafa'}; /* Firefox */
  
  /* Webkit 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.mode === 'dark' ? '#2a2a2a' : '#fafafa'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.mode === 'dark' ? '#4a4a4a' : '#fdd2d2'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.mode === 'dark' ? '#5a5a5a' : '#ecc2c2'};
  }
`;

const ContentContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  min-height: 300px;
  border: 1px solid ${({ theme }) => theme.mode === 'dark' ? '#4a4a4a' : '#fdd2d2'};
  border-radius: 12px;
  background: ${({ theme }) => theme.mode === 'dark' ? '#2a2a2a' : '#fafafa'};
  padding: 16px;
  margin-bottom: 20px;
  overflow: ${() => window.innerWidth <= 768 ? 'hidden' : 'visible'};
  box-sizing: border-box;
`;

const StickerElement = styled.div`
  position: absolute;
  cursor: move;
  user-select: none;
  border: ${props => props.isSelected ? '2px solid #cb6565' : 'none'};
  border-radius: 4px;
  
  &:hover {
    border: 2px solid #cb6565;
  }
`;

function WriteDiary({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [diary, setDiary] = useState({
        title: '',
        content: '',
        mood: '',
        imageUrls: [],
        weather: '',
        emotion: ''
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingDiaryId, setExistingDiaryId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmotionSheetOpen, setIsEmotionSheetOpen] = useState(false);
    const [isWeatherSheetOpen, setIsWeatherSheetOpen] = useState(false);
    const toast = useToast();
    const prevLocation = useRef(location);
    const textareaRef = useRef();
    const theme = useTheme();
    const isDark = theme.actualTheme === 'dark';
    const labelColor = isDark ? '#fff' : '#222';
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const containerRef = useRef();
    const [currentPoints, setCurrentPoints] = useState(0);
    const [isImageLimitExtended, setIsImageLimitExtended] = useState(false);
    const [hasExtendedThisSession, setHasExtendedThisSession] = useState(false);

    // 스티커 관련 state
    const [stickers, setStickers] = useState([]);
    const [isStickerPanelOpen, setIsStickerPanelOpen] = useState(false);
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [stickerCounter, setStickerCounter] = useState(0);
    const [contentHeight, setContentHeight] = useState(300);
    const [draggedSticker, setDraggedSticker] = useState(null);
    const [dragStartPos, setDragStartPos] = useState(null);

    const weatherImageMap = {
        sunny: '/weather/sunny.png',
        cloudy: '/weather/cloudy.png',
        rainy: '/weather/rainy.png',
        snowy: '/weather/snowy.png',
        windy: '/weather/windy.png',
        thunder: '/weather/thunder.png',
    };
    const weatherOptions = [
        { value: 'sunny', label: '맑음' },
        { value: 'cloudy', label: '흐림' },
        { value: 'rainy', label: '비' },
        { value: 'snowy', label: '눈' },
        { value: 'windy', label: '바람' },
        { value: 'thunder', label: '천둥' },
    ];
    const emotionImageMap = {
        love: '/emotions/love.png',
        good: '/emotions/good.png',
        normal: '/emotions/normal.png',
        surprised: '/emotions/surprised.png',
        angry: '/emotions/angry.png',
        cry: '/emotions/cry.png',
    };
    const emotionOptions = [
        { value: 'love', label: '완전행복' },
        { value: 'good', label: '기분좋음' },
        { value: 'normal', label: '평범함' },
        { value: 'surprised', label: '놀람' },
        { value: 'angry', label: '화남' },
        { value: 'cry', label: '슬픔' }
    ];

    // 스티커 목록
    const stickerList = [
        { id: 'cutlery', name: '커틀러리', src: '/sticker/cutlery.png' },
        { id: 'closednote', name: '노트', src: '/sticker/closednote.png' },
        { id: 'note', name: '메모', src: '/sticker/note.png' },
        { id: 'error', name: '에러', src: '/sticker/error.png' },
        { id: 'clock', name: '시계', src: '/sticker/clock.png' },
        { id: 'music2', name: '음악', src: '/sticker/music2.png' },
        { id: 'phone_chat', name: '채팅', src: '/sticker/phone_chat.png' },
        { id: 'hamburger', name: '햄버거', src: '/sticker/hamburger.png' },
        { id: 'cake2', name: '케이크', src: '/sticker/cake2.png' },
        { id: 'laptop2', name: '노트북', src: '/sticker/laptop2.png' },
        { id: 'coffee_takeout', name: '커피', src: '/sticker/coffee_takeout.png' },
        { id: 'bed', name: '침대', src: '/sticker/bed.png' },
        { id: 'music', name: '음악', src: '/sticker/music.png' },
        { id: 'shopping', name: '쇼핑', src: '/sticker/shopping.png' },
        { id: 'juice', name: '주스', src: '/sticker/juice.png' },
        { id: 'laptop', name: '노트북', src: '/sticker/laptop.png' },
        { id: 'camera', name: '카메라', src: '/sticker/camera.png' },
        { id: 'calander', name: '달력', src: '/sticker/calander.png' },
        { id: 'run', name: '달리기', src: '/sticker/run.png' },
        { id: 'gift', name: '선물', src: '/sticker/gift.png' },
        { id: 'piggybank', name: '저금통', src: '/sticker/piggybank.png' },
        { id: 'heart', name: '하트', src: '/sticker/heart.png' },
        { id: 'weight', name: '운동', src: '/sticker/weight.png' },
        { id: 'movie', name: '영화', src: '/sticker/movie.png' },
        { id: 'cake', name: '케이크', src: '/sticker/cake.png' },
        { id: 'sleep', name: '잠', src: '/sticker/sleep.png' },
        { id: 'Headset', name: '헤드셋', src: '/sticker/Headset.png' },
        { id: 'food', name: '음식', src: '/sticker/food.png' },
        { id: 'diary2', name: '다이어리', src: '/sticker/diary2.png' },
        { id: 'laundry', name: '빨래', src: '/sticker/laundry.png' },
        { id: 'noddle', name: '면', src: '/sticker/noddle.png' },
        { id: 'love_chat', name: '러브채팅', src: '/sticker/love_chat.png' },
        { id: 'food2', name: '음식2', src: '/sticker/food2.png' },
        { id: 'diary', name: '다이어리', src: '/sticker/diary.png' },
        { id: 'coffee', name: '커피', src: '/sticker/coffee.png' }
    ];

    useEffect(() => {
        // location.state에서 전달받은 날짜 처리
        if (location.state && location.state.selectedDate && user) {
            const date = new Date(location.state.selectedDate.replace(/-/g, '/'));
            setSelectedDate(date);
            fetchDiaryForDate(date);
        } else {
            // URL 파라미터에서 날짜 처리 (기존 방식)
            const params = new URLSearchParams(location.search);
            const dateParam = params.get('date');
            if (dateParam && user) {
                // new Date()는 T00:00:00Z가 아닌 로컬 시간대를 사용하도록 합니다.
                const date = new Date(dateParam.replace(/-/g, '/'));
                setSelectedDate(date);
                fetchDiaryForDate(date);
            }
        }
    }, [location, user]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const minHeight = 300;
            const maxHeight = window.innerWidth <= 768 ? 800 : 600; // 모바일에서 더 큰 최대 높이
            const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
            textareaRef.current.style.height = newHeight + 'px';
            setContentHeight(newHeight + 32); // padding 고려
        }
    }, [diary.content]);

    useEffect(() => {
        setDiary(prev => ({ ...prev, date: formatDateToString(selectedDate) }));
    }, [selectedDate]);

    useEffect(() => {
        let onShow, onHide;
        if (Capacitor.getPlatform() !== 'web') {
            onShow = Keyboard.addListener('keyboardWillShow', (info) => {
                setKeyboardHeight(info.keyboardHeight);
                // 키보드가 올라올 때 입력창이 가려지지 않도록 스크롤
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }, 100);
            });
            onHide = Keyboard.addListener('keyboardWillHide', () => {
                setKeyboardHeight(0);
            });
        }
        return () => {
            if (onShow) onShow.remove();
            if (onHide) onHide.remove();
        };
    }, []);

    useEffect(() => {
        if (user?.uid) {
            const fetchPoints = async () => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setCurrentPoints(userDoc.data().point || 0);
                    }
                } catch (error) {
                    console.error('포인트 조회 실패:', error);
                }
            };
            fetchPoints();
        }
    }, [user]);

    // 페이지를 나갈 때 확장 상태 초기화
    usePrompt(
        hasExtendedThisSession && !isEditMode,
        (location, callback) => {
            // 확장 상태를 초기화하고 페이지 이동 허용
            setIsImageLimitExtended(false);
            setHasExtendedThisSession(false);
            callback();
        }
    );

    // 스티커 드래그 앤 드롭 기능
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (draggedSticker) {
                handleDragMove(e);
            }
        };

        const handleMouseUp = () => {
            if (draggedSticker) {
                handleDragEnd();
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove, { passive: false });
        document.addEventListener('touchend', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [draggedSticker, dragStartPos, stickers]);

    // fetchDiaryForDate에서 imageLimitExtended 필드 반영
    const fetchDiaryForDate = async (date) => {
        const dateStr = formatDateToString(date);
        const diariesRef = collection(db, 'diaries');
        const q = query(diariesRef, where('userId', '==', user.uid), where('date', '==', dateStr));

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const existingDiary = querySnapshot.docs[0].data();
            const diaryId = querySnapshot.docs[0].id;
            setDiary({
                title: existingDiary.title,
                content: existingDiary.content,
                mood: existingDiary.mood || '',
                imageUrls: existingDiary.imageUrls || [],
                weather: existingDiary.weather || '',
                emotion: existingDiary.emotion || '',
                date: dateStr,
            });
            setImagePreview(existingDiary.imageUrls || []);
            setStickers(existingDiary.stickers || []);
            setStickerCounter(existingDiary.stickers ? existingDiary.stickers.length : 0);
            setIsEditMode(true);
            setExistingDiaryId(diaryId);
            setIsImageLimitExtended(!!existingDiary.imageLimitExtended); // 필드 없으면 false
            setHasExtendedThisSession(false); // 기존 일기 불러올 때는 세션 확장 상태 초기화
        } else {
            // Reset form if no diary exists for the new date
            setDiary({
                title: '',
                content: '',
                mood: '',
                imageUrls: [],
                weather: '',
                emotion: '',
                date: dateStr,
            });
            setImagePreview([]);
            setStickers([]);
            setStickerCounter(0);
            setIsEditMode(false);
            setExistingDiaryId(null);
            setIsImageLimitExtended(false);
            setHasExtendedThisSession(false);
        }
    };

    // 날짜 포맷팅
    const formattedDate = {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate()
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDiary(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 사진 한도 확장 함수
    const handleExtendImageLimit = async () => {
        if (currentPoints < 20) {
            toast.showToast('포인트가 부족하여 사진 한도 확장이 불가합니다. (20포인트 필요)', 'error');
            return;
        }
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                point: increment(-20)
            });
            await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                type: 'use',
                amount: -20,
                desc: '일기 사진 한도 확장',
                createdAt: new Date()
            });
            setCurrentPoints(prev => prev - 20);
            setIsImageLimitExtended(true);
            toast.showToast('사진 한도가 확장되었습니다! 이제 최대 4장까지 업로드할 수 있습니다.', 'success');
        } catch (error) {
            toast.showToast('사진 한도 확장에 실패했습니다.', 'error');
        }
    };

    const handleImageUpload = async (e) => {
        const newFiles = Array.from(e.target.files);
        const totalImages = imagePreview.length + newFiles.length;
        // 한도 미확장 시 1장까지만 허용
        if (!isImageLimitExtended && totalImages > 1) {
            toast.showToast('사진 한도를 확장해야 2장 이상 업로드할 수 있습니다.', 'info');
            return;
        }
        if (totalImages > 4) {
            toast.showToast('사진은 최대 4장까지 등록할 수 있습니다.', 'error');
            return;
        }
        // 이미지 압축 및 리사이즈
        const compressedFiles = await Promise.all(
            newFiles.map(file =>
                imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                })
            )
        );
        setImageFiles(prev => [...prev, ...compressedFiles]);
        const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
        setImagePreview(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (indexToRemove) => {
        const existingUrlCount = (diary.imageUrls || []).length;

        setImagePreview(prev => prev.filter((_, i) => i !== indexToRemove));

        if (indexToRemove < existingUrlCount) {
            // 기존에 업로드되었던 이미지 제거 (diary.imageUrls에서 제거)
            const urlToRemove = diary.imageUrls[indexToRemove];
            setDiary(prev => ({
                ...prev,
                imageUrls: prev.imageUrls.filter(url => url !== urlToRemove)
            }));
        } else {
            // 이번에 새로 첨부한 파일 제거 (imageFiles에서 제거)
            const fileIndexToRemove = indexToRemove - existingUrlCount;
            setImageFiles(prev => prev.filter((_, i) => i !== fileIndexToRemove));
        }
    };

    const handleDelete = async () => {
        if (window.confirm('정말 일기를 삭제하시겠습니까?\n삭제된 일기는 복구할 수 없습니다.')) {
            if (existingDiaryId) {
                try {
                    const diaryRef = doc(db, 'diaries', existingDiaryId);
                    await deleteDoc(diaryRef);
                    alert('일기가 삭제되었습니다.');
                    navigate('/diaries');
                } catch (error) {
                    alert('일기 삭제에 실패했습니다.');
                }
            }
        }
    };

    // 사진 한도 확장 함수 (포인트 차감 없이 확장만)
    const handleExtendAndEnableImageUpload = async () => {
        if (currentPoints < 20) {
            toast.showToast('포인트가 부족하여 사진 한도 확장이 불가합니다. (20포인트 필요)', 'error');
            return;
        }

        setIsImageLimitExtended(true);
        setHasExtendedThisSession(true);
        toast.showToast('사진 한도가 확장되었습니다! 저장 시 20포인트가 차감됩니다.', 'success');

        // 수정 모드라면 Firestore에도 반영
        if (isEditMode && existingDiaryId) {
            try {
                await updateDoc(doc(db, 'diaries', existingDiaryId), { imageLimitExtended: true });
            } catch (e) {
                toast.showToast('확장 상태 저장에 실패했습니다.', 'error');
            }
        }

        // 확장 후 바로 파일 선택창 열기
        document.getElementById('image-upload').click();
    };

    // 감정/날씨 바텀시트 오버레이 닫기 핸들러
    const closeSheets = () => {
        setIsEmotionSheetOpen(false);
        setIsWeatherSheetOpen(false);
    };

    // 스티커 관련 함수들
    const addSticker = (sticker) => {
        const newSticker = {
            id: `sticker_${stickerCounter}`,
            type: sticker.id,
            src: sticker.src,
            x: 50,
            y: 50,
            width: 60,
            height: 60,
            zIndex: stickerCounter
        };
        setStickers(prev => {
            const updatedStickers = [...prev, newSticker];
            // 최신 스티커 데이터로 컨테이너 크기 업데이트
            setTimeout(() => updateContainerSize(updatedStickers), 0);
            return updatedStickers;
        });
        setStickerCounter(prev => prev + 1);
        setIsStickerPanelOpen(false);
    };

    const updateStickerPosition = (stickerId, x, y) => {
        setStickers(prev => {
            const sticker = prev.find(s => s.id === stickerId);
            if (!sticker) return prev;

            // ContentContainer의 현재 너비 가져오기
            const contentContainer = document.querySelector('[data-content-container]');
            const containerWidth = contentContainer ? contentContainer.offsetWidth : 600;
            const padding = 16; // ContentContainer의 padding
            const maxX = containerWidth - padding * 2 - sticker.width; // 오른쪽 경계
            const minX = 0; // 왼쪽 경계

            // x 좌표를 경계 내로 제한
            const clampedX = Math.max(minX, Math.min(maxX, x));

            const updatedStickers = prev.map(sticker =>
                sticker.id === stickerId
                    ? { ...sticker, x: clampedX, y }
                    : sticker
            );

            // 최신 스티커 데이터로 컨테이너 크기 업데이트 (가로는 제한)
            setTimeout(() => updateContainerSize(updatedStickers), 0);
            return updatedStickers;
        });
    };

    const updateStickerSize = (stickerId, width, height) => {
        setStickers(prev => {
            const updatedStickers = prev.map(sticker =>
                sticker.id === stickerId
                    ? { ...sticker, width, height }
                    : sticker
            );
            // 최신 스티커 데이터로 컨테이너 크기 업데이트
            setTimeout(() => updateContainerSize(updatedStickers), 0);
            return updatedStickers;
        });
    };



    const removeSticker = (stickerId) => {
        setStickers(prev => {
            const updatedStickers = prev.filter(sticker => sticker.id !== stickerId);
            // 최신 스티커 데이터로 컨테이너 크기 업데이트
            setTimeout(() => updateContainerSize(updatedStickers), 0);
            return updatedStickers;
        });
    };

    const selectSticker = (stickerId) => {
        setSelectedSticker(stickerId);
    };

    // 컨테이너 크기를 스티커 위치에 맞게 업데이트 (가로 크기 확장 방지)
    const updateContainerSize = (currentStickers = stickers) => {
        if (currentStickers.length === 0) return;

        const padding = 16; // ContentContainer의 padding
        const minHeight = 300; // 최소 높이

        // 모바일에서는 실제 화면 너비를 계산, 데스크탑에서는 고정 너비
        const isMobile = window.innerWidth <= 768;
        const containerWidth = isMobile ? Math.min(window.innerWidth - 40, 600) : 600; // 40px는 좌우 마진
        const fixedWidth = `${containerWidth}px`;

        // 모든 스티커의 최대 위치 계산 (가로는 제한)
        const maxY = Math.max(...currentStickers.map(s => s.y + s.height));

        // 컨테이너 크기 계산 (가로는 고정, 세로만 동적)
        const containerHeight = Math.max(minHeight, maxY + padding * 2);

        console.log('Container size update:', { maxY, containerHeight, isMobile, fixedWidth, containerWidth });

        // ContentContainer의 크기 업데이트 (가로는 고정 픽셀 값)
        const contentContainer = document.querySelector('[data-content-container]');
        if (contentContainer) {
            contentContainer.style.width = fixedWidth;
            contentContainer.style.height = `${containerHeight}px`;
            contentContainer.style.maxWidth = '100%'; // 부모 컨테이너를 넘지 않도록
        }
    };

    // 드래그 시작 처리 (마우스 + 터치)
    const handleDragStart = (e, stickerId, action) => {
        e.preventDefault();
        e.stopPropagation();

        const sticker = stickers.find(s => s.id === stickerId);
        if (!sticker) return;

        // 마우스와 터치 이벤트 모두 지원
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        setDragStartPos({ x: clientX, y: clientY });
        setSelectedSticker(stickerId);
        setDraggedSticker({ id: stickerId, action });

        console.log('Drag start:', action, stickerId);
    };

    // 드래그 중 처리 (마우스 + 터치)
    const handleDragMove = (e) => {
        if (!draggedSticker || !dragStartPos) return;

        e.preventDefault();

        // 마우스와 터치 이벤트 모두 지원
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const deltaX = clientX - dragStartPos.x;
        const deltaY = clientY - dragStartPos.y;

        console.log('Drag move:', draggedSticker.action, deltaX, deltaY);

        if (draggedSticker.action === 'move') {
            const sticker = stickers.find(s => s.id === draggedSticker.id);
            if (sticker) {
                updateStickerPosition(draggedSticker.id, sticker.x + deltaX, sticker.y + deltaY);
            }
        } else if (draggedSticker.action === 'resize') {
            const sticker = stickers.find(s => s.id === draggedSticker.id);
            if (sticker) {
                const newWidth = Math.max(20, sticker.width + deltaX);
                const newHeight = Math.max(20, sticker.height + deltaY);
                updateStickerSize(draggedSticker.id, newWidth, newHeight);
            }
        }

        setDragStartPos({ x: clientX, y: clientY });
    };

    // 드래그 종료 처리
    const handleDragEnd = () => {
        console.log('Drag end');
        setDraggedSticker(null);
        setDragStartPos(null);
    };

    // 작성 중 여부 판별
    const isDirty = diary.title || diary.content || diary.mood || diary.weather || diary.emotion || imagePreview.length > 0 || stickers.length > 0;

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: window.innerWidth <= 768 ? '120vh' : '100vh', // 모바일에서 더 긴 화면
            position: 'relative',
            maxWidth: '600px',
            width: '100%',
            margin: window.innerWidth <= 768 ? '60px auto' : '60px auto',
            padding: window.innerWidth <= 768 ? '20px' : '20px',
            paddingTop: window.innerWidth <= 768 ? '20px' : '20px',
            marginBottom: window.innerWidth <= 768 ? '100px' : '100px',
            paddingBottom: window.innerWidth <= 768 ? '200px' : '180px', // 키보드 대응을 위해 더 큰 패딩
            overflowX: 'hidden', // 가로 스크롤 방지
        },
        mainContent: {
            flex: 1,
            position: 'relative',
            paddingBottom: window.innerWidth <= 768 ? '250px' : '220px', // 키보드 대응을 위해 더 큰 패딩
            minHeight: 0,
            width: '100%',
            maxWidth: '100%',
            paddingTop: '8px',
            overflowX: 'hidden', // 가로 스크롤 방지
        },
        // header: {
        //     display: 'flex',
        //     alignItems: 'center',
        //     gap: '15px',
        //     marginBottom: '25px'
        // },
        // 저장 버튼 컨테이너
        actionButtons: {
            display: 'flex',
            gap: '10px',
            position: 'absolute',
            top: '20px',
            right: '20px'
        },
        // 저장 버튼
        actionButton: {
            backgroundColor: 'rgba(190, 71, 71, 0.62)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: '4px 15px',
            fontSize: '14px',
            fontFamily: 'Source Sans Pro',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
        },
        // 삭제 버튼
        deleteButton: {
            backgroundColor: 'rgba(190, 71, 71, 0.4)'
        },
        // 날짜 선택 컨테이너
        dateSection: {
            fontWeight: 500,
            fontSize: '18px',
            color: '#cb6565',
            lineHeight: '24px',
            marginBottom: '24px',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        datePicker: {
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: '#ffffff',
            border: '1px solid #fdd2d2',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: isDatePickerOpen ? 'block' : 'none',
            // marginTop: '8px'
        },
        dateUnit: {
            fontSize: '18px',
            color: '#cb6565',
            opacity: 0.8,
            marginLeft: '2px'
        },
        datePickerInput: {
            border: 'none',
            outline: 'none',
            fontFamily: 'Inter',
            fontSize: '16px',
            color: '#cb6565',
            // padding: '8px',
            width: '100%',
            backgroundColor: '#fff9f9'
        },
        imageContainer: {
            marginBottom: '24px',
            position: 'relative'
        },
        uploadLabel: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#fdd2d2',
            border: 'none',
            borderRadius: '12px',
            color: '#cb6565',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
        },
        titleInput: {
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: '24px',
            color: theme.primary,
            border: 'none',
            borderBottom: `1px solid ${theme.primary}`,
            background: 'transparent',
            width: '100%',
            marginBottom: '24px',
            padding: '8px 0',
            outline: 'none'
        },
        contentInput: {
            fontFamily: 'Inter',
            fontSize: '16px',
            color: theme.text,
            border: 'none',
            background: 'transparent',
            width: '100%',
            outline: 'none',
            lineHeight: '1.5'
        },
        dateDisplay: {
            fontSize: '18px',
            color: '#e46262',
            marginBottom: '20px',
            fontWeight: '500',
            marginTop: '40px',
            cursor: 'pointer'
        },
        navigationFixed: {
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: 500,
            margin: '0 auto',
            zIndex: 100,
            background: '#fff',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
        }
    };

    // handleSubmit 함수 재정의 (컴포넌트 내부에 추가)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!diary.content || diary.content.trim().length < 50) {
            toast.showToast('더 풍부한 소설 내용을 위해\n50자 이상 작성해 주세요!', 'info');
            return;
        }
        // 사진 한도 확장 시 저장 시점에만 포인트 차감
        if (hasExtendedThisSession && !isEditMode) {
            if (currentPoints < 20) {
                toast.showToast('포인트가 부족하여 사진이 포함된 일기를 저장할 수 없습니다. (사진 한도 확장 20포인트 필요)', 'error');
                return;
            }
        }
        setIsSubmitting(true);
        try {
            // 1. Firestore에 일기 텍스트만 먼저 저장 (imageUrls는 저장하지 않음)
            const diaryData = {
                userId: user.uid,
                date: formatDateToString(selectedDate),
                title: diary.title,
                content: diary.content,
                weather: diary.weather,
                emotion: diary.emotion,
                mood: diary.mood,
                stickers: stickers,
                createdAt: new Date(),
                imageLimitExtended: isImageLimitExtended, // 필드 추가
            };
            let diaryRef;
            if (isEditMode && existingDiaryId) {
                diaryRef = doc(db, 'diaries', existingDiaryId);
                await setDoc(diaryRef, { ...diaryData, updatedAt: new Date() }, { merge: true });
                toast.showToast('일기가 수정되었습니다.', 'success');
            } else {
                diaryRef = await addDoc(collection(db, 'diaries'), diaryData);
                toast.showToast('일기가 저장되었습니다.', 'success');
                // 포인트 적립: 일기 최초 저장 시 정책값 적용 (당일에만 지급)
                try {
                    const today = new Date();
                    const todayStr = formatDateToString(today);
                    const selectedDateStr = formatDateToString(selectedDate);

                    // 당일에 작성한 일기인 경우에만 포인트 지급
                    if (selectedDateStr === todayStr) {
                        const earnPoint = await getPointPolicy('diary_write_earn', 10);
                        await updateDoc(doc(db, "users", user.uid), {
                            point: increment(earnPoint)
                        });
                        await addDoc(collection(db, "users", user.uid, "pointHistory"), {
                            type: 'earn',
                            amount: earnPoint,
                            desc: '오늘의 일기 작성',
                            createdAt: new Date()
                        });

                        // 일주일 연속 일기 작성 보너스 체크 (당일 작성인 경우에만)
                        await checkWeeklyBonus(user.uid, today);
                    } else {
                        // 과거 날짜에 작성한 경우 안내 메시지
                        toast.showToast('과거 날짜의 일기는 포인트가 지급되지 않습니다.', 'info');
                    }
                } catch (pointError) {
                    toast.showToast('포인트 적립에 실패했습니다.', 'error');
                }
            }
            // 2. 이미지 업로드는 Firestore 저장 후 비동기로 진행
            let finalImageUrls = diary.imageUrls || [];
            if (imageFiles.length > 0) {
                const uploadPromises = imageFiles.map(file => {
                    const imageRef = ref(storage, `diaries/${user.uid}/${formatDateToString(selectedDate)}/${file.name}`);
                    return uploadBytes(imageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
                });
                const uploadedUrls = await Promise.all(uploadPromises);
                finalImageUrls = [...finalImageUrls, ...uploadedUrls];
            }
            // 3. 기존 이미지 + 새 이미지 모두 update (항상 실행)
            await updateDoc(isEditMode && existingDiaryId ? diaryRef : doc(db, 'diaries', diaryRef.id), {
                imageUrls: finalImageUrls,
                updatedAt: new Date(),
                imageLimitExtended: isImageLimitExtended, // 필드 추가
            });
            // 4. 사진 한도 확장 시 포인트 차감(저장 시점, 새로 작성하는 경우에만)
            if (hasExtendedThisSession && !isEditMode) {
                await updateDoc(doc(db, 'users', user.uid), {
                    point: increment(-20)
                });
                await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                    type: 'use',
                    amount: -20,
                    desc: '일기 사진 한도 확장',
                    createdAt: new Date()
                });
                toast.showToast('사진 한도 확장으로 20포인트가 차감되었습니다.', 'info');
            }
            navigate(`/diary/date/${formatDateToString(selectedDate)}`);
        } catch (error) {
            toast.showToast('저장에 실패했습니다.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div ref={containerRef} style={styles.container}>
            <Header
                user={user}
                rightActions={
                    <button
                        style={styles.actionButton}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '저장 중...' : (isEditMode ? '수정' : '저장')}
                    </button>
                }
            />
            <main style={{ ...styles.mainContent, paddingBottom: keyboardHeight }}>
                {/* <TopRow> */}
                <DiaryDate>{formatDate(diary.date)}</DiaryDate>
                {/* </TopRow> */}

                <DiaryMeta>
                    <MetaLabel>
                        {!diary.weather ? (
                            <Button
                                onClick={(e) => {
                                    setIsWeatherSheetOpen(true);
                                    setIsEmotionSheetOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    height: 44,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    fontSize: 16,
                                    color: isDark ? '#ffffff' : '#222',
                                    fontWeight: 600,
                                    padding: '0 0'
                                }}
                            >
                                오늘의 날씨
                            </Button>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 44, minWidth: 140, fontSize: 16, color: isDark ? '#ffffff' : '#222', fontWeight: 500, padding: 0 }}>
                                오늘의 날씨
                                <img
                                    src={weatherImageMap[diary.weather]}
                                    alt={diary.weather}
                                    style={{ width: 36, height: 36, cursor: 'pointer', verticalAlign: 'middle', marginLeft: 8 }}
                                    onClick={(e) => {
                                        setIsWeatherSheetOpen(true);
                                        setIsEmotionSheetOpen(false);
                                    }}
                                />
                            </span>
                        )}
                    </MetaLabel>
                    <MetaLabel>
                        {!diary.emotion ? (
                            <Button
                                onClick={(e) => {
                                    setIsEmotionSheetOpen(true);
                                    setIsWeatherSheetOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    height: 44,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    fontSize: 16,
                                    color: isDark ? '#ffffff' : '#222',
                                    fontWeight: 600,
                                    padding: '0 0'
                                }}
                            >
                                내 기분
                            </Button>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 44, minWidth: 140, fontSize: 16, color: isDark ? '#ffffff' : '#222', fontWeight: 500, padding: 0 }}>
                                내 기분
                                <img
                                    src={emotionImageMap[diary.emotion]}
                                    alt={diary.emotion}
                                    style={{ width: 36, height: 36, cursor: 'pointer', verticalAlign: 'middle', marginLeft: 8 }}
                                    onClick={(e) => {
                                        setIsEmotionSheetOpen(true);
                                        setIsWeatherSheetOpen(false);
                                    }}
                                />
                            </span>
                        )}
                    </MetaLabel>
                </DiaryMeta>

                {/* 바텀시트 오버레이 */}
                {(isWeatherSheetOpen || isEmotionSheetOpen) && (
                    <div
                        onClick={closeSheets}
                        style={{
                            position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999,
                            background: 'rgba(0,0,0,0.15)'
                        }}
                    />
                )}
                {isWeatherSheetOpen && (
                    <div style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
                        background: isDark ? '#1a1a1a' : '#fff',
                        borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        boxShadow: isDark ? '0 -2px 16px rgba(0,0,0,0.32)' : '0 -2px 16px rgba(0,0,0,0.12)',
                        padding: 24, minHeight: 220,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'slideUp 0.2s ease',
                        color: isDark ? '#f1f1f1' : '#222',
                    }}>
                        <div style={{ fontWeight: 300, fontSize: 18, marginBottom: 16, color: isDark ? '#f1f1f1' : '#222' }}>오늘의 날씨를 선택하세요</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(2, 1fr)',
                            gap: 24,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 240,
                            margin: '0 auto',
                        }}>
                            {weatherOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                        setDiary(prev => ({ ...prev, weather: opt.value }));
                                        setIsWeatherSheetOpen(false);
                                    }}
                                    style={{
                                        border: 'none', background: 'none', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        outline: 'none',
                                        filter: diary.weather === opt.value ? (isDark ? 'brightness(1.2) drop-shadow(0 0 6px #ffe29f)' : 'brightness(0.9) drop-shadow(0 0 6px rgb(255, 209, 111))') : 'none'
                                    }}
                                >
                                    <img src={weatherImageMap[opt.value]} alt={opt.label} style={{ width: 56, height: 56, marginBottom: 6 }} />
                                    <span style={{ fontSize: 14, color: isDark ? '#ffffff' : '#cb6565', fontWeight: 500, fontFamily: 'inherit' }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsWeatherSheetOpen(false)}
                            style={{ marginTop: 24, color: isDark ? '#aaa' : '#888', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
                        >닫기</button>
                    </div>
                )}
                {isEmotionSheetOpen && (
                    <div style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
                        background: isDark ? '#1a1a1a' : '#fff',
                        borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        boxShadow: isDark ? '0 -2px 16px rgba(0,0,0,0.32)' : '0 -2px 16px rgba(0,0,0,0.12)',
                        padding: 24, minHeight: 220,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'slideUp 0.2s ease',
                        color: isDark ? '#f1f1f1' : '#222',
                    }}>
                        <div style={{ fontWeight: 300, fontSize: 18, marginBottom: 16, color: isDark ? '#f1f1f1' : '#222' }}>오늘의 기분을 선택하세요</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(2, 1fr)',
                            gap: 24,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 240,
                            margin: '0 auto',
                        }}>
                            {emotionOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                        setDiary(prev => ({ ...prev, emotion: opt.value }));
                                        setIsEmotionSheetOpen(false);
                                    }}
                                    style={{
                                        border: 'none', background: 'none', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        outline: 'none',
                                        filter: diary.emotion === opt.value ? (isDark ? 'brightness(1.2) drop-shadow(0 0 6px #ffe29f)' : 'brightness(0.9) drop-shadow(0 0 6px rgb(255, 209, 111))') : 'none'
                                    }}
                                >
                                    <img src={emotionImageMap[opt.value]} alt={opt.label} style={{ width: 56, height: 56, marginBottom: 6 }} />
                                    <span style={{ fontSize: 14, color: isDark ? '#ffffff' : '#cb6565', fontWeight: 500, fontFamily: 'inherit' }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEmotionSheetOpen(false)}
                            style={{ marginTop: 24, color: isDark ? '#aaa' : '#888', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
                        >닫기</button>
                    </div>
                )}

                <div style={styles.imageContainer}>
                    {/* 사진 개수 표시 */}
                    {/* 사진 개수 표시(상단, 버튼 위) 코드 완전히 삭제 */}
                    {/* 사진 추가 버튼 분기 */}
                    <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={imagePreview.length >= 4 || (!isImageLimitExtended && imagePreview.length >= 1)}
                    />
                    <ImagePreviewContainer style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {imagePreview.map((src, index) => (
                            <ImagePreviewBox key={index}>
                                <PreviewImg src={src} alt={`업로드 이미지 ${index + 1}`} />
                                <RemoveButton type="button" onClick={(e) => removeImage(index)}>
                                    ×
                                </RemoveButton>
                            </ImagePreviewBox>
                        ))}
                        {/* 한도 미확장 && 사진 1장 이상이면 확장 버튼 */}
                        {!isImageLimitExtended && imagePreview.length >= 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleExtendAndEnableImageUpload}
                                    disabled={currentPoints < 20}
                                    style={{
                                        marginTop: 0,
                                        width: 100,
                                        height: 100,
                                        borderRadius: 8,
                                        background: currentPoints < 20 ? '#eee' : '#cb6565',
                                        color: currentPoints < 20 ? '#aaa' : '#fff',
                                        border: 'none',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        cursor: currentPoints < 20 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <span className="icon" style={{ fontSize: 24, marginBottom: 4 }}>📸</span>
                                    사진 추가 저장 (20P)
                                </button>
                                <span style={{
                                    marginLeft: 6,
                                    fontSize: 13,
                                    color: '#cb6565',
                                    fontWeight: 400,
                                    minWidth: 38,
                                    textAlign: 'left',
                                    alignSelf: 'flex-end',
                                    letterSpacing: '-0.5px',
                                }}>
                                    ({imagePreview.length}/1)
                                </span>
                            </>
                        )}
                        {/* 한도 확장 && 4장 미만이면 사진 추가 버튼 */}
                        {isImageLimitExtended && imagePreview.length < 4 && (
                            <>
                                <UploadLabel htmlFor="image-upload" style={{
                                    opacity: imagePreview.length >= 4 ? 0.5 : 1,
                                    pointerEvents: imagePreview.length >= 4 ? 'none' : 'auto',
                                    position: 'relative',
                                }}>
                                    <span className="icon">📸</span>
                                    사진 추가
                                </UploadLabel>
                                <span style={{
                                    marginLeft: 6,
                                    fontSize: 13,
                                    color: '#cb6565',
                                    fontWeight: 400,
                                    minWidth: 38,
                                    textAlign: 'left',
                                    alignSelf: 'flex-end',
                                    letterSpacing: '-0.5px',
                                }}>
                                    ({imagePreview.length}/4)
                                </span>
                            </>
                        )}
                        {/* 한도 미확장 && 사진이 0개일 때만 사진 추가 버튼 */}
                        {!isImageLimitExtended && imagePreview.length === 0 && (
                            <>
                                <UploadLabel htmlFor="image-upload" style={{
                                    opacity: 1,
                                    pointerEvents: 'auto',
                                    position: 'relative',
                                }}>
                                    <span className="icon">📸</span>
                                    사진 추가
                                </UploadLabel>
                                <span style={{
                                    marginLeft: 6,
                                    fontSize: 13,
                                    color: '#cb6565',
                                    fontWeight: 400,
                                    minWidth: 38,
                                    textAlign: 'left',
                                    alignSelf: 'flex-end',
                                    letterSpacing: '-0.5px',
                                }}>
                                    (0/1)
                                </span>
                            </>
                        )}
                    </ImagePreviewContainer>
                    {/* 안내 메시지 */}
                    {imagePreview.length >= 4 && (
                        <div style={{ color: '#cb6565', marginTop: 8, fontSize: 14 }}>사진은 최대 4장까지 등록할 수 있습니다.</div>
                    )}
                    {imagePreview.length === 1 && !isImageLimitExtended && currentPoints < 20 && (
                        <div style={{ color: '#cb6565', marginTop: 8, fontSize: 14 }}>포인트가 부족하여 사진 한도 확장이 불가합니다.<br />20포인트 필요</div>
                    )}
                </div>



                <TitleInput
                    type="text"
                    name="title"
                    placeholder="일기 제목"
                    value={diary.title}
                    onChange={handleChange}
                    required
                />

                {/* 일기 내용 작성 영역 (스티커 포함) */}
                <ContentContainer
                    data-content-container
                    style={{ height: contentHeight }}
                    onClick={(e) => {
                        if (!draggedSticker) {
                            setSelectedSticker(null);
                        }
                    }}
                >
                    <ContentTextarea
                        ref={textareaRef}
                        name="content"
                        placeholder="일기 내용을 작성하세요..."
                        value={diary.content}
                        onChange={handleChange}
                        onFocus={e => {
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        required
                    />

                    {/* 스티커들 */}
                    {stickers.map((sticker) => (
                        <StickerElement
                            key={sticker.id}
                            data-sticker-id={sticker.id}
                            isSelected={selectedSticker === sticker.id}
                            style={{
                                left: sticker.x,
                                top: sticker.y,
                                width: sticker.width,
                                height: sticker.height,
                                zIndex: sticker.zIndex
                            }}
                        >
                            <StickerImage
                                src={sticker.src}
                                alt={sticker.type}
                                onMouseDown={(e) => handleDragStart(e, sticker.id, 'move')}
                                onTouchStart={(e) => handleDragStart(e, sticker.id, 'move')}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    selectSticker(sticker.id);
                                }}
                                style={{
                                    cursor: draggedSticker?.id === sticker.id ? 'grabbing' : 'grab',
                                    userSelect: 'none',
                                    pointerEvents: 'auto',
                                    touchAction: 'none'
                                }}
                                draggable={false}
                            />

                            {/* 삭제 버튼 - 항상 표시 */}
                            <StickerDeleteButton
                                onClick={() => removeSticker(sticker.id)}
                                title="삭제"
                                style={{
                                    opacity: selectedSticker === sticker.id ? 1 : 0.7
                                }}
                            >
                                ✕
                            </StickerDeleteButton>

                            {selectedSticker === sticker.id && (
                                <>
                                    {/* 크기 조절 핸들 (우하단) */}
                                    <StickerHandle
                                        style={{
                                            bottom: '-8px',
                                            right: '-8px',
                                            cursor: 'nw-resize',
                                            background: draggedSticker?.id === sticker.id && draggedSticker?.action === 'resize' ? '#a54a4a' : '#cb6565',
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDragStart(e, sticker.id, 'resize');
                                        }}
                                        onTouchStart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDragStart(e, sticker.id, 'resize');
                                        }}
                                        title="크기 조절"
                                    />
                                </>
                            )}
                        </StickerElement>
                    ))}
                </ContentContainer>

                {/* 스티커 패널 */}
                {isStickerPanelOpen && (
                    <>
                        <div
                            onClick={() => setIsStickerPanelOpen(false)}
                            style={{
                                position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999,
                                background: 'rgba(0,0,0,0.15)'
                            }}
                        />
                        <StickerPanel>
                            <div style={{
                                fontWeight: 300,
                                fontSize: 18,
                                marginBottom: 16,
                                color: isDark ? '#f1f1f1' : '#222',
                                textAlign: 'center'
                            }}>
                                스티커를 선택하세요
                            </div>
                            <StickerGrid>
                                {stickerList.map((sticker) => (
                                    <StickerItem
                                        key={sticker.id}
                                        onClick={() => addSticker(sticker)}
                                        title={sticker.name}
                                    >
                                        <img src={sticker.src} alt={sticker.name} />
                                    </StickerItem>
                                ))}
                            </StickerGrid>
                            <button
                                type="button"
                                onClick={() => setIsStickerPanelOpen(false)}
                                style={{
                                    marginTop: 24,
                                    color: isDark ? '#aaa' : '#888',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            >
                                닫기
                            </button>
                        </StickerPanel>
                    </>
                )}

                {/* 플로팅 스티커 버튼 */}
                <StickerButton onClick={() => setIsStickerPanelOpen(true)}>
                    🎨
                </StickerButton>
            </main>
            <div style={styles.navigationFixed}>
                <Navigation />
            </div>
        </div>
    );
}

export default WriteDiary; 