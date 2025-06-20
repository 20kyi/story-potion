import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import styled from 'styled-components';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
//   background: radial-gradient(circle at 30% 20%, #f2b7b7 0%, #ffffff 100%);
  padding: 20px;
  padding-top: 70px;
`;

function DiaryView({ user }) {
    const navigate = useNavigate();
    const { date } = useParams();
    const [diary, setDiary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !date) return;
        // URL의 date 파라미터는 'YYYY-MM-DD' 형식이므로,
        // new Date()가 로컬 시간대 자정으로 해석하도록 '-'를 '/'로 변경합니다.
        const targetDate = new Date(date.replace(/-/g, '/'));

        const fetchDiary = async () => {
            setIsLoading(true);
            const diariesRef = collection(db, 'diaries');
            const q = query(diariesRef, where('userId', '==', user.uid), where('date', '==', date));

            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const diaryData = querySnapshot.docs[0].data();
                    const diaryId = querySnapshot.docs[0].id;
                    setDiary({ ...diaryData, id: diaryId });
                } else {
                    setDiary(null);
                }
            } catch (error) {
                console.error("Error fetching diary: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiary();
    }, [user, date]);

    const handleDelete = async () => {
        if (diary && window.confirm('일기를 삭제하시겠습니까?')) {
            try {
                const diaryRef = doc(db, 'diaries', diary.id);
                await deleteDoc(diaryRef);
                alert('일기가 삭제되었습니다.');
                navigate('/diaries');
            } catch (error) {
                console.error("Error deleting diary: ", error);
                alert('일기 삭제에 실패했습니다.');
            }
        }
    };

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            // background: 'radial-gradient(circle at 30% 20%, #f2b7b7 0%, #ffffff 100%)',
            // padding: '20px',
        },
        content: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '80px',
            // marginTop: '20px'
        },
        mainContent: {
            // backgroundColor: '#fffbfb',
            // borderRadius: '30px',
            // padding: '20px',
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            maxHeight: 'calc(100vh - 200px)',
        },
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
        diaryDate: {
            fontSize: '18px',
            color: '#e46262',
            marginBottom: '20px',
            fontWeight: '500',
            marginTop: '40px'
        },
        diaryTitle: {
            fontSize: '20px',
            color: '#333',
            marginBottom: '16px',
            fontWeight: '600'
        },
        diaryContent: {
            fontSize: '16px',
            color: '#666',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
        },
        imageGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '16px',
            marginTop: '20px'
        },
        image: {
            width: '100%',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #fdd2d2'
        },
        noDiary: {
            textAlign: 'center',
            color: '#888',
            fontSize: '16px',
            marginTop: '40px'
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    // 날씨/감정 이모티콘 매핑 추가
    const weatherIcons = {
        sunny: "☀️",
        cloudy: "☁️",
        rainy: "🌧️",
        snowy: "❄️"
    };
    const emotionIcons = {
        happy: "😊",
        sad: "😢",
        angry: "😠",
        calm: "😌"
    };

    return (
        <Container>
            <Header
                user={user}
                rightActions={
                    diary && (
                        <>
                            <button style={styles.actionButton} onClick={() => navigate(`/write?date=${date}`)}>수정</button>
                            <button style={{ ...styles.actionButton, ...styles.deleteButton }} onClick={handleDelete}>삭제</button>
                        </>
                    )
                }
            />
            <div style={styles.content}>
                <main style={styles.mainContent}>
                    {isLoading ? (
                        <div>로딩 중...</div>
                    ) : diary ? (
                        <>
                            <div style={styles.diaryDate}>{formatDate(diary.date)}</div>
                            {diary.imageUrls && diary.imageUrls.length > 0 && (
                                <div style={styles.imageGrid}>
                                    {diary.imageUrls.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`일기 이미지 ${index + 1}`}
                                            style={styles.image}
                                        />
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', margin: '12px 0 8px 0', minHeight: '28px', fontSize: '17px', color: '#cb6565', fontWeight: 500 }}>
                                <span>오늘의 날씨: <span style={{ fontSize: '22px', verticalAlign: 'middle' }}>{weatherIcons[diary.weather] || ''}</span></span>
                                <span>나의 기분: <span style={{ fontSize: '22px', verticalAlign: 'middle' }}>{emotionIcons[diary.emotion] || ''}</span></span>
                            </div>
                            <h2 style={styles.diaryTitle}>{diary.title}</h2>
                            <p style={styles.diaryContent}>{diary.content}</p>
                        </>
                    ) : (
                        <div style={styles.noDiary}>
                            이 날짜에 작성된 일기가 없습니다.
                        </div>
                    )}
                </main>
            </div>
            <Navigation />
        </Container>
    );
}

export default DiaryView; 