import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { usePrompt } from '../hooks/usePrompt';

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

// TopRow styled-component 추가
const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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
                emotion: existingDiary.emotion || ''
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
                emotion: ''
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

    const handleDateChange = (date) => {
        const newDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (newDate > today) {
            alert('미래의 일기는 작성할 수 없습니다.');
            return;
        }
        setSelectedDate(newDate);
        fetchDiaryForDate(newDate);
        setIsDatePickerOpen(false);
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
                    console.error("Error deleting diary: ", error);
                    alert('일기 삭제에 실패했습니다.');
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!diary.content || diary.content.trim().length < 50) {
            toast.showToast('더 풍부한 소설 내용을 위해 50자 이상 작성해 주세요!', 'info');
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
            console.error("Error saving diary: ", error);
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
            height: '100vh',
            // background: 'radial-gradient(circle at 30% 20%, #f2b7b7 0%, #ffffff 100%)',
            position: 'relative',
            maxWidth: '100%',
            margin: '0 auto',
            overflowX: 'hidden',
            padding: '20px',
            paddingTop: '70px',
        },
        mainContent: {
            // backgroundColor: '#fffbfb',
            // borderRadius: '30px',
            // padding: '20px',
            flex: 1,
            position: 'relative',
            paddingBottom: '100px',
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
            marginTop: '8px'
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
            padding: '8px',
            width: '100%',
            backgroundColor: '#fff9f9'
        },
        imageContainer: {
            marginBottom: '24px',
            position: 'relative'
        },
        imagePreviewContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '10px'
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
        imagePreview: {
            position: 'relative',
            width: '100px',
            height: '100px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid #fdd2d2'
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        },
        removeButton: {
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#cb6565'
        },
        titleInput: {
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: '24px',
            color: '#cb6565',
            border: 'none',
            borderBottom: '1px solid #cb6565',
            background: 'transparent',
            width: '100%',
            marginBottom: '24px',
            padding: '8px 0',
            outline: 'none'
        },
        contentInput: {
            fontFamily: 'Inter',
            fontSize: '16px',
            color: '#000000',
            border: 'none',
            background: 'transparent',
            width: '100%',
            height: '60%',
            resize: 'none',
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
        }
    };

    return (
        <div style={styles.container}>
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
            <main style={styles.mainContent}>
                <TopRow>
                    <div style={styles.dateDisplay} onClick={() => setIsDatePickerOpen(true)}>
                        <span>{formattedDate.year}</span>
                        <span style={styles.dateUnit}>년</span>
                        <span>{formattedDate.month}</span>
                        <span style={styles.dateUnit}>월</span>
                        <span>{formattedDate.day}</span>
                        <span style={styles.dateUnit}>일</span>
                        <div style={styles.datePicker}>
                            <input
                                type="date"
                                value={selectedDate.toISOString().split('T')[0]}
                                max={getTodayString()}
                                onChange={(e) => handleDateChange(e.target.value)}
                                style={styles.datePickerInput}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                </TopRow>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ marginBottom: '20px', minWidth: 140, minHeight: 44, display: 'flex', alignItems: 'center' }}>
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
                                    color: '#cb6565',
                                    fontWeight: 600,
                                    padding: '0 0'
                                }}
                            >
                                오늘의 날씨
                            </Button>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 44, minWidth: 140, fontSize: 16, color: '#cb6565', fontWeight: 600, padding: 0 }}>
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
                    </div>
                    <div style={{ marginBottom: '20px', minWidth: 140, minHeight: 44, display: 'flex', alignItems: 'center' }}>
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
                                    color: '#cb6565',
                                    fontWeight: 600,
                                    padding: '0 0'
                                }}
                            >
                                내 기분
                            </Button>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 44, minWidth: 140, fontSize: 16, color: '#cb6565', fontWeight: 600, padding: 0 }}>
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
                    </div>
                </div>

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
                        background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        boxShadow: '0 -2px 16px rgba(0,0,0,0.12)', padding: 24, minHeight: 220,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'slideUp 0.2s ease'
                    }}>
                        <div style={{ fontWeight: 300, fontSize: 18, marginBottom: 16 }}>오늘의 날씨를 선택하세요</div>
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
                                        filter: diary.weather === opt.value ? 'brightness(0.9) drop-shadow(0 0 6px rgb(255, 209, 111))' : 'none'
                                    }}
                                >
                                    <img src={weatherImageMap[opt.value]} alt={opt.label} style={{ width: 56, height: 56, marginBottom: 6 }} />
                                    <span style={{ fontSize: 14, color: '#cb6565', fontWeight: 500 }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsWeatherSheetOpen(false)}
                            style={{ marginTop: 24, color: '#888', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
                        >닫기</button>
                    </div>
                )}
                {isEmotionSheetOpen && (
                    <div style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
                        background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        boxShadow: '0 -2px 16px rgba(0,0,0,0.12)', padding: 24, minHeight: 220,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'slideUp 0.2s ease'
                    }}>
                        <div style={{ fontWeight: 300, fontSize: 18, marginBottom: 16 }}>오늘의 기분을 선택하세요</div>
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
                                        filter: diary.emotion === opt.value ? 'brightness(0.9) drop-shadow(0 0 6px rgb(255, 209, 111))' : 'none'
                                    }}
                                >
                                    <img src={emotionImageMap[opt.value]} alt={opt.label} style={{ width: 56, height: 56, marginBottom: 6 }} />
                                    <span style={{ fontSize: 14, color: '#cb6565', fontWeight: 500 }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEmotionSheetOpen(false)}
                            style={{ marginTop: 24, color: '#888', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
                        >닫기</button>
                    </div>
                )}

                <div style={styles.imageContainer}>
                    <label htmlFor="image-upload" style={styles.uploadLabel}>
                        📸 사진 추가하기
                    </label>
                    <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                    <div style={styles.imagePreviewContainer}>
                        {imagePreview.map((src, index) => (
                            <div key={index} style={styles.imagePreview}>
                                <img src={src} alt={`업로드 이미지 ${index + 1}`} style={styles.image} />
                                <button
                                    type="button"
                                    onClick={(e) => removeImage(index)}
                                    style={styles.removeButton}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <input
                    type="text"
                    name="title"
                    placeholder="일기 제목"
                    value={diary.title}
                    onChange={handleChange}
                    style={styles.titleInput}
                    required
                />

                <textarea
                    name="content"
                    placeholder="일기 내용"
                    value={diary.content}
                    onChange={handleChange}
                    style={styles.contentInput}
                    required
                />
            </main>
            <Navigation />
        </div>
    );
}

export default WriteDiary; 