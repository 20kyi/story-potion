import React from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import styles from './Support.module.css';

function Support() {
    const navigate = useNavigate();
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="고객지원" />
            <div className={styles.supportContainer}>
                <ul className={styles.supportList}>
                    <li className={styles.supportItem}>FAQ</li>
                    <li className={styles.supportItem}>문의하기</li>
                    <li className={styles.supportItem}>피드백</li>
                </ul>
            </div>
        </>
    );
}

export default Support; 