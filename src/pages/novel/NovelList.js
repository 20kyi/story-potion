import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: radial-gradient(circle at 30% 20%, #f2b7b7 0%, #ffffff 100%);
    padding: 20px;
    padding-top: 40px;
    margin: 40px auto;
    max-width: 600px;
`;

function NovelList() {
    const navigate = useNavigate();
    const novels = JSON.parse(localStorage.getItem('novels') || '[]');

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: 'radial-gradient(circle at 30% 20%, #f2b7b7 0%, #ffffff 100%)',
            padding: '20px'
        },
        content: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '120px' // 하단 네비게이션 바와 작성하기 버튼을 위한 여백
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '25px'
        },
        profileImage: {
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid #df9696',
            cursor: 'pointer'
        },
        headerText: {
            display: 'flex',
            flexDirection: 'column'
        },
        welcome: {
            fontFamily: 'Island Moments',
            fontSize: '20px',
            color: '#df9696',
            letterSpacing: '2px',
            margin: 0
        },
        headerTitle: {
            fontFamily: 'Instrument Sans',
            fontSize: '10px',
            color: '#de2a2a',
            margin: 0
        },
        mainContent: {
            backgroundColor: '#fffbfb',
            borderRadius: '30px',
            padding: '20px',
            flex: 1,
            overflowY: 'auto'
        },
        novelList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        },
        novelItem: {
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #fdd2d2',
            cursor: 'pointer'
        },
        novelTitle: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#cb6565',
            marginBottom: '8px'
        },
        novelDate: {
            fontSize: '14px',
            color: '#888',
            marginBottom: '12px'
        },
        novelContent: {
            fontSize: '14px',
            color: '#666',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    return (
        <Container>
            <Header />
            <div style={styles.container}>
                <div style={styles.content}>
                    <header style={styles.header}>
                        <div
                            style={styles.profileImage}
                            onClick={() => navigate('/home')}
                            title="홈으로 이동"
                        />
                        <div style={styles.headerText}>
                            <h1 style={styles.welcome}>Welcome</h1>
                            <p style={styles.headerTitle}>소설보기</p>
                        </div>
                    </header>

                    <main style={styles.mainContent}>
                        <div style={styles.novelList}>
                            {novels.map((novel) => (
                                <div
                                    key={novel.id}
                                    style={styles.novelItem}
                                    onClick={() => navigate(`/novel/${novel.year}-${novel.month}-${novel.weekNum}`)}
                                >
                                    <div style={styles.novelTitle}>{novel.title}</div>
                                    <div style={styles.novelDate}>{formatDate(novel.date)}</div>
                                    <div style={styles.novelContent}>{novel.content}</div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
                <Navigation />
            </div>
        </Container>
    );
}

export default NovelList; 