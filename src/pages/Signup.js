import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { setDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  generateRandomNickname
} from '../utils/signupUtils';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import pushNotificationManager from '../utils/pushNotification';

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

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
`;

const OptionalLabel = styled.span`
  font-size: 6px;
  color: #999;
  font-weight: 400;
  margin-left: 12px;
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
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isEmailDuplicate, setIsEmailDuplicate] = useState(false);
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mainRef = useRef();
  const inputRef = useRef();
  const emailCheckTimeoutRef = useRef(null);
  const nicknameCheckTimeoutRef = useRef(null);

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
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 이메일 필드가 아닐 때만 에러 메시지 초기화
    if (name !== 'email' && name !== 'nickname') {
      setError('');
      setSuccessMessage('');
    }

    // 닉네임 변경 시 중복 체크
    if (name === 'nickname' && currentStep === 1) {
      // 닉네임 변경 시 이전 중복 상태 초기화
      if (isNicknameDuplicate) {
        setIsNicknameDuplicate(false);
        setError('');
      }
      setSuccessMessage('');

      // 기존 타임아웃 취소
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }

      // 닉네임이 입력된 경우에만 체크
      if (value.trim()) {
        // debounce: 500ms 후에 체크
        nicknameCheckTimeoutRef.current = setTimeout(() => {
          checkNicknameDuplicate(value.trim());
        }, 500);
      } else if (!value.trim()) {
        // 닉네임이 비어있으면 에러 초기화
        setError('');
        setIsNicknameDuplicate(false);
      }
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

  // 닉네임 중복 체크 함수
  const checkNicknameDuplicate = async (nickname) => {
    if (!nickname) return;

    setIsNicknameChecking(true);
    setError('');
    setSuccessMessage('');

    try {
      // Firestore에서 닉네임 중복 체크
      const usersRef = collection(db, 'users');
      const nicknameQuery = query(usersRef, where('displayName', '==', nickname.trim()));
      const querySnapshot = await getDocs(nicknameQuery);

      if (!querySnapshot.empty) {
        setIsNicknameDuplicate(true);
        setError('이미 사용 중인 닉네임입니다.');
        setSuccessMessage('');
      } else {
        setIsNicknameDuplicate(false);
        setError('');
        setSuccessMessage('사용 가능한 닉네임입니다.');
      }
    } catch (error) {
      console.error('닉네임 중복 체크 실패:', error);
      // 에러가 발생하면 안전하게 중복으로 간주
      setIsNicknameDuplicate(true);
      setError('닉네임 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSuccessMessage('');
    } finally {
      setIsNicknameChecking(false);
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

      // 2. Firestore에서도 이메일 중복 체크
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(emailQuery);

      // Auth에 있지만 Firestore에 없는 경우 (탈퇴한 회원)
      if (signInMethods && signInMethods.length > 0 && querySnapshot.empty) {
        // 탈퇴한 회원의 Auth 계정이 남아있는 경우
        // 사용 가능하다고 표시 (회원가입 시 처리)
        setIsEmailDuplicate(false);
        setError('');
        setSuccessMessage('사용 가능한 이메일입니다. (이전 계정 정보가 정리됩니다)');
      } else if (signInMethods && signInMethods.length > 0) {
        // Auth와 Firestore 모두에 있는 경우
        setIsEmailDuplicate(true);
        setError('이미 사용 중인 이메일입니다.');
        setSuccessMessage('');
      } else if (!querySnapshot.empty) {
        // Firestore에만 있는 경우
        setIsEmailDuplicate(true);
        setError('이미 사용 중인 이메일입니다.');
        setSuccessMessage('');
      } else {
        // 둘 다 없는 경우
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

    // 중복 클릭 방지
    if (isSubmitting || isEmailChecking || isNicknameChecking) {
      return;
    }

    setError('');
    setSuccessMessage('');

    // 이메일 필수 입력 검증
    if (!formData.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 이미 검증 중이면 대기
    if (isEmailChecking || isNicknameChecking) {
      return;
    }

    // 이미 중복으로 확인된 경우
    if (isEmailDuplicate) {
      setError('이미 사용 중인 이메일입니다.');
      return;
    }

    // 닉네임이 입력된 경우 중복 여부 확인
    if (formData.nickname.trim() && isNicknameDuplicate) {
      setError('이미 사용 중인 닉네임입니다.');
      return;
    }

    // 닉네임이 없으면 자동 생성
    if (!formData.nickname.trim()) {
      setFormData(prev => ({ ...prev, nickname: generateRandomNickname() }));
    }

    // 모든 검증이 완료되었으므로 바로 다음 단계로 이동
    setIsSubmitting(false);
    setCurrentStep(2);
  };

  // 2단계: 비밀번호 검증
  const handleStep2Next = (e) => {
    e.preventDefault();

    // 중복 클릭 방지
    if (isSubmitting) {
      return;
    }

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

    // 검증 통과 시 바로 다음 단계로 이동
    setCurrentStep(3);
  };

  // 3단계: 휴대폰 번호 입력 및 회원가입 진행
  const handleStep3Next = (e) => {
    e.preventDefault();

    // 중복 클릭 방지
    if (isSubmitting) {
      return;
    }

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

  // 권한 요청 함수
  const requestPermissions = async (user) => {
    try {
      // 1. 알림 권한 요청
      if (Capacitor.getPlatform() !== 'web') {
        // 모바일 앱 환경
        try {
          const permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            // FCM 토큰 저장을 위한 리스너 등록
            if (!window.__pushRegListenerAdded) {
              window.__pushRegListenerAdded = true;
              await PushNotifications.addListener('registration', async (token) => {
                console.log('FCM 토큰:', token.value);
                // auth.currentUser를 사용하여 항상 최신 사용자 정보 가져오기
                const currentUser = auth.currentUser;
                if (currentUser && token.value) {
                  try {
                    await setDoc(doc(db, "users", currentUser.uid), { fcmToken: token.value }, { merge: true });
                    console.log('FCM 토큰 Firestore 저장 완료:', token.value);
                  } catch (error) {
                    console.error('FCM 토큰 Firestore 저장 실패:', error);
                  }
                } else {
                  console.warn('FCM 토큰이 발급되었지만 사용자가 로그인하지 않았습니다.');
                }
              });
            }
            await pushNotificationManager.subscribeToPush();
          }
        } catch (error) {
          console.error('알림 권한 요청 실패:', error);
        }
      } else {
        // 웹 환경
        try {
          await pushNotificationManager.requestPermission();
        } catch (error) {
          console.error('알림 권한 요청 실패:', error);
        }
      }

      // 2. 사진 접근 권한 요청 (모바일 앱 환경)
      // 웹에서는 input type="file"을 사용하므로 별도 권한 요청 불필요
      // 모바일 앱에서는 프로필 이미지 업로드 시 자동으로 권한 요청됨
      // Android의 경우 AndroidManifest.xml에 권한이 선언되어 있어야 함

    } catch (error) {
      console.error('권한 요청 중 오류 발생:', error);
    }
  };

  // 최종 회원가입 처리
  const handleFinalSignup = async () => {
    setError('');
    setIsSubmitting(true);

    // 최종 이메일 중복 체크 (Firestore에서만 - 구글/카카오 계정과 별도로 허용)
    try {
      // Firestore에서 이메일 중복 체크 (authProvider가 'password'인 경우에만 중복으로 처리)
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', formData.email.trim().toLowerCase()));
      const querySnapshot = await getDocs(emailQuery);

      if (!querySnapshot.empty) {
        // 같은 이메일이 있는 경우, authProvider 확인
        const existingUser = querySnapshot.docs[0].data();
        if (existingUser.authProvider === 'password') {
          // 이미 이메일/비밀번호로 가입된 경우만 중복으로 처리
          setError('이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.');
          setIsEmailDuplicate(true);
          setCurrentStep(1); // 1단계로 돌아가기
          setIsSubmitting(false);
          return;
        }
        // 구글/카카오 계정이 있는 경우는 허용 - 별도 계정으로 생성
        console.log('구글/카카오 계정이 있지만 이메일 회원가입 허용 (별도 계정)');
      }
    } catch (error) {
      console.error('최종 이메일 중복 체크 실패:', error);
      // 체크 실패 시에도 진행하지 않음 (안전하게)
      setError('이메일 확인에 실패했습니다. 다시 시도해주세요.');
      setIsEmailDuplicate(true);
      setIsSubmitting(false);
      return;
    }

    try {
      let userCredential;

      try {
        // 회원가입 시도
        userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );
      } catch (createError) {
        if (createError.code === 'auth/email-already-in-use') {
          // Firebase Auth에 이미 같은 이메일이 있는 경우 (구글 계정 등)
          // 구글 계정과 별도 계정으로 생성하려면 커스텀 토큰 필요
          // 하지만 이메일/비밀번호 로그인을 위해 Firebase Auth를 사용해야 함
          // 따라서 에러 메시지를 변경하여 안내
          setError('이 이메일은 다른 로그인 방식(구글, 카카오 등)으로 이미 사용 중입니다. 해당 방식으로 로그인해주세요.');
          setIsEmailDuplicate(true);
          setCurrentStep(1);
          setIsSubmitting(false);
          return;
        } else {
          throw createError;
        }
      }

      const user = userCredential.user;
      const providerId = user.providerData[0]?.providerId || "password";

      // 닉네임 최종 중복 체크 (회원가입 직전)
      const finalNickname = formData.nickname || generateRandomNickname();
      if (formData.nickname.trim()) {
        const usersRef = collection(db, 'users');
        const nicknameQuery = query(usersRef, where('displayName', '==', finalNickname.trim()));
        const querySnapshot = await getDocs(nicknameQuery);

        if (!querySnapshot.empty) {
          setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.');
          setCurrentStep(1);
          setIsSubmitting(false);
          return;
        }
      }

      // Firebase Auth의 displayName 설정
      await updateProfile(user, {
        displayName: finalNickname,
        photoURL: process.env.PUBLIC_URL + '/default-profile.svg'
      });

      // 약관 동의 정보 가져오기
      const termsAgreement = JSON.parse(sessionStorage.getItem('termsAgreement') || '{}');

      // 휴대전화번호에서 하이픈 제거하여 저장 (일관성 유지)
      const cleanPhoneNumber = formData.phoneNumber ? formData.phoneNumber.replace(/-/g, '') : '';

      await setDoc(doc(db, "users", user.uid), {
        authProvider: providerId,
        createdAt: new Date(),
        displayName: finalNickname,
        email: formData.email.trim().toLowerCase(), // 소문자로 정규화하여 저장
        phoneNumber: cleanPhoneNumber,
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

      // 회원가입 완료 후 권한 요청
      await requestPermissions(user);

      alert('회원가입이 완료되었습니다!');
      setIsSubmitting(false);
      navigate('/login');
    } catch (error) {
      console.error('회원가입 실패:', error);
      setIsSubmitting(false);
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
      <Form onSubmit={handleStep1Next} autoComplete="off">
        <Input
          type="email"
          name="email"
          placeholder="이메일"
          value={formData.email}
          onChange={handleChange}
          autoComplete="off"
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
        <InputWrapper>
          <OptionalLabel>[선택]</OptionalLabel>
          <Input
            type="text"
            name="nickname"
            placeholder="닉네임"
            value={formData.nickname}
            onChange={handleChange}
            autoComplete="off"
            maxLength={20}
            $hasError={isNicknameDuplicate}
            $isChecking={isNicknameChecking}
            onBlur={(e) => {
              const nickname = e.target.value.trim();
              if (nickname) {
                checkNicknameDuplicate(nickname);
              }
            }}
            onFocus={e => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
          />
        </InputWrapper>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {successMessage && !error && !isEmailDuplicate && !isNicknameDuplicate && <SuccessMessage>{successMessage}</SuccessMessage>}
        <ButtonContainer>
          <div></div>
          <Button type="submit" disabled={isEmailDuplicate || isEmailChecking || isNicknameDuplicate || isNicknameChecking || isSubmitting}>
            {(isEmailChecking || isNicknameChecking || isSubmitting) ? '확인 중...' : '다음으로'}
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
      <Form onSubmit={handleStep2Next} autoComplete="off">
        <PasswordContainer>
          <PasswordInput
            type={passwordShown ? "text" : "password"}
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
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
            autoComplete="new-password"
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
          <BackButton type="button" onClick={() => setCurrentStep(1)} disabled={isSubmitting}>
            <FaArrowLeft /> 이전으로
          </BackButton>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '다음으로'} <FaArrowRight />
          </Button>
        </ButtonContainer>
      </Form>
    </>
  );

  const renderStep3 = () => (
    <>
      <Title>휴대폰 번호 입력</Title>
      <Subtitle>휴대폰 번호를 입력해주세요</Subtitle>
      {renderStepIndicator()}
      <Form onSubmit={handleStep3Next} autoComplete="off">
        <InputWrapper>
          <OptionalLabel>[선택]</OptionalLabel>
          <Input
            type="tel"
            name="phoneNumber"
            placeholder="휴대전화 (- 없이 입력)"
            value={formData.phoneNumber}
            onChange={(e) => {
              // 휴대전화번호 입력 시 자동 포맷팅
              let value = e.target.value;
              // 숫자만 추출
              value = value.replace(/[^0-9]/g, '');
              // 자동 하이픈 추가
              if (value.length > 3 && value.length <= 7) {
                value = value.slice(0, 3) + '-' + value.slice(3);
              } else if (value.length > 7) {
                value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
              }
              setFormData(prev => ({ ...prev, phoneNumber: value }));
              setError('');
              setSuccessMessage('');
            }}
            autoComplete="off"
            maxLength={13}
            onFocus={e => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
          />
        </InputWrapper>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

        <ButtonContainer>
          <BackButton type="button" onClick={() => setCurrentStep(2)} disabled={isSubmitting}>
            <FaArrowLeft /> 이전으로
          </BackButton>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '가입 완료'}
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
