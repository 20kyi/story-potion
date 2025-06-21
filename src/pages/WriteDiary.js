import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
        mood: '행복',
        imageUrls: [],
        weather: 'sunny',
        emotion: 'happy'
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingDiaryId, setExistingDiaryId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                mood: existingDiary.mood || '행복',
                imageUrls: existingDiary.imageUrls || [],
                weather: existingDiary.weather || 'sunny',
                emotion: existingDiary.emotion || 'happy'
            });
            setImagePreview(existingDiary.imageUrls || []);
            setIsEditMode(true);
            setExistingDiaryId(diaryId);
        } else {
            // Reset form if no diary exists for the new date
            setDiary({
                title: '',
                content: '',
                mood: '행복',
                imageUrls: [],
                weather: 'sunny',
                emotion: 'happy'
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
                        imageUrls: [...prev.imageUrls, ...newPreviews]
                    }));
                    setImageFiles(prev => [...prev, ...files]);
                    setImagePreview(prev => [...prev, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setDiary(prev => ({
            ...prev,
            imageUrls: prev.imageUrls.filter((_, i) => i !== index)
        }));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
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

        if (!user) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        if (!diary.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!diary.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const dateStr = formatDateToString(selectedDate);
            let imageUrls = diary.imageUrls || [];

            if (imageFiles.length > 0) {
                const uploadPromises = imageFiles.map(file => {
                    const imageRef = ref(storage, `diaries/${user.uid}/${dateStr}/${file.name}`);
                    return uploadBytes(imageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
                });
                const newImageUrls = await Promise.all(uploadPromises);
                imageUrls = [...imageUrls, ...newImageUrls];
            }

            const diaryData = {
                ...diary,
                userId: user.uid,
                date: dateStr,
                imageUrls,
                createdAt: new Date(),
            };

            if (isEditMode && existingDiaryId) {
                const diaryRef = doc(db, 'diaries', existingDiaryId);
                await setDoc(diaryRef, diaryData, { merge: true });
                alert('일기가 수정되었습니다.');
            } else {
                await addDoc(collection(db, 'diaries'), diaryData);
                alert('일기가 저장되었습니다.');
            }

            navigate('/diaries');
        } catch (error) {
            console.error("Error saving diary: ", error);
            alert('일기 저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
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