import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding-top: 0;
  width: 100%;
  @media (min-width: 1024px) {
    flex-direction: row;
    justify-content: space-between;
    max-width: 1000px;
    gap: 0;
  }
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
  @media (min-width: 1024px) {
    align-items: center;
    max-width: none;
    flex: 1;
  }
`;

const LogoSection = styled.div`
  margin-bottom: 40px;
  @media (min-width: 1024px) {
    margin-bottom: 0;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const Logo = styled.img`
  width: 150px;
  @media (min-width: 1024px) {
    width: 250px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  color: #e46262;
  margin-bottom: 30px;
  font-weight: 700;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 400px;
`;

const PasswordContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled.input`
  padding: 14px 20px;
  padding-right: 45px;
  border-radius: 15px;
  border: 1px solid #f1f1f1;
  font-size: 16px;
  color: #222;
  background-color: #fff;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;
  width: 100%;
  &:focus {
    border-color: #e46262;
    background-color: #fff;
  }
`;

const EyeIcon = styled.div`
  position: absolute;
  right: 15px;
  cursor: pointer;
  color: #aaa;
  font-size: 20px;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  padding: 14px 20px;
  border-radius: 15px;
  border: 1px solid #f1f1f1;
  font-size: 16px;
  color: #222;
  background-color: #fff;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;
  &:focus {
    border-color: #e46262;
    background-color: #fff;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #ff8a8a 0%, #e46262 100%);
  color: #fff;
  padding: 15px;
  border-radius: 15px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s;
  &:hover {
    box-shadow: 0 4px 15px rgba(228, 98, 98, 0.4);
  }
`;

const ErrorMessage = styled.p`
  color: #d9534f;
  font-size: 14px;
  text-align: center;
`;

const LoginLink = styled.div`
  margin-top: 25px;
  font-size: 14px;
  color: #555;
  a {
    color: #e46262;
    text-decoration: none;
    font-weight: 600;
    margin-left: 5px;
    &:hover {
      text-decoration: underline;
    }
  }
`;

function Signup() {
  const navigate = useNavigate();
  const [passwordShown, setPasswordShown] = useState(false);
  const [confirmPasswordShown, setConfirmPasswordShown] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const mainRef = useRef();
  const inputRef = useRef();

  // 라이트 모드 강제 적용
  useEffect(() => {
    const originalTheme = document.body.className;
    document.body.className = 'light';
    
    return () => {
      document.body.className = originalTheme;
    };
  }, []);

  // 약관 동의 확인
  useEffect(() => {
    const termsAgreement = sessionStorage.getItem('termsAgreement');
    if (!termsAgreement) {
      // 약관 동의를 하지 않았다면 약관 동의 페이지로 리다이렉트
      navigate('/terms-agreement');
    }
  }, [navigate]);

  useEffect(() => {
    let onShow, onHide;
    if (Capacitor.getPlatform() !== 'web') {
      onShow = Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardHeight(info.keyboardHeight);
      });
      onHide = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      });
    }
    return () => {
      if (onShow) onShow.remove();
      if (onHide) onHide.remove();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      // Firestore에 사용자 정보 + 기존 회원과 동일한 필드 저장
      const user = userCredential.user;
      const providerId = user.providerData[0]?.providerId || "password";
      
      // Firebase Auth의 displayName 설정
      await updateProfile(user, {
        displayName: formData.nickname,
        photoURL: process.env.PUBLIC_URL + '/default-profile.svg'
      });
      
      // 약관 동의 정보 가져오기
      const termsAgreement = JSON.parse(sessionStorage.getItem('termsAgreement') || '{}');
      
      await setDoc(doc(db, "users", user.uid), {
        authProvider: providerId,
        createdAt: new Date(),
        displayName: formData.nickname,
        email: formData.email,
        phoneNumber: formData.phoneNumber || '',
        emailVerified: user.emailVerified || false,
        eventEnabled: false,
        fcmToken: "",
        isActive: true,
        lastLoginAt: new Date(),
        marketingEnabled: termsAgreement.marketing || false,
        point: 100,
        reminderEnabled: false,
        reminderTime: "",
        updatedAt: new Date(),
        photoURL: process.env.PUBLIC_URL + '/default-profile.svg',
        // 약관 동의 정보 저장
        termsAgreement: {
          service: termsAgreement.service || false,
          privacy: termsAgreement.privacy || false,
          collection: termsAgreement.collection || false,
          marketing: termsAgreement.marketing || false,
          agreedAt: new Date()
        }
      });
      
      // 약관 동의 정보 세션에서 제거
      sessionStorage.removeItem('termsAgreement');
      
      alert('회원가입이 완료되었습니다!');
      navigate('/login');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호는 6자 이상이어야 합니다.');
          break;
        case 'auth/invalid-email':
          setError('유효하지 않은 이메일 주소입니다.');
          break;
        default:
          setError('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  return (
    <div ref={mainRef} style={{ paddingBottom: keyboardHeight }}>
      <Container>
        <ContentWrapper>
          <LogoSection>
            <Logo src="/app_logo/logo3.png" alt="Story Potion Logo" />
          </LogoSection>
          <FormSection>
            {/* <Title>회원가입</Title> */}
            <Form onSubmit={handleSubmit}>
              <Input
                type="text"
                name="nickname"
                placeholder="닉네임"
                value={formData.nickname}
                onChange={handleChange}
                ref={inputRef}
                onFocus={e => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              />
              <Input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                ref={inputRef}
                onFocus={e => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              />
              <Input
                type="tel"
                name="phoneNumber"
                placeholder="휴대전화 번호 (예: 01012345678)"
                value={formData.phoneNumber}
                onChange={handleChange}
                ref={inputRef}
                onFocus={e => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              />
              <PasswordContainer>
                <PasswordInput
                  type={passwordShown ? "text" : "password"}
                  name="password"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                  ref={inputRef}
                  onFocus={e => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                />
                <EyeIcon onClick={() => setPasswordShown(!passwordShown)}>
                  {passwordShown ? <FaEyeSlash /> : <FaEye />}
                </EyeIcon>
              </PasswordContainer>
              <PasswordContainer>
                <PasswordInput
                  type={confirmPasswordShown ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  ref={inputRef}
                  onFocus={e => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                />
                <EyeIcon onClick={() => setConfirmPasswordShown(!confirmPasswordShown)}>
                  {confirmPasswordShown ? <FaEyeSlash /> : <FaEye />}
                </EyeIcon>
              </PasswordContainer>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <Button type="submit">회원가입</Button>
            </Form>
            <LoginLink>
              이미 계정이 있으신가요?
              <Link to="/login">로그인</Link>
            </LoginLink>
          </FormSection>
        </ContentWrapper>
      </Container>
    </div>
  );
}

export default Signup; 