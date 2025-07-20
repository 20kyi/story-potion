import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { notices } from '../../data/notices';

function NoticeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const notice = notices.find(n => String(n.id) === String(id));

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="공지사항" />
            <div style={{ maxWidth: 600, margin: '40px auto', marginTop: 50, padding: 24, paddingTop: 40, minHeight: '100vh' }}>
                {notice ? (
                    <>
                        <h2 style={{ color: '#222', marginTop: 10, marginBottom: 10, textAlign: 'left', fontWeight: 500, fontSize: 22 }}>{notice.title}</h2>
                        <div style={{ color: '#888', fontSize: 14, textAlign: 'left', marginBottom: 20 }}>{notice.date}</div>
                        <div style={{ fontSize: 16, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-line', textAlign: 'left' }}>{notice.content}</div>
                    </>
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', marginTop: 80 }}>존재하지 않는 공지입니다.</div>
                )}
            </div>
        </>
    );
}

export default NoticeDetail; 