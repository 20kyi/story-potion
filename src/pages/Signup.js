import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { setDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
  // initializeRecaptchaForSignup, // SMS 인증 기능 숨김 (나중에 사용 가능)
  // sendSMSCodeForSignup, // SMS 인증 기능 숨김 (나중에 사용 가능)
  // verifySMSCodeForSignup, // SMS 인증 기능 숨김 (나중에 사용 가능)
  generateRandomNickname
} from '../utils/signupUtils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 200px 20px;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding-top: 0;
  width: 100%;
  overflow-y: auto;
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
  font-size: 24px;
  color: #e46262;
  margin-bottom: 10px;
  font-weight: 700;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
  line-height: 1.5;
`;

const StepIndicator = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  align-items: center;
  justify-content: center;
`;

const StepLine = styled.div`
  width: 40px;
  height: 2px;
  background-color: ${props => props.active ? '#e46262' : '#ddd'};
  transition: background-color 0.3s;
`;

const StepNumber = styled.div`
  font-size: 14px;
  color: ${props => props.active ? '#e46262' : '#999'};
  font-weight: ${props => props.active ? '600' : '400'};
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
  border: 1px solid ${props => {
    if (props.$hasError) return '#d9534f';
    if (props.$isChecking) return '#ffa500';
    return '#f1f1f1';
  }};
  font-size: 16px;
  color: #222;
  background-color: #fff;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;
  &:focus {
    border-color: ${props => props.$hasError ? '#d9534f' : '#e46262'};
    background-color: #fff;
  }
`;

const PhoneInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
`;

const PhoneInput = styled(Input)`
  flex: 1;
  min-width: 0;
