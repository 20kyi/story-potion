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
import { useTheme } from '../../ThemeContext';
import { useLanguage, useTranslation } from '../../LanguageContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 28px;
  padding-bottom: 100px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme, $isDiaryTheme }) =>
        $isDiaryTheme
            ? '#fefcf7'
            : theme.background};
  ${props => props.$isDiaryTheme && `
    background-image: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.02) 2px,
        rgba(0, 0, 0, 0.02) 4px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.02) 2px,
        rgba(0, 0, 0, 0.02) 4px
      );
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.08),
      inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  `}
  overflow-y: auto;
  overflow-x: hidden;
`;

const DiaryTitle = styled.h2`
  font-size: 25px !important;
  font-weight: 700 !important;
  margin: 0;
  color: ${({ theme, $isDiaryTheme }) =>
        $isDiaryTheme ? '#8B6F47' : theme.diaryText} !important;
`;

const DiaryContent = styled.p`
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: ${({ theme, $isDiaryTheme }) =>
        $isDiaryTheme ? '#5C4B37' : theme.diaryContent};
`;

const ContentContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 200px;
  border: none;
  border-radius: 0;
  background: transparent;
  margin: 0;
  overflow: visible;
  box-sizing: border-box;
  max-width: 100%;
`;

const StickerElement = styled.div`
  position: absolute;
`;

const StickerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const Card = styled.div`
  background: ${props => {
        if (props.$isDiaryTheme) return '#fffef9';
        if (props.$isDark) return '#232323';
        return '#fff';
    }};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: ${props => props.$isDiaryTheme
        ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)'
        : props.$isDark
            ? '0 2px 8px rgba(0, 0, 0, 0.18)'
            : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  border: ${props => props.$isDiaryTheme
        ? '1px solid rgba(139, 111, 71, 0.15)'
        : 'none'};
  display: flex;
  align-items: center;
`;

const DiaryDate = styled.div`
  font-size: 18px;
  color: ${({ theme, $isDiaryTheme }) =>
        $isDiaryTheme ? '#8B6F47' : theme.text};
  font-weight: 500;
  margin: 0;
`;

const DiaryMeta = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  margin: 0;
  min-height: 28px;
  font-size: 17px;
  color: ${({ theme, $isDiaryTheme }) =>
        $isDiaryTheme ? '#8B6F47' : theme.text};
  font-weight: 500;
  width: 100%;
  
  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const ImageViewerModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ImageViewerContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ImageViewerImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
`;

const ImageViewerClose = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  color: #333;
  z-index: 2001;
  font-weight: bold;
  
  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`;

const ImageViewerNav = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  color: white;
  z-index: 2001;
  font-weight: bold;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

