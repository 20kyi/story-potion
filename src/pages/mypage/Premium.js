import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Premium() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ padding: 24, paddingTop: 70, minHeight: '100vh' }}>
                <h2>프리미엄</h2>
                <p>여기에 상점, 구독 서비스 등 프리미엄 기능 안내가 표시됩니다.</p>
            </div>
        </>
    );
}

export default Premium; 