/**
 * MyPage.js - 마이페이지 메인 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 프로필 정보 표시 및 편집
 * - 프로필 이미지 업로드/변경
 * - 닉네임 변경
 * - 비밀번호 변경
 * - 마이페이지 메뉴 네비게이션
 * - 로그아웃 기능
 * - 다크모드/라이트모드 지원
 * 
 * 사용된 라이브러리:
 * - styled-components: 스타일링
 * - firebase: 인증, 스토리지, Firestore
 * - react-router-dom: 페이지 네비게이션
 * - @capacitor/keyboard: 키보드 이벤트 처리
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { auth, storage } from '../../firebase';
import { signOut } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import EditIcon from '../../components/icons/EditIcon';
import RecentActivityIcon from '../../components/icons/RecentActivityIcon';
import NotificationIcon from '../../components/icons/NotificationIcon';
import NoticeIcon from '../../components/icons/NoticeIcon';
import CustomerServiceIcon from '../../components/icons/CustomerServiceIcon';
import InviteFriendIcon from '../../components/icons/InviteFriendIcon';
import GearIcon from '../../components/icons/GearIcon';
import CrownIcon from '../../components/icons/CrownIcon';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { sendPasswordResetEmail } from 'firebase/auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import EyeIcon from '../../components/icons/EyeIcon';
import EyeOffIcon from '../../components/icons/EyeOffIcon';
import { getSafeProfileImageUrl, handleImageError } from '../../utils/profileImageUtils';
import PointIcon from '../../components/icons/PointIcon';
import ShopIcon from '../../components/icons/ShopIcon';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { isAdmin } from '../../utils/adminAuth';
import { getFriendsList } from '../../utils/friendSystem';

// 관리자 아이콘 추가
const AdminIcon = ({ color = '#222' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill={color} />
    <path d="M19 15L19.74 18.26L23 19L19.74 19.74L19 23L18.26 19.74L15 19L18.26 18.26L19 15Z" fill={color} />
    <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill={color} />
  </svg>
);

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  // min-height: 100vh;
  padding: 20px;
  // padding-top: 0;
  margin: 60px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
`;
/* 프로필 이미지 */
const ProfileContainer = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px auto 16px auto;
`;

const ProfileImage = styled.img`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  // background: #fdd2d2;
  // border: 2px solid #e46262;
  object-fit: cover;
`;
/* 프로필 이미지 빈 공간 */
const ProfileImagePlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #fdd2d2;
  // border: 2px solid #e46262;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  // color: #e46262;
  margin-top: 10px;
  margin-bottom: 16px;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
`;

const EditIconWrapper = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 40px;
  height: 40px;
  background: rgba(210, 209, 209, 0.85);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  z-index: 2;
`;

const Nickname = styled.div`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-top: 20px;
  color: ${({ theme }) => theme.text};
`;

const PremiumStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  // margin-bottom: 20px;
  padding: 8px 16px;
  // background: ${({ theme, isPremium }) => isPremium ? 'linear-gradient(135deg, #e46262, #cb6565)' : theme.card};
  color: ${({ theme, isPremium }) => isPremium ? theme.text : theme.subText || '#666'};
  border-radius: 20px;
  font-size: 14px;
  font-weight: 400;
  // box-shadow: ${({ isPremium }) => isPremium ? '0 2px 8px rgba(228, 98, 98, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'};
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0px;
  margin-top: 30px;
  margin-bottom: 30px;
  width: 100%;
`;

const MenuButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  border-radius: 12px;
  padding: 15px 10px;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.menuHover};
  }
`;

const MenuIcon = styled.div`
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.menuText};
  margin-top: 2px;
`;

const Info = styled.div`
  font-size: 15px;
  color: #888;
  margin-bottom: 32px;
  text-align: center;
`;

const EditProfileCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 18px;
  box-shadow: ${({ theme }) => theme.cardShadow};
  padding: 32px 24px 24px 24px;
  max-width: 380px;
  margin: 40px auto 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const EditProfileImage = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #fdd2d2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  margin-bottom: 18px;
  overflow: hidden;
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
  margin-top: 20px;
  align-self: flex-start;
`;

const EditInputWrap = styled.div`
  width: 100%;
  max-width: 260px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
`;

const EditInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: #e46262;
    box-shadow: 0 0 0 2px rgba(228,98,98,0.08);
  }
`;

const EditButtonRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 40px;
  gap: 15px;
`;

const EditSaveButton = styled.button`
  flex: 1 1 0;
  height: 52px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 11px;
  border: none;
  background: #e46262;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  letter-spacing: 0.01em;
  margin-right: 8px;
  &:hover, &:focus {
    background: #cb6565;
  }
`;

const EditCancelTextButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 8px;
  height: 52px;
  &:hover, &:focus {
    color: #e46262;
    text-decoration: underline;
  }
