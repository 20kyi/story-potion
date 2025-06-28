import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useSwipeable } from 'react-swipeable';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../components/ui/ToastProvider';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  padding-top: 40px;
  margin: 40px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
`;

const DiaryTitle = styled.h2`
  font-size: 25px;
  font-weight: 500;
  margin-bottom: 16px;
  margin-top: 30px;
  color: ${({ theme }) => theme.diaryText};
`;

const DiaryContent = styled.p`
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: ${({ theme }) => theme.diaryContent};
`;

const DiaryDate = styled.div`
  font-size: 18px;
  color: ${({ theme }) => theme.text};
//   margin-bottom: 10px;
  font-weight: 500;
//   margin-top: 40px;
`;

const DiaryMeta = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  margin: 12px 0 8px 0;
  min-height: 28px;
  font-size: 17px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`;

function DiaryView({ user }) {
    const navigate = useNavigate();
    const { date } = useParams();
    const [diary, setDiary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [noMoreFuture, setNoMoreFuture] = useState(false); // 미래 안내 상태
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const toast = useToast();

    // 날짜 계산 함수
    const getAdjacentDate = (baseDate, diff) => {
        const d = new Date(baseDate.replace(/-/g, '/'));
        d.setDate(d.getDate() + diff);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // 오늘 날짜를 yyyy-mm-dd로 반환하는 함수
    const getTodayString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // 스와이프 핸들러
    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (noMoreFuture) return; // 미래 안내 상태면 더 이상 오른쪽 이동 불가
            const nextDate = getAdjacentDate(date, 1);
            if (nextDate > getTodayString()) {
                setNoMoreFuture(true);
                return;
            }
            navigate(`/diary/date/${nextDate}`);
        },
        onSwipedRight: () => {
            if (noMoreFuture) {
                setNoMoreFuture(false); // 미래 안내 상태에서 왼쪽 이동 시 원래 일기로 복귀
                return;
            }
            const prevDate = getAdjacentDate(date, -1);
            navigate(`/diary/date/${prevDate}`);
        },
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
    });

    useEffect(() => {
        if (!user || !date) return;
        setIsLoading(true);
        setNoMoreFuture(false); // 날짜 바뀌면 미래 안내 상태 해제
        const fetchDiary = async () => {
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
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        console.log('삭제 시도 diary:', diary);
        let snap = null;
        if (diary && diary.id) {
            try {
                const diaryRef = doc(db, 'diaries', diary.id);
                snap = await getDoc(diaryRef);
                if (snap.exists()) {
                    console.log('실제 Firestore 문서:', snap.data());
                } else {
                    console.log('Firestore 문서가 존재하지 않습니다.');
                }
                await deleteDoc(diaryRef);
                toast.showToast('일기가 삭제되었습니다.', 'success');
                setShowDeleteModal(false);
                navigate('/diaries');
            } catch (error) {
                console.error("Error deleting diary: ", error);
                console.log('catch 블록 diary:', diary);
                if (snap) {
                    console.log('catch 블록 Firestore 문서:', snap.data());
                }
                toast.showToast('일기 삭제에 실패했습니다.', 'error');
                setShowDeleteModal(false);
            }
        } else {
            toast.showToast('일기 정보가 올바르지 않습니다.', 'error');
            setShowDeleteModal(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
    };

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
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
            minHeight: 0,
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
            color: theme => theme.mode === 'dark' ? theme.diaryText : '#e46262',
            marginBottom: '16px',
            fontWeight: '600'
        },
        diaryContent: {
            fontSize: '16px',
            color: theme => theme.mode === 'dark' ? theme.diaryContent : '#444',
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

    // 감정/날씨 이미지 매핑 추가
    const weatherImageMap = {
        sunny: '/weather/sunny.png',
        cloudy: '/weather/cloudy.png',
        rainy: '/weather/rainy.png',
        snowy: '/weather/snowy.png',
        windy: '/weather/windy.png',
        thunder: '/weather/thunder.png',
    };
    const emotionImageMap = {
        love: '/emotions/love.png',
        good: '/emotions/good.png',
        normal: '/emotions/normal.png',
        surprised: '/emotions/surprised.png',
        angry: '/emotions/angry.png',
        cry: '/emotions/cry.png',
    };

    return (
        <Container {...handlers}>
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
                    ) : noMoreFuture ? (
                        <div style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '80px' }}>
                            더이상 일기가 없습니다.<br />
                            (왼쪽으로 스와이프하면 이전 일기로 돌아갑니다)
                        </div>
                    ) : diary ? (
                        <>
                            <DiaryDate>{formatDate(diary.date)}</DiaryDate>
                            <DiaryMeta>
                                <span>오늘의 날씨 {diary.weather && weatherImageMap[diary.weather] ? <img src={weatherImageMap[diary.weather]} alt="날씨" style={{ width: 28, height: 28, verticalAlign: 'middle' }} /> : ''}</span>
                                <span>내 기분 {diary.emotion && emotionImageMap[diary.emotion] ? <img src={emotionImageMap[diary.emotion]} alt="감정" style={{ width: 32, height: 32, verticalAlign: 'middle' }} /> : ''}</span>
                            </DiaryMeta>
                            {!isLoading && !noMoreFuture && diary && diary.imageUrls && diary.imageUrls.length > 0 && (
                                <div style={styles.imageGrid}>
                                    {diary.imageUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt={`일기 이미지 ${idx + 1}`} style={styles.image} />
                                    ))}
                                </div>
                            )}
                            <DiaryTitle>{diary.title}</DiaryTitle>
                            <DiaryContent>{diary.content}</DiaryContent>
                        </>
                    ) : (
                        <div style={styles.noDiary}>
                            이 날짜에 작성된 일기가 없습니다.
                        </div>
                    )}
                </main>
            </div>
            <Navigation />
            <ConfirmModal
                open={showDeleteModal}
                title="일기 삭제"
                description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
            />
        </Container>
    );
}

export default DiaryView; 