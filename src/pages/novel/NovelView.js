import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { parseNovelUrl } from '../../utils/novelUtils';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, runTransaction, doc as fsDoc, setDoc, getDoc as getFsDoc, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getFsDoc as getDocFS } from 'firebase/firestore';
import { useLanguage, useTranslation } from '../../LanguageContext';
import { createNovelPurchaseNotification, createPointEarnNotification } from '../../utils/notificationService';
import ConfirmModal from '../../components/ui/ConfirmModal';
import AlertModal from '../../components/ui/AlertModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
//   padding-top: 40px;
//   padding-bottom: 100px;
  margin: 40px auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const NovelHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
`;

const NovelCover = styled.img`
  width: 120px;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const NovelInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const NovelTitle = styled.h1`
  font-size: 24px;
  color: ${({ theme }) => theme.primary};
  margin: 0 0 8px 0;
  font-weight: 600;
  font-family: inherit;

  /* 다크모드 대응 */
  body.dark & {
    color: #ffb3b3;
  }
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: #999;
  font-family: inherit;
`;

const NovelSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9f9f9'};
  border-radius: 8px;
`;

const SettingLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`;

const ToggleButton = styled.button`
  width: 50px;
  height: 28px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background-color: ${({ active }) => active ? '#cb6565' : '#ccc'};
  
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: white;
    top: 2px;
    left: ${({ active }) => active ? '24px' : '2px'};
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

const PurchaseCount = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 4px;
`;

const NovelContent = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.cardText};
  white-space: pre-line;
  padding: 20px;
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  font-family: inherit;

  /* 다크모드 대응 */
  body.dark & {
    color: #f1f1f1;
    background: #232323;
  }
`;

const CoverViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 10px;
  cursor: pointer;
`;

const LargeCover = styled.img`
  width: 100%;
  max-width: 400px;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const CoverTitle = styled.h2`
  font-size: 24px;
  color: ${({ theme }) => theme.primary};
  margin-top: 24px;
  margin-bottom: 8px;
  font-weight: 600;
  text-align: center;
  font-family: inherit;
`;

const CoverHint = styled.div`
  font-size: 14px;
  color: #999;
  text-align: center;
  margin-top: 12px;
  font-family: inherit;
`;

const PurchaseNotice = styled.div`
  font-size: 11px;
  color: #999;
  text-align: center;
  margin-top: 16px;
  padding: 0 20px;
  line-height: 1.4;
  font-family: inherit;
