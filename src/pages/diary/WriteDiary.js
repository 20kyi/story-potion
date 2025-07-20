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
import { useTheme } from 'styled-components';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

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
  font-family: 'Inter', sans-serif;
  .date-number, .date-unit {
    color: ${({ theme }) => theme.text};
    font-family: 'Inter', sans-serif;
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
  border: 2px solid #fdd2d2;
  background: #fafafa;
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
    const isDark = theme.mode === 'dark';
    const labelColor = isDark ? '#fff' : '#222';
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const containerRef = useRef();

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

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const dateParam = params.get('date');
        if (dateParam && user) {
            // new Date()는 T00:00:00Z가 아닌 로컬 시간대를 사용하도록 합니다.
            const date = new Date(dateParam.replace(/-/g, '/'));
            setSelectedDate(date);
            fetchDiaryForDate(date);
        }
    }, [location, user]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
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
            setIsEditMode(true);
            setExistingDiaryId(diaryId);
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
            setIsEditMode(false);
            setExistingDiaryId(null);
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

    const handleImageUpload = async (e) => {
        const newFiles = Array.from(e.target.files);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!diary.content || diary.content.trim().length < 50) {
            toast.showToast('더 풍부한 소설 내용을 위해\n50자 이상 작성해 주세요!', 'info');
            return;
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
                createdAt: new Date(),
            };

            let diaryRef;
            if (isEditMode && existingDiaryId) {
                diaryRef = doc(db, 'diaries', existingDiaryId);
                await setDoc(diaryRef, { ...diaryData, updatedAt: new Date() }, { merge: true });
                toast.showToast('일기가 수정되었습니다.', 'success');
            } else {
                diaryRef = await addDoc(collection(db, 'diaries'), diaryData);
                toast.showToast('일기가 저장되었습니다.', 'success');
                // 포인트 적립: 일기 최초 저장 시 10포인트 지급
                try {
                    await updateDoc(doc(db, "users", user.uid), {
                        point: increment(10)
                    });
                    // 포인트 적립 내역 기록
                    await addDoc(collection(db, "users", user.uid, "pointHistory"), {
                        type: 'earn',
                        amount: 10,
                        desc: '일기 작성',
                        createdAt: new Date()
                    });
                    console.log('포인트 적립 성공');
                } catch (pointError) {
                    toast.showToast('포인트 적립에 실패했습니다.', 'error');
                    console.error('포인트 적립 에러:', pointError);
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
            });

            navigate(`/diary/date/${formatDateToString(selectedDate)}`);
        } catch (error) {
            toast.showToast('저장에 실패했습니다.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 감정/날씨 바텀시트 오버레이 닫기 핸들러
    const closeSheets = () => {
        setIsEmotionSheetOpen(false);
        setIsWeatherSheetOpen(false);
    };

    // 작성 중 여부 판별
    const isDirty = diary.title || diary.content || diary.mood || diary.weather || diary.emotion || imagePreview.length > 0;

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100svh',
            position: 'relative',
            maxWidth: '600px',
            margin: '40px auto',
            padding: '20px',
            paddingTop: '40px',
            // paddingBottom: '100px',
        },
        mainContent: {
            flex: 1,
            position: 'relative',
            paddingBottom: '100px',
            overflowY: 'scroll',
            minHeight: 0,
            width: '100%',
            paddingTop: '8px',
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
                                    color: labelColor,
                                    fontWeight: 600,
                                    padding: '0 0'
                                }}
                            >
                                오늘의 날씨
                            </Button>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 44, minWidth: 140, fontSize: 16, color: labelColor, fontWeight: 500, padding: 0 }}>
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
                                    color: labelColor,
                                    fontWeight: 600,
                                    padding: '0 0'
                                }}
                            >
                                내 기분
                            </Button>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 44, minWidth: 140, fontSize: 16, color: labelColor, fontWeight: 500, padding: 0 }}>
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
                        background: isDark ? '#232323' : '#fff',
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
                                    <span style={{ fontSize: 14, color: isDark ? '#ffe29f' : '#cb6565', fontWeight: 500 }}>{opt.label}</span>
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
                        background: isDark ? '#232323' : '#fff',
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
                                    <span style={{ fontSize: 14, color: isDark ? '#ffe29f' : '#cb6565', fontWeight: 500 }}>{opt.label}</span>
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
                    <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                    <ImagePreviewContainer>
                        {imagePreview.map((src, index) => (
                            <ImagePreviewBox key={index}>
                                <PreviewImg src={src} alt={`업로드 이미지 ${index + 1}`} />
                                <RemoveButton type="button" onClick={(e) => removeImage(index)}>
                                    ×
                                </RemoveButton>
                            </ImagePreviewBox>
                        ))}
                        <UploadLabel htmlFor="image-upload">
                            <span className="icon">📸</span>
                            사진 추가
                        </UploadLabel>
                    </ImagePreviewContainer>
                </div>

                <TitleInput
                    type="text"
                    name="title"
                    placeholder="일기 제목"
                    value={diary.title}
                    onChange={handleChange}
                    required
                />

                <ContentTextarea
                    ref={textareaRef}
                    name="content"
                    placeholder="일기 내용"
                    value={diary.content}
                    onChange={handleChange}
                    onFocus={e => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    required
                />
            </main>
            <div style={styles.navigationFixed}>
                <Navigation />
            </div>
        </div>
    );
}

export default WriteDiary; 