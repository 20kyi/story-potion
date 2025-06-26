import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Social() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ padding: 24, paddingTop: 70, minHeight: '100vh' }}>
                <h2>소셜</h2>
                <p>여기에 친구초대, 공유, 커뮤니티 등이 표시됩니다.</p>
            </div>
        </>
    );
}

export default Social; 