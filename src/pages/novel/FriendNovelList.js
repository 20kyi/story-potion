import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, runTransaction, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import ConfirmModal from '../../components/ui/ConfirmModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
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
  margin-bottom: 14px;
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
`;

// 버튼 스타일 개선: 카드 하단 전체 너비, 더 큼직하게
const ActionButton = styled.button`
  width: 100%;
  padding: 16px 0;
//   margin-top: 20px;
  background: #e46262;
  color: #fff;
  border: none;
  border-radius: 0 0 12px 12px;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  opacity: ${props => props.disabled ? 0.6 : 1};
  font-family: inherit;
  &:active {
    background: #c13d3d;
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

function FriendNovelList({ user }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const [novels, setNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [purchased, setPurchased] = useState({}); // { novelId: true }
    const [loadingNovelId, setLoadingNovelId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingNovel, setPendingNovel] = useState(null);

    useEffect(() => {
        if (!userId) {
            setNovels([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const fetchNovels = async () => {
            try {
                const novelsRef = collection(db, 'novels');
                const q = query(novelsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedNovels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
                setNovels([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNovels();
    }, [userId, user]);

    const formatDate = (dateOrTimestamp) => {
        if (!dateOrTimestamp) return '';
        let dateObj;
        if (typeof dateOrTimestamp === 'object' && dateOrTimestamp.toDate) {
            dateObj = dateOrTimestamp.toDate();
        } else {
            dateObj = new Date(dateOrTimestamp);
        }
        return `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
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
            alert('로그인이 필요합니다.');
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
                if (!userSnap.exists()) throw new Error('내 계정 정보를 찾을 수 없습니다.');
                if (viewedSnapTx.exists()) return; // 이미 결제됨
                const myPoint = userSnap.data().point || 0;
                if (myPoint < 10) throw new Error('포인트가 부족합니다. (10포인트 필요)');
                // 차감/지급
                transaction.update(userRef, { point: myPoint - 10 });
                if (ownerSnap.exists()) {
                    const ownerPoint = ownerSnap.data().point || 0;
                    transaction.update(ownerRef, { point: ownerPoint + 5 });
                }
                // 결제 기록 저장
                transaction.set(viewedRef, { viewedAt: new Date() });
            });
            // 포인트 사용 내역 기록
            await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                type: 'use',
                amount: -10,
                desc: '친구 소설 열람',
                novelId: novel.id,
                createdAt: Timestamp.now(),
            });
            // 소설 주인(저자) 포인트 적립 내역 기록
            await addDoc(collection(db, 'users', novel.userId, 'pointHistory'), {
                type: 'earn',
                amount: 5,
                desc: '소설 판매 적립',
                novelId: novel.id,
                createdAt: Timestamp.now(),
            });
            setPurchased((prev) => ({ ...prev, [novel.id]: true }));
            alert('구매가 완료되었습니다!');
        } catch (e) {
            alert(e.message || '포인트 결제에 실패했습니다.');
        } finally {
            setLoadingNovelId(null);
        }
    };

    return (
        <Container>
            <Header title="친구의 소설 목록" />
            <ConfirmModal
                open={confirmOpen}
                title="소설 구매"
                description="이 소설을 10포인트로 구매하시겠습니까? 포인트가 차감됩니다."
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => handlePurchase(pendingNovel)}
                confirmText="확인"
            />
            {(!userId) ? (
                <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>userId가 없습니다.</div>
            ) : isLoading ? (
                <div style={{ textAlign: 'center', marginTop: 40 }}>로딩 중...</div>
            ) : (
                <NovelListWrapper>
                    {novels.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>소설이 없습니다.</div>
                    ) : (
                        novels.map((novel) => (
                            <NovelItem
                                key={novel.id}
                                style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', flexDirection: 'column', padding: 0 }}
                            >
                                <div style={{ display: 'flex', width: '100%', padding: 16 }}>
                                    <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginLeft: 12 }}>
                                        <NovelTitle>{novel.title}</NovelTitle>
                                        <NovelDate>{novel.month}월 {novel.weekNum}주차 소설</NovelDate>
                                        <NovelContent>{novel.content}</NovelContent>
                                    </div>
                                </div>
                                {purchased[novel.id] ? (
                                    <ActionButtonView
                                        onClick={() => navigate(`/novel/${novel.year}-${novel.month}-${novel.weekNum}?userId=${novel.userId}`)}
                                    >
                                        보기
                                    </ActionButtonView>
                                ) : (
                                    <ActionButton
                                        onClick={() => handlePurchaseClick(novel)}
                                        disabled={loadingNovelId === novel.id}
                                    >
                                        {loadingNovelId === novel.id ? '구매 중...' : '10P로 구매'}
                                    </ActionButton>
                                )}
                            </NovelItem>
                        ))
                    )}
                </NovelListWrapper>
            )}
            <Navigation />
        </Container>
    );
}

export default FriendNovelList; 