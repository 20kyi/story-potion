import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Settings() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ padding: 24, paddingTop: 70, minHeight: '100vh' }}>
                <h2>개인설정</h2>
                <p>여기에 알림, 테마, 언어 설정 등이 표시됩니다.</p>
            </div>
        </>
    );
}

export default Settings; 