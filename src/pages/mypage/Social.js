import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Social() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="소셜" />
            <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, paddingTop: 40, minHeight: '100vh', paddingBottom: 120 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: '1.1rem' }}>친구 초대</li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: '1.1rem' }}>공유</li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: '1.1rem' }}>커뮤니티</li>
                </ul>
            </div>
        </>
    );
}

export default Social; 