import React from 'react';
import { Link } from 'react-router-dom';

function Signup() {
  const isMobile = window.innerWidth <= 768;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#df9696',
      position: 'relative',
      maxWidth: '100%',
      margin: '0 auto',
      overflowX: 'hidden'
    },
    mainContent: {
      backgroundColor: '#ffffff',
      borderRadius: '30px 30px 0 0',
      flex: 1,
      marginTop: '120px',
      padding: isMobile ? '40px 20px' : '60px 40px',
      position: 'relative',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    },
    title: {
      fontFamily: 'Island Moments',
      fontSize: isMobile ? '36px' : '48px',
      color: '#df9696',
      textAlign: 'center',
      marginBottom: '40px',
      letterSpacing: '2px'
    },
    subtitle: {
      fontFamily: 'Instrument Sans',
      fontSize: '14px',
      color: '#40392b',
      textAlign: 'center',
      marginTop: '-30px',
      marginBottom: '40px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxWidth: '400px',
      margin: '0 auto'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontFamily: 'Instrument Sans',
      fontSize: '14px',
      color: '#df9696',
      marginLeft: '4px'
    },
    input: {
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid #fdd2d2',
      fontSize: '16px',
      fontFamily: 'Plus Jakarta Sans',
      color: '#40392b',
      backgroundColor: '#fff',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      '&:focus': {
        borderColor: '#df9696'
      }
    },
    signupButton: {
      backgroundColor: '#e46262',
      color: '#ffffff',
      padding: '14px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '16px',
      fontFamily: 'Roboto Serif',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#d45252'
      }
    },
    socialLogin: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginTop: '30px'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      margin: '20px 0',
      color: '#df9696',
      fontFamily: 'Instrument Sans',
      fontSize: '14px'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#fdd2d2'
    },
    socialButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '12px',
      borderRadius: '12px',
      border: '1px solid #fdd2d2',
      backgroundColor: '#ffffff',
      color: '#40392b',
      fontSize: '14px',
      fontFamily: 'Plus Jakarta Sans',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    loginLink: {
      textAlign: 'center',
      marginTop: '30px',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: '14px',
      color: '#40392b'
    },
    link: {
      color: '#e46262',
      textDecoration: 'none',
      fontWeight: '600',
      marginLeft: '5px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <h1 style={styles.title}>Join Us</h1>
        <p style={styles.subtitle}>나만의 특별한 이야기를 기록해보세요</p>

        <form style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>닉네임</label>
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>비밀번호 확인</label>
            <input
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.signupButton}>
            회원가입
          </button>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span>또는</span>
            <div style={styles.dividerLine} />
          </div>

          <div style={styles.socialLogin}>
            <button
              type="button"
              style={{
                ...styles.socialButton,
                backgroundColor: '#4285f4',
                color: '#ffffff',
                border: 'none'
              }}
            >
              Google로 계속하기
            </button>
            <button
              type="button"
              style={{
                ...styles.socialButton,
                backgroundColor: '#1877f2',
                color: '#ffffff',
                border: 'none'
              }}
            >
              Facebook으로 계속하기
            </button>
          </div>

          <div style={styles.loginLink}>
            이미 계정이 있으신가요?
            <Link to="/login" style={styles.link}>로그인</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup; 