`;

const PasswordInputWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 260px;
  margin-bottom: 0px;
  display: flex;
  flex-direction: column;
`;
const PasswordInputIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  z-index: 2;
`;

const AdminButton = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.3);
  border-radius: 16px;
  cursor: pointer;
  font-size: 11px;
  color: #3498db;
  font-weight: 500;
  transition: all 0.2s ease;
  margin: 8px auto;
  width: fit-content;

  &:hover {
    background: rgba(52, 152, 219, 0.2);
    border-color: rgba(52, 152, 219, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  // margin: 16px 0 24px 0;
  padding: 16px 0;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const StatNumber = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #888;
  font-weight: 500;
`;

/**
 * 마이페이지 메인 컴포넌트
 * @param {Object} user - 현재 로그인한 사용자 정보
 */
function MyPage({ user }) {
  // 프로필 편집 관련 상태
  const [isEditing, setIsEditing] = useState(false); // 편집 모드 활성화 여부
  const [newDisplayName, setNewDisplayName] = useState(''); // 새로운 닉네임
  const [newProfileImageFile, setNewProfileImageFile] = useState(null); // 새 프로필 이미지 파일
  const [newProfileImageUrl, setNewProfileImageUrl] = useState(''); // 새 프로필 이미지 URL (미리보기용)
  const [removeProfileImage, setRemoveProfileImage] = useState(false); // 프로필 이미지 삭제 여부
  const [point, setPoint] = useState(0); // 사용자 포인트
  const [friendCount, setFriendCount] = useState(0); // 친구 수
  const [premiumStatus, setPremiumStatus] = useState({
    isMonthlyPremium: false,
    isYearlyPremium: false,
    premiumType: null
  }); // 프리미엄 상태
  const [isLoading, setIsLoading] = useState(false);

  // 네비게이션 및 테마
  const navigate = useNavigate();
  const theme = useTheme();

  // 비밀번호 변경 관련 상태
  const [currentPassword, setCurrentPassword] = useState(''); // 현재 비밀번호
  const [newPassword, setNewPassword] = useState(''); // 새 비밀번호
  const [confirmPassword, setConfirmPassword] = useState(''); // 새 비밀번호 확인
  const [pwChangeLoading, setPwChangeLoading] = useState(false); // 비밀번호 변경 로딩 상태
  const [pwChangeError, setPwChangeError] = useState(''); // 비밀번호 변경 오류 메시지
  const [pwChangeSuccess, setPwChangeSuccess] = useState(''); // 비밀번호 변경 성공 메시지

  // 비밀번호 보기/숨김 상태
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 모바일 키보드 높이 (키보드가 올라올 때 화면 조정용)
  const [keyboardHeight, setKeyboardHeight] = useState(0);


  // 사용자 정보가 변경될 때 편집 폼 초기화
  useEffect(() => {
    if (user) {
      setNewDisplayName(user.displayName || '');
      setNewProfileImageUrl(user.photoURL || '');
      setRemoveProfileImage(false);
    }
  }, [user]);

  // 사용자 포인트 정보를 Firestore에서 가져오기
  useEffect(() => {
    if (user?.uid) {
      // Firestore에서 포인트 불러오기
      getDoc(doc(db, "users", user.uid)).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setPoint(userData.point || 0);
          setPremiumStatus({
            isMonthlyPremium: userData.isMonthlyPremium || false,
            isYearlyPremium: userData.isYearlyPremium || false,
            premiumType: userData.premiumType || null
          });
        }
      });
    }
  }, [user]);

  // 친구 수 정보를 가져오기
  useEffect(() => {
    if (user?.uid) {
      const fetchFriendCount = async () => {
        try {
          const friends = await getFriendsList(user.uid);
          setFriendCount(friends.length);
        } catch (error) {
          console.error('친구 수 조회 실패:', error);
          setFriendCount(0);
        }
      };
      fetchFriendCount();
    }
  }, [user]);

  // 모바일 키보드 이벤트 리스너 설정 (웹에서는 제외)
  useEffect(() => {
    let onShow, onHide;
    if (Capacitor.getPlatform() !== 'web') {
      // 키보드가 나타날 때 높이 정보 저장
      onShow = Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardHeight(info.keyboardHeight);
      });
      // 키보드가 사라질 때 높이 초기화
      onHide = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      });
    }
    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (onShow) onShow.remove();
      if (onHide) onHide.remove();
    };
  }, []);

  /**
   * 로그아웃 처리
   * Firebase Auth에서 로그아웃하고 로그인 페이지로 리디렉션
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 로그아웃 성공 시 App.js의 onAuthStateChanged가 감지하여
      // 자동으로 로그인 페이지로 리디렉션합니다.
      alert('로그아웃 되었습니다.');
    } catch (error) {
      alert('로그아웃에 실패했습니다.');
    }
  };

  /**
   * 프로필 이미지 파일 선택 처리
   * 선택된 파일을 상태에 저장하고 미리보기 URL 생성
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImageFile(file);
      setNewProfileImageUrl(URL.createObjectURL(file));
      setRemoveProfileImage(false); // 새 이미지 선택 시 삭제 상태 해제
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
   * 프로필 정보 업데이트 처리
   * 이미지 업로드 및 사용자 정보 변경을 Firebase에 반영
   */
  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      let photoURL = user.photoURL;

      // 프로필 이미지 삭제가 선택된 경우
      if (removeProfileImage) {
        photoURL = process.env.PUBLIC_URL + '/default-profile.svg'; // 기본 프로필 이미지 URL
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

      // Firestore users 문서에도 photoURL 반영
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName,
        photoURL: photoURL
      });

      alert('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
    } catch (error) {
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  // 프리미엄 해지 함수 제거

  const displayName = user?.displayName || user?.email?.split('@')[0] || '사용자';

  return (
    <>
      <Header user={user} title="마이페이지" />
      <MainContainer className="my-page-container" style={{ paddingBottom: 20 + keyboardHeight }}>
        {isEditing ? (
          <EditProfileCard>
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
              <EditLabel htmlFor="edit-nickname">닉네임</EditLabel>
              <EditInput
                id="edit-nickname"
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                autoComplete="off"
                onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
              />
            </EditInputWrap>
            {/* 비밀번호 변경 입력창: 구글 로그인 사용자는 숨김 */}
            {user && user.providerData && !user.providerData.some(p => p.providerId === 'google.com') && (
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
              <EditCancelTextButton onClick={() => setIsEditing(false)}>취소</EditCancelTextButton>
              <EditSaveButton
                onClick={async () => {
                  setPwChangeError('');
                  setPwChangeSuccess('');
                  // 1. 비밀번호 변경 로직 (입력값이 있을 때만)
                  if (user && user.providerData && !user.providerData.some(p => p.providerId === 'google.com') && (currentPassword || newPassword || confirmPassword)) {
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
                }}
                disabled={pwChangeLoading}
              >저장</EditSaveButton>
            </EditButtonRow>

            {/* 구글 로그인 사용자에게 비밀번호 변경 안내 메시지 */}
            {user && user.providerData && user.providerData.some(p => p.providerId === 'google.com') && (
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
                구글 계정으로 로그인하신 경우, 비밀번호는 구글 계정 설정에서 변경하실 수 있습니다.
              </div>
            )}
          </EditProfileCard>
        ) : (
          <>
            <ProfileContainer>
              <ProfileImage 
                src={getSafeProfileImageUrl(user?.photoURL)} 
                alt="Profile"
                onError={(e) => handleImageError(e)}
              />
              <EditIconWrapper onClick={() => setIsEditing(true)}>
                <EditIcon width="20" height="20" color="#555555" />
              </EditIconWrapper>
            </ProfileContainer>
            <Nickname>{displayName}님!</Nickname>

            {/* 프리미엄 상태 표시 */}
            <PremiumStatus
              theme={theme}
              isPremium={premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium}
            >
              {premiumStatus.isMonthlyPremium && (
                <>
                  <span>💎</span>
                  월간 프리미엄 회원
                  <span>💎</span>
                </>
              )}
              {premiumStatus.isYearlyPremium && (
                <>
                  <span>👑</span>
                  연간 프리미엄 회원
                  <span>👑</span>
                </>
              )}
              {!premiumStatus.isMonthlyPremium && !premiumStatus.isYearlyPremium && (
                <>
                  <span>⭐</span>
                  일반 회원
                  <span>⭐</span>
                </>
              )}
            </PremiumStatus>

            {/* 프리미엄 해지 버튼 제거 */}

            {/* 인스타그램 스타일 통계 섹션 */}
            <StatsContainer>
              <StatItem onClick={() => navigate('/my/shop/charge')}>
                <StatNumber>{point.toLocaleString()}</StatNumber>
                <StatLabel>포인트</StatLabel>
              </StatItem>
              <StatItem onClick={() => navigate('/my/friend')}>
                <StatNumber>{friendCount}</StatNumber>
                <StatLabel>친구</StatLabel>
              </StatItem>

            </StatsContainer>
            <MenuGrid>
              <MenuButton onClick={() => navigate('/my/statistics')}>
                <MenuIcon as="div">
                  <RecentActivityIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>내 통계</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/settings')}>
                <MenuIcon as="div">
                  <GearIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>개인설정</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/notice')}>
                <MenuIcon as="div">
                  <NotificationIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>공지사항</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/support')}>
                <MenuIcon as="div">
                  <CustomerServiceIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>고객지원</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/social')}>
                <MenuIcon as="div">
                  <InviteFriendIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>소셜</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/shop')}>
                <MenuIcon as="div">
                  <CrownIcon color={theme.theme === 'dark' ? '#fff' : '#181725'} />
                </MenuIcon>
                <MenuLabel>상점</MenuLabel>
              </MenuButton>


            </MenuGrid>
          </>
        )}

        <Navigation />

        {/* 관리자 버튼 - 관리자만 표시 */}
        {isAdmin(user) && (
          <AdminButton onClick={() => navigate('/admin/users')}>
            <AdminIcon color="#3498db" width={14} height={14} />
            관리자
          </AdminButton>
        )}
      </MainContainer>
    </>
  );
}

export default MyPage; 