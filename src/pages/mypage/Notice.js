import React from 'react';
import Header from '../../components/Header';
import { useNavigate, Link } from 'react-router-dom';
import { notices } from '../../data/notices';
import { useTheme } from '../../ThemeContext';
import styles from './Notice.module.css';

function Notice() {
    const navigate = useNavigate();
    const { actualTheme } = useTheme();

    // 다크모드에 따른 색상 설정
    const textColor = actualTheme === 'dark' ? '#f1f1f1' : '#222';
    const secondaryTextColor = actualTheme === 'dark' ? '#ccc' : '#888';
    const borderColor = actualTheme === 'dark' ? '#333' : '#f1f1f1';
    const arrowColor = actualTheme === 'dark' ? '#f1f1f1' : '#000000';

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="공지사항" />
            <div className={styles.noticeContainer}>
                <ul className={styles.noticeList}>
                    {notices.map(notice => (
                        <li key={notice.id} className={styles.noticeItem} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <Link to={`/my/notice/${notice.id}`} className={styles.noticeLink} style={{ color: 'inherit' }}>
                                <div>
                                    <div className={styles.noticeTitle} style={{ color: textColor }}>{notice.title}</div>
                                    <div className={styles.noticeDate} style={{ color: secondaryTextColor }}>{notice.date}</div>
                                </div>
                                <span className={styles.noticeArrow}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 6l6 6-6 6" stroke={arrowColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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