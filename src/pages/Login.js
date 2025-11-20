import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard } from '@capacitor/keyboard';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  Container, ContentWrapper, FormSection, LogoSection, Logo, Title,
  Form, PasswordContainer, PasswordInput, EyeIcon, Input,
  Button, ErrorMessage, SignupLink, Divider,
  SocialLoginContainer, SocialButton, NaverIcon
} from './LoginStyled';
import { FaEye, FaEyeSlash, FaGoogle, FaApple } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import './Login.css';
import {
  initializeRecaptcha,
  sendSMSCode,
  verifySMSCodeAndResetPassword,
  findUserByPhone
} from '../utils/passwordResetUtils';
import {
  getUserSecurityQuestions,
  verifySecurityAnswers,
  resetPasswordWithSecurityQuestions,
  SECURITY_QUESTIONS
} from '../utils/securityQuestionUtils';

const isMobile = Capacitor.getPlatform() !== 'web';

function Login() {
  const navigate = useNavigate();
  const [passwordShown, setPasswordShown] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showFindId, setShowFindId] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  // 아이디 찾기 관련 상태
  const [findIdMethod, setFindIdMethod] = useState('email'); // 'email', 'phone'
  const [findIdEmail, setFindIdEmail] = useState('');
  const [findIdPhone, setFindIdPhone] = useState('');
  const [findIdMessage, setFindIdMessage] = useState('');
  const [findIdLoading, setFindIdLoading] = useState(false);
  const [foundEmail, setFoundEmail] = useState('');

  // 비밀번호 찾기 방법 선택
  const [resetMethod, setResetMethod] = useState('email'); // 'email', 'sms', 'security'

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

  // 새 비밀번호 설정
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleAppleLogin = async () => {
    console.log('애플 로그인 버튼 클릭됨');
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      const result = await signInWithPopup(auth, provider);
      // 애플 로그인 성공 시 users/{userId} 문서 자동 생성
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 애플 프로필 정보 사용
        const appleDisplayName = user.displayName || user.email?.split('@')[0] || '사용자';
        const applePhotoURL = user.photoURL || process.env.PUBLIC_URL + '/default-profile.svg';

        // Firebase Auth의 프로필 정보 업데이트
        await updateProfile(user, {
          displayName: appleDisplayName,
          photoURL: applePhotoURL
        });

        await setDoc(userRef, {
          email: user.email || '',
          displayName: appleDisplayName,
          photoURL: applePhotoURL,
          point: 0,
          createdAt: new Date(),
          authProvider: 'apple.com',
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

        // 기존 사용자의 경우 애플 프로필 정보로 업데이트 (photoURL이 비어있거나 기본 이미지인 경우)
        if (!userData.photoURL || userData.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
          const applePhotoURL = user.photoURL || process.env.PUBLIC_URL + '/default-profile.svg';
          await updateDoc(userRef, {
            photoURL: applePhotoURL,
            authProvider: 'apple.com',
            lastLoginAt: new Date(),
            updatedAt: new Date()
          });

          // Firebase Auth도 업데이트
          if (user.photoURL) {
            await updateProfile(user, {
              photoURL: applePhotoURL
            });
          }
        } else {
          // 마지막 로그인 시간만 업데이트
          await updateDoc(userRef, {
            authProvider: 'apple.com',
            lastLoginAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      navigate('/');
    } catch (e) {
      console.error('Apple 로그인 실패:', e);
      setError('Apple 로그인에 실패했습니다.');
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

  // 아이디 찾기 (이메일로)
  const handleFindIdByEmail = async (e) => {
    e.preventDefault();
    if (!findIdEmail.trim()) {
      setFindIdMessage('이메일을 입력해주세요.');
      return;
    }

    setFindIdLoading(true);
    setFindIdMessage('');
    setFoundEmail('');

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', findIdEmail.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setFindIdMessage('해당 이메일로 가입된 계정을 찾을 수 없습니다.');
      } else {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        setFoundEmail(userData.email || findIdEmail);
        setFindIdMessage('아이디를 찾았습니다.');
      }
    } catch (error) {
      console.error('아이디 찾기 실패:', error);
      setFindIdMessage('아이디 찾기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setFindIdLoading(false);
    }
  };

  // 아이디 찾기 (휴대폰 번호로)
  const handleFindIdByPhone = async (e) => {
    e.preventDefault();
    if (!findIdPhone.trim()) {
      setFindIdMessage('휴대폰 번호를 입력해주세요.');
      return;
    }

    setFindIdLoading(true);
    setFindIdMessage('');
    setFoundEmail('');

    try {
      const result = await findUserByPhone(findIdPhone.trim());
      if (result.success) {
        setFoundEmail(result.user.email || '');
        setFindIdMessage('아이디를 찾았습니다.');
      } else {
        setFindIdMessage(result.message);
      }
    } catch (error) {
      console.error('아이디 찾기 실패:', error);
      setFindIdMessage('아이디 찾기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setFindIdLoading(false);
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

              {/* 아이디/비밀번호 찾기 버튼 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                marginTop: '15px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowFindId(true)}
                  style={{
                    background: '#fff',
                    border: 'none',
                    color: '#e46262',
                    cursor: 'pointer',
                    padding: '10px 0',
                    borderRadius: '15px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                  }}
                >
                  아이디 찾기
                </button>
                <span style={{
                  color: '#e46262',
                  fontSize: '14px'
                }}>
                  /
                </span>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    background: '#fff',
                    border: 'none',
                    color: '#e46262',
                    cursor: 'pointer',
                    padding: '10px 0',
                    borderRadius: '15px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                  }}
                >
                  비밀번호 찾기
                </button>
              </div>
            </Form>
            <Divider>또는</Divider>
            <SocialLoginContainer>
              <SocialButton color="#4285F4" onClick={handleSocialLogin}><FaGoogle /></SocialButton>
              <SocialButton color="#000000" onClick={handleAppleLogin}><FaApple /></SocialButton>
              <SocialButton color="#FEE500"><RiKakaoTalkFill style={{ color: '#3c1e1e' }} /></SocialButton>
              <SocialButton><NaverIcon>N</NaverIcon></SocialButton>
            </SocialLoginContainer>
            <SignupLink>
              계정이 없으신가요?
              <Link to="/terms-agreement">회원가입</Link>
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
                { key: 'security', label: '보안질문' }
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
          </div>
        </div>
      )}

      {/* 아이디 찾기 모달 */}
      {showFindId && (
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
              아이디 찾기
            </h3>

            {/* 방법 선택 탭 */}
            <div style={{
              display: 'flex',
              marginBottom: '20px',
              borderBottom: '1px solid #eee'
            }}>
              {[
                { key: 'email', label: '이메일' },
                { key: 'phone', label: '휴대폰 번호' }
              ].map(method => (
                <button
                  key={method.key}
                  onClick={() => {
                    setFindIdMethod(method.key);
                    setFindIdMessage('');
                    setFoundEmail('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: 'none',
                    color: findIdMethod === method.key ? '#e46262' : '#666',
                    borderBottom: findIdMethod === method.key ? '2px solid #e46262' : 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: findIdMethod === method.key ? '600' : '400'
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {/* 이메일 방법 */}
            {findIdMethod === 'email' && (
              <form onSubmit={handleFindIdByEmail}>
                <p style={{
                  margin: '0 0 20px 0',
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  가입하신 이메일 주소를 입력하시면<br />
                  아이디(이메일)를 찾아드립니다.
                </p>

                <Input
                  type="email"
                  placeholder="이메일 주소"
                  value={findIdEmail}
                  onChange={(e) => setFindIdEmail(e.target.value)}
                  style={{ marginBottom: '15px' }}
                />

                {foundEmail && (
                  <div style={{
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>찾은 아이디</div>
                    <div>{foundEmail}</div>
                  </div>
                )}

                {findIdMessage && !foundEmail && (
                  <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb'
                  }}>
                    {findIdMessage}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFindId(false);
                      setFindIdEmail('');
                      setFindIdPhone('');
                      setFindIdMessage('');
                      setFoundEmail('');
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
                    disabled={findIdLoading}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#e46262',
                      color: 'white',
                      cursor: findIdLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: findIdLoading ? 0.7 : 1
                    }}
                  >
                    {findIdLoading ? '찾는 중...' : '아이디 찾기'}
                  </button>
                </div>
              </form>
            )}

            {/* 휴대폰 번호 방법 */}
            {findIdMethod === 'phone' && (
              <form onSubmit={handleFindIdByPhone}>
                <p style={{
                  margin: '0 0 20px 0',
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  가입하신 휴대폰 번호를 입력하시면<br />
                  아이디(이메일)를 찾아드립니다.
                </p>

                <Input
                  type="tel"
                  placeholder="휴대폰 번호 (예: 01012345678)"
                  value={findIdPhone}
                  onChange={(e) => setFindIdPhone(e.target.value)}
                  style={{ marginBottom: '15px' }}
                />

                {foundEmail && (
                  <div style={{
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>찾은 아이디</div>
                    <div>{foundEmail}</div>
                  </div>
                )}

                {findIdMessage && !foundEmail && (
                  <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb'
                  }}>
                    {findIdMessage}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFindId(false);
                      setFindIdEmail('');
                      setFindIdPhone('');
                      setFindIdMessage('');
                      setFoundEmail('');
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
                    disabled={findIdLoading}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#e46262',
                      color: 'white',
                      cursor: findIdLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: findIdLoading ? 0.7 : 1
                    }}
                  >
                    {findIdLoading ? '찾는 중...' : '아이디 찾기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;
