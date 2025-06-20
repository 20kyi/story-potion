import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

// 오늘 날짜를 yyyy-mm-dd 형식으로 반환하는 함수
const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
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
        mood: '행복',
        images: [],
        weather: 'sunny',
        emotion: 'happy'
    });
    const [imagePreview, setImagePreview] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingDiaryId, setExistingDiaryId] = useState(null);

    const weatherOptions = [
        { value: 'sunny', label: '☀️ 맑음' },
        { value: 'cloudy', label: '☁️ 흐림' },
        { value: 'rainy', label: '🌧️ 비' },
        { value: 'snowy', label: '❄️ 눈' }
    ];
    const emotionOptions = [
        { value: 'happy', label: '😊 행복' },
        { value: 'sad', label: '😢 슬픔' },
        { value: 'angry', label: '😠 화남' },
        { value: 'calm', label: '😌 평온' }
    ];

    useEffect(() => {
        // URL에서 날짜 파라미터 가져오기
        const params = new URLSearchParams(location.search);
        const dateParam = params.get('date');
        if (dateParam) {
            const date = new Date(dateParam);
            setSelectedDate(date);

            // 해당 날짜의 일기가 있는지 확인
            const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
            const existingDiary = diaries.find(d => d.date.startsWith(dateParam));

            if (existingDiary) {
                setDiary({
                    title: existingDiary.title,
                    content: existingDiary.content,
                    mood: existingDiary.mood || '행복',
                    images: existingDiary.images || [],
                    weather: existingDiary.weather || 'sunny',
                    emotion: existingDiary.emotion || 'happy'
                });
                setImagePreview(existingDiary.images || []);
                setIsEditMode(true);
                setExistingDiaryId(existingDiary.id);
            }
        }
    }, [location]);

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
        // 날짜 변경 시 해당 날짜의 일기가 있는지 확인
        const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
        const existingDiary = diaries.find(d => d.date.startsWith(date));

        if (existingDiary && !isEditMode) {
            if (window.confirm('이미 해당 날짜의 일기가 있습니다. 수정하시겠습니까?')) {
                setDiary({
                    title: existingDiary.title,
                    content: existingDiary.content,
                    mood: existingDiary.mood || '행복',
                    images: existingDiary.images || [],
                    weather: existingDiary.weather || 'sunny',
                    emotion: existingDiary.emotion || 'happy'
                });
                setImagePreview(existingDiary.images || []);
                setIsEditMode(true);
                setExistingDiaryId(existingDiary.id);
            } else {
                return;
            }
        }

        setSelectedDate(newDate);
        setIsDatePickerOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDiary(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newPreviews = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result);
                if (newPreviews.length === files.length) {
                    setDiary(prev => ({
                        ...prev,
                        images: [...prev.images, ...newPreviews]
                    }));
                    setImagePreview(prev => [...prev, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setDiary(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleDelete = () => {
        if (window.confirm('정말 일기를 삭제하시겠습니까?\n삭제된 일기는 복구할 수 없습니다.')) {
            const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
            const updatedDiaries = diaries.filter(d => d.id !== existingDiaryId);
            localStorage.setItem('diaries', JSON.stringify(updatedDiaries));
            alert('일기가 삭제되었습니다.');
            navigate('/diaries');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!diary.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!diary.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
        const dateStr = selectedDate.toISOString().split('T')[0];

        // 같은 날짜의 일기가 있는지 확인
        const existingIndex = diaries.findIndex(d => d.date.startsWith(dateStr));

        if (existingIndex !== -1 && !isEditMode) {
            alert('이미 해당 날짜의 일기가 있습니다.');
            return;
        }

        const diaryData = {
            ...diary,
            date: selectedDate.toISOString(),
            id: isEditMode ? existingDiaryId : Date.now(),
            weather: diary.weather,
            emotion: diary.emotion
        };

        if (isEditMode) {
            // 수정 모드일 경우 기존 일기 업데이트
            const updatedDiaries = diaries.map(d =>
                d.id === existingDiaryId ? diaryData : d
            );
            localStorage.setItem('diaries', JSON.stringify(updatedDiaries));
            alert('일기가 수정되었습니다.');
        } else {
            // 새 일기 추가
            diaries.push(diaryData);
            localStorage.setItem('diaries', JSON.stringify(diaries));
            alert('일기가 저장되었습니다.');
        }

        navigate('/diaries');
    };

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
            position: 'relative'
        },
        // header: {
        //     display: 'flex',
        //     alignItems: 'center',
        //     gap: '15px',
        //     marginBottom: '25px'
        // },
        actionButtons: {
            display: 'flex',
            gap: '10px',
            position: 'absolute',
            top: '20px',
            right: '20px'
        },
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
        deleteButton: {
            backgroundColor: 'rgba(190, 71, 71, 0.4)'
        },
        // profileImage: {
        //     width: '36px',
        //     height: '36px',
        //     borderRadius: '50%',
        //     border: '1px solid #df9696',
        //     cursor: 'pointer',
        //     transition: 'transform 0.2s ease',
        //     '&:hover': {
        //         transform: 'scale(1.05)'
        //     }
        // },
        // headerText: {
        //     display: 'flex',
        //     flexDirection: 'column'
        // },
        // headerTitle: {
        //     fontFamily: 'Instrument Sans',
        //     fontSize: '10px',
        //     color: '#de2a2a',
        //     margin: 0
        // },
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
                    <button style={styles.actionButton} onClick={handleSubmit}>저장</button>
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
                    <div>
                        <label style={{ color: '#cb6565', fontWeight: 600, marginRight: 8 }}>날씨</label>
                        <select
                            name="weather"
                            value={diary.weather}
                            onChange={handleChange}
                            style={{ fontSize: '16px', borderRadius: '8px', padding: '4px 8px', border: '1px solid #fdd2d2', color: '#cb6565', background: '#fff9f9' }}
                        >
                            {weatherOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ color: '#cb6565', fontWeight: 600, marginRight: 8 }}>감정</label>
                        <select
                            name="emotion"
                            value={diary.emotion}
                            onChange={handleChange}
                            style={{ fontSize: '16px', borderRadius: '8px', padding: '4px 8px', border: '1px solid #fdd2d2', color: '#cb6565', background: '#fff9f9' }}
                        >
                            {emotionOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

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
                                    onClick={() => removeImage(index)}
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