import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../../ThemeContext';

function NoticeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);

    // 다크모드에 따른 색상 설정
    const textColor = actualTheme === 'dark' ? '#f1f1f1' : '#222';
    const secondaryTextColor = actualTheme === 'dark' ? '#ccc' : '#888';
    const contentTextColor = actualTheme === 'dark' ? '#e0e0e0' : '#333';

    useEffect(() => {
        const fetchNotice = async () => {
            try {
                const noticeDoc = await getDoc(doc(db, 'announcements', id));
                if (noticeDoc.exists()) {
                    const data = noticeDoc.data();
                    setNotice({
                        id: noticeDoc.id,
                        ...data,
                        date: data.createdAt?.toDate() ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    });
                }
            } catch (error) {
                console.error('공지사항 조회 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchNotice();
        }
    }, [id]);

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="공지사항" />
            <div style={{ maxWidth: 600, margin: '50px auto', marginTop: 50, padding: 20, paddingTop: 20, paddingBottom: 20 }}>
                {loading ? (
                    <div style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 80 }}>로딩 중...</div>
                ) : notice ? (
                    <>
                        <h2 style={{ color: textColor, marginTop: 10, marginBottom: 10, textAlign: 'left', fontWeight: 400, fontSize: '1.1rem' }}>{notice.title}</h2>
                        <div style={{ color: secondaryTextColor, fontSize: 14, textAlign: 'left', marginBottom: 20 }}>{notice.date}</div>
                        <div style={{ fontSize: 16, color: contentTextColor, lineHeight: 1.7, whiteSpace: 'pre-line', textAlign: 'left', marginBottom: 40 }}>{notice.content}</div>
                    </>
                ) : (
                    <div style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 80 }}>존재하지 않는 공지입니다.</div>
                )}
            </div>
        </>
    );
}

export default NoticeDetail; 