import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const isMobile = window.innerWidth <= 768;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 입력값 검증
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      // 여기에 실제 로그인 API 호출이 들어갈 예정
      // 임시로 이메일/비밀번호가 모두 입력되면 로그인 성공으로 처리
      if (formData.email && formData.password) {
        // 로그인 성공 시 localStorage에 임시 토큰 저장
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', formData.email);

        // 홈 화면으로 이동
        navigate('/home');
      }
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

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
    loginButton: {
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
    errorMessage: {
      color: '#e46262',
      fontSize: '14px',
      fontFamily: 'Plus Jakarta Sans',
      textAlign: 'center',
      marginTop: '10px'
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
    signupLink: {
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
        <h1 style={styles.title}>Welcome Back</h1>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              name="email"
              placeholder="이메일을 입력하세요"
              style={styles.input}
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              name="password"
              placeholder="비밀번호를 입력하세요"
              style={styles.input}
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && <div style={styles.errorMessage}>{error}</div>}

          <button type="submit" style={styles.loginButton}>
            로그인
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

          <div style={styles.signupLink}>
            아직 계정이 없으신가요?
            <Link to="/signup" style={styles.link}>회원가입</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login; 