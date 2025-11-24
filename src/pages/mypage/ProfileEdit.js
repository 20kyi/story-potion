/**
 * ProfileEdit.js - 프로필 수정 페이지
 * 
 * 주요 기능:
 * - 프로필 이미지 업로드/변경
 * - 닉네임 변경
 * - 휴대전화 번호 변경
 * - 비밀번호 변경
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import { auth, storage } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import EyeIcon from '../../components/icons/EyeIcon';
import EyeOffIcon from '../../components/icons/EyeOffIcon';
import { useTranslation } from '../../LanguageContext';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  align-items: center;
`;

const EditProfileImgTag = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  margin: 0;
  padding: 0;
`;

const EditImageInput = styled.input`
  display: none;
`;

const EditImageLabel = styled.label`
  position: absolute;
  right: 0;
  bottom: 0;
  background: rgba(220,220,220,0.85);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1.5px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const EditLabel = styled.label`
  font-size: 15px;
  font-weight: 500;
  color: #888;
  margin-bottom: 6px;
  margin-top: 12px;
  align-self: flex-start;
`;

const EditInputWrap = styled.div`
  width: 100%;
  max-width: 400px;
  margin-bottom: 6px;
  display: flex;
  flex-direction: column;
`;

const EditInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.inputBackground || '#fff'};
  outline: none;
  transition: border-color 0.2s;
  &:focus {
    border-color: #e46262;
  }
`;

const PasswordInputWrap = styled.div`
  width: 100%;
  max-width: 400px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
`;

const PasswordInputIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EditButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 400px;
  margin-top: 20px;
  gap: 12px;
`;

const EditCancelTextButton = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: transparent;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #f5f5f5;
  }
`;

const EditSaveButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff8a8a 0%, #e46262 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    box-shadow: 0 4px 15px rgba(228, 98, 98, 0.4);
  }
`;

function ProfileEdit({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  
  // 프로필 편집 관련 상태
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newProfileImageFile, setNewProfileImageFile] = useState(null);
  const [newProfileImageUrl, setNewProfileImageUrl] = useState('');
  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  // 비밀번호 변경 관련 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwChangeLoading, setPwChangeLoading] = useState(false);
  const [pwChangeError, setPwChangeError] = useState('');
  const [pwChangeSuccess, setPwChangeSuccess] = useState('');

  // 비밀번호 보기/숨김 상태
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 모바일 키보드 높이
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 닉네임 중복 체크 관련 상태
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');

  // 인증 제공자 정보 (카카오 로그인 확인용)
  const [authProvider, setAuthProvider] = useState(null);

  // 사용자 정보가 변경될 때 편집 폼 초기화
  useEffect(() => {
    if (user) {
      // Firestore에서 사용자 정보 가져오기 (닉네임, 휴대전화번호, 인증 제공자 등)
      if (user?.uid) {
        getDoc(doc(db, "users", user.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Firestore의 displayName을 우선 사용, 없으면 Firebase Auth의 displayName 사용
            setNewDisplayName(userData.displayName || user.displayName || '');
            setNewProfileImageUrl(userData.photoURL || user.photoURL || '');
            // phoneNumber만 설정 (email이 들어가지 않도록 명확히 구분)
            const phoneNumber = userData.phoneNumber;
            setNewPhoneNumber(phoneNumber && typeof phoneNumber === 'string' ? phoneNumber : '');
            setAuthProvider(userData.authProvider || null);
          } else {
            // Firestore 문서가 없는 경우 Firebase Auth 정보만 사용
            setNewDisplayName(user.displayName || '');
            setNewProfileImageUrl(user.photoURL || '');
            setNewPhoneNumber('');
            setAuthProvider(null);
          }
          setRemoveProfileImage(false);
        });
      } else {
        // uid가 없는 경우
        setNewDisplayName(user.displayName || '');
        setNewProfileImageUrl(user.photoURL || '');
        setNewPhoneNumber('');
        setRemoveProfileImage(false);
      }
    }
  }, [user]);

  // 모바일 키보드 이벤트 리스너 설정
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

  /**
   * 프로필 이미지 파일 선택 처리
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImageFile(file);
      setNewProfileImageUrl(URL.createObjectURL(file));
      setRemoveProfileImage(false);
    }
  };

  /**
   * 프로필 이미지 삭제 처리
   */
  const handleRemoveProfileImage = () => {
    setRemoveProfileImage(true);
    setNewProfileImageFile(null);
    setNewProfileImageUrl('');
  };

  /**
   * 닉네임 중복 체크 함수
   */
  const checkNicknameDuplicate = async (nickname) => {
    if (!nickname || !nickname.trim()) {
      setIsNicknameDuplicate(false);
      setNicknameError('');
      setNicknameSuccess('');
      return;
    }

    // 현재 사용자의 닉네임과 동일하면 중복이 아님
    if (nickname.trim() === user?.displayName) {
      setIsNicknameDuplicate(false);
      setNicknameError('');
      setNicknameSuccess('현재 사용 중인 닉네임입니다.');
      return;
    }

    setIsNicknameChecking(true);
    setNicknameError('');
    setNicknameSuccess('');

    try {
      const usersRef = collection(db, 'users');
      const nicknameQuery = query(usersRef, where('displayName', '==', nickname.trim()));
      const querySnapshot = await getDocs(nicknameQuery);

      if (!querySnapshot.empty) {
        setIsNicknameDuplicate(true);
        setNicknameError('이미 사용 중인 닉네임입니다.');
        setNicknameSuccess('');
      } else {
        setIsNicknameDuplicate(false);
        setNicknameError('');
        setNicknameSuccess('사용 가능한 닉네임입니다.');
      }
    } catch (error) {
      console.error('닉네임 중복 체크 실패:', error);
      setIsNicknameDuplicate(true);
      setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
      setNicknameSuccess('');
    } finally {
      setIsNicknameChecking(false);
    }
  };

  /**
   * 프로필 정보 업데이트 처리
   */
  const handleProfileUpdate = async () => {
    if (!user) return;

    // 닉네임이 변경된 경우 중복 체크
    if (newDisplayName.trim() && newDisplayName.trim() !== user.displayName) {
      if (isNicknameDuplicate) {
        alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.');
        return;
      }

      // 최종 중복 체크
      try {
        const usersRef = collection(db, 'users');
        const nicknameQuery = query(usersRef, where('displayName', '==', newDisplayName.trim()));
        const querySnapshot = await getDocs(nicknameQuery);

        if (!querySnapshot.empty) {
          // 현재 사용자가 아닌 다른 사용자가 사용 중인 경우
          const isOtherUser = querySnapshot.docs.some(doc => doc.id !== user.uid);
          if (isOtherUser) {
            alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.');
            return;
          }
        }
      } catch (error) {
        console.error('닉네임 중복 체크 실패:', error);
        alert('닉네임 확인에 실패했습니다. 다시 시도해주세요.');
        return;
      }
    }

    try {
      let photoURL = user.photoURL;

      // 프로필 이미지 삭제가 선택된 경우
      if (removeProfileImage) {
        photoURL = process.env.PUBLIC_URL + '/default-profile.svg';
      }
      // 새 이미지가 선택된 경우 Firebase Storage에 업로드
      else if (newProfileImageFile) {
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, newProfileImageFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Firebase Auth 프로필 정보 업데이트
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName,
        photoURL: photoURL,
      });

      // Firestore users 문서에도 photoURL 및 휴대전화 번호 반영
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName,
        photoURL: photoURL,
        phoneNumber: newPhoneNumber || ''
      });

      alert('프로필이 성공적으로 업데이트되었습니다.');
      navigate('/my');
    } catch (error) {
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    setPwChangeError('');
    setPwChangeSuccess('');
    
    // 1. 비밀번호 변경 로직 (입력값이 있을 때만)
    // 구글 로그인 또는 카카오 로그인 사용자는 비밀번호 변경 불가
    const isGoogleUser = user && user.providerData && user.providerData.some(p => p.providerId === 'google.com');
    const isKakaoUser = authProvider === 'kakao';
    const canChangePassword = !isGoogleUser && !isKakaoUser;
    
    if (user && canChangePassword && (currentPassword || newPassword || confirmPassword)) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPwChangeError('모든 비밀번호 입력란을 채워주세요.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwChangeError('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      if (newPassword.length < 6) {
        setPwChangeError('비밀번호는 6자 이상이어야 합니다.');
        return;
      }
      setPwChangeLoading(true);
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        setPwChangeSuccess('비밀번호가 성공적으로 변경되었습니다!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setPwChangeError('현재 비밀번호가 올바르지 않습니다.');
        } else {
          setPwChangeError(error.message || '비밀번호 변경에 실패했습니다.');
        }
        setPwChangeLoading(false);
        return;
      }
      setPwChangeLoading(false);
    }
    
    // 2. 프로필(닉네임/사진) 저장 로직
    await handleProfileUpdate();
  };

  return (
    <>
      <Header user={user} title="프로필 수정" />
      <MainContainer className="profile-edit-container" style={{ paddingBottom: 20 + keyboardHeight }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <EditImageLabel htmlFor="profile-image-upload" style={{ position: 'static', width: 120, height: 120, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', opacity: removeProfileImage ? 0.5 : 1 }}>
              {newProfileImageUrl ? (
                <EditProfileImgTag src={newProfileImageUrl} alt="Profile" />
              ) : (
                <img
                  src={process.env.PUBLIC_URL + '/default-profile.svg'}
                  alt="Default Profile"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    margin: 0,
                    padding: 0
                  }}
                />
              )}
              <EditImageInput id="profile-image-upload" type="file" accept="image/*" onChange={handleFileChange} />
            </EditImageLabel>

            {/* 프로필 이미지 삭제 버튼 */}
            {(newProfileImageUrl || user?.photoURL) && !removeProfileImage && (
              <button
                onClick={handleRemoveProfileImage}
                style={{
                  position: 'absolute',
                  top: '0',
                  right: 'calc(50% - 60px)',
                  background: '#e46262',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                title="프로필 이미지 삭제"
              >
                ×
              </button>
            )}

            {/* 삭제 취소 버튼 */}
            {removeProfileImage && (
              <button
                onClick={() => {
                  setRemoveProfileImage(false);
                  setNewProfileImageUrl(user?.photoURL || '');
                }}
                style={{
                  position: 'absolute',
                  top: '0',
                  right: 'calc(50% - 60px)',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                title="삭제 취소"
              >
                ↺
              </button>
            )}
          </div>
          
          <EditInputWrap>
            <EditLabel htmlFor="edit-nickname">{t('nickname') || '닉네임'}</EditLabel>
            <EditInput
              id="edit-nickname"
              type="text"
              value={newDisplayName}
              onChange={(e) => {
                setNewDisplayName(e.target.value);
                // 닉네임 변경 시 이전 에러/성공 메시지 초기화
                if (isNicknameDuplicate) {
                  setIsNicknameDuplicate(false);
                  setNicknameError('');
                  setNicknameSuccess('');
                }
              }}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              autoComplete="off"
              onBlur={(e) => {
                const nickname = e.target.value.trim();
                if (nickname && nickname !== user?.displayName) {
                  checkNicknameDuplicate(nickname);
                } else if (nickname === user?.displayName) {
                  setIsNicknameDuplicate(false);
                  setNicknameError('');
                  setNicknameSuccess('');
                }
              }}
              onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
              style={{
                borderColor: isNicknameDuplicate ? '#d9534f' : nicknameSuccess ? '#5cb85c' : undefined
              }}
            />
            {nicknameError && <div style={{ color: '#d9534f', fontSize: 12, marginTop: 4 }}>{nicknameError}</div>}
            {nicknameSuccess && !nicknameError && <div style={{ color: '#5cb85c', fontSize: 12, marginTop: 4 }}>{nicknameSuccess}</div>}
            {isNicknameChecking && <div style={{ color: '#ffa500', fontSize: 12, marginTop: 4 }}>확인 중...</div>}
          </EditInputWrap>
          
          <EditInputWrap>
            <EditLabel htmlFor="edit-phone">휴대전화 번호</EditLabel>
            <EditInput
              id="edit-phone"
              type="tel"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              placeholder="휴대전화 번호 (예: 01012345678)"
              autoComplete="off"
              onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
            />
          </EditInputWrap>
          
          {/* 비밀번호 변경 입력창: 구글/카카오 로그인 사용자는 숨김 */}
          {user && user.providerData && !user.providerData.some(p => p.providerId === 'google.com') && authProvider !== 'kakao' && (
            <>
              <PasswordInputWrap>
                <EditLabel htmlFor="current-password">현재 비밀번호</EditLabel>
                <div style={{ position: 'relative' }}>
                  <EditInput
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호 입력"
                    autoComplete="current-password"
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
                  />
                  <PasswordInputIcon onClick={() => setShowCurrentPassword(v => !v)}>
                    {showCurrentPassword ? <EyeOffIcon width={22} height={22} color="#888" /> : <EyeIcon width={22} height={22} color="#888" />}
                  </PasswordInputIcon>
                </div>
              </PasswordInputWrap>
              
              <PasswordInputWrap>
                <EditLabel htmlFor="new-password" style={{ marginTop: 12 }}>새 비밀번호</EditLabel>
                <div style={{ position: 'relative' }}>
                  <EditInput
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    autoComplete="new-password"
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
                  />
                  <PasswordInputIcon onClick={() => setShowNewPassword(v => !v)}>
                    {showNewPassword ? <EyeOffIcon width={22} height={22} color="#888" /> : <EyeIcon width={22} height={22} color="#888" />}
                  </PasswordInputIcon>
                </div>
              </PasswordInputWrap>
              
              <PasswordInputWrap>
                <EditLabel htmlFor="confirm-password" style={{ marginTop: 12 }}>새 비밀번호 확인</EditLabel>
                <div style={{ position: 'relative' }}>
                  <EditInput
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호 확인"
                    autoComplete="new-password"
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
                  />
                  <PasswordInputIcon onClick={() => setShowConfirmPassword(v => !v)}>
                    {showConfirmPassword ? <EyeOffIcon width={22} height={22} color="#888" /> : <EyeIcon width={22} height={22} color="#888" />}
                  </PasswordInputIcon>
                </div>
                {pwChangeError && <div style={{ color: '#e46262', fontSize: 13, marginTop: 8 }}>{pwChangeError}</div>}
                {pwChangeSuccess && <div style={{ color: '#27ae60', fontSize: 13, marginTop: 8 }}>{pwChangeSuccess}</div>}
              </PasswordInputWrap>
            </>
          )}
          
          <EditButtonRow>
            <EditCancelTextButton onClick={() => navigate('/my')}>{t('cancel') || '취소'}</EditCancelTextButton>
            <EditSaveButton
              onClick={handleSave}
              disabled={pwChangeLoading || isNicknameDuplicate || isNicknameChecking}
            >
              {t('save') || '저장'}
            </EditSaveButton>
          </EditButtonRow>

          {/* 구글/카카오 로그인 사용자에게 비밀번호 변경 안내 메시지 */}
          {user && (
            (user.providerData && user.providerData.some(p => p.providerId === 'google.com')) || authProvider === 'kakao'
          ) && (
            <div style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '14px',
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              wordBreak: 'keep-all',
              lineHeight: '1.5'
            }}>
              {user.providerData && user.providerData.some(p => p.providerId === 'google.com')
                ? (t('google_password_notice') || '구글 계정으로 로그인하신 경우, 비밀번호는 구글 계정 설정에서 변경하실 수 있습니다.')
                : (t('kakao_password_notice') || '카카오 계정으로 로그인하신 경우, 비밀번호는 카카오 계정 설정에서 변경하실 수 있습니다.')
              }
            </div>
          )}
      </MainContainer>
    </>
  );
}

export default ProfileEdit;

