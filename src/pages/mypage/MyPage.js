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
import { useTheme as useThemeContext } from '../../ThemeContext';
import { useTheme } from 'styled-components';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { sendPasswordResetEmail } from 'firebase/auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import EyeIcon from '../../components/icons/EyeIcon';
import EyeOffIcon from '../../components/icons/EyeOffIcon';
import { getSafeProfileImageUrl, handleImageError } from '../../utils/profileImageUtils';
import PointIcon from '../../components/icons/PointIcon';
import ShopIcon from '../../components/icons/ShopIcon';
import AppInfoIcon from '../../components/icons/AppInfoIcon';
import GiftIcon from '../../components/icons/GiftIcon';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { isAdmin } from '../../utils/adminAuth';
import { getFriendsList, subscribeToFriendRequests } from '../../utils/friendSystem';
import { useTranslation } from '../../LanguageContext';
import { inAppPurchaseService } from '../../utils/inAppPurchase';

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
  padding: 0 20px;
  // padding-top: 0;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: ${({ $isDiaryTheme }) => $isDiaryTheme ? '#faf8f3' : 'transparent'};
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  ${props => props.$isDiaryTheme && `
    background-image: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.02) 2px,
        rgba(0, 0, 0, 0.02) 4px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.02) 2px,
        rgba(0, 0, 0, 0.02) 4px
      );
  `}
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
  color: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#8B6F47' : theme.text};
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const PremiumStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  // margin-bottom: 20px;
  padding: 8px 16px;
  // background: ${({ theme, isPremium }) => isPremium ? 'linear-gradient(135deg, #e46262, #cb6565)' : theme.card};
  color: ${({ theme, isPremium, $isDiaryTheme }) => {
    if ($isDiaryTheme) return isPremium ? '#8B6F47' : '#5C4B37';
    return isPremium ? theme.text : (theme.subText || '#666');
  }};
  border-radius: 20px;
  font-size: 14px;
  font-weight: 400;
  // box-shadow: ${({ isPremium }) => isPremium ? '0 2px 8px rgba(228, 98, 98, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'};
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0px;
  margin-top: 10px;
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
  color: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#8B6F47' : theme.menuText};
  margin-top: 2px;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const Info = styled.div`
  font-size: 15px;
  color: #888;
  margin-bottom: 32px;
  text-align: center;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const EditProfileCard = styled.div`
  background: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#fffef9' : theme.card};
  border-radius: ${({ $isDiaryTheme }) =>
    $isDiaryTheme ? '16px 20px 18px 17px' : '18px'};
  box-shadow: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    return theme.cardShadow;
  }};
  border: ${({ $isDiaryTheme }) =>
    $isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.2)' : 'none'};
  padding: 20px 16px;
  max-width: 380px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'rotate(0.2deg)' : 'none'};
  position: relative;
  
  ${({ $isDiaryTheme }) => $isDiaryTheme && `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}
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
  margin-top: 12px;
  align-self: flex-start;
`;

const EditInputWrap = styled.div`
  width: 100%;
  max-width: 260px;
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
  position: relative;

  &:hover {
    opacity: 0.8;
  }
`;

const StatNumber = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#8B6F47' : theme.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: ${({ $isDiaryTheme }) =>
    $isDiaryTheme ? '#5C4B37' : '#888'};
  font-weight: 500;
`;

const FriendRequestBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: #e74c3c;
  border-radius: 50%;
  width: 6px;
  height: 6px;
`;

