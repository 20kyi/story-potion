import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Statistics() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ padding: 24, paddingTop: 70, minHeight: '100vh' }}>
                <h2>내 통계</h2>
                <p>여기에 사용자 통계 정보가 표시됩니다.</p>
            </div>
        </>
    );
}

export default Statistics; 