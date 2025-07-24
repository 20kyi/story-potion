import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, runTransaction, doc as fsDoc, setDoc, getDoc as getFsDoc, addDoc, Timestamp } from 'firebase/firestore';
import { getFsDoc as getDocFS } from 'firebase/firestore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  padding-top: 40px;
  padding-bottom: 100px;
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

function NovelView({ user }) {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const targetUserId = searchParams.get('userId') || user.uid;
    // id가 연-월-주차(예: 2025-6-3) 형식인지 확인
    const idParts = id ? id.split('-') : [];
    const isDateKey = idParts.length === 3 && idParts.every(part => !isNaN(Number(part)));
    const [novel, setNovel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accessGranted, setAccessGranted] = useState(false);
    const navigate = useNavigate();

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
                    // 연-월-주차로 쿼리 (targetUserId 사용)
                    const [year, month, weekNum] = idParts.map(Number);
                    const novelsRef = collection(db, 'novels');
                    const q = query(
                        novelsRef,
                        where('year', '==', year),
                        where('month', '==', month),
                        where('weekNum', '==', weekNum),
                        where('userId', '==', targetUserId)
                    );
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
                    setError('소설을 찾을 수 없거나 접근 권한이 없습니다.');
                    return;
                }
                setNovel(fetchedNovel);
                // 본인 소설은 바로 접근 허용
                if (fetchedNovel.userId === user.uid) {
                    setAccessGranted(true);
                    return;
                }
                // 친구 관계 확인 (friendships 컬렉션)
                const friendshipId = [user.uid, fetchedNovel.userId].sort().join('_');
                const friendshipRef = fsDoc(db, 'friendships', friendshipId);
                const friendshipSnap = await getFsDoc(friendshipRef);
                if (!friendshipSnap.exists()) {
                    setError('친구만 열람할 수 있습니다.');
                    return;
                }
                // 친구 소설: 결제 기록 확인
                const viewedRef = fsDoc(db, 'users', user.uid, 'viewedNovels', fetchedNovel.id);
                const viewedSnap = await getFsDoc(viewedRef);
                if (viewedSnap.exists()) {
                    setAccessGranted(true);
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
                    // 소설 주인(저자) 포인트 적립 내역 기록
                    await addDoc(collection(db, 'users', fetchedNovel.userId, 'pointHistory'), {
                        type: 'earn',
                        amount: 15,
                        desc: '소설 판매 적립',
                        novelId: fetchedNovel.id,
                        createdAt: Timestamp.now(),
                    });
                } catch (e) {
                    setError(e.message || '포인트 결제에 실패했습니다.');
                }
            } catch (error) {
                setNovel(null);
                setError('소설을 찾을 수 없거나 접근 권한이 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchNovel();
    }, [id, user, targetUserId]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '날짜 정보 없음';
        return timestamp.toDate().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDelete = async () => {
        if (!novel || !novel.id) return;
        if (!window.confirm('정말 이 소설을 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'novels', novel.id));
            alert('소설이 삭제되었습니다.');
            navigate('/novel');
        } catch (error) {
            alert('삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <Container>
                <Header user={user} />
                <div>소설을 불러오는 중...</div>
                <Navigation />
            </Container>
        );
    }

    if (!novel || (!accessGranted && error)) {
        return (
            <Container>
                <Header user={user} />
                <div>{error || '소설을 찾을 수 없거나 접근 권한이 없습니다.'}</div>
                <Navigation />
            </Container>
        );
    }

    return (
        <Container>
            <Header user={user} />
            <NovelHeader>
                <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                <NovelInfo>
                    <NovelTitle>{novel.title}</NovelTitle>
                    <NovelDate>{formatDate(novel.createdAt)}</NovelDate>
                    {/* 삭제 버튼 */}
                    {novel.id && novel.userId === user.uid && (
                        <button onClick={handleDelete} style={{ marginTop: 16, background: '#e46262', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
                            소설 삭제하기
                        </button>
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