const PremiumUpgradeCard = styled.div`
  width: 100%;
  margin: 24px 0 32px 0;
  background: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme
      ? '#fffef9'
      : (theme.premiumUpgradeCardBg || 'linear-gradient(135deg, #F5E6D3 0%, #FFE5B4 50%, #FFD89B 100%)')};
  border-radius: ${({ $isDiaryTheme }) =>
    $isDiaryTheme ? '16px 20px 18px 17px' : '16px'};
  padding: 18px 24px;
  cursor: pointer;
  box-shadow: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    return theme.mode === 'dark' ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(255, 216, 155, 0.4)';
  }};
  border: ${({ $isDiaryTheme }) =>
    $isDiaryTheme ? '2px solid rgba(139, 111, 71, 0.3)' : 'none'};
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
  transform: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'rotate(-0.3deg)' : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: ${({ $isDiaryTheme }) => $isDiaryTheme ? '-1px' : '-25%'};
    right: ${({ $isDiaryTheme }) => $isDiaryTheme ? '-1px' : '-25%'};
    width: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'auto' : '150%'};
    height: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'auto' : '150%'};
    left: ${({ $isDiaryTheme }) => $isDiaryTheme ? '-1px' : 'auto'};
    bottom: ${({ $isDiaryTheme }) => $isDiaryTheme ? '-1px' : 'auto'};
    border-radius: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'inherit' : '0'};
    background: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return 'linear-gradient(135deg, rgba(139, 111, 71, 0.1) 0%, transparent 50%)';
    return theme.mode === 'dark'
      ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)'
      : 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)';
  }};
    z-index: ${({ $isDiaryTheme }) => $isDiaryTheme ? '-1' : '0'};
    opacity: ${({ $isDiaryTheme }) => $isDiaryTheme ? '0.3' : '1'};
    animation: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'none' : 'shimmer 4s infinite'};
  }
  
  @keyframes shimmer {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  &:hover {
    transform: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'rotate(-0.5deg) translateY(-2px)' : 'translateY(-2px)'};
    box-shadow: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    return theme.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.4)' : '0 6px 20px rgba(255, 216, 155, 0.5)';
  }};
  }
`;

const PremiumUpgradeContent = styled.div`
  position: relative;
  z-index: 1;
`;

/**
 * 마이페이지 메인 컴포넌트
 * @param {Object} user - 현재 로그인한 사용자 정보
 */
