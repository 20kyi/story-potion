import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard } from '@capacitor/keyboard';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  Container, ContentWrapper, FormSection, LogoSection, Logo, Title,
  Form, PasswordContainer, PasswordInput, EyeIcon, Input,
  Button, ErrorMessage, SignupLink, Divider,
  SocialLoginContainer, SocialButton, NaverIcon
} from './LoginStyled';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import './Login.css';

const isMobile = Capacitor.getPlatform() !== 'web';

function Login() {
  const navigate = useNavigate();
  const [passwordShown, setPasswordShown] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const mainRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    let onShow, onHide;
    if (isMobile) {
      onShow = Keyboard.addListener('keyboardWillShow', (info) => setKeyboardHeight(info.keyboardHeight));
      onHide = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    }
    return () => {
      if (onShow) onShow.remove();
      if (onHide) onHide.remove();
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        alert('appUrlOpen 이벤트 발생! url: ' + url);
        console.log('appUrlOpen 이벤트 발생! url:', url);
        if (url && url.startsWith('storypotion://auth')) {
          const hash = url.split('#')[1];
          const params = new URLSearchParams(hash);
          const idToken = params.get('id_token');
          if (idToken) {
            alert('id_token 추출 성공: ' + idToken);
            console.log('id_token 추출 성공:', idToken);
            try {
              const credential = GoogleAuthProvider.credential(idToken);
              await signInWithCredential(auth, credential);
              alert('Firebase 로그인 성공!');
              navigate('/');
            } catch (e) {
              alert('Firebase 로그인 실패: ' + e.message);
              console.error('Firebase 로그인 실패:', e);
              setError('로그인 실패. 다시 시도해주세요.');
            }
          } else {
            alert('id_token 없음. URL: ' + url);
            console.error('id_token 없음. URL:', url);
            setError('로그인 실패: 토큰이 없습니다.');
          }
        }
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // 로그인 성공 시 users/{userId} 문서 자동 생성
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          point: 0,
          createdAt: new Date()
        });
      }
      navigate('/');
    } catch {
      setError('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleSocialLogin = async () => {
    alert('구글 로그인 버튼 클릭됨');
    console.log('구글 로그인 버튼 클릭됨');
    const androidClientId = '607033226027-srdkp30ievjn5kjms4ds25n727muanh9.apps.googleusercontent.com';
    const redirectUri = 'storypotion://auth';
    const nonce = Math.random().toString(36).substring(2);

    const authUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      `client_id=${androidClientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile` +
      `&nonce=${nonce}` +
      `&prompt=consent`;

    try {
      if (isMobile) {
        alert('모바일 환경, 브라우저 오픈 시도');
        console.log('모바일 환경, 브라우저 오픈 시도');
        await Browser.open({ url: authUrl });
        alert('브라우저 오픈 성공');
        console.log('브라우저 오픈 성공');
      } else {
        alert('웹 환경, signInWithPopup 시도');
        console.log('웹 환경, signInWithPopup 시도');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // 소셜 로그인 성공 시 users/{userId} 문서 자동 생성
        const user = result.user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            point: 0,
            createdAt: new Date()
          });
        }
        navigate('/');
      }
    } catch (e) {
      alert('Google 로그인 실패: ' + e.message);
      console.error('Google 로그인 실패:', e);
      setError('Google 로그인에 실패했습니다.');
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
            <Form onSubmit={handleSubmit}>
              <Input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                ref={inputRef}
                onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
              />
              <PasswordContainer>
                <PasswordInput
                  type={passwordShown ? 'text' : 'password'}
                  name="password"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
                />
                <EyeIcon onClick={() => setPasswordShown(!passwordShown)}>
                  {passwordShown ? <FaEyeSlash /> : <FaEye />}
                </EyeIcon>
              </PasswordContainer>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <Button type="submit">로그인 하세요</Button>
            </Form>
            <Divider>또는</Divider>
            <SocialLoginContainer>
              <SocialButton color="#4285F4" onClick={handleSocialLogin}><FaGoogle /></SocialButton>
              <SocialButton color="#1877F2"><FaFacebook /></SocialButton>
              <SocialButton color="#FEE500"><RiKakaoTalkFill style={{ color: '#3c1e1e' }} /></SocialButton>
              <SocialButton><NaverIcon>N</NaverIcon></SocialButton>
            </SocialLoginContainer>
            <SignupLink>
              계정이 없으신가요?
              <Link to="/signup">회원가입</Link>
            </SignupLink>
          </FormSection>
        </ContentWrapper>
      </Container>
    </div>
  );
}

export default Login;
