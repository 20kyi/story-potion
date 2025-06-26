import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function Support() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, paddingTop: 40, minHeight: '100vh', paddingBottom: 120 }}>
                <h2 style={{ color: '#e46262', marginBottom: 32, textAlign: 'center', fontWeight: 600 }}>고객지원</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: 16 }}>FAQ</li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: 16 }}>문의하기</li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: 16 }}>피드백</li>
                </ul>
            </div>
        </>
    );
}

export default Support; 