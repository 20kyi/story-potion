import React from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';

function Settings() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, paddingTop: 40, minHeight: '100vh', /* background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', */ paddingBottom: 120 }}>
                <h2 style={{ color: '#e46262', marginBottom: 32, textAlign: 'center', fontWeight: 600 }}>개인설정</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 400, fontSize: 16 }}>
                        <span style={{ fontWeight: 400 }}>알림 설정</span>
                        <button style={{ background: '#fdd2d2', color: '#cb6565', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 400, fontSize: 14, cursor: 'pointer' }}>관리</button>
                    </li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 400, fontSize: 16 }}>
                        <span style={{ fontWeight: 400 }}>테마</span>
                        <button style={{ background: '#fdd2d2', color: '#cb6565', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 400, fontSize: 14, cursor: 'pointer' }}>변경</button>
                    </li>
                    <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 400, fontSize: 16 }}>
                        <span style={{ fontWeight: 400 }}>언어</span>
                        <button style={{ background: '#fdd2d2', color: '#cb6565', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 400, fontSize: 14, cursor: 'pointer' }}>한국어</button>
                    </li>
                </ul>
                <button style={{ background: '#e46262', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 16, fontWeight: 400, width: '100%', marginTop: 40, cursor: 'pointer', boxShadow: '0 2px 8px rgba(228,98,98,0.08)' }}>
                    로그아웃
                </button>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <span style={{ color: '#888', fontSize: 13, fontWeight: 400, cursor: 'pointer' }}>탈퇴하기</span>
                </div>
            </div>
            <Navigation />
        </>
    );
}

export default Settings; 