function MyPage({ user }) {
  // 프로필 편집 관련 상태
  const [isEditing, setIsEditing] = useState(false); // 편집 모드 활성화 여부
  const [newDisplayName, setNewDisplayName] = useState(''); // 새로운 닉네임
  const [newPhoneNumber, setNewPhoneNumber] = useState(''); // 새로운 휴대전화 번호
  const [newProfileImageFile, setNewProfileImageFile] = useState(null); // 새 프로필 이미지 파일
  const [newProfileImageUrl, setNewProfileImageUrl] = useState(''); // 새 프로필 이미지 URL (미리보기용)
  const [removeProfileImage, setRemoveProfileImage] = useState(false); // 프로필 이미지 삭제 여부
  const [point, setPoint] = useState(0); // 사용자 포인트
  const [friendCount, setFriendCount] = useState(0); // 친구 수
  const [potionCount, setPotionCount] = useState(0); // 포션 개수
  const [premiumStatus, setPremiumStatus] = useState(null); // 프리미엄 상태 (null: 로딩 중, 객체: 로드 완료)
  const [isLoading, setIsLoading] = useState(false);
  const [hasFriendRequest, setHasFriendRequest] = useState(false); // 친구 요청 존재 여부

  // 네비게이션 및 테마
  const navigate = useNavigate();
  const themeContext = useThemeContext();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDiaryTheme = themeContext.actualTheme === 'diary';

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

  // 닉네임 중복 체크 관련 상태
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');

  // 인증 제공자 정보 (카카오 로그인 확인용)
  const [authProvider, setAuthProvider] = useState(null);

  // Firestore에서 가져온 displayName (화면 표시용)
  const [firestoreDisplayName, setFirestoreDisplayName] = useState('');
  // Firestore에서 가져온 photoURL (화면 표시용)
  const [firestorePhotoURL, setFirestorePhotoURL] = useState('');

  // 사용자 정보가 변경될 때 편집 폼 초기화
  useEffect(() => {
    if (user) {
      // Firestore에서 사용자 정보 가져오기 (닉네임, 휴대전화번호, 인증 제공자 등)
      if (user?.uid) {
        getDoc(doc(db, "users", user.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Firestore의 displayName을 우선 사용, 없으면 Firebase Auth의 displayName 사용
            const displayName = userData.displayName || user.displayName || '';
            const photoURL = userData.photoURL || user.photoURL || '';
            setNewDisplayName(displayName);
            setFirestoreDisplayName(displayName);
            setFirestorePhotoURL(photoURL);
            setNewProfileImageUrl(photoURL);
            // phoneNumber만 설정 (email이 들어가지 않도록 명확히 구분)
            const phoneNumber = userData.phoneNumber;
            setNewPhoneNumber(phoneNumber && typeof phoneNumber === 'string' ? phoneNumber : '');
            setAuthProvider(userData.authProvider || null);
          } else {
            // Firestore 문서가 없는 경우 Firebase Auth 정보만 사용
            const displayName = user.displayName || '';
            const photoURL = user.photoURL || '';
            setNewDisplayName(displayName);
            setFirestoreDisplayName(displayName);
            setFirestorePhotoURL(photoURL);
            setNewProfileImageUrl(photoURL);
            setNewPhoneNumber('');
            setAuthProvider(null);
          }
          setRemoveProfileImage(false);
        });
      } else {
        // uid가 없는 경우
        const displayName = user.displayName || '';
        const photoURL = user.photoURL || '';
        setNewDisplayName(displayName);
        setFirestoreDisplayName(displayName);
        setFirestorePhotoURL(photoURL);
        setNewProfileImageUrl(photoURL);
        setNewPhoneNumber('');
        setRemoveProfileImage(false);
      }
    }
  }, [user]);

  // 사용자 포인트 및 포션 정보를 Firestore에서 가져오기
  useEffect(() => {
    if (user?.uid) {
      // Firestore에서 포인트 및 포션 불러오기
      getDoc(doc(db, "users", user.uid)).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setPoint(userData.point || 0);

          // 포션 개수 계산
          const potions = userData.potions || {};
          const totalPotions = Object.values(potions).reduce((sum, count) => sum + (count || 0), 0);
          setPotionCount(totalPotions);
        } else {
          // 문서가 없는 경우 기본값 설정
          setPotionCount(0);
        }
      }).catch(() => {
        // 에러 발생 시 기본값 설정
        setPotionCount(0);
      });
    }
  }, [user]);

  // 구독 상태 실시간 조회 및 Google Play 동기화
  useEffect(() => {
    if (user?.uid) {
      // 네이티브 플랫폼에서 구독 상태 동기화
      const syncStatus = async () => {
        try {
          await inAppPurchaseService.syncSubscriptionStatus(user.uid);
        } catch (error) {
          console.error('구독 상태 동기화 실패:', error);
        }
      };
      syncStatus();

      // Firebase에서 실시간으로 구독 상태 확인 (네이티브 앱에서 동기화한 결과 반영)
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPremiumStatus({
            isMonthlyPremium: data.isMonthlyPremium || false,
            isYearlyPremium: data.isYearlyPremium || false,
            premiumType: data.premiumType || null
          });
        } else {
          // 문서가 없는 경우 기본값 설정
          setPremiumStatus({
            isMonthlyPremium: false,
            isYearlyPremium: false,
            premiumType: null
          });
        }
      }, (error) => {
        console.error('구독 상태 실시간 조회 실패:', error);
        // 에러 발생 시 기본값 설정
        setPremiumStatus({
          isMonthlyPremium: false,
          isYearlyPremium: false,
          premiumType: null
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  // 페이지 포커스 시 네이티브 플랫폼에서 구독 상태 동기화
  useEffect(() => {
    const handleFocus = () => {
      if (user?.uid) {
        // 네이티브 플랫폼에서만 구독 상태 동기화 (웹에서는 Firebase 실시간 업데이트로 반영됨)
        inAppPurchaseService.syncSubscriptionStatus(user.uid).catch(error => {
          console.error('구독 상태 동기화 실패:', error);
        });
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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

  // 친구 요청 실시간 감지
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToFriendRequests(user.uid, (requests) => {
        const pendingRequests = requests.filter(req => req.status === 'pending');
        setHasFriendRequest(pendingRequests.length > 0);
      });
      return unsubscribe;
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
      alert(t('logout'));
    } catch (error) {
      alert(t('logout_failed') || '로그아웃에 실패했습니다.');
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
   * 이미지 업로드 및 사용자 정보 변경을 Firebase에 반영
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

      // Firestore users 문서에도 photoURL 및 휴대전화 번호 반영
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName,
        photoURL: photoURL,
        phoneNumber: newPhoneNumber || ''
      });

      // 화면 표시용 displayName과 photoURL도 업데이트
      setFirestoreDisplayName(newDisplayName);
      setFirestorePhotoURL(photoURL);
      setNewProfileImageUrl(photoURL);

      alert('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
      setIsNicknameDuplicate(false);
      setNicknameError('');
      setNicknameSuccess('');
    } catch (error) {
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  // 프리미엄 해지 함수 제거

  // Firestore의 displayName을 우선 사용, 없으면 Firebase Auth의 displayName, 그것도 없으면 이메일 앞부분 또는 '사용자'
  const displayName = firestoreDisplayName || user?.displayName || user?.email?.split('@')[0] || '사용자';

  return (
    <>
      <Header user={user} title={t('mypage')} />
      <MainContainer $isDiaryTheme={isDiaryTheme} className="my-page-container" style={{ paddingBottom: 20 + keyboardHeight }}>
        {false && isEditing ? (
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
              <EditCancelTextButton onClick={() => setIsEditing(false)}>{t('cancel')}</EditCancelTextButton>
              <EditSaveButton
                onClick={async () => {
                  setPwChangeError('');
                  setPwChangeSuccess('');
                  // 닉네임 중복 체크
                  if (isNicknameDuplicate || isNicknameChecking) {
                    alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.');
                    return;
                  }
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
                }}
                disabled={pwChangeLoading || isNicknameDuplicate || isNicknameChecking}
              >{t('save')}</EditSaveButton>
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
          </EditProfileCard>
        ) : (
          <>
            <ProfileContainer>
              <ProfileImage
                src={getSafeProfileImageUrl(firestorePhotoURL || user?.photoURL)}
                alt="Profile"
                onError={(e) => handleImageError(e)}
              />
              <EditIconWrapper onClick={() => navigate('/my/profile-edit')}>
                <EditIcon width="20" height="20" color="#555555" />
              </EditIconWrapper>
            </ProfileContainer>
            <Nickname $isDiaryTheme={isDiaryTheme}>{displayName}{t('user_nim_suffix')}</Nickname>

            {/* 프리미엄 상태 표시 */}
            {premiumStatus && (
              <PremiumStatus
                theme={theme}
                isPremium={premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium}
                $isDiaryTheme={isDiaryTheme}
              >
                {premiumStatus.premiumType === 'trial' && (
                  <>
                    <span>🎁</span>
                    일주일 무료 체험
                    <span>🎁</span>
                  </>
                )}
                {premiumStatus.isMonthlyPremium && premiumStatus.premiumType !== 'trial' && (
                  <>
                    <span>💎</span>
                    {t('premium_monthly')}
                    <span>💎</span>
                  </>
                )}
                {premiumStatus.isYearlyPremium && (
                  <>
                    <span>👑</span>
                    {t('premium_yearly')}
                    <span>👑</span>
                  </>
                )}
                {!premiumStatus.isMonthlyPremium && !premiumStatus.isYearlyPremium && (
                  <>
                    <span>⭐</span>
                    {t('premium_basic')}
                    <span>⭐</span>
                  </>
                )}
              </PremiumStatus>
            )}


            {/* 프리미엄 가입 버튼 - 프리미엄이 아닌 사용자에게만 표시 (데이터 로드 완료 후) */}
            {premiumStatus && !premiumStatus.isMonthlyPremium && !premiumStatus.isYearlyPremium && (
              <PremiumUpgradeCard $isDiaryTheme={false} onClick={() => navigate('/my/premium')}>
                <PremiumUpgradeContent>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px' }}>👑</span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: theme.premiumUpgradeCardText || '#8B6914',
                      wordBreak: 'keep-all',
                      overflowWrap: 'break-word'
                    }}>
                      {t('premium_benefits')}
                    </span>
                    <span style={{ fontSize: '20px' }}>👑</span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.premiumUpgradeCardDesc || 'rgba(139, 105, 20, 0.85)',
                    lineHeight: '1.4',
                    marginBottom: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span>일기 사진 4개 업로드</span>
                    <span>·</span>
                    <span>일기 전용 스티커</span>
                    <span>·</span>
                    <span>한 주에 여러 장르 소설 생성</span>
                    <span>·</span>
                    <span>AI 일기 생성</span>
                  </div>
                  <div style={{
                    background: theme.premiumUpgradeCardButtonBg || 'white',
                    color: theme.premiumUpgradeCardButtonText || '#D4A017',
                    padding: '10px 30px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '15px',
                    display: 'inline-block',
                  }}>
                    가입하기
                  </div>
                </PremiumUpgradeContent>
              </PremiumUpgradeCard>
            )}

            {/* 프리미엄 해지 버튼 제거 */}

            {/* 인스타그램 스타일 통계 섹션 */}
            <StatsContainer>
              <StatItem onClick={() => navigate('/my/shop/charge')}>
                <StatNumber $isDiaryTheme={isDiaryTheme}>{point.toLocaleString()}</StatNumber>
                <StatLabel $isDiaryTheme={isDiaryTheme}>{t('points')}</StatLabel>
              </StatItem>
              <StatItem onClick={() => navigate('/my/potion-shop')}>
                <StatNumber $isDiaryTheme={isDiaryTheme}>{potionCount}</StatNumber>
                <StatLabel $isDiaryTheme={isDiaryTheme}>{t('potions')}</StatLabel>
              </StatItem>
              <StatItem onClick={() => navigate('/my/friend')}>
                <StatNumber $isDiaryTheme={isDiaryTheme}>{friendCount}</StatNumber>
                <StatLabel $isDiaryTheme={isDiaryTheme}>{t('friends')}</StatLabel>
                {hasFriendRequest && <FriendRequestBadge theme={theme} />}
              </StatItem>
            </StatsContainer>
            <MenuGrid>
              <MenuButton onClick={() => navigate('/my/statistics')}>
                <MenuIcon as="div">
                  <RecentActivityIcon color={isDiaryTheme ? '#8B6F47' : (theme.mode === 'dark' ? theme.menuText : '#222')} />
                </MenuIcon>
                <MenuLabel $isDiaryTheme={isDiaryTheme}>{t('stats')}</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/settings')}>
                <MenuIcon as="div">
                  <GearIcon color={isDiaryTheme ? '#8B6F47' : (theme.mode === 'dark' ? theme.menuText : '#222')} />
                </MenuIcon>
                <MenuLabel $isDiaryTheme={isDiaryTheme}>{t('personal_settings')}</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/shop')}>
                <MenuIcon as="div">
                  <ShopIcon color={isDiaryTheme ? '#8B6F47' : (theme.mode === 'dark' ? theme.menuText : '#222')} />
                </MenuIcon>
                <MenuLabel $isDiaryTheme={isDiaryTheme}>{t('shop')}</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/potion-gift')}>
                <MenuIcon as="div">
                  <GiftIcon color={isDiaryTheme ? '#8B6F47' : (theme.mode === 'dark' ? theme.menuText : '#222')} />
                </MenuIcon>
                <MenuLabel $isDiaryTheme={isDiaryTheme}>{t('potion_gift') || '포션 선물'}</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/premium')}>
                <MenuIcon as="div">
                  <CrownIcon color={isDiaryTheme ? '#8B6F47' : (theme.mode === 'dark' ? theme.menuText : '#222')} />
                </MenuIcon>
                <MenuLabel $isDiaryTheme={isDiaryTheme}>{t('premium') || '프리미엄'}</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/support')}>
                <MenuIcon as="div">
                  <CustomerServiceIcon color={isDiaryTheme ? '#8B6F47' : (theme.mode === 'dark' ? theme.menuText : '#222')} />
                </MenuIcon>
                <MenuLabel $isDiaryTheme={isDiaryTheme}>{t('support')}</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/app-info')}>
                <MenuIcon as="div">
                  <AppInfoIcon color={isDiaryTheme ? '#8B6F47' : (theme.mode === 'dark' ? theme.menuText : '#222')} />
                </MenuIcon>
                <MenuLabel $isDiaryTheme={isDiaryTheme}>{t('app_info')}</MenuLabel>
              </MenuButton>

            </MenuGrid>
          </>
        )}

        <Navigation />

        {/* 관리자 버튼 - 관리자만 표시 */}
        {isAdmin(user) && (
          <AdminButton onClick={() => navigate('/admin/users')}>
            <AdminIcon color="#3498db" width={14} height={14} />
            {t('admin')}
          </AdminButton>
        )}
      </MainContainer>
    </>
  );
}

export default MyPage; 