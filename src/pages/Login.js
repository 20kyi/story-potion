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
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
import { 
  initializeRecaptcha, 
  sendSMSCode, 
  verifySMSCodeAndResetPassword 
} from '../utils/passwordResetUtils';
import { 
  getUserSecurityQuestions, 
  verifySecurityAnswers, 
  resetPasswordWithSecurityQuestions,
  SECURITY_QUESTIONS 
} from '../utils/securityQuestionUtils';
import { 
  createPasswordResetRequest, 
  checkRequestStatus 
} from '../utils/adminPasswordResetUtils';

const isMobile = Capacitor.getPlatform() !== 'web';

function Login() {
  const navigate = useNavigate();
  const [passwordShown, setPasswordShown] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  // 비밀번호 찾기 방법 선택
  const [resetMethod, setResetMethod] = useState('email'); // 'email', 'sms', 'security', 'admin'
  
  // SMS 인증 관련 상태
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // 보안 질문 관련 상태
  const [securityEmail, setSecurityEmail] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [securityAnswers, setSecurityAnswers] = useState([]);
  const [securityVerified, setSecurityVerified] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  
  // 관리자 문의 관련 상태
  const [adminRequest, setAdminRequest] = useState({
    email: '',
    displayName: '',
    phoneNumber: '',
    reason: '',
    additionalInfo: ''
  });
  const [adminRequestId, setAdminRequestId] = useState('');
  const [adminRequestStatus, setAdminRequestStatus] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  
  // 새 비밀번호 설정
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        console.log('appUrlOpen 이벤트 발생! url:', url);
        if (url && url.startsWith('storypotion://auth')) {
          const hash = url.split('#')[1];
          const params = new URLSearchParams(hash);
          const idToken = params.get('id_token');
          if (idToken) {
            console.log('id_token 추출 성공:', idToken);
            try {
              const credential = GoogleAuthProvider.credential(idToken);
              const result = await signInWithCredential(auth, credential);
              
              // 구글 로그인 성공 후 사용자 정보 처리
              const user = result.user;
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userRef);
              
              if (!userSnap.exists()) {
                // 구글 프로필 정보 사용 (displayName과 photoURL 모두 구글에서 가져온 값 사용)
                const googleDisplayName = user.displayName || user.email?.split('@')[0] || '사용자';
                const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;
                
                // Firebase Auth의 프로필 정보 업데이트 (구글 정보 유지)
                await updateProfile(user, {
                  displayName: googleDisplayName,
                  photoURL: googlePhotoURL
                });
                
                await setDoc(userRef, {
                  email: user.email || '',
                  displayName: googleDisplayName,
                  photoURL: googlePhotoURL,
                  point: 0,
                  createdAt: new Date(),
                  authProvider: 'google.com',
                  emailVerified: user.emailVerified || false,
                  isActive: true,
                  lastLoginAt: new Date(),
                  updatedAt: new Date()
                });
              } else {
                const userData = userSnap.data();
                if (userData.status === '정지') {
                  setError('정지된 계정입니다. 관리자에게 문의하세요.');
                  await auth.signOut();
                  return;
                }
                
                // 기존 사용자의 경우 구글 프로필 정보로 업데이트 (photoURL이 비어있거나 기본 이미지인 경우)
                if (!userData.photoURL || userData.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
                  const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;
                  await updateDoc(userRef, {
                    photoURL: googlePhotoURL,
                    authProvider: 'google.com',
                    lastLoginAt: new Date(),
                    updatedAt: new Date()
                  });
                  
                  // Firebase Auth도 업데이트
                  await updateProfile(user, {
                    photoURL: googlePhotoURL
                  });
                }
              }
              
              navigate('/');
            } catch (e) {
              console.error('Firebase 로그인 실패:', e);
              setError('로그인 실패. 다시 시도해주세요.');
            }
          } else {
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
        // 기본 displayName 설정 (이메일에서 @ 앞부분 사용)
        const defaultDisplayName = user.email?.split('@')[0] || '사용자';
        
        // Firebase Auth의 displayName 설정
        await updateProfile(user, {
          displayName: defaultDisplayName,
          photoURL: process.env.PUBLIC_URL + '/default-profile.svg'
        });
        
        await setDoc(userRef, {
          email: user.email || '',
          displayName: defaultDisplayName,
          photoURL: process.env.PUBLIC_URL + '/default-profile.svg',
          point: 0,
          createdAt: new Date()
        });
      } else {
        const userData = userSnap.data();
        if (userData.status === '정지') {
          setError('정지된 계정입니다. 관리자에게 문의하세요.');
          await auth.signOut();
          return;
        }
        
        // 임시 비밀번호로 로그인한 경우 처리
        if (userData.temporaryPassword && userData.passwordResetBy === 'admin') {
          // 임시 비밀번호 정보 삭제 (보안상)
          await updateDoc(userRef, {
            temporaryPassword: null,
            passwordResetBy: null,
            passwordResetAt: null,
            lastLoginAt: new Date(),
            updatedAt: new Date()
          });
          
          // 사용자에게 비밀번호 변경 안내
          setError('임시 비밀번호로 로그인되었습니다. 보안을 위해 비밀번호를 변경해주세요.');
          // TODO: 비밀번호 변경 페이지로 리다이렉트
          return;
        }
        
        // 마지막 로그인 시간 업데이트
        await updateDoc(userRef, {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        });
      }
      navigate('/');
    } catch {
      setError('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleSocialLogin = async () => {
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
        console.log('모바일 환경, 브라우저 오픈 시도');
        await Browser.open({ url: authUrl });
        console.log('브라우저 오픈 성공');
      } else {
        console.log('웹 환경, signInWithPopup 시도');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // 소셜 로그인 성공 시 users/{userId} 문서 자동 생성
        const user = result.user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // 구글 프로필 정보 사용 (displayName과 photoURL 모두 구글에서 가져온 값 사용)
          const googleDisplayName = user.displayName || user.email?.split('@')[0] || '사용자';
          const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;
          
          // Firebase Auth의 프로필 정보 업데이트 (구글 정보 유지)
          await updateProfile(user, {
            displayName: googleDisplayName,
            photoURL: googlePhotoURL
          });
          
          await setDoc(userRef, {
            email: user.email || '',
            displayName: googleDisplayName,
            photoURL: googlePhotoURL,
            point: 0,
            createdAt: new Date(),
            authProvider: 'google.com',
            emailVerified: user.emailVerified || false,
            isActive: true,
            lastLoginAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          const userData = userSnap.data();
          if (userData.status === '정지') {
            setError('정지된 계정입니다. 관리자에게 문의하세요.');
            await auth.signOut();
            return;
          }
          
          // 기존 사용자의 경우 구글 프로필 정보로 업데이트 (photoURL이 비어있거나 기본 이미지인 경우)
          if (!userData.photoURL || userData.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
            const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;
            await updateDoc(userRef, {
              photoURL: googlePhotoURL,
              authProvider: 'google.com',
              lastLoginAt: new Date(),
              updatedAt: new Date()
            });
            
            // Firebase Auth도 업데이트
            await updateProfile(user, {
              photoURL: googlePhotoURL
            });
          }
        }
        navigate('/');
      }
    } catch (e) {
      console.error('Google 로그인 실패:', e);
      setError('Google 로그인에 실패했습니다.');
    }
  };

  // 비밀번호 재설정 함수들
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetMessage('이메일을 입력해주세요.');
      return;
    }

    setResetLoading(true);
    setResetMessage('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.');
      setResetEmail('');
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setResetMessage('해당 이메일로 가입된 계정을 찾을 수 없습니다.');
          break;
        case 'auth/invalid-email':
          setResetMessage('유효하지 않은 이메일 주소입니다.');
          break;
        case 'auth/too-many-requests':
          setResetMessage('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          setResetMessage('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  // SMS 인증 코드 발송
  const handleSendSMSCode = async (e) => {
    e.preventDefault();
    if (!smsPhone.trim()) {
      setResetMessage('휴대폰 번호를 입력해주세요.');
      return;
    }

    setSmsLoading(true);
    setResetMessage('');

    try {
      // reCAPTCHA 초기화
      initializeRecaptcha('recaptcha-container');
      
      const result = await sendSMSCode(smsPhone);
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setSmsSent(true);
        setResetMessage('인증 코드가 발송되었습니다.');
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error('SMS 발송 실패:', error);
      setResetMessage('SMS 발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSmsLoading(false);
    }
  };

  // SMS 인증 코드 확인
  const handleVerifySMSCode = async (e) => {
    e.preventDefault();
    if (!smsCode.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setResetMessage('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSmsLoading(true);
    setResetMessage('');

    try {
      const result = await verifySMSCodeAndResetPassword(confirmationResult, smsCode, newPassword);
      if (result.success) {
        setResetMessage('비밀번호가 성공적으로 변경되었습니다.');
        setShowForgotPassword(false);
        setResetMethod('email');
        setSmsPhone('');
        setSmsCode('');
        setSmsSent(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error('SMS 인증 실패:', error);
      setResetMessage('인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSmsLoading(false);
    }
  };

  // 보안 질문 조회
  const handleGetSecurityQuestions = async (e) => {
    e.preventDefault();
    if (!securityEmail.trim()) {
      setResetMessage('이메일을 입력해주세요.');
      return;
    }

    setSecurityLoading(true);
    setResetMessage('');

    try {
      const result = await getUserSecurityQuestions(securityEmail);
      if (result.success) {
        setSecurityQuestions(result.securityQuestions);
        setSecurityAnswers(new Array(result.securityQuestions.length).fill(''));
        setResetMessage('보안 질문을 확인해주세요.');
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error('보안 질문 조회 실패:', error);
      setResetMessage('보안 질문 조회에 실패했습니다.');
    } finally {
      setSecurityLoading(false);
    }
  };

  // 보안 질문 답변 확인
  const handleVerifySecurityAnswers = async (e) => {
    e.preventDefault();
    if (securityAnswers.some(answer => !answer.trim())) {
      setResetMessage('모든 질문에 답변해주세요.');
      return;
    }

    setSecurityLoading(true);
    setResetMessage('');

    try {
      const result = await verifySecurityAnswers(securityQuestions[0]?.userId, securityAnswers);
      if (result.success) {
        setSecurityVerified(true);
        setResetMessage('보안 질문 인증이 완료되었습니다. 새 비밀번호를 입력해주세요.');
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error('보안 질문 확인 실패:', error);
      setResetMessage('보안 질문 확인에 실패했습니다.');
    } finally {
      setSecurityLoading(false);
    }
  };

  // 보안 질문으로 비밀번호 재설정
  const handleResetPasswordWithSecurity = async (e) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setResetMessage('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSecurityLoading(true);
    setResetMessage('');

    try {
      const result = await resetPasswordWithSecurityQuestions(securityQuestions[0]?.userId, newPassword);
      if (result.success) {
        setResetMessage('비밀번호가 성공적으로 변경되었습니다.');
        setShowForgotPassword(false);
        setResetMethod('email');
        setSecurityEmail('');
        setSecurityQuestions([]);
        setSecurityAnswers([]);
        setSecurityVerified(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      setResetMessage('비밀번호 재설정에 실패했습니다.');
    } finally {
      setSecurityLoading(false);
    }
  };

  // 관리자 문의 요청
  const handleAdminRequest = async (e) => {
    e.preventDefault();
    if (!adminRequest.email.trim() || !adminRequest.displayName.trim() || !adminRequest.reason.trim()) {
      setResetMessage('필수 정보를 모두 입력해주세요.');
      return;
    }

    setAdminLoading(true);
    setResetMessage('');

    try {
      const result = await createPasswordResetRequest(adminRequest);
      if (result.success) {
        setAdminRequestId(result.requestId);
        setAdminRequestStatus('pending');
        setResetMessage('비밀번호 재설정 요청이 접수되었습니다. 관리자 검토 후 연락드리겠습니다.');
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error('관리자 요청 실패:', error);
      setResetMessage('요청 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAdminLoading(false);
    }
  };

  // 요청 상태 확인
  const handleCheckRequestStatus = async () => {
    if (!adminRequestId) {
      setResetMessage('요청 ID가 없습니다.');
      return;
    }

    setAdminLoading(true);
    setResetMessage('');

    try {
      const result = await checkRequestStatus(adminRequestId);
      if (result.success) {
        setAdminRequestStatus(result.request.status);
        setResetMessage(`요청 상태: ${result.request.status}`);
      } else {
        setResetMessage(result.message);
      }
    } catch (error) {
      console.error('요청 상태 확인 실패:', error);
      setResetMessage('요청 상태 확인에 실패했습니다.');
    } finally {
      setAdminLoading(false);
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
              
              {/* 비밀번호 찾기 링크 */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '15px',
                fontSize: '14px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e46262',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
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

      {/* 비밀번호 재설정 모달 */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              textAlign: 'center',
              color: '#333',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              비밀번호 찾기
            </h3>

            {/* 방법 선택 탭 */}
            <div style={{ 
              display: 'flex', 
              marginBottom: '20px',
              borderBottom: '1px solid #eee'
            }}>
              {[
                { key: 'email', label: '이메일' },
                { key: 'sms', label: 'SMS' },
                { key: 'security', label: '보안질문' },
                { key: 'admin', label: '관리자문의' }
              ].map(method => (
                <button
                  key={method.key}
                  onClick={() => setResetMethod(method.key)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: 'none',
                    color: resetMethod === method.key ? '#e46262' : '#666',
                    borderBottom: resetMethod === method.key ? '2px solid #e46262' : 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: resetMethod === method.key ? '600' : '400'
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {/* 이메일 방법 */}
            {resetMethod === 'email' && (
              <div>
                <p style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '14px', 
                  color: '#666',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  가입하신 이메일 주소를 입력하시면<br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>

                <form onSubmit={handlePasswordReset}>
                  <Input
                    type="email"
                    placeholder="이메일 주소"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{ marginBottom: '15px' }}
                  />
                  
                  {resetMessage && (
                    <div style={{
                      padding: '10px',
                      marginBottom: '15px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textAlign: 'center',
                      backgroundColor: resetMessage.includes('발송되었습니다') ? '#d4edda' : '#f8d7da',
                      color: resetMessage.includes('발송되었습니다') ? '#155724' : '#721c24',
                      border: `1px solid ${resetMessage.includes('발송되었습니다') ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                      {resetMessage}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmail('');
                        setResetMessage('');
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#e46262',
                        color: 'white',
                        cursor: resetLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        opacity: resetLoading ? 0.7 : 1
                      }}
                    >
                      {resetLoading ? '발송 중...' : '재설정 이메일 발송'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SMS 방법 */}
            {resetMethod === 'sms' && (
              <div>
                <p style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '14px', 
                  color: '#666',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  휴대폰 번호로 인증 코드를 받아<br />
                  비밀번호를 재설정합니다.
                </p>

                {!smsSent ? (
                  <form onSubmit={handleSendSMSCode}>
                    <Input
                      type="tel"
                      placeholder="휴대폰 번호 (예: 01012345678)"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      style={{ marginBottom: '15px' }}
                    />
                    <div id="recaptcha-container"></div>
                    
                    {resetMessage && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: resetMessage.includes('발송되었습니다') ? '#d4edda' : '#f8d7da',
                        color: resetMessage.includes('발송되었습니다') ? '#155724' : '#721c24',
                        border: `1px solid ${resetMessage.includes('발송되었습니다') ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {resetMessage}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setSmsPhone('');
                          setResetMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={smsLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#e46262',
                          color: 'white',
                          cursor: smsLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: smsLoading ? 0.7 : 1
                        }}
                      >
                        {smsLoading ? '발송 중...' : '인증 코드 발송'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySMSCode}>
                    <Input
                      type="text"
                      placeholder="인증 코드 6자리"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      style={{ marginBottom: '15px' }}
                    />
                    <Input
                      type="password"
                      placeholder="새 비밀번호"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ marginBottom: '15px' }}
                    />
                    <Input
                      type="password"
                      placeholder="새 비밀번호 확인"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ marginBottom: '15px' }}
                    />
                    
                    {resetMessage && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: resetMessage.includes('성공') ? '#d4edda' : '#f8d7da',
                        color: resetMessage.includes('성공') ? '#155724' : '#721c24',
                        border: `1px solid ${resetMessage.includes('성공') ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {resetMessage}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSmsSent(false);
                          setSmsCode('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setResetMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        뒤로
                      </button>
                      <button
                        type="submit"
                        disabled={smsLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#e46262',
                          color: 'white',
                          cursor: smsLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: smsLoading ? 0.7 : 1
                        }}
                      >
                        {smsLoading ? '확인 중...' : '비밀번호 변경'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 보안 질문 방법 */}
            {resetMethod === 'security' && (
              <div>
                <p style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '14px', 
                  color: '#666',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  보안 질문에 답변하여<br />
                  비밀번호를 재설정합니다.
                </p>

                {securityQuestions.length === 0 ? (
                  <form onSubmit={handleGetSecurityQuestions}>
                    <Input
                      type="email"
                      placeholder="이메일 주소"
                      value={securityEmail}
                      onChange={(e) => setSecurityEmail(e.target.value)}
                      style={{ marginBottom: '15px' }}
                    />
                    
                    {resetMessage && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: resetMessage.includes('확인') ? '#d4edda' : '#f8d7da',
                        color: resetMessage.includes('확인') ? '#155724' : '#721c24',
                        border: `1px solid ${resetMessage.includes('확인') ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {resetMessage}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setSecurityEmail('');
                          setResetMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={securityLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#e46262',
                          color: 'white',
                          cursor: securityLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: securityLoading ? 0.7 : 1
                        }}
                      >
                        {securityLoading ? '확인 중...' : '보안 질문 확인'}
                      </button>
                    </div>
                  </form>
                ) : !securityVerified ? (
                  <form onSubmit={handleVerifySecurityAnswers}>
                    {securityQuestions.map((question, index) => (
                      <div key={index} style={{ marginBottom: '15px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '5px', 
                          fontSize: '14px', 
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          {question.question}
                        </label>
                        <Input
                          type="text"
                          placeholder="답변을 입력하세요"
                          value={securityAnswers[index] || ''}
                          onChange={(e) => {
                            const newAnswers = [...securityAnswers];
                            newAnswers[index] = e.target.value;
                            setSecurityAnswers(newAnswers);
                          }}
                        />
                      </div>
                    ))}
                    
                    {resetMessage && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: resetMessage.includes('완료') ? '#d4edda' : '#f8d7da',
                        color: resetMessage.includes('완료') ? '#155724' : '#721c24',
                        border: `1px solid ${resetMessage.includes('완료') ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {resetMessage}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityQuestions([]);
                          setSecurityAnswers([]);
                          setSecurityEmail('');
                          setResetMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        뒤로
                      </button>
                      <button
                        type="submit"
                        disabled={securityLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#e46262',
                          color: 'white',
                          cursor: securityLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: securityLoading ? 0.7 : 1
                        }}
                      >
                        {securityLoading ? '확인 중...' : '답변 확인'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordWithSecurity}>
                    <Input
                      type="password"
                      placeholder="새 비밀번호"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ marginBottom: '15px' }}
                    />
                    <Input
                      type="password"
                      placeholder="새 비밀번호 확인"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ marginBottom: '15px' }}
                    />
                    
                    {resetMessage && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: resetMessage.includes('성공') ? '#d4edda' : '#f8d7da',
                        color: resetMessage.includes('성공') ? '#155724' : '#721c24',
                        border: `1px solid ${resetMessage.includes('성공') ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {resetMessage}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityVerified(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setResetMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        뒤로
                      </button>
                      <button
                        type="submit"
                        disabled={securityLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#e46262',
                          color: 'white',
                          cursor: securityLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: securityLoading ? 0.7 : 1
                        }}
                      >
                        {securityLoading ? '변경 중...' : '비밀번호 변경'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 관리자 문의 방법 */}
            {resetMethod === 'admin' && (
              <div>
                <p style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '14px', 
                  color: '#666',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  관리자에게 직접 문의하여<br />
                  비밀번호를 재설정합니다.
                </p>

                {!adminRequestId ? (
                  <form onSubmit={handleAdminRequest}>
                    <Input
                      type="email"
                      placeholder="이메일 주소"
                      value={adminRequest.email}
                      onChange={(e) => setAdminRequest({...adminRequest, email: e.target.value})}
                      style={{ marginBottom: '15px' }}
                    />
                    <Input
                      type="text"
                      placeholder="사용자 이름"
                      value={adminRequest.displayName}
                      onChange={(e) => setAdminRequest({...adminRequest, displayName: e.target.value})}
                      style={{ marginBottom: '15px' }}
                    />
                    <Input
                      type="tel"
                      placeholder="휴대폰 번호 (선택사항)"
                      value={adminRequest.phoneNumber}
                      onChange={(e) => setAdminRequest({...adminRequest, phoneNumber: e.target.value})}
                      style={{ marginBottom: '15px' }}
                    />
                    <textarea
                      placeholder="비밀번호를 잊어버린 이유"
                      value={adminRequest.reason}
                      onChange={(e) => setAdminRequest({...adminRequest, reason: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '15px',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                    />
                    <textarea
                      placeholder="추가 정보 (선택사항)"
                      value={adminRequest.additionalInfo}
                      onChange={(e) => setAdminRequest({...adminRequest, additionalInfo: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '15px',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                    
                    {resetMessage && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: resetMessage.includes('접수') ? '#d4edda' : '#f8d7da',
                        color: resetMessage.includes('접수') ? '#155724' : '#721c24',
                        border: `1px solid ${resetMessage.includes('접수') ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {resetMessage}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setAdminRequest({
                            email: '',
                            displayName: '',
                            phoneNumber: '',
                            reason: '',
                            additionalInfo: ''
                          });
                          setResetMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={adminLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#e46262',
                          color: 'white',
                          cursor: adminLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: adminLoading ? 0.7 : 1
                        }}
                      >
                        {adminLoading ? '접수 중...' : '문의 접수'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div style={{
                      padding: '15px',
                      marginBottom: '20px',
                      borderRadius: '8px',
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #bbdefb'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>요청 접수 완료</h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
                        요청 ID: <strong>{adminRequestId}</strong>
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                        관리자 검토 후 연락드리겠습니다.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckRequestStatus}
                      disabled={adminLoading}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#666',
                        cursor: adminLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        marginBottom: '15px',
                        opacity: adminLoading ? 0.7 : 1
                      }}
                    >
                      {adminLoading ? '확인 중...' : '요청 상태 확인'}
                    </button>

                    {adminRequestStatus && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        border: '1px solid #ffeaa7'
                      }}>
                        상태: {adminRequestStatus}
                      </div>
                    )}

                    {resetMessage && (
                      <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        backgroundColor: resetMessage.includes('상태') ? '#fff3cd' : '#f8d7da',
                        color: resetMessage.includes('상태') ? '#856404' : '#721c24',
                        border: `1px solid ${resetMessage.includes('상태') ? '#ffeaa7' : '#f5c6cb'}`
                      }}>
                        {resetMessage}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setAdminRequestId('');
                        setAdminRequestStatus('');
                        setAdminRequest({
                          email: '',
                          displayName: '',
                          phoneNumber: '',
                          reason: '',
                          additionalInfo: ''
                        });
                        setResetMessage('');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#e46262',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      닫기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
