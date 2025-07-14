import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';

function PointHistory({ user }) {
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.uid) return;
        const fetchHistory = async () => {
            const q = query(
                collection(db, 'users', user.uid, 'pointHistory'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(data);
        };
        fetchHistory();
    }, [user]);

    const getTypeLabel = (type) => {
        switch (type) {
            case 'earn': return '적립';
            case 'use': return '사용';
            case 'charge': return '충전';
            default: return type;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'earn': return '#3498f3'; // 파랑
            case 'use': return '#e46262'; // 빨강
            case 'charge': return '#27ae60'; // 초록
            default: return '#888';
        }
    };

    if (!user?.uid) {
        return (
            <div style={{ maxWidth: 500, margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ fontSize: 18, color: '#e46262', marginBottom: 24 }}>로그인이 필요합니다.</div>
                <button onClick={() => navigate(-1)} style={{ padding: 12, borderRadius: 8, border: 'none', background: '#e46262', color: '#fff', fontWeight: 700, fontSize: 16 }}>돌아가기</button>
                <Navigation style={{ position: 'fixed', left: 0, right: 0, bottom: 0, width: '100%', maxWidth: 500, margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 500, margin: '0 auto', minHeight: '100vh', background: '#fff', position: 'relative' }}>
            <Header user={user} />
            <div style={{ padding: 24 }}>
                <button onClick={() => navigate(-1)} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#e46262', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>← 뒤로가기</button>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>포인트 내역</h2>
                <div style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>
                    포인트는 일기 작성, 소설 생성, 충전 등 다양한 활동에서 적립/사용/충전됩니다.<br />
                    내역이 실시간으로 반영됩니다.
                </div>
                {history.length === 0 ? (
                    <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>포인트 내역이 없습니다.</div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {history.map(item => (
                            <li key={item.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 0', borderBottom: '1px solid #eee', fontSize: 16
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: getTypeColor(item.type) }}>{getTypeLabel(item.type)} {item.amount > 0 ? '+' : ''}{item.amount}p</div>
                                    <div style={{ color: '#888', fontSize: 13 }}>{item.desc || ''}</div>
                                </div>
                                <div style={{ color: '#aaa', fontSize: 13 }}>{
                                    item.createdAt && typeof item.createdAt.toDate === 'function'
                                        ? item.createdAt.toDate().toLocaleString()
                                        : (item.createdAt ? String(item.createdAt) : '')
                                }</div>
                            </li>
                        ))}
                    </ul>
                )}
                {/* 하단 돌아가기 버튼 제거 */}
            </div>
            <Navigation style={{ position: 'fixed', left: 0, right: 0, bottom: 0, width: '100%', maxWidth: 500, margin: '0 auto' }} />
        </div>
    );
}

export default PointHistory; 