/* 이미지 뷰어 버튼 */
const ImageViewerPrev = styled(ImageViewerNav)`
  left: 20px;
`;
/* 이미지 뷰어 버튼 */
const ImageViewerNext = styled(ImageViewerNav)`
  right: 20px;
`;
/* 이미지 뷰어 버튼 */
function DiaryView({ user }) {
    const navigate = useNavigate();
    const { date } = useParams();
    const [diary, setDiary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [noMoreFuture, setNoMoreFuture] = useState(false); // 미래 안내 상태
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const toast = useToast();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const isDiaryTheme = actualTheme === 'diary';
    const { language } = useLanguage();
    const { t } = useTranslation();

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

    // 일기가 로드되면 컨테이너 크기 업데이트
    useEffect(() => {
        if (diary && !isLoading) {
            setTimeout(() => updateContainerSize(), 100);
        }
    }, [diary, isLoading]);

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

    // 이미지 뷰어 키보드 이벤트
    useEffect(() => {
        if (selectedImageIndex === null || !diary || !diary.imageUrls) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedImageIndex(null);
            } else if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
                setSelectedImageIndex(selectedImageIndex - 1);
            } else if (e.key === 'ArrowRight' && selectedImageIndex < diary.imageUrls.length - 1) {
                setSelectedImageIndex(selectedImageIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedImageIndex, diary]);

    // 컨테이너 크기를 텍스트 영역 높이에 맞게 업데이트 (스티커 위치는 무시)
    const updateContainerSize = () => {
        if (!diary) return;

        const padding = 16; // ContentContainer의 padding
        const minHeight = 200; // 최소 높이
        const maxContainerWidth = 600; // 최대 컨테이너 너비

        // 텍스트 영역의 실제 높이 가져오기
        let textContentHeight = minHeight;
        const contentContainer = document.querySelector('[data-content-container]');
        if (contentContainer) {
            const diaryContent = contentContainer.querySelector('p'); // DiaryContent 요소
            if (diaryContent) {
                // 텍스트 내용의 실제 높이 계산
                textContentHeight = Math.max(minHeight, diaryContent.scrollHeight);
            }
        }

        // 텍스트 2줄 높이 계산 (font-size: 16px, line-height: 1.6)
        const fontSize = 16;
        const lineHeight = 1.6;
        const twoLinesHeight = fontSize * lineHeight * 2; // 약 51.2px

        // 컨테이너 너비는 고정 (스티커 위치 무시)
        const containerWidth = maxContainerWidth;

        // 컨테이너 높이는 텍스트 높이 + 2줄 여백 고려
        const containerHeight = Math.max(minHeight, textContentHeight + padding * 2 + twoLinesHeight);

        console.log('DiaryView Container size update:', {
            textContentHeight,
            containerWidth,
            containerHeight
        });

        // ContentContainer의 크기 업데이트
        if (contentContainer) {
            contentContainer.style.width = `${containerWidth}px`;
            contentContainer.style.height = `${containerHeight}px`;
        }
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
            // fontSize: '50px',
            color: theme => theme.mode === 'dark' ? theme.diaryText : '#e46262',
            // marginBottom: '16px',
            // fontWeight: '600'
        },
        diaryContent: {
            fontSize: '16px',
            color: theme => theme.mode === 'dark' ? theme.diaryContent : '#444',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
        },
        imageGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginTop: '20px',
            marginBottom: '20px'
        },
        image: {
            width: '100%',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '8px',
            border: `1px solid ${isDiaryTheme ? 'rgba(139, 111, 71, 0.2)' : isDark ? '#4a4a4a' : '#fdd2d2'}`
        },
        noDiary: {
            textAlign: 'center',
            color: isDark ? '#aaa' : '#888',
            fontSize: '16px',
            marginTop: '40px'
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (language === 'en') {
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
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
        <Container {...handlers} $isDiaryTheme={isDiaryTheme}>
            <Header
                user={user}
                rightActions={
                    diary && (
                        <>
                            <button style={styles.actionButton} onClick={() => navigate(`/write?date=${date}`)}>{t('diary_update')}</button>
                            <button style={{ ...styles.actionButton, ...styles.deleteButton }} onClick={handleDelete}>{t('delete')}</button>
                        </>
                    )
                }
            />
            <div style={styles.content}>
                <main style={styles.mainContent}>
                    {isLoading ? (
                        <div style={{ color: isDark ? '#fff' : '#000' }}>{t('diary_loading')}</div>
                    ) : noMoreFuture ? (
                        <div style={{ textAlign: 'center', color: isDark ? '#aaa' : '#888', fontSize: '14px', marginTop: '80px' }}>
                            {t('diary_no_more')}<br />
                            {t('diary_swipe_back')}
                        </div>
                    ) : diary ? (
                        <>
                            <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark}>
                                <DiaryDate $isDiaryTheme={isDiaryTheme}>{formatDate(diary.date)}</DiaryDate>
                            </Card>

                            <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark}>
                                <DiaryMeta $isDiaryTheme={isDiaryTheme}>
                                    <span>
                                        {t('today_weather')}
                                        {diary.weather && weatherImageMap[diary.weather] && (
                                            <img src={weatherImageMap[diary.weather]} alt={t('diary_weather_alt') || 'weather'} style={{ width: 28, height: 28 }} />
                                        )}
                                    </span>
                                    <span>
                                        {t('today_mood')}
                                        {diary.emotion && emotionImageMap[diary.emotion] && (
                                            <img src={emotionImageMap[diary.emotion]} alt={t('diary_emotion_alt') || 'emotion'} style={{ width: 32, height: 32 }} />
                                        )}
                                    </span>
                                </DiaryMeta>
                            </Card>

                            {!isLoading && !noMoreFuture && diary && diary.imageUrls && diary.imageUrls.length > 0 && (
                                <div style={styles.imageGrid}>
                                    {diary.imageUrls.map((url, idx) => (
                                        <img
                                            key={idx}
                                            src={url}
                                            alt={`${t('diary_image_alt') || 'diary image'} ${idx + 1}`}
                                            style={{ ...styles.image, cursor: 'pointer' }}
                                            onClick={() => setSelectedImageIndex(idx)}
                                        />
                                    ))}
                                </div>
                            )}

                            <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark}>
                                <DiaryTitle $isDiaryTheme={isDiaryTheme}>{diary.title}</DiaryTitle>
                            </Card>

                            {/* 일기 내용 영역 (스티커 포함) */}
                            <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark}>
                                <ContentContainer data-content-container $isDiaryTheme={isDiaryTheme}>
                                    <DiaryContent $isDiaryTheme={isDiaryTheme}>{diary.content}</DiaryContent>

                                    {/* 스티커들 */}
                                    {!isLoading && !noMoreFuture && diary && diary.stickers && diary.stickers.length > 0 && (
                                        diary.stickers.map((sticker) => (
                                            <StickerElement
                                                key={sticker.id}
                                                style={{
                                                    left: sticker.x,
                                                    top: sticker.y,
                                                    width: sticker.width,
                                                    height: sticker.height,
                                                    zIndex: sticker.zIndex
                                                }}
                                            >
                                                <StickerImage src={sticker.src} alt={sticker.type} />
                                            </StickerElement>
                                        ))
                                    )}
                                </ContentContainer>
                            </Card>
                        </>
                    ) : (
                        <div style={styles.noDiary}>
                            {t('diary_no_diary')}
                        </div>
                    )}
                </main>
            </div>
            <Navigation />
            <ConfirmModal
                open={showDeleteModal}
                title={t('delete')}
                description={t('diary_delete_confirm')}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
            />
            {/* 이미지 뷰어 모달 */}
            {selectedImageIndex !== null && diary && diary.imageUrls && (
                <ImageViewerModal onClick={() => setSelectedImageIndex(null)}>
                    <ImageViewerContent onClick={(e) => e.stopPropagation()}>
                        <ImageViewerClose onClick={() => setSelectedImageIndex(null)}>
                            ×
                        </ImageViewerClose>
                        {selectedImageIndex > 0 && (
                            <ImageViewerPrev
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(selectedImageIndex - 1);
                                }}
                            >
                                ‹
                            </ImageViewerPrev>
                        )}
                        <ImageViewerImg
                            src={diary.imageUrls[selectedImageIndex]}
                            alt={`이미지 ${selectedImageIndex + 1}`}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {selectedImageIndex < diary.imageUrls.length - 1 && (
                            <ImageViewerNext
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(selectedImageIndex + 1);
                                }}
                            >
                                ›
                            </ImageViewerNext>
                        )}
                    </ImageViewerContent>
                </ImageViewerModal>
            )}
        </Container>
    );
}

export default DiaryView; 