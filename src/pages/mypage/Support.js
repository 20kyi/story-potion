import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import styles from './Support.module.css';
import { useTranslation } from '../../LanguageContext';

function Support() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    
    const handleMenuClick = (menuType) => {
        switch (menuType) {
            case 'notice':
                navigate('/my/notice');
                break;
            case 'faq':
                navigate('/my/faq');
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
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('support_title')} />
            <div className={styles.supportContainer}>
                <ul className={styles.supportList}>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('notice')}>
                        {t('notice')}
                    </li>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('faq')}>
                        {t('faq')}
                    </li>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('inquiry')}>
                        {t('inquiry')}
                    </li>
                    <li className={styles.supportItem} onClick={() => handleMenuClick('feedback')}>
                        {t('feedback')}
                    </li>
                </ul>
            </div>
        </>
    );
}

export default Support; 