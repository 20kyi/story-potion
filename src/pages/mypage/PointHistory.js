/**
 * PointHistory.js - 포인트 내역 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 사용자의 포인트 적립/사용/충전 내역 표시
 * - Firestore에서 포인트 히스토리 데이터 조회
 * - 포인트 타입별 색상 구분 (적립: 파랑, 사용: 빨강, 충전: 초록)
 * - 실시간 내역 업데이트
 * - 다크모드/라이트모드 지원
 * 
 * 데이터 구조:
 * - collection: 'users/{userId}/pointHistory'
 * - 필드: type(earn/use/charge), amount, desc, createdAt
 * 
 * 사용된 라이브러리:
 * - firebase/firestore: 데이터베이스 조회
 * - styled-components: 스타일링
 * - react-router-dom: 네비게이션
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import PointIcon from '../../components/icons/PointIcon';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
//   padding-top: 56px; /* 헤더 높이만큼 여백 */
  margin: 40px auto;
  margin-top: 50px;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  position: relative;
`;

/**
 * 포인트 내역 페이지 컴포넌트
 * @param {Object} user - 현재 로그인한 사용자 정보
 */
function PointHistory({ user }) {
    console.log('현재 로그인한 user.uid:', user?.uid);
    const [history, setHistory] = useState([]); // 포인트 내역 데이터
    const navigate = useNavigate();
    const theme = useTheme();

    // 사용자 포인트 내역을 Firestore에서 가져오기
    useEffect(() => {
        if (!user?.uid) return;
        const fetchHistory = async () => {
            // 사용자의 포인트 히스토리 컬렉션에서 최신순으로 조회
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

    /**
     * 포인트 타입에 따른 한글 라벨 반환
     * @param {string} type - 포인트 타입 (earn/use/charge)
     * @returns {string} 한글 라벨
     */
    const getTypeLabel = (type) => {
        switch (type) {
            case 'earn': return '적립';
            case 'use': return '사용';
            case 'charge': return '충전';
            default: return type;
        }
    };

    /**
     * 포인트 타입에 따른 색상 반환
     * @param {string} type - 포인트 타입 (earn/use/charge)
     * @returns {string} 색상 코드
     */
    const getTypeColor = (type) => {
        switch (type) {
            case 'earn': return '#3498f3'; // 파랑 - 적립
            case 'use': return '#e46262'; // 빨강 - 사용
            case 'charge': return '#27ae60'; // 초록 - 충전
            default: return '#888';
        }
    };

    if (!user?.uid) {
        return (
            <div style={{ maxWidth: 500, margin: '0 auto', minHeight: '100vh', background: theme.background, color: theme.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ fontSize: 18, color: '#e46262', marginBottom: 24 }}>로그인이 필요합니다.</div>
                <button onClick={() => navigate(-1)} style={{ padding: 12, borderRadius: 8, border: 'none', background: '#e46262', color: '#fff', fontWeight: 700, fontSize: 16 }}>돌아가기</button>
                <Navigation style={{ position: 'fixed', left: 0, right: 0, bottom: 0, width: '100%', maxWidth: 500, margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <Container theme={theme}>
            <Header user={user} title="포인트 내역" />
            <div style={{ padding: 24 }}>
                {/* <button onClick={() => navigate(-1)} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#e46262', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>← 뒤로가기</button> */}
                {/* <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>포인트 내역</h2> */}
                <div style={{ color: theme.subText || '#888', fontSize: 14, marginBottom: 16 }}>
                    포인트는 일기 작성, 소설 생성, 충전 등 다양한 활동에서 적립/사용/충전됩니다.<br />
                    내역이 실시간으로 반영됩니다.
                </div>

                {/* 포인트 충전 버튼 */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <button
                        onClick={() => navigate('/my/shop/charge')}
                        style={{
                            background: '#3498f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(52, 152, 243, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 auto'
                        }}
                    >
                        <PointIcon width={20} height={20} color="white" />
                        포인트 충전하기
                    </button>
                </div>
                {history.length === 0 ? (
                    <div style={{ color: theme.subText || '#888', textAlign: 'center', marginTop: 40 }}>포인트 내역이 없습니다.</div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {history.map(item => (
                            <li key={item.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 0', borderBottom: `1px solid ${theme.border || '#eee'}`, fontSize: 16
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: getTypeColor(item.type) }}>{getTypeLabel(item.type)} {item.amount > 0 ? '+' : ''}{item.amount}p</div>
                                    <div style={{ color: theme.subText || '#888', fontSize: 13 }}>{item.desc || ''}</div>
                                </div>
                                <div style={{ color: theme.subText || '#aaa', fontSize: 13 }}>{
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
            <Navigation />
        </Container>
    );
}

export default PointHistory; 