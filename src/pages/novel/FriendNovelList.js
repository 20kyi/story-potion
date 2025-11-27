import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, runTransaction, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import ConfirmModal from '../../components/ui/ConfirmModal';
import AlertModal from '../../components/ui/AlertModal';
import { useTheme } from '../../ThemeContext';
import { getSafeProfileImageUrl, handleImageError } from '../../utils/profileImageUtils';
import { createNovelUrl, getGenreKey } from '../../utils/novelUtils';
import { useLanguage, useTranslation } from '../../LanguageContext';
import { createNovelPurchaseNotification, createPointEarnNotification } from '../../utils/notificationService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
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

// 친구 프로필 섹션 스타일
const FriendProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
//   background: ${({ theme }) => theme.card};
//   border-radius: 16px;
//   box-shadow: ${({ theme }) => theme.cardShadow};
//   border: 1px solid ${({ theme }) => theme.border};
`;

const ProfileContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
`;

const ProfileImagePlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #fdd2d2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
`;

const FriendNickname = styled.div`
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.text};
  margin-bottom: 8px;
`;

const FriendEmail = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardSubText || '#888'};
  text-align: center;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 24px 0 24px 0;
`;

const NovelListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NovelItem = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 12px;
  padding: 16px;
  box-shadow: ${({ theme }) => theme.cardShadow};
  border: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  }
`;

const NovelCover = styled.img`
  width: 100px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  background: #fdd2d2;
  margin-right: 16px;
`;

const NovelTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 6px;
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardSubText};
  margin-bottom: 6px;
`;

const NovelGenre = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.cardSubText || '#888'};
  margin-bottom: 14px;
  font-weight: 500;
`;

const NovelContent = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardText};
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0;
  filter: ${props => props.$blurred ? 'blur(4px)' : 'none'};    // 블러 효과
  opacity: ${props => props.$blurred ? '0.6' : '1'};    // 투명도
  user-select: ${props => props.$blurred ? 'none' : 'auto'};    // 텍스트 선택 금지
  pointer-events: none;    // 텍스트 직접 클릭은 방지
`;

const NovelContentWrapper = styled.div`
  position: relative;
  width: 100%;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
`;

const LockOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
  pointer-events: auto;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#333'};
  white-space: nowrap;
  text-align: center;
  cursor: pointer;
`;

const LockIcon = styled.span`
  font-size: 24px;
`;

// 버튼 스타일 개선: 카드 하단 전체 너비, 더 큼직하게
const ActionButton = styled.button`
  width: 100%;
  padding: 12px 0;
  background-color: rgba(201, 59, 59, 0.73);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(190, 71, 71, 0.08);
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.15s;
  opacity: ${props => props.disabled ? 0.6 : 1};
  font-family: inherit;
  &:hover, &:focus {
    background-color: rgba(190, 71, 71, 0.82);
  }
  &:disabled {
    background: #ccc;
    color: #fff;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ActionButtonView = styled(ActionButton)`
  background: transparent;
  color: #2176bd;
  font-weight: 700;
  box-shadow: none;
  border-radius: 0 0 12px 12px;
  font-family: inherit;
  &:active, &:hover {
    background: transparent;
    text-decoration: underline;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const GenreSelect = styled.select`
  padding: 8px 12px;
  background: ${({ theme }) => theme.card || '#fff'};
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.text || '#333'};
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  outline: none;
  
  &:hover {
    border-color: #cb6565;
  }
  
  &:focus {
    border-color: #cb6565;
  }
`;

function FriendNovelList({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const [novels, setNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [purchased, setPurchased] = useState({}); // { novelId: true }
    const [loadingNovelId, setLoadingNovelId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingNovel, setPendingNovel] = useState(null);
    const [friendInfo, setFriendInfo] = useState(null); // 친구 정보 상태 추가
    const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
    const [selectedGenre, setSelectedGenre] = useState('all'); // 장르 필터 상태
    const [filteredNovels, setFilteredNovels] = useState([]); // 필터링된 소설 목록

    useEffect(() => {
        if (!userId) {
            setNovels([]);
            setFriendInfo(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const fetchData = async () => {
            try {
                // 친구 정보 가져오기
                const friendRef = doc(db, 'users', userId);
                const friendSnap = await getDoc(friendRef);
                if (friendSnap.exists()) {
                    setFriendInfo({ uid: friendSnap.id, ...friendSnap.data() });
                }

                // 소설 목록 가져오기 (공개 소설만)
                const novelsRef = collection(db, 'novels');
                const q = query(
                    novelsRef,
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                // 클라이언트 측에서 비공개/삭제된 소설 필터링
                const fetchedNovels = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(novel => novel.isPublic !== false && novel.deleted !== true); // 공개되고 삭제되지 않은 소설만
                setNovels(fetchedNovels);

                // 구매 여부 확인
                if (user) {
                    const purchasedObj = {};
                    for (const novel of fetchedNovels) {
                        const viewedRef = doc(db, 'users', user.uid, 'viewedNovels', novel.id);
                        const viewedSnap = await getDoc(viewedRef);
                        if (viewedSnap.exists()) {
                            purchasedObj[novel.id] = true;
                        }
                    }
                    setPurchased(purchasedObj);
                }
            } catch (error) {
                console.error('데이터 가져오기 실패:', error);
                setNovels([]);
                setFriendInfo(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId, user]);

    // 장르별 필터링 로직
    useEffect(() => {
        if (!novels || novels.length === 0) {
            setFilteredNovels([]);
            return;
        }

        if (selectedGenre === 'all') {
            setFilteredNovels(novels);
        } else {
            const filtered = novels.filter(novel => novel.genre === selectedGenre);
            setFilteredNovels(filtered);
        }
    }, [novels, selectedGenre]);

    // 사용 가능한 장르 목록 가져오기 (지정된 순서대로)
    const availableGenres = React.useMemo(() => {
        const genreOrder = ['로맨스', '역사', '추리', '동화', '판타지', '공포'];
        const genresInNovels = new Set(novels.map(novel => novel.genre).filter(Boolean));

        // 지정된 순서대로 장르 정렬
        const sortedGenres = genreOrder.filter(genre => genresInNovels.has(genre));

        return ['all', ...sortedGenres];
    }, [novels]);

    const formatDate = (dateOrTimestamp) => {
        if (!dateOrTimestamp) return '';
        let dateObj;
        if (typeof dateOrTimestamp === 'object' && dateOrTimestamp.toDate) {
            dateObj = dateOrTimestamp.toDate();
        } else {
            dateObj = new Date(dateOrTimestamp);
        }

        if (language === 'en') {
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }

        return `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
    };

    const getDisplayGenre = (genre) => {
        if (!genre) return '';
        // genre가 한글이면 영어 키로 변환, 이미 영어 키면 그대로 사용
        const genreKey = getGenreKey(genre) || genre;
        const translationKey = `novel_genre_${genreKey}`;
        const translated = t(translationKey);
        // 번역 키가 그대로 반환되면 장르 값 그대로 사용
        return translated !== translationKey ? translated : genre;
    };

    // 구매 버튼 클릭 시 모달 오픈
    const handlePurchaseClick = (novel) => {
        setPendingNovel(novel);
        setConfirmOpen(true);
    };
    // 실제 결제 로직
    const handlePurchase = async (novel) => {
        setConfirmOpen(false);
        if (!user) {
            setAlertModal({
                open: true,
                title: '',
                message: t('friend_novel_login_required')
            });
            return;
        }
        setLoadingNovelId(novel.id);
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', user.uid);
                const ownerRef = doc(db, 'users', novel.userId);
                const viewedRef = doc(db, 'users', user.uid, 'viewedNovels', novel.id);
                const userSnap = await transaction.get(userRef);
                const ownerSnap = await transaction.get(ownerRef);
                const viewedSnapTx = await transaction.get(viewedRef);
                if (!userSnap.exists()) throw new Error(t('user_info_not_found') || 'User info not found.');
                if (viewedSnapTx.exists()) return; // 이미 결제됨
                const myPoint = userSnap.data().point || 0;
                if (myPoint < 30) throw new Error(t('friend_novel_point_not_enough'));
                // 차감/지급
                transaction.update(userRef, { point: myPoint - 30 });
                if (ownerSnap.exists()) {
                    const ownerPoint = ownerSnap.data().point || 0;
                    transaction.update(ownerRef, { point: ownerPoint + 15 });
                }
                // 결제 기록 저장
                transaction.set(viewedRef, { viewedAt: new Date() });
            });
            // 구매한 소설 데이터를 사용자별 purchasedNovels 컬렉션에 백업 저장
            const purchasedNovelRef = doc(db, 'users', user.uid, 'purchasedNovels', novel.id);
            await setDoc(purchasedNovelRef, {
                ...novel,
                purchasedAt: Timestamp.now(),
                originalNovelId: novel.id
            });
            // 포인트 사용 내역 기록
            await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                type: 'use',
                amount: -30,
                desc: '친구 소설 구매',
                novelId: novel.id,
                createdAt: Timestamp.now(),
            });
            // 소설 주인(저자) 포인트 적립 내역 기록
            await addDoc(collection(db, 'users', novel.userId, 'pointHistory'), {
                type: 'earn',
                amount: 15,
                desc: '소설 판매 적립',
                novelId: novel.id,
                createdAt: Timestamp.now(),
            });
            // 포인트 적립 알림 생성 (저자에게)
            await createPointEarnNotification(novel.userId, 15, '소설 판매 적립');
            // 소설 구매 알림 생성 (저자에게)
            await createNovelPurchaseNotification(
                novel.userId,
                user.uid,
                novel.id,
                novel.title
            );
            setPurchased((prev) => ({ ...prev, [novel.id]: true }));
            setAlertModal({
                open: true,
                title: '',
                message: t('friend_novel_buy_success')
            });
        } catch (e) {
            setAlertModal({
                open: true,
                title: '',
                message: e.message || t('friend_novel_buy_failed')
            });
        } finally {
            setLoadingNovelId(null);
        }
    };

    return (
        <Container theme={theme}>
            <Header title={t('friend_novel_list_title')} />
            <ConfirmModal
                open={confirmOpen}
                title={t('friend_novel_buy_confirm_title')}
                description={`${t('friend_novel_buy_confirm_desc')}\n\n${t('novel_purchase_notice')}`}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => handlePurchase(pendingNovel)}
                confirmText={t('confirm')}
            />
            <AlertModal
                open={alertModal.open}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal({ open: false, title: '', message: '' })}
            />
            {(!userId) ? (
                <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>{t('friend_novel_userid_missing')}</div>
            ) : isLoading ? (
                <div style={{ textAlign: 'center', marginTop: 40 }}>{t('friend_novel_loading')}</div>
            ) : (
                <>
                    {/* 친구 프로필 섹션 */}
                    {friendInfo && (
                        <FriendProfileSection theme={theme}>
                            <ProfileContainer>
                                <ProfileImage
                                    src={getSafeProfileImageUrl(friendInfo.photoURL)}
                                    alt="Friend Profile"
                                    onError={(e) => handleImageError(e)}
                                />
                            </ProfileContainer>
                            <FriendNickname theme={theme}>
                                {t('friend_novel_owner_title', { name: friendInfo.displayName || 'User' })}
                            </FriendNickname>
                            <FriendEmail theme={theme}>{friendInfo.email}</FriendEmail>
                        </FriendProfileSection>
                    )}

                    {novels.length > 0 && availableGenres.length > 1 && (
                        <FilterContainer>
                            <GenreSelect
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                theme={theme}
                            >
                                <option value="all">
                                    {(() => {
                                        const translated = t('genre_all');
                                        return translated !== 'genre_all' ? translated : '전체 장르';
                                    })()}
                                </option>
                                {availableGenres.filter(g => g !== 'all').map(genre => {
                                    // 장르가 한글이면 영어 키로 변환, 이미 영어 키면 그대로 사용
                                    const genreKey = getGenreKey(genre) || genre;
                                    const translated = t(`novel_genre_${genreKey}`);
                                    // 번역 키가 그대로 반환되면 한글 장르 값 그대로 사용
                                    const displayGenre = translated !== `novel_genre_${genreKey}` ? translated : genre;
                                    return (
                                        <option key={genre} value={genre}>
                                            {displayGenre}
                                        </option>
                                    );
                                })}
                            </GenreSelect>
                        </FilterContainer>
                    )}
                    <NovelListWrapper>
                        {filteredNovels.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>
                                {novels.length === 0 ? t('friend_novel_empty') : (t('genre_no_novel') || '해당 장르의 소설이 없습니다.')}
                            </div>
                        ) : (
                            filteredNovels.map((novel) => (
                                <NovelItem
                                    key={novel.id}
                                    onClick={purchased[novel.id] ? () => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}?userId=${novel.userId}`) : undefined}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        position: 'relative',
                                        flexDirection: 'column',
                                        padding: 0,
                                        cursor: purchased[novel.id] ? 'pointer' : 'default'
                                    }}
                                >
                                    <div style={{ display: 'flex', width: '100%', padding: 16 }}>
                                        <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginLeft: 12 }}>
                                            <NovelTitle>{novel.title}</NovelTitle>
                                            <NovelDate>
                                                {language === 'en'
                                                    ? (() => {
                                                        const d = new Date(novel.year || 2000, (novel.month || 1) - 1, 1);
                                                        const monthName = d.toLocaleDateString('en-US', { month: 'long' });
                                                        return `${monthName} ${t('week_num', { num: novel.weekNum })}`;
                                                    })()
                                                    : `${novel.month}월 ${novel.weekNum}주차 소설`}
                                            </NovelDate>
                                            {novel.genre && (
                                                <NovelGenre>{getDisplayGenre(novel.genre)}</NovelGenre>
                                            )}
                                            <NovelContentWrapper
                                                $clickable={!purchased[novel.id]}
                                                onClick={!purchased[novel.id] ? (e) => {
                                                    e.stopPropagation();
                                                    handlePurchaseClick(novel);
                                                } : undefined}
                                            >
                                                <NovelContent $blurred={!purchased[novel.id]}>
                                                    {novel.content}
                                                </NovelContent>
                                                {!purchased[novel.id] && (
                                                    <LockOverlay>
                                                        <LockIcon>🔒</LockIcon>
                                                        <span>30P로 구매</span>
                                                    </LockOverlay>
                                                )}
                                            </NovelContentWrapper>
                                        </div>
                                    </div>
                                </NovelItem>
                            ))
                        )}
                    </NovelListWrapper>
                </>
            )}
            <Navigation />
        </Container>
    );
}

export default FriendNovelList; 