`;

const VerificationInput = styled(Input)`
  width: 100%;
  max-width: 200px;
  text-align: left;
  letter-spacing: 6px;
  font-size: 18px;
  font-weight: 600;
  padding: 14px 20px;
  
  &::placeholder {
    font-size: 16px;
    letter-spacing: 0;
    color: #999;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  width: 100%;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #ff8a8a 0%, #e46262 100%);
  color: #fff;
  padding: 15px 30px;
  border-radius: 15px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  &:hover:not(:disabled) {
    box-shadow: 0 4px 15px rgba(228, 98, 98, 0.4);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: #f5f5f5;
  color: #666;
  margin-top: 10px;
  &:hover:not(:disabled) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background: #e8e8e8;
  }
`;

const SendCodeButton = styled.button`
  background: ${props => props.disabled ? '#f5f5f5' : 'linear-gradient(135deg, #ff8a8a 0%, #e46262 100%)'};
  color: ${props => props.disabled ? '#999' : '#fff'};
  padding: 0;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  border: none;
  font-size: 11px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  white-space: normal;
  transition: all 0.3s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
  &:hover:not(:disabled) {
    box-shadow: 0 4px 15px rgba(228, 98, 98, 0.4);
  }
`;

const ErrorMessage = styled.p`
  color: #d9534f;
  font-size: 14px;
  text-align: center;
`;

const SuccessMessage = styled.p`
  color: #5cb85c;
  font-size: 14px;
  text-align: center;
`;

const InfoText = styled.p`
  color: #999;
  font-size: 12px;
  text-align: center;
  margin-top: 10px;
  line-height: 1.5;
`;

const LoginLink = styled.div`
  margin-top: 25px;
  font-size: 14px;
  color: #555;
  text-align: center;
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

const BackButton = styled.button`
  background: #f5f5f5;
  border: none;
  color: #666;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 30px;
  border-radius: 15px;
  transition: all 0.3s;
  &:hover {
    background: #e8e8e8;
    color: #333;
  }
`;

const SkipLink = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  margin-top: 10px;
  text-decoration: underline;
  &:hover {
    color: #e46262;
  }
`;

function Signup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordShown, setPasswordShown] = useState(false);
  const [confirmPasswordShown, setConfirmPasswordShown] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phoneNumber: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // SMS 인증 관련 상태 (나중에 사용 가능하도록 주석 처리)
  // const [smsSent, setSmsSent] = useState(false);
  // const [smsLoading, setSmsLoading] = useState(false);
  // const [verificationLoading, setVerificationLoading] = useState(false);
  // const [confirmationResult, setConfirmationResult] = useState(null);
  // const [isVerified, setIsVerified] = useState(false);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isEmailDuplicate, setIsEmailDuplicate] = useState(false);
  const mainRef = useRef();
  const inputRef = useRef();
  const emailCheckTimeoutRef = useRef(null);

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
      navigate('/terms-agreement');
    }
  }, [navigate]);

  useEffect(() => {
    // cleanup: email check timeout
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 이메일 필드가 아닐 때만 에러 메시지 초기화
    if (name !== 'email') {
      setError('');
      setSuccessMessage('');
    }

    // 이메일 변경 시 중복 체크
    if (name === 'email' && currentStep === 1) {
      // 이메일 변경 시 이전 중복 상태 초기화
      if (isEmailDuplicate) {
        setIsEmailDuplicate(false);
        setError('');
      }
      setSuccessMessage('');

      // 기존 타임아웃 취소
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }

      // 유효한 이메일 형식인지 확인
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.trim() && emailRegex.test(value.trim())) {
        // debounce: 500ms 후에 체크
        emailCheckTimeoutRef.current = setTimeout(() => {
          checkEmailDuplicate(value.trim());
        }, 500);
      } else if (!value.trim()) {
        // 이메일이 비어있으면 에러 초기화
        setError('');
        setIsEmailDuplicate(false);
      }
    }
  };

  // 이메일 중복 체크 함수
  const checkEmailDuplicate = async (email) => {
    if (!email) return;

    setIsEmailChecking(true);
    setError('');
    setSuccessMessage('');

    try {
      // 1. Firebase Auth에서 이메일 중복 체크
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods && signInMethods.length > 0) {
        setIsEmailDuplicate(true);
        setError('이미 사용 중인 이메일입니다.');
        setSuccessMessage('');
        setIsEmailChecking(false);
        return;
      }

      // 2. Firestore에서도 이메일 중복 체크
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(emailQuery);

      if (!querySnapshot.empty) {
        setIsEmailDuplicate(true);
        setError('이미 사용 중인 이메일입니다.');
        setSuccessMessage('');
      } else {
        setIsEmailDuplicate(false);
        setError('');
        setSuccessMessage('사용 가능한 이메일입니다.');
      }
    } catch (error) {
      console.error('이메일 중복 체크 실패:', error);
      // 에러가 발생하면 안전하게 중복으로 간주
      setIsEmailDuplicate(true);
      setError('이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSuccessMessage('');
    } finally {
      setIsEmailChecking(false);
    }
  };

  // 1단계: 이메일 & 닉네임 검증
  const handleStep1Next = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 중복 체크 (한 번 더 확인)
    if (isEmailDuplicate) {
      setError('이미 사용 중인 이메일입니다.');
      return;
    }

    setIsEmailChecking(true);
    try {
      // 1. Firebase Auth에서 이메일 중복 체크
      const signInMethods = await fetchSignInMethodsForEmail(auth, formData.email.trim());

      if (signInMethods && signInMethods.length > 0) {
        setError('이미 사용 중인 이메일입니다.');
        setIsEmailDuplicate(true);
        setIsEmailChecking(false);
        return; // 중복이면 절대 진행하지 않음
      }

      // 2. Firestore에서도 이메일 중복 체크
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', formData.email.trim().toLowerCase()));
      const querySnapshot = await getDocs(emailQuery);

      if (!querySnapshot.empty) {
        setError('이미 사용 중인 이메일입니다.');
        setIsEmailDuplicate(true);
        setIsEmailChecking(false);
        return; // 중복이면 절대 진행하지 않음
      }

      // 중복이 아닌 경우 상태 업데이트
      setIsEmailDuplicate(false);
    } catch (error) {
      console.error('이메일 중복 체크 실패:', error);
      // 체크 실패 시 진행하지 않음 (안전하게)
      setError('이메일 확인에 실패했습니다. 다시 시도해주세요.');
      setIsEmailDuplicate(true); // 안전을 위해 중복으로 간주
      setIsEmailChecking(false);
      return;
    } finally {
      setIsEmailChecking(false);
    }

    // 닉네임이 없으면 자동 생성
    if (!formData.nickname.trim()) {
      setFormData(prev => ({ ...prev, nickname: generateRandomNickname() }));
    }

    setCurrentStep(2);
  };

  // 2단계: 비밀번호 검증
  const handleStep2Next = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setCurrentStep(3);
  };

  // 3단계: 휴대폰 번호 입력 및 회원가입 진행
  const handleStep3Next = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 휴대폰 번호는 선택사항이므로 비어있어도 진행 가능
    // 하지만 입력된 경우 형식 검증
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^010\d{8}$|^010-\d{4}-\d{4}$/;
      const cleanPhone = formData.phoneNumber.replace(/-/g, '');

      if (!phoneRegex.test(cleanPhone) && !/^\+82/.test(formData.phoneNumber)) {
        setError('올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)');
        return;
      }
    }

    // 휴대폰 번호 입력 후 바로 회원가입 진행
    handleFinalSignup();
  };

  // SMS 코드 발송 (나중에 사용 가능하도록 주석 처리)
  // const handleSendSMSCode = async (e) => {
  //   e.preventDefault();

  //   if (!formData.phoneNumber.trim()) {
  //     setError('휴대폰 번호를 입력해주세요.');
  //     return;
  //   }

  //   // 휴대폰 번호 형식 검증 (한국 번호)
  //   const phoneRegex = /^010\d{8}$|^010-\d{4}-\d{4}$/;
  //   const cleanPhone = formData.phoneNumber.replace(/-/g, '');

  //   if (!phoneRegex.test(cleanPhone) && !/^\+82/.test(formData.phoneNumber)) {
  //     setError('올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)');
  //     return;
  //   }

  //   setSmsLoading(true);
  //   setError('');
  //   setSuccessMessage('');

  //   try {
  //     // reCAPTCHA 초기화
  //     let container = document.getElementById('recaptcha-container-signup');
  //     if (!container) {
  //       container = document.createElement('div');
  //       container.id = 'recaptcha-container-signup';
  //       container.style.display = 'none';
  //       document.body.appendChild(container);
  //     }
  //     initializeRecaptchaForSignup('recaptcha-container-signup');

  //     const result = await sendSMSCodeForSignup(formData.phoneNumber);

  //     if (result.success) {
  //       setConfirmationResult(result.confirmationResult);
  //       setSmsSent(true);
  //       setSuccessMessage('인증 코드가 발송되었습니다.');
  //     } else {
  //       setError(result.message || 'SMS 발송에 실패했습니다.');
  //     }
  //   } catch (error) {
  //     console.error('SMS 발송 실패:', error);
  //     setError('SMS 발송에 실패했습니다. 다시 시도해주세요.');
  //   } finally {
  //     setSmsLoading(false);
  //   }
  // };

  // SMS 인증 코드 확인 (나중에 사용 가능하도록 주석 처리)
  // const handleVerifyCode = async (e) => {
  //   e.preventDefault();

  //   if (!formData.verificationCode.trim()) {
  //     setError('인증 코드를 입력해주세요.');
  //     return;
  //   }

  //   if (formData.verificationCode.length !== 6) {
  //     setError('인증 코드는 6자리입니다.');
  //     return;
  //   }

  //   if (!confirmationResult) {
  //     setError('먼저 인증 코드를 발송해주세요.');
  //     return;
  //   }

  //   setVerificationLoading(true);
  //   setError('');
  //   setSuccessMessage('');

  //   try {
  //     const result = await verifySMSCodeForSignup(confirmationResult, formData.verificationCode);

  //     if (result.success) {
  //       setIsVerified(true);
  //       setSuccessMessage('인증이 완료되었습니다.');

  //       // SMS 인증으로 생성된 임시 계정이 있으면 로그아웃
  //       if (auth.currentUser && auth.currentUser.phoneNumber) {
  //         await auth.signOut();
  //       }

  //       // 인증 성공 후 자동으로 회원가입 진행
  //       setTimeout(() => {
  //         handleFinalSignup();
  //       }, 500);
  //     } else {
  //       setError(result.message || '인증에 실패했습니다.');
  //     }
  //   } catch (error) {
  //     console.error('인증 실패:', error);
  //     setError('인증에 실패했습니다. 다시 시도해주세요.');
  //   } finally {
  //     setVerificationLoading(false);
  //   }
  // };

  // 최종 회원가입 처리
  const handleFinalSignup = async () => {
    setError('');

    // 최종 이메일 중복 체크 (중요!)
    try {
      // 1. Firebase Auth에서 이메일 중복 체크
      const signInMethods = await fetchSignInMethodsForEmail(auth, formData.email.trim());

      if (signInMethods && signInMethods.length > 0) {
        setError('이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.');
        setIsEmailDuplicate(true);
        setCurrentStep(1); // 1단계로 돌아가기
        return;
      }

      // 2. Firestore에서도 이메일 중복 체크
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', formData.email.trim().toLowerCase()));
      const querySnapshot = await getDocs(emailQuery);

      if (!querySnapshot.empty) {
        setError('이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.');
        setIsEmailDuplicate(true);
        setCurrentStep(1); // 1단계로 돌아가기
        return;
      }
    } catch (error) {
      console.error('최종 이메일 중복 체크 실패:', error);
      // 체크 실패 시에도 진행하지 않음 (안전하게)
      setError('이메일 확인에 실패했습니다. 다시 시도해주세요.');
      setIsEmailDuplicate(true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      const user = userCredential.user;
      const providerId = user.providerData[0]?.providerId || "password";

      // Firebase Auth의 displayName 설정
      await updateProfile(user, {
        displayName: formData.nickname || generateRandomNickname(),
        photoURL: process.env.PUBLIC_URL + '/default-profile.svg'
      });

      // 약관 동의 정보 가져오기
      const termsAgreement = JSON.parse(sessionStorage.getItem('termsAgreement') || '{}');

      await setDoc(doc(db, "users", user.uid), {
        authProvider: providerId,
        createdAt: new Date(),
        displayName: formData.nickname || generateRandomNickname(),
        email: formData.email.trim().toLowerCase(), // 소문자로 정규화하여 저장
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
      console.error('회원가입 실패:', error);
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

  const renderStepIndicator = () => {
    return (
      <StepIndicator>
        <StepNumber active={currentStep >= 1}>1</StepNumber>
        <StepLine active={currentStep >= 2} />
        <StepNumber active={currentStep >= 2}>2</StepNumber>
        <StepLine active={currentStep >= 3} />
        <StepNumber active={currentStep >= 3}>3</StepNumber>
      </StepIndicator>
    );
  };

  const renderStep1 = () => (
    <>
      <Title>계정 만들기</Title>
      <Subtitle>이메일과 닉네임을 입력해주세요</Subtitle>
      {renderStepIndicator()}
      <Form onSubmit={handleStep1Next}>
        <Input
          type="email"
          name="email"
          placeholder="이메일"
          value={formData.email}
          onChange={handleChange}
          onBlur={(e) => {
            const email = e.target.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && emailRegex.test(email)) {
              checkEmailDuplicate(email);
            }
          }}
          required
          $hasError={isEmailDuplicate}
          $isChecking={isEmailChecking}
          onFocus={e => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
        />
        <Input
          type="text"
          name="nickname"
          placeholder="닉네임 (선택사항)"
          value={formData.nickname}
          onChange={handleChange}
          maxLength={20}
          onFocus={e => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {successMessage && !error && !isEmailDuplicate && <SuccessMessage>{successMessage}</SuccessMessage>}
        <ButtonContainer>
          <div></div>
          <Button type="submit" disabled={isEmailDuplicate || isEmailChecking}>
            {isEmailChecking ? '확인 중...' : '다음으로'}
            <FaArrowRight />
          </Button>
        </ButtonContainer>
      </Form>
    </>
  );

  const renderStep2 = () => (
    <>
      <Title>비밀번호 설정</Title>
      <Subtitle>비밀번호를 입력해주세요</Subtitle>
      {renderStepIndicator()}
      <Form onSubmit={handleStep2Next}>
        <PasswordContainer>
          <PasswordInput
            type={passwordShown ? "text" : "password"}
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
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
            required
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
        <ButtonContainer>
          <BackButton type="button" onClick={() => setCurrentStep(1)}>
            <FaArrowLeft /> 이전으로
          </BackButton>
          <Button type="submit">다음으로 <FaArrowRight /></Button>
        </ButtonContainer>
      </Form>
    </>
  );

  const renderStep3 = () => (
    <>
      <Title>휴대폰 번호 입력</Title>
      <Subtitle>휴대폰 번호를 입력해주세요 (선택사항)</Subtitle>
      {renderStepIndicator()}
      <Form onSubmit={handleStep3Next}>
        <Input
          type="tel"
          name="phoneNumber"
          placeholder="휴대전화 (예: 01012345678, 선택사항)"
          value={formData.phoneNumber}
          onChange={(e) => {
            // 숫자와 하이픈만 허용
            const value = e.target.value.replace(/[^0-9-]/g, '');
            setFormData(prev => ({ ...prev, phoneNumber: value }));
            setError('');
            setSuccessMessage('');
          }}
          onFocus={e => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

        <ButtonContainer>
          <BackButton type="button" onClick={() => setCurrentStep(2)}>
            <FaArrowLeft /> 이전으로
          </BackButton>
          <Button type="submit">
            가입 완료
            <FaArrowRight />
          </Button>
        </ButtonContainer>
      </Form>
    </>
  );

  return (
    <div ref={mainRef}>
      <Container>
        <ContentWrapper>
          <LogoSection>
            <Logo src="/app_logo/logo3.png" alt="Story Potion Logo" />
          </LogoSection>
          <FormSection>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
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
