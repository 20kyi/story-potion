import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Premium() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="프리미엄" />
            <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, paddingTop: 40, minHeight: '100vh', paddingBottom: 120 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 40 }}>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: '1.1rem' }}>광고 제거</li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: '1.1rem' }}>프리미엄 전용 테마</li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: '1.1rem' }}>AI 일기 분석 리포트</li>
                </ul>
                <button style={{ background: '#e46262', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 0', fontSize: 18, fontWeight: 400, width: '100%', cursor: 'pointer', boxShadow: '0 2px 8px rgba(228,98,98,0.08)' }}>
                    프리미엄 가입하기
                </button>
            </div>
        </>
    );
}

export default Premium; 