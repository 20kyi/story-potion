import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { notices } from '../../data/notices';
import { useTheme } from '../../ThemeContext';

function NoticeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const notice = notices.find(n => String(n.id) === String(id));

    // 다크모드에 따른 색상 설정
    const textColor = actualTheme === 'dark' ? '#f1f1f1' : '#222';
    const secondaryTextColor = actualTheme === 'dark' ? '#ccc' : '#888';
    const contentTextColor = actualTheme === 'dark' ? '#e0e0e0' : '#333';

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="공지사항" />
            <div style={{ maxWidth: 600, margin: '40px auto', marginTop: 50, padding: 24, paddingTop: 40, minHeight: '100vh' }}>
                {notice ? (
                    <>
                        <h2 style={{ color: textColor, marginTop: 10, marginBottom: 10, textAlign: 'left', fontWeight: 400, fontSize: '1.1rem' }}>{notice.title}</h2>
                        <div style={{ color: secondaryTextColor, fontSize: 14, textAlign: 'left', marginBottom: 20 }}>{notice.date}</div>
                        <div style={{ fontSize: 16, color: contentTextColor, lineHeight: 1.7, whiteSpace: 'pre-line', textAlign: 'left' }}>{notice.content}</div>
                    </>
                ) : (
                    <div style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 80 }}>존재하지 않는 공지입니다.</div>
                )}
            </div>
        </>
    );
}

export default NoticeDetail; 