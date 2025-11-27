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
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
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
  const [findIdMethod, setFindIdMethod] = useState('nickname'); // 'nickname' or 'phone'
  const [findIdInput, setFindIdInput] = useState(''); // 닉네임 또는 휴대전화번호 입력용
  const [findIdMessage, setFindIdMessage] = useState('');
  const [findIdLoading, setFindIdLoading] = useState(false);
  const [foundEmails, setFoundEmails] = useState([]); // 여러 계정의 이메일 배열

  // 비밀번호 찾기 방법 선택 (이메일만 사용)
  const [resetMethod] = useState('email'); // 이메일 인증만 사용

  // 카카오 로그인 로딩 상태
  const [kakaoLoading, setKakaoLoading] = useState(false);

  // 보안 질문 관련 상태
  const [securityEmail, setSecurityEmail] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [securityAnswers, setSecurityAnswers] = useState([]);
  const [securityVerified, setSecurityVerified] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  // 새 비밀번호 설정
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
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

    // 카카오 로그인 성공 시 자동으로 홈으로 이동
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        // 카카오 로그인 중이고 사용자가 로그인된 경우
        if (kakaoLoading && user) {
          console.log('✅ 카카오 로그인 성공 감지, 홈으로 이동');
          setKakaoLoading(false);
          navigate('/');
        }
      });

      // 카카오 로그인 성공 이벤트 리스너
      const handleKakaoLoginSuccess = () => {
        console.log('✅ 카카오 로그인 성공 이벤트 수신');
        // auth 상태 변화를 기다리기 위해 약간의 지연
        setTimeout(() => {
          const currentUser = auth.currentUser;
          if (currentUser) {
            setKakaoLoading(false);
            navigate('/');
          }
        }, 500);
      };

      // 카카오 로그인 실패 이벤트 리스너
      const handleKakaoLoginFailed = () => {
        console.log('❌ 카카오 로그인 실패 이벤트 수신');
        setKakaoLoading(false);
        setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      };

      window.addEventListener('kakaoLoginSuccess', handleKakaoLoginSuccess);
      window.addEventListener('kakaoLoginFailed', handleKakaoLoginFailed);

      return () => {
        unsubscribe();
        window.removeEventListener('kakaoLoginSuccess', handleKakaoLoginSuccess);
        window.removeEventListener('kakaoLoginFailed', handleKakaoLoginFailed);
      };
    }, [kakaoLoading, navigate]);

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

  // HTTPS redirect URI를 사용하는 커스텀 OAuth 플로우

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

      // 이메일 인증 상태 확인 (이메일/비밀번호 로그인인 경우만)
      if (user.providerData[0]?.providerId === 'password' && !user.emailVerified) {
        setEmailVerificationMessage('이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해주세요.');
        setEmailVerificationSent(false);
        // 로그인은 허용하되 안내 메시지 표시 후 홈으로 이동
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setEmailVerificationMessage('');
        setEmailVerificationSent(false);
        navigate('/');
      }
    } catch {
      setError('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  };

  // Google 로그인 성공 후 사용자 정보 처리 공통 함수
  const handleGoogleLoginSuccess = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 신규 사용자 - 구글 프로필 정보 사용
      const googleDisplayName = user.displayName || user.email?.split('@')[0] || '사용자';
      const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;

      // Firebase Auth 프로필 업데이트
      await updateProfile(user, {
        displayName: googleDisplayName,
        photoURL: googlePhotoURL
      });

      // Firestore에 사용자 정보 저장
      await setDoc(userRef, {
        email: user.email || '',
        displayName: googleDisplayName,
        photoURL: googlePhotoURL,
        point: 100,
        createdAt: new Date(),
        authProvider: 'google.com',
        emailVerified: user.emailVerified || false,
        isActive: true,
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });

      // 회원가입 축하 포인트 히스토리 추가
      await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
        type: 'earn',
        amount: 100,
        desc: '회원가입 축하 포인트',
        createdAt: new Date()
      });
    } else {
      // 기존 사용자
      const userData = userSnap.data();

      if (userData.status === '정지') {
        setError('정지된 계정입니다. 관리자에게 문의하세요.');
        await auth.signOut();
        return;
      }

      // 프로필 이미지 업데이트 (비어있거나 기본 이미지인 경우)
      if (!userData.photoURL || userData.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
        const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;
        await updateDoc(userRef, {
          photoURL: googlePhotoURL,
          authProvider: 'google.com',
          lastLoginAt: new Date(),
          updatedAt: new Date()
        });

        await updateProfile(user, {
          photoURL: googlePhotoURL
        });
      } else {
        // 마지막 로그인 시간만 업데이트
        await updateDoc(userRef, {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  };

  const handleSocialLogin = async () => {
    console.log('구글 로그인 버튼 클릭됨');

    try {
      if (isMobile) {
        // 모바일: HTTPS redirect URI를 사용하는 커스텀 OAuth 플로우
        console.log('모바일 환경, HTTPS redirect URI 사용');

        // Firebase 프로젝트의 웹 OAuth 클라이언트 ID 사용
        const webClientId = '607033226027-8f2q1anu11vdm5usbdcv418um9jsvk1e.apps.googleusercontent.com';
        // HTTPS redirect URI 사용 (Google OAuth Console에 등록 가능)
        // oauth2redirect 페이지에서 앱으로 리디렉션 처리
        const redirectUri = 'https://story-potion.web.app/oauth2redirect';


        // nonce 생성 (보안을 위해)
        const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // state 생성 (CSRF 방지)
        const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // 세션 스토리지에 저장 (리디렉션 후 확인용)
        // sessionStorage 접근 불가능한 환경에서는 에러 무시하고 계속 진행
        try {
          sessionStorage.setItem('google_oauth_state', state);
          sessionStorage.setItem('google_oauth_nonce', nonce);
        } catch (storageError) {
          console.warn('⚠️ sessionStorage 접근 불가 (OAuth 플로우는 계속 진행):', storageError);
          // sessionStorage 접근 불가능해도 OAuth 플로우는 계속 진행
          // state와 nonce는 URL 파라미터로 전달되므로 문제없음
        }

        // OAuth URL 생성 (Authorization Code Flow with PKCE)
        // 모바일에서는 id_token을 직접 받는 방식 사용
        const authUrl =
          'https://accounts.google.com/o/oauth2/v2/auth?' +
          `client_id=${webClientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=id_token` +
          `&scope=openid%20email%20profile` +
          `&nonce=${nonce}` +
          `&state=${state}` +
          `&prompt=consent`;

        console.log('OAuth URL 생성 완료, 브라우저 열기');

        // 브라우저가 닫힐 때를 감지 (사용자가 취소하거나 완료했을 때)
        Browser.addListener('browserFinished', () => {
          console.log('브라우저가 닫혔습니다. 로그인 상태 확인 중...');
          // appUrlOpen 이벤트가 발생하지 않았다면 사용자가 취소한 것일 수 있음
          // 하지만 로그인 성공 시에는 appUrlOpen이 먼저 발생하므로 여기서는 로그만 남김
        });

        await Browser.open({ url: authUrl });
        console.log('브라우저 열기 성공');
        // 리디렉션은 App.js의 appUrlOpen 이벤트에서 storypotion://auth로 처리됨
      } else {
        // 웹: popup 사용
        console.log('웹 환경, signInWithPopup 시도');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        const result = await signInWithPopup(auth, provider);
        await handleGoogleLoginSuccess(result.user);
        navigate('/');
      }
    } catch (e) {
      console.error('Google 로그인 실패:', e);
      setError('Google 로그인에 실패했습니다: ' + (e.message || '알 수 없는 오류'));
    }
  };

  const handleAppleLogin = async () => {
    console.log('애플 로그인 버튼 클릭됨');
    alert('애플 로그인은 현재 준비 중입니다. 곧 제공될 예정입니다.');
  };

  const handleNaverLogin = async () => {
    console.log('네이버 로그인 버튼 클릭됨');
    alert('네이버 로그인은 현재 준비 중입니다. 곧 제공될 예정입니다.');
  };

  const handleKakaoLogin = async () => {
    console.log('카카오 로그인 버튼 클릭됨');
    setError('');
    setKakaoLoading(true); // 로딩 상태 시작

    try {
      // 카카오 REST API 키 (환경 변수로 관리)
      const KAKAO_REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;

      console.log('카카오 REST API 키 확인:', KAKAO_REST_API_KEY ? '설정됨' : '설정되지 않음');

      if (!KAKAO_REST_API_KEY || KAKAO_REST_API_KEY.trim() === '') {
        setError('카카오 REST API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_KAKAO_REST_API_KEY를 추가하고 개발 서버를 재시작해주세요.');
        setKakaoLoading(false);
        return;
      }

      // 리다이렉트 URI
      const redirectUri = isMobile
        ? 'https://story-potion.web.app/auth/kakao/callback'
        : window.location.origin + '/auth/kakao/callback';

      console.log('카카오 리다이렉트 URI:', redirectUri);
      console.log('현재 origin:', window.location.origin);

      // state 생성 (CSRF 방지)
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 세션 스토리지에 저장
      try {
        sessionStorage.setItem('kakao_oauth_state', state);
      } catch (storageError) {
        console.warn('⚠️ sessionStorage 접근 불가:', storageError);
      }

      // 카카오 OAuth URL 생성
      const authUrl =
        'https://kauth.kakao.com/oauth/authorize?' +
        `client_id=${KAKAO_REST_API_KEY}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&state=${state}`;

      console.log('카카오 OAuth URL 생성 완료, 브라우저 열기');

      if (isMobile) {
        // 모바일: Capacitor Browser 사용
        Browser.addListener('browserFinished', () => {
          console.log('카카오 로그인 브라우저가 닫혔습니다.');
          // 브라우저가 닫혔지만 로그인이 완료되지 않은 경우 로딩 해제
          setTimeout(() => {
            if (kakaoLoading && !auth.currentUser) {
              setKakaoLoading(false);
            }
          }, 2000);
        });

        await Browser.open({ url: authUrl });
        console.log('브라우저 열기 성공');
        // 리디렉션은 App.js의 appUrlOpen 이벤트에서 처리됨
      } else {
        // 웹: 새 창으로 열기
        window.location.href = authUrl;
      }
    } catch (e) {
      console.error('카카오 로그인 실패:', e);
      setError('카카오 로그인에 실패했습니다: ' + (e.message || '알 수 없는 오류'));
      setKakaoLoading(false);
    }
  };

  // 비밀번호 재설정 이메일 발송
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

  // 이메일 인증 재발송
  const handleResendEmailVerification = async () => {
    if (!auth.currentUser) {
      setEmailVerificationMessage('로그인이 필요합니다.');
      return;
    }

    try {
      await sendEmailVerification(auth.currentUser);
      setEmailVerificationSent(true);
      setEmailVerificationMessage('이메일 인증 메일을 재발송했습니다. 이메일을 확인해주세요.');
    } catch (error) {
      console.error('이메일 인증 재발송 실패:', error);
      setEmailVerificationMessage('이메일 인증 메일 재발송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 아이디 찾기 (닉네임 또는 휴대전화번호로)
  const handleFindId = async (e) => {
    e.preventDefault();
    if (!findIdInput.trim()) {
      setFindIdMessage(findIdMethod === 'nickname' ? '닉네임을 입력해주세요.' : '휴대전화번호를 입력해주세요.');
      return;
    }

    setFindIdLoading(true);
    setFindIdMessage('');
    setFoundEmails([]);

    try {
      const usersRef = collection(db, 'users');
      let q;

      if (findIdMethod === 'nickname') {
        q = query(usersRef, where('displayName', '==', findIdInput.trim()));
      } else {
        // 휴대전화번호로 검색 (형식 통일: - 제거 후 검색)
        const phoneNumber = findIdInput.trim().replace(/-/g, '');
        q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setFindIdMessage(findIdMethod === 'nickname'
          ? '해당 닉네임으로 가입된 계정을 찾을 수 없습니다.'
          : '해당 휴대전화번호로 가입된 계정을 찾을 수 없습니다.');
      } else {
        // 여러 계정이 있을 수 있으므로 모든 계정의 이메일을 수집
        const emails = [];
        snapshot.forEach((doc) => {
          const userData = doc.data();
          const email = userData.email || '';
          if (email) {
            // 이메일의 일부를 마스킹하여 표시
            const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (match, p1, p2, p3) => {
              return p1 + '*'.repeat(Math.min(p2.length, 4)) + p3;
            });
            emails.push(maskedEmail);
          }
        });

        if (emails.length > 0) {
          setFoundEmails(emails);
          if (emails.length === 1) {
            setFindIdMessage('아이디를 찾았습니다.');
          } else {
            setFindIdMessage(`해당 정보로 가입된 계정이 ${emails.length}개 발견되었습니다.`);
          }
        } else {
          setFindIdMessage('이메일 정보를 찾을 수 없습니다.');
        }
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
              {emailVerificationMessage && (
                <div style={{
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textAlign: 'center',
                  backgroundColor: emailVerificationSent ? '#d4edda' : '#fff3cd',
                  color: emailVerificationSent ? '#155724' : '#856404',
                  border: `1px solid ${emailVerificationSent ? '#c3e6cb' : '#ffeaa7'}`
                }}>
                  <div style={{ marginBottom: emailVerificationSent ? '0' : '10px' }}>
                    {emailVerificationMessage}
                  </div>
                  {!emailVerificationSent && auth.currentUser && (
                    <button
                      type="button"
                      onClick={handleResendEmailVerification}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#e46262',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      인증 메일 재발송
                    </button>
                  )}
                </div>
              )}
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
              <SocialButton color="#4285F4" onClick={handleSocialLogin}><FaGoogle size={16} /></SocialButton>
              <SocialButton 
                color="#FEE500" 
                onClick={handleKakaoLogin}
                disabled={kakaoLoading}
                style={{ 
                  opacity: kakaoLoading ? 0.6 : 1,
                  cursor: kakaoLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {kakaoLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid #3c1e1e',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></span>
                    <RiKakaoTalkFill size={16} style={{ color: '#3c1e1e' }} />
                  </span>
                ) : (
                  <RiKakaoTalkFill size={16} style={{ color: '#3c1e1e' }} />
                )}
              </SocialButton>
              <SocialButton onClick={handleNaverLogin}><NaverIcon>N</NaverIcon></SocialButton>
              <SocialButton color="#000000" onClick={handleAppleLogin}><FaApple size={16} /></SocialButton>
            </SocialLoginContainer>
            {kakaoLoading && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '32px',
                  animation: 'fadeIn 0.3s ease-in-out'
                }}>
                  {/* 카카오 아이콘 */}
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FEE500 0%, #FDD835 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3c1e1e',
                    boxShadow: '0 8px 24px rgba(254, 229, 0, 0.3)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}>
                    <RiKakaoTalkFill size={70} />
                  </div>

                  {/* 로딩 텍스트 */}
                  <div style={{
                    textAlign: 'center',
                    color: '#fff'
                  }}>
                    <h2 style={{
                      margin: '0 0 12px 0',
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#fff'
                    }}>
                      카카오 로그인 처리 중
                    </h2>
                    <p style={{
                      margin: 0,
                      fontSize: '16px',
                      color: '#fff',
                      opacity: 0.8
                    }}>
                      잠시만 기다려주세요
                    </p>
                  </div>

                  {/* 로딩 인디케이터 */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#FEE500',
                          animation: `bounce 1.4s ease-in-out infinite`,
                          animationDelay: `${index * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <style>{`
                  @keyframes fadeIn {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }

                  @keyframes pulse {
                    0%, 100% {
                      transform: scale(1);
                      box-shadow: 0 8px 24px rgba(254, 229, 0, 0.3);
                    }
                    50% {
                      transform: scale(1.05);
                      box-shadow: 0 12px 32px rgba(254, 229, 0, 0.4);
                    }
                  }

                  @keyframes bounce {
                    0%, 80%, 100% {
                      transform: scale(0.8);
                      opacity: 0.5;
                    }
                    40% {
                      transform: scale(1.2);
                      opacity: 1;
                    }
                  }
                `}</style>
              </div>
            )}
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

            {/* 이메일 방법 */}
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

            {/* 아이디 찾기 방법 선택 */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              borderBottom: '1px solid #eee',
              paddingBottom: '15px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setFindIdMethod('nickname');
                  setFindIdInput('');
                  setFindIdMessage('');
                  setFoundEmails([]);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  background: findIdMethod === 'nickname' ? '#e46262' : '#f5f5f5',
                  color: findIdMethod === 'nickname' ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: findIdMethod === 'nickname' ? '600' : '400',
                  transition: 'all 0.3s'
                }}
              >
                닉네임
              </button>
              <button
                type="button"
                onClick={() => {
                  setFindIdMethod('phone');
                  setFindIdInput('');
                  setFindIdMessage('');
                  setFoundEmails([]);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  background: findIdMethod === 'phone' ? '#e46262' : '#f5f5f5',
                  color: findIdMethod === 'phone' ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: findIdMethod === 'phone' ? '600' : '400',
                  transition: 'all 0.3s'
                }}
              >
                휴대전화번호
              </button>
            </div>

            <form onSubmit={handleFindId}>
              <p style={{
                margin: '0 0 20px 0',
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                {findIdMethod === 'nickname'
                  ? <>가입하신 닉네임을 입력하시면<br />아이디(이메일)를 찾아드립니다.</>
                  : <>가입하신 휴대전화번호를 입력하시면<br />아이디(이메일)를 찾아드립니다.</>
                }
              </p>

              <Input
                type={findIdMethod === 'phone' ? 'tel' : 'text'}
                placeholder={findIdMethod === 'nickname' ? '닉네임' : '휴대전화번호 (- 없이 입력)'}
                value={findIdInput}
                onChange={(e) => {
                  let value = e.target.value;
                  // 휴대전화번호 입력 시 자동 포맷팅
                  if (findIdMethod === 'phone') {
                    value = value.replace(/[^0-9]/g, '');
                    if (value.length > 3 && value.length <= 7) {
                      value = value.slice(0, 3) + '-' + value.slice(3);
                    } else if (value.length > 7) {
                      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                    }
                  }
                  setFindIdInput(value);
                }}
                style={{
                  marginBottom: '15px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                maxLength={findIdMethod === 'phone' ? 13 : undefined}
              />

              {foundEmails.length > 0 && (
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
                  <div style={{ fontWeight: '600', marginBottom: '10px' }}>
                    {foundEmails.length === 1 ? '찾은 아이디' : `찾은 아이디 (${foundEmails.length}개)`}
                  </div>
                  {foundEmails.map((email, index) => (
                    <div key={index} style={{
                      marginBottom: index < foundEmails.length - 1 ? '8px' : '0',
                      padding: index < foundEmails.length - 1 ? '8px 0' : '0',
                      borderBottom: index < foundEmails.length - 1 ? '1px solid #c3e6cb' : 'none'
                    }}>
                      {email}
                    </div>
                  ))}
                </div>
              )}

              {findIdMessage && foundEmails.length === 0 && (
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
                    setFindIdInput('');
                    setFindIdMessage('');
                    setFoundEmails([]);
                    setFindIdMethod('nickname');
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
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;
