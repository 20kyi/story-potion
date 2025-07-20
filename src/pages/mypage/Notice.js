import React from 'react';
import Header from '../../components/Header';
import { useNavigate, Link } from 'react-router-dom';
import { notices } from '../../data/notices';

function Notice() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="공지사항" />
            <div style={{ maxWidth: 600, margin: '40px auto', marginTop: 50, padding: 24, paddingTop: 40, minHeight: '100vh', /* background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', */ }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {notices.map(notice => (
                        <li key={notice.id} style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 400 }}>
                            <Link to={`/my/notice/${notice.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 400, fontSize: 20, marginBottom: 4 }}>{notice.title}</div>
                                    <div style={{ fontSize: 16, color: '#888', fontWeight: 400 }}>{notice.date}</div>
                                </div>
                                <span style={{ marginLeft: 16, display: 'flex', alignItems: 'center' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 6l6 6-6 6" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

export default Notice; 