import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import styles from './Support.module.css';

function Support() {
    const navigate = useNavigate();
    
    const handleMenuClick = (menuType) => {
        switch (menuType) {
            case 'notice':
                navigate('/my/notice');
                break;
            case 'faq':
                // FAQ 페이지로 이동 (추후 구현)
                alert('FAQ 기능은 준비 중입니다.');
                break;
            case 'inquiry':
                // 문의하기 페이지로 이동 (추후 구현)
                alert('문의하기 기능은 준비 중입니다.');
                break;
            case 'feedback':
                // 피드백 페이지로 이동 (추후 구현)
                alert('피드백 기능은 준비 중입니다.');
                break;
            default:
                break;
        }
    };

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="고객지원" />
            <div className={styles.supportContainer}>
                <ul className={styles.supportList}>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('notice')}>
                        공지사항
                    </li>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('faq')}>
                        FAQ
                    </li>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('inquiry')}>
                        문의하기
                    </li>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('feedback')}>
                        피드백
                    </li>
                </ul>
            </div>
        </>
    );
}

export default Support; 