`;

function NovelView({ user }) {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const targetUserId = searchParams.get('userId') || user.uid;
    // URL 파싱 (year-month-weekNum 또는 year-month-weekNum-genre 형식)
    const parsedUrl = parseNovelUrl(id);
    const isDateKey = parsedUrl !== null;
    const [novel, setNovel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accessGranted, setAccessGranted] = useState(false);
    const [purchaseCount, setPurchaseCount] = useState(0);
    const [showCoverView, setShowCoverView] = useState(true); // 표지 보기 모드로 시작
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [privateConfirmOpen, setPrivateConfirmOpen] = useState(false);
    const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { t } = useTranslation();

    useEffect(() => {
        if (!user || !id) {
            setLoading(false);
            return;
        }

        const fetchNovel = async () => {
            setLoading(true);
            setError('');
            setAccessGranted(false);
            try {
                let fetchedNovel = null;
                if (isDateKey) {
                    // 연-월-주차(및 장르)로 쿼리 (targetUserId 사용)
                    const { year, month, weekNum, genre } = parsedUrl;
                    const novelsRef = collection(db, 'novels');
                    let q = query(
                        novelsRef,
                        where('year', '==', year),
                        where('month', '==', month),
                        where('weekNum', '==', weekNum),
                        where('userId', '==', targetUserId)
                    );
                    // 장르가 있으면 장르 필터 추가
                    if (genre) {
                        q = query(q, where('genre', '==', genre));
                    }
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        fetchedNovel = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    }
                } else {
                    // 기존: 랜덤 문서 ID로 접근
                    const novelRef = doc(db, 'novels', id);
                    const novelSnap = await getDoc(novelRef);
                    if (novelSnap.exists()) {
                        fetchedNovel = { ...novelSnap.data(), id: novelSnap.id };
                    }
                }
                if (!fetchedNovel) {
                    setNovel(null);
                    setError(t('novel_not_found_or_forbidden'));
                    return;
                }
                setNovel(fetchedNovel);
                setShowCoverView(true); // 소설이 로드될 때마다 표지 보기 모드로 리셋

                // 본인 소설인 경우 구매자 수 조회
                if (fetchedNovel.userId === user.uid) {
                    setAccessGranted(true);
                    // 구매자 수 조회 (비동기로 처리하여 로딩 속도 향상)
                    (async () => {
                        try {
                            // 모든 사용자의 viewedNovels 서브컬렉션에서 해당 소설 ID를 가진 문서 개수 조회
                            // Note: Firestore의 collection group query를 사용할 수 없으므로
                            // 모든 사용자를 순회하는 방식 사용 (사용자 수가 많지 않다면 문제없음)
                            const usersRef = collection(db, 'users');
                            const usersSnapshot = await getDocs(usersRef);
                            let count = 0;
                            const checkPromises = [];
                            usersSnapshot.docs.forEach(userDoc => {
                                const viewedRef = doc(db, 'users', userDoc.id, 'viewedNovels', fetchedNovel.id);
                                checkPromises.push(getDoc(viewedRef).then(snap => {
                                    if (snap.exists()) count++;
                                }));
                            });
                            await Promise.all(checkPromises);
                            setPurchaseCount(count);
                        } catch (error) {
                            console.error('구매자 수 조회 실패:', error);
                        }
                    })();
                    return;
                }

                // 구매 기록 확인 (구매한 소설은 삭제/비공개 상태와 관계없이 접근 가능)
                const viewedRef = fsDoc(db, 'users', user.uid, 'viewedNovels', fetchedNovel.id);
                const viewedSnap = await getFsDoc(viewedRef);
                if (viewedSnap.exists()) {
                    // 구매한 소설인 경우, 삭제되었거나 비공개여도 접근 가능
                    // 삭제된 소설인 경우 백업 데이터에서 가져오기
                    if (fetchedNovel.deleted === true) {
                        const purchasedNovelRef = fsDoc(db, 'users', user.uid, 'purchasedNovels', fetchedNovel.id);
                        const purchasedNovelSnap = await getFsDoc(purchasedNovelRef);
                        if (purchasedNovelSnap.exists()) {
                            const purchasedNovelData = purchasedNovelSnap.data();
                            setNovel({ ...purchasedNovelData, id: purchasedNovelSnap.id });
                            setAccessGranted(true);
                            return;
                        }
                    }
                    setAccessGranted(true);
                    return;
                }

                // 비공개 소설인 경우 친구도 접근 불가
                if (fetchedNovel.isPublic === false) {
                    setError(t('novel_private') || '이 소설은 비공개입니다.');
                    return;
                }
                // 친구 관계 확인 (friendships 컬렉션)
                const friendshipId = [user.uid, fetchedNovel.userId].sort().join('_');
                const friendshipRef = fsDoc(db, 'friendships', friendshipId);
                const friendshipSnap = await getFsDoc(friendshipRef);
                if (!friendshipSnap.exists()) {
                    setError(t('friend_only'));
                    return;
                }
                // 트랜잭션: 포인트 차감/지급 (모든 읽기 먼저)
                try {
                    await runTransaction(db, async (transaction) => {
                        const userRef = fsDoc(db, 'users', user.uid);
                        const ownerRef = fsDoc(db, 'users', fetchedNovel.userId);
                        const userSnap = await transaction.get(userRef);
                        const ownerSnap = await transaction.get(ownerRef);
                        const viewedSnapTx = await transaction.get(viewedRef);
                        if (!userSnap.exists()) throw new Error('내 계정 정보를 찾을 수 없습니다.');
                        if (viewedSnapTx.exists()) return; // 이미 결제됨
                        const myPoint = userSnap.data().point || 0;
                        if (myPoint < 30) throw new Error('포인트가 부족합니다. (30포인트 필요)');
                        // 차감/지급
                        transaction.update(userRef, { point: myPoint - 30 });
                        if (ownerSnap.exists()) {
                            const ownerPoint = ownerSnap.data().point || 0;
                            transaction.update(ownerRef, { point: ownerPoint + 15 });
                        }
                        // 결제 기록 저장
                        transaction.set(viewedRef, { viewedAt: new Date() });
                    });
                    setAccessGranted(true);
                    // 구매한 소설 데이터를 사용자별 purchasedNovels 컬렉션에 백업 저장
                    const purchasedNovelRef = doc(db, 'users', user.uid, 'purchasedNovels', fetchedNovel.id);
                    await setDoc(purchasedNovelRef, {
                        ...fetchedNovel,
                        purchasedAt: Timestamp.now(),
                        originalNovelId: fetchedNovel.id
                    });
                    // 소설 주인(저자) 포인트 적립 내역 기록
                    await addDoc(collection(db, 'users', fetchedNovel.userId, 'pointHistory'), {
                        type: 'earn',
                        amount: 15,
                        desc: '소설 판매 적립',
                        novelId: fetchedNovel.id,
                        createdAt: Timestamp.now(),
                    });
                    // 포인트 적립 알림 생성 (저자에게)
                    await createPointEarnNotification(fetchedNovel.userId, 15, '소설 판매 적립');
                    // 소설 구매 알림 생성 (저자에게)
                    await createNovelPurchaseNotification(
                        fetchedNovel.userId,
                        user.uid,
                        fetchedNovel.id,
                        fetchedNovel.title
                    );
                } catch (e) {
                    setError(e.message || t('friend_novel_buy_failed'));
                }
            } catch (error) {
                setNovel(null);
                setError(t('novel_not_found_or_forbidden'));
            } finally {
                setLoading(false);
            }
        };

        fetchNovel();
    }, [id, user, targetUserId]);

    const formatDate = (timestamp) => {
        if (!timestamp) return t('no_data');
        const date = timestamp.toDate();
        if (language === 'en') {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatWeekInfo = (novel) => {
        if (!novel || novel.month === undefined || novel.weekNum === undefined) {
            return '';
        }
        if (language === 'en') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[novel.month - 1]} Week ${novel.weekNum} Novel`;
        }
        return `${novel.month}월 ${novel.weekNum}주차 소설`;
    };

    const handleDelete = () => {
        if (!novel || !novel.id) return;
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setDeleteConfirmOpen(false);
        if (!novel || !novel.id) return;
        try {
            // 실제 삭제 대신 deleted 플래그 설정 (구매한 사용자들이 계속 접근할 수 있도록)
            await updateDoc(doc(db, 'novels', novel.id), {
                deleted: true,
                deletedAt: Timestamp.now()
            });
            setAlertModal({
                open: true,
                title: '',
                message: t('novel_deleted')
            });
            setTimeout(() => {
                navigate('/novel', { state: { novelDeleted: true } });
            }, 1000);
        } catch (error) {
            setAlertModal({
                open: true,
                title: '',
                message: t('novel_delete_failed')
            });
        }
    };

    const handleTogglePublic = async () => {
        if (!novel || !novel.id) return;
        // 비공개로 전환하는 경우에만 안내
        if (novel.isPublic !== false) {
            setPrivateConfirmOpen(true);
            return;
        }
        // 공개로 전환하는 경우 바로 실행
        const newIsPublic = !novel.isPublic;
        try {
            await updateDoc(doc(db, 'novels', novel.id), {
                isPublic: newIsPublic
            });
            setNovel({ ...novel, isPublic: newIsPublic });
        } catch (error) {
            console.error('공개 설정 변경 실패:', error);
            setAlertModal({
                open: true,
                title: '',
                message: '공개 설정 변경에 실패했습니다.'
            });
        }
    };

    const confirmTogglePrivate = async () => {
        setPrivateConfirmOpen(false);
        if (!novel || !novel.id) return;
        const newIsPublic = false;
        try {
            await updateDoc(doc(db, 'novels', novel.id), {
                isPublic: newIsPublic
            });
            setNovel({ ...novel, isPublic: newIsPublic });
        } catch (error) {
            console.error('공개 설정 변경 실패:', error);
            setAlertModal({
                open: true,
                title: '',
                message: '공개 설정 변경에 실패했습니다.'
            });
        }
    };

    if (loading) {
        return (
            <Container>
                <Header user={user} />
                <div>{t('novel_loading')}</div>
                <Navigation />
            </Container>
        );
    }

    if (!novel || (!accessGranted && error)) {
        return (
            <Container>
                <Header user={user} />
                <div>{error || t('novel_not_found_or_forbidden')}</div>
                <Navigation />
            </Container>
        );
    }

    // 표지 보기 모드
    if (showCoverView) {
        return (
            <Container>
                <Header user={user} />
                <CoverViewContainer onClick={() => setShowCoverView(false)}>
                    <LargeCover
                        src={novel.imageUrl || '/novel_banner/default.png'}
                        alt={novel.title}
                    />
                    <CoverTitle>{novel.title}</CoverTitle>
                    {/* <CoverHint>표지를 터치하거나 클릭하여 소설을 읽으세요</CoverHint> */}
                    {/* 구매 전 안내 문구 (본인 소설이 아니고 접근 권한이 없을 때만) */}
                    {novel.userId !== user.uid && !accessGranted && (
                        <PurchaseNotice>{t('novel_purchase_notice')}</PurchaseNotice>
                    )}
                </CoverViewContainer>
                <Navigation />
            </Container>
        );
    }

    // 내용 보기 모드
    return (
        <Container>
            <Header user={user} />
            <ConfirmModal
                open={deleteConfirmOpen}
                title={t('novel_delete_confirm')}
                description={t('novel_delete_warning')}
                onCancel={() => setDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                confirmText={t('confirm')}
            />
            <ConfirmModal
                open={privateConfirmOpen}
                title="소설 비공개 전환"
                description={`${t('novel_private_warning')}\n\n계속하시겠습니까?`}
                onCancel={() => setPrivateConfirmOpen(false)}
                onConfirm={confirmTogglePrivate}
                confirmText={t('confirm')}
            />
            <AlertModal
                open={alertModal.open}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal({ open: false, title: '', message: '' })}
            />
            <NovelHeader>
                <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                <NovelInfo>
                    <NovelTitle>{novel.title}</NovelTitle>
                    <NovelDate>{formatWeekInfo(novel) || formatDate(novel.createdAt)}</NovelDate>
                    {/* 소설 설정 (소설 주인만) */}
                    {novel.id && novel.userId === user.uid && (
                        <NovelSettings>
                            <SettingRow>
                                <div>
                                    <SettingLabel>공개 설정</SettingLabel>
                                    <PurchaseCount>
                                        {novel.isPublic !== false ? '공개' : '비공개'}
                                        {novel.isPublic !== false && ` · 구매 ${purchaseCount}명`}
                                    </PurchaseCount>
                                </div>
                                <ToggleButton
                                    active={novel.isPublic !== false}
                                    onClick={handleTogglePublic}
                                />
                            </SettingRow>
                            <button onClick={handleDelete} style={{ marginTop: 8, background: '#e46262', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                                소설 삭제하기
                            </button>
                        </NovelSettings>
                    )}
                </NovelInfo>
            </NovelHeader>
            <NovelContent>
                {novel.content || `이 소설은 ${formatDate(novel.createdAt)}에 작성되었습니다. 
아직 내용이 준비되지 않았습니다.`}
            </NovelContent>
            <Navigation />
        </Container>
    );
}

export default NovelView; 