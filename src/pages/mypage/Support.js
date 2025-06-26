import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Support() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ padding: 24, paddingTop: 70, minHeight: '100vh' }}>
                <h2>고객지원</h2>
                <p>여기에 FAQ, 문의하기, 피드백 등이 표시됩니다.</p>
            </div>
        </>
    );
}

export default Support; 