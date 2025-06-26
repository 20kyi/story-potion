import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

const notices = [
    { id: 1, title: '스토리포션 신규 기능 안내', date: '2025-06-20', content: '신규 기능이 추가되었습니다!' },
    { id: 2, title: '서버 점검 안내', date: '2025-06-15', content: '서버 점검이 예정되어 있습니다.' },
    { id: 3, title: '이용약관 변경 안내', date: '2025-06-10', content: '이용약관이 변경되었습니다.' },
];

function Notice() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, paddingTop: 70, minHeight: '100vh', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h2 style={{ color: '#e46262', marginBottom: 24, textAlign: 'center' }}>공지사항</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {notices.map(notice => (
                        <li key={notice.id} style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{notice.title}</div>
                                <div style={{ fontSize: 13, color: '#888' }}>{notice.date}</div>
                            </div>
                            <span style={{ marginLeft: 16, display: 'flex', alignItems: 'center' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 6l6 6-6 6" stroke="#e46262" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

export default Notice; 