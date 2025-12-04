/**
 * UserManagement.js - 사용자 데이터 관리 페이지
 * 
 * 관리자가 Firebase에 사용자 데이터를 일괄 저장하고 관리할 수 있는 페이지
 * 개발/테스트 목적으로만 사용해야 함
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import {
  generateSampleUsers,
  batchSaveUsers,
  getExistingUsers,
  getUsersByCondition,
  updateUserData,
  migrationExamples,
  getUsersWithQuery
} from '../../utils/userMigration';
import {
  syncCurrentUser,
  createTestUsers,
  getUsersCollectionStatus,
  createManualUser
} from '../../utils/syncAuthUsers';
import {
  updateEmptyProfileImages,
  checkAndUpdateAllProfileImages,
  updateEmptyDisplayNames,
  checkAndUpdateAllUserProfiles
} from '../../utils/updateDefaultProfile';
import {
  getAllFirestoreUsers,
  checkAllUserProfiles
} from '../../utils/debugUsers';
import {
  findInactiveUsers,
  findOldInactiveUsers,
  cleanupDeletedUsers,
  cleanupInactiveUsers
} from '../../utils/cleanupDeletedUsers';
import { requireAdmin, isMainAdmin, isAdmin } from '../../utils/adminAuth';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit as fsLimit, limit, doc, deleteDoc, addDoc, updateDoc, Timestamp, getDoc, increment } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// FCM 실패 원인 코드를 읽기 쉬운 텍스트로 변환
const getFailureReasonText = (code) => {
  const reasonMap = {
    'messaging/invalid-registration-token': '유효하지 않은 FCM 토큰',
    'messaging/registration-token-not-registered': '등록되지 않은 FCM 토큰',
    'messaging/invalid-argument': '잘못된 인수',
    'messaging/message-rate-exceeded': '메시지 전송 속도 초과',
    'messaging/authentication-error': '인증 오류',
    'messaging/server-unavailable': '서버 사용 불가',
    'messaging/internal-error': '내부 오류',
    'messaging/invalid-apns-credentials': '잘못된 APNS 인증 정보',
    'messaging/invalid-package-name': '잘못된 패키지 이름',
    'messaging/unknown-error': '알 수 없는 오류',
    'batch-error': '배치 전송 오류',
    'fcm-api-not-found': 'FCM API 엔드포인트를 찾을 수 없음 (404)',
    'fcm-api-forbidden': 'FCM API 접근 권한 없음 (403)',
    'fcm-api-unauthorized': 'FCM API 인증 실패 (401)',
    'unknown': '알 수 없는 오류'
  };
  return reasonMap[code] || code;
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 120px;
  font-family: 'Arial', sans-serif;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: 10px;
    padding-bottom: 100px;
  }
`;

// 기존 Header 스타일 컴포넌트 이름을 PageTitle로 변경
const PageTitle = styled.h1`
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin-bottom: 30px;
  position: relative;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s, transform 0.2s;
  z-index: 10;
  
  &:hover {
    background: ${({ theme }) => theme.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 20px;
    padding: 6px;
  }
`;

const Section = styled.div`
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : 'white'};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.3' : '0.1'});
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  
  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 6px;
  }
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.text};
  margin-bottom: 15px;
  border-bottom: 2px solid #3498f3;
  padding-bottom: 10px;
  font-size: 18px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 12px;
    padding-bottom: 8px;
  }
`;

const AccordionIcon = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  transition: transform 0.3s ease;
  transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
  margin-left: 10px;
`;

const SectionContent = styled.div`
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: ${props => props.isOpen ? '10000px' : '0'};
  opacity: ${props => props.isOpen ? '1' : '0'};
`;

const Button = styled.button`
  background: ${props => props.variant === 'danger' ? '#e74c3c' : '#3498f3'};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin: 5px;
  font-size: 14px;
  min-height: 44px;
  touch-action: manipulation;
  flex-shrink: 0;
  max-width: 100%;
  box-sizing: border-box;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#c0392b' : '#2980b9'};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 13px;
    margin: 4px;
    min-height: 48px;
    flex: 1 1 auto;
    min-width: 120px;
    max-width: calc(100% - 8px);
  }
`;

const InfoText = styled.div`
  color: ${({ theme }) => theme.subText || '#666'};
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const LoadingText = styled.div`
  color: #e46262;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

const StatusText = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  margin-top: 12px;
  padding: 12px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  max-height: 300px;
  overflow-y: auto;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#ddd'};
  border-radius: 4px;
  margin: 5px;
  font-size: 14px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
  color: ${({ theme }) => theme.text};
  
  &:focus {
    outline: none;
    border-color: #3498f3;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 16px;
    margin: 4px 0;
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
  }
`;

const Select = styled.select`
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#ddd'};
  border-radius: 4px;
  margin: 5px;
  font-size: 13px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
  color: ${({ theme }) => theme.theme === 'dark' ? '#fff' : '#333'} !important;
  height: 32px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3498f3;
  }
  
  option {
    background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
    color: ${({ theme }) => theme.theme === 'dark' ? '#fff' : '#333'} !important;
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 13px;
    margin: 4px 0;
    width: 100%;
    height: 32px;
    box-sizing: border-box;
  }
`;

const Status = styled.div`
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background: ${props => props.type === 'success' ? '#d4edda' : props.type === 'error' ? '#f8d7da' : '#d1ecf1'};
  color: ${props => props.type === 'success' ? '#155724' : props.type === 'error' ? '#721c24' : '#0c5460'};
  border: 1px solid ${props => props.type === 'success' ? '#c3e6cb' : props.type === 'error' ? '#f5c6cb' : '#bee5eb'};
`;

const UserList = styled.div`
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#ddd'};
  border-radius: 4px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#f8f9fa'};
  word-break: break-all;
  overflow-wrap: anywhere;
`;

const UserItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#eee'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 4px;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
  word-break: break-all;
  overflow-wrap: anywhere;
`;

const UserName = styled.strong`
  color: ${({ theme }) => theme.text};
  word-break: break-all;
  overflow-wrap: anywhere;
`;

const UserEmail = styled.div`
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  font-size: 12px;
  word-break: break-all;
  overflow-wrap: anywhere;
`;

const UserPoints = styled.div`
  color: #3498f3;
  font-weight: bold;
`;

const UserTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TableHeader = styled.thead`
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#f8f9fa'};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.theme === 'dark' ? '#3d566e' : '#f0f0f0'};
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  text-align: left;
  color: ${({ theme }) => theme.text};
  word-break: break-word;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: bold;
  color: ${({ theme }) => theme.text};
  border-bottom: 2px solid ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#ddd'};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

// 모바일용 카드 스타일
const MobileUserCard = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
    border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'};
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.15' : '0.08'});
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 1px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.15' : '0.08'});
    }
  }
`;

const MobileCardContainer = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const EmptyTableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'};
  height: 60px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const EmptyTableCell = styled.td`
  padding: 12px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#555' : '#ccc'};
  font-style: italic;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const EmptyMobileCard = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
    border: 1px dashed ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'};
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 6px;
    opacity: 0.5;
    min-height: 60px;
  }
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 6px;
`;

const MobileCardTitle = styled.div`
  font-weight: bold;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  margin-bottom: 2px;
  line-height: 1.2;
`;

const MobileCardEmail = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  word-break: break-all;
  line-height: 1.2;
`;

const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'};
`;

const MobileCardLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
`;

const MobileCardValue = styled.span`
  font-size: 11px;
  font-weight: bold;
  color: ${({ theme }) => theme.text};
`;

const PremiumBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  background: ${props => props.type === 'yearly' ? '#FFC300' : props.type === 'monthly' ? '#3498db' : 'transparent'};
  color: ${props => props.type ? 'white' : '#999'};
  border: ${props => props.type ? 'none' : '1px solid #ddd'};
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 12px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding: 15px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#f8f9fa'};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  width: 100%;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 12px;
    gap: 6px;
    margin-bottom: 12px;
  }
`;

const ButtonGroupTitle = styled.div`
  font-weight: bold;
  color: ${({ theme }) => theme.text};
  margin-bottom: 10px;
  font-size: 14px;
  width: 100%;
  
  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 8px;
  }
`;

function UserManagement({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const toast = useToast();

  // 관리자 권한 체크
  useEffect(() => {
    if (!requireAdmin(user, navigate)) {
      return;
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(10);
  const [searchField, setSearchField] = useState('displayName');
  const [searchOperator, setSearchOperator] = useState('==');
  const [searchValue, setSearchValue] = useState('');
  const [simpleSearchTerm, setSimpleSearchTerm] = useState('');
  const [usersCollectionStats, setUsersCollectionStats] = useState(null);
  const [manualUserData, setManualUserData] = useState({
    uid: '',
    email: '',
    displayName: '',
    point: 500
  });
  const [debugInfo, setDebugInfo] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [userActivity, setUserActivity] = useState({ diaries: [], novels: [], comments: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionStatus, setStatusActionStatus] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 아코디언 상태 관리
  const [openSections, setOpenSections] = useState({
    premiumMigration: false,
    userList: false, // 사용자 목록은 기본적으로 닫힘
    profileUpdate: false,
    debugging: false,
    notifications: false,
    cleanupUsers: false,
    userPointManagement: false // 유저 및 포인트 관리
  });

  // 유저 및 포인트 관리 상태
  const [csSearchTerm, setCsSearchTerm] = useState('');
  const [csSearchType, setCsSearchType] = useState('displayName'); // displayName, email, uid
  const [csSearchResult, setCsSearchResult] = useState(null);
  const [csSearchResults, setCsSearchResults] = useState([]); // 여러 검색 결과
  const [csPointAmount, setCsPointAmount] = useState('');
  const [csPointReason, setCsPointReason] = useState('');
  const [csPointUid, setCsPointUid] = useState(''); // 포인트 관리용 UID
  const [csPotionType, setCsPotionType] = useState('romance');
  const [csPotionAmount, setCsPotionAmount] = useState('');
  const [csPotionReason, setCsPotionReason] = useState('');
  const [csPotionUid, setCsPotionUid] = useState(''); // 포션 관리용 UID
  const [csPremiumUid, setCsPremiumUid] = useState(''); // 프리미엄 관리용 UID
  const [csActionLoading, setCsActionLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };


  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 마케팅/이벤트 알림 발송 관련 상태
  const [notificationType, setNotificationType] = useState('marketing'); // 'marketing' or 'event'
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationImageUrl, setNotificationImageUrl] = useState('');
  const [notificationLinkUrl, setNotificationLinkUrl] = useState('');
  const [notificationSending, setNotificationSending] = useState(false);
  const [marketingUsersList, setMarketingUsersList] = useState([]); // 마케팅 알림 수신 사용자 목록


  // 페이지네이션/정렬 상태
  const [pageLimit, setPageLimit] = useState(10);
  const [orderByField, setOrderByField] = useState('createdAt');
  const [orderDir, setOrderDir] = useState('desc');
  const [lastDoc, setLastDoc] = useState(null);
  const [pageStack, setPageStack] = useState([]); // 이전 페이지 스택
  const [totalUsers, setTotalUsers] = useState(null); // 전체 사용자 수

  // 상태 표시용 컬러 텍스트 (작고 간단하게)
  const renderStatusBadge = (status) => {
    let color = '#2ecc40', text = '정상';
    if (status === '정지') { color = '#e74c3c'; text = '정지'; }
    if (status === '탈퇴') { color = '#95a5a6'; text = '탈퇴'; }
    return <span style={{ color: color, fontSize: '11px', fontWeight: '500' }}>{text}</span>;
  };

  // 프리미엄 간단 표시 (일반, 월간, 연간)
  const renderPremiumBadge = (user) => {
    const premiumText = getPremiumText(user);
    const premiumColor = getPremiumColor(user);
    return <span style={{ color: premiumColor, fontSize: '11px', fontWeight: '500' }}>{premiumText}</span>;
  };

  // 프리미엄 간단 표시 (모바일용)
  const getPremiumText = (user) => {
    if (user.isYearlyPremium) return '연간';
    if (user.isMonthlyPremium) return '월간';
    return '일반';
  };

  // 프리미엄 색상 가져오기
  const getPremiumColor = (user) => {
    if (user.isYearlyPremium) return '#FFC300'; // 금색
    if (user.isMonthlyPremium) return '#3498db'; // 파란색
    return '#95a5a6'; // 회색
  };

  // Firestore에서 유저 목록 불러오기 (페이지네이션/정렬/검색)
  const loadUsersPage = async (opts = {}) => {
    setLoading(true);
    try {
      // 프리미엄이나 상태 정렬은 클라이언트 사이드에서 처리
      const needsClientSort = orderByField === 'premium' || orderByField === 'status';
      const firestoreOrderBy = needsClientSort ? 'createdAt' : orderByField; // 기본값 사용

      // limit 결정: opts.limit이 있으면 사용, 없으면 pageLimit 사용 (null이면 전체)
      const queryLimit = opts.limit !== undefined
        ? opts.limit
        : (needsClientSort ? 1000 : (pageLimit || 10000));

      const { users: loadedUsers, lastDoc: newLastDoc } = await getUsersWithQuery({
        limit: queryLimit,
        orderBy: firestoreOrderBy,
        orderDir: needsClientSort ? 'desc' : orderDir,
        startAfter: opts.startAfter || null,
        where: opts.where || []
      });

      // 클라이언트 사이드 정렬
      let finalUsers = loadedUsers;
      if (needsClientSort) {
        finalUsers = [...loadedUsers].sort((a, b) => {
          let aVal, bVal;

          if (orderByField === 'premium') {
            // 프리미엄: 연간(3) > 월간(2) > 일반(1)
            const getPremiumValue = (user) => {
              if (user.isYearlyPremium) return 3;
              if (user.isMonthlyPremium) return 2;
              return 1;
            };
            aVal = getPremiumValue(a);
            bVal = getPremiumValue(b);
          } else if (orderByField === 'status') {
            // 상태: 정상(3) > 정지(2) > 탈퇴(1)
            const getStatusValue = (status) => {
              if (!status || status === '정상') return 3;
              if (status === '정지') return 2;
              if (status === '탈퇴') return 1;
              return 0;
            };
            aVal = getStatusValue(a.status);
            bVal = getStatusValue(b.status);
          }

          if (aVal === bVal) return 0;
          const comparison = aVal > bVal ? 1 : -1;
          return orderDir === 'desc' ? -comparison : comparison;
        });

        // 페이지네이션 적용 (전체가 아닐 때만)
        if (pageLimit) {
          finalUsers = finalUsers.slice(0, pageLimit);
        }
      }

      setUsers(finalUsers);

      if (opts.isNext) {
        // 다음 페이지로 이동: 현재 lastDoc을 스택에 저장하고 새로운 lastDoc 설정
        setPageStack(prev => [...prev, lastDoc]);
        setLastDoc(newLastDoc);
      } else if (opts.isPrev) {
        // 이전 페이지로 이동: 스택에서 마지막 항목 제거
        setPageStack(prev => {
          const newStack = [...prev];
          newStack.pop();
          // 첫 페이지로 돌아간 경우: newLastDoc 사용 (다음 페이지로 갈 수 있도록)
          // 그 외: 스택의 마지막 항목 사용
          if (newStack.length === 0) {
            // 첫 페이지로 돌아간 경우
            setLastDoc(newLastDoc);
          } else {
            // 중간 페이지로 돌아간 경우
            setLastDoc(newStack[newStack.length - 1]);
          }
          return newStack;
        });
      } else {
        // 일반 로드 (정렬 변경 등): 스택 초기화하고 새로운 lastDoc 설정
        setPageStack([]);
        setLastDoc(newLastDoc);
      }
    } catch (e) {
      setStatus({ type: 'error', message: '유저 목록 불러오기 실패: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  // 전체 사용자 수 조회
  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const result = await getUsersCollectionStatus();
        if (result && result.stats) {
          setTotalUsers(result.stats.totalUsers);
        }
      } catch (error) {
        console.error('전체 사용자 수 조회 실패:', error);
      }
    };
    fetchTotalUsers();
  }, []);

  // 최초 로드
  useEffect(() => {
    loadUsersPage();
    // eslint-disable-next-line
  }, [orderByField, orderDir]);

  // 정렬 기준 변경 핸들러
  const handleSortFieldChange = (field) => {
    setOrderByField(field);
  };

  // 정렬 방향 변경 핸들러
  const handleSortDirChange = (dir) => {
    setOrderDir(dir);
  };

  // 다음/이전 페이지
  const handleNextPage = () => {
    loadUsersPage({ startAfter: lastDoc, isNext: true });
  };

  const handlePrevPage = () => {
    if (pageStack.length === 0) return; // 첫 페이지면 아무것도 하지 않음

    const prevStack = [...pageStack];
    prevStack.pop();
    const prevLastDoc = prevStack.length > 0 ? prevStack[prevStack.length - 1] : null;
    loadUsersPage({ startAfter: prevLastDoc, isPrev: true });
  };

  // 샘플 사용자 생성 및 저장
  const handleCreateSampleUsers = async () => {
    if (!window.confirm(`${userCount}명의 샘플 사용자를 생성하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '샘플 사용자 생성 중...' });

    try {
      const sampleUsers = generateSampleUsers(parseInt(userCount));
      const result = await batchSaveUsers(sampleUsers);

      setStatus({
        type: 'success',
        message: `샘플 사용자 생성 완료: 성공 ${result.success}명, 실패 ${result.failed}명`
      });

      // 사용자 목록 새로고침
      await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
    } catch (error) {
      setStatus({ type: 'error', message: '샘플 사용자 생성 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 간단한 사용자 검색 (이메일 또는 이름)
  const handleSimpleSearch = async () => {
    if (!simpleSearchTerm || simpleSearchTerm.trim().length < 2) {
      toast.showToast('검색어를 2자 이상 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    toast.showToast('사용자 검색 중...', 'info');

    try {
      const searchLower = simpleSearchTerm.toLowerCase().trim();
      const usersRef = collection(db, 'users');

      // 이름으로 검색
      const nameQuery = query(
        usersRef,
        where('displayName', '>=', searchLower),
        where('displayName', '<=', searchLower + '\uf8ff'),
        limit(100)
      );

      // 이메일로 검색
      const emailQuery = query(
        usersRef,
        where('email', '>=', searchLower),
        where('email', '<=', searchLower + '\uf8ff'),
        limit(100)
      );

      const [nameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(emailQuery)
      ]);

      const usersMap = new Map(); // 중복 제거를 위해 Map 사용

      // 이름 검색 결과 처리
      nameSnapshot.forEach(doc => {
        const userData = { uid: doc.id, ...doc.data() };
        usersMap.set(userData.uid, userData);
      });

      // 이메일 검색 결과 처리
      emailSnapshot.forEach(doc => {
        const userData = { uid: doc.id, ...doc.data() };
        usersMap.set(userData.uid, userData);
      });

      const searchResults = Array.from(usersMap.values());
      setUsers(searchResults);

      // 페이지네이션 상태 초기화
      setLastDoc(null);
      setPageStack([]);

      toast.showToast(`검색 완료: ${searchResults.length}명의 사용자를 찾았습니다.`, 'success');
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      toast.showToast('사용자 검색 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 검색 초기화 (전체 목록 다시 로드)
  const handleResetSearch = async () => {
    setSimpleSearchTerm('');
    setLastDoc(null);
    setPageStack([]);
    await loadUsersPage();
  };

  // CS용 유저 검색 (닉네임, 이메일, UID)
  const handleCsSearch = async () => {
    if (!csSearchTerm || !csSearchTerm.trim()) {
      toast.showToast('검색어를 입력해주세요.', 'error');
      return;
    }

    setCsActionLoading(true);
    toast.showToast('사용자 검색 중...', 'info');

    try {
      const searchTerm = csSearchTerm.trim();

      if (csSearchType === 'uid') {
        // UID로 직접 검색
        const userDoc = await getDoc(doc(db, 'users', searchTerm));
        if (userDoc.exists()) {
          const userData = { uid: userDoc.id, ...userDoc.data() };
          setCsSearchResult(userData);
          setCsSearchResults([userData]);
          toast.showToast('사용자를 찾았습니다.', 'success');
        } else {
          setCsSearchResult(null);
          setCsSearchResults([]);
          toast.showToast('사용자를 찾을 수 없습니다.', 'error');
        }
      } else {
        // 닉네임 또는 이메일로 검색
        const usersRef = collection(db, 'users');
        const searchLower = searchTerm.toLowerCase();

        let searchQuery;
        if (csSearchType === 'displayName') {
          searchQuery = query(
            usersRef,
            where('displayName', '>=', searchLower),
            where('displayName', '<=', searchLower + '\uf8ff'),
            limit(50) // 더 많은 결과를 가져올 수 있도록 증가
          );
        } else {
          searchQuery = query(
            usersRef,
            where('email', '>=', searchLower),
            where('email', '<=', searchLower + '\uf8ff'),
            limit(50)
          );
        }

        const snapshot = await getDocs(searchQuery);
        if (!snapshot.empty) {
          const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          setCsSearchResults(users);

          if (users.length === 1) {
            // 결과가 1개면 자동 선택
            setCsSearchResult(users[0]);
            toast.showToast('사용자를 찾았습니다.', 'success');
          } else {
            // 결과가 여러 개면 리스트만 표시
            setCsSearchResult(null);
            toast.showToast(`${users.length}명의 사용자를 찾았습니다. 선택해주세요.`, 'info');
          }
        } else {
          setCsSearchResult(null);
          setCsSearchResults([]);
          toast.showToast('사용자를 찾을 수 없습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('CS 검색 실패:', error);
      toast.showToast('검색 실패: ' + error.message, 'error');
      setCsSearchResult(null);
      setCsSearchResults([]);
    } finally {
      setCsActionLoading(false);
    }
  };

  // 검색 결과에서 사용자 선택
  const handleSelectUser = (user) => {
    setCsSearchResult(user);
    // 선택한 사용자의 UID를 각 관리 섹션에 자동 입력
    setCsPointUid(user.uid);
    setCsPotionUid(user.uid);
    setCsPremiumUid(user.uid);
  };

  // 포인트 지급/차감 (독립적으로 사용 가능)
  const handlePointAction = async (action, targetUid = null) => {
    const uid = targetUid || csSearchResult?.uid;
    if (!uid) {
      toast.showToast('UID를 입력하거나 사용자를 검색해주세요.', 'error');
      return;
    }

    const amount = parseInt(csPointAmount);
    if (!amount || amount <= 0) {
      toast.showToast('올바른 포인트를 입력해주세요.', 'error');
      return;
    }

    if (!csPointReason || !csPointReason.trim()) {
      toast.showToast('사유를 입력해주세요.', 'error');
      return;
    }

    setCsActionLoading(true);
    toast.showToast(`${action === 'add' ? '포인트 지급' : '포인트 차감'} 중...`, 'info');

    try {
      const pointChange = action === 'add' ? amount : -amount;
      const reason = csPointReason.trim();

      // 사용자 정보 확인
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        toast.showToast('사용자를 찾을 수 없습니다.', 'error');
        return;
      }

      // 포인트 업데이트
      await updateDoc(doc(db, 'users', uid), {
        point: increment(pointChange),
        updatedAt: Timestamp.now()
      });

      // 포인트 히스토리 기록
      await addDoc(collection(db, 'users', uid, 'pointHistory'), {
        type: action === 'add' ? 'admin_give' : 'admin_deduct',
        amount: pointChange,
        desc: `[관리자 ${action === 'add' ? '지급' : '차감'}] ${reason}`,
        createdAt: Timestamp.now()
      });

      // 검색 결과가 있으면 업데이트
      if (csSearchResult && csSearchResult.uid === uid) {
        const updatedPoint = (csSearchResult.point || 0) + pointChange;
        setCsSearchResult({ ...csSearchResult, point: updatedPoint });
      }

      // 입력 필드 초기화
      setCsPointAmount('');
      setCsPointReason('');

      toast.showToast(`${action === 'add' ? '포인트 지급' : '포인트 차감'} 완료: ${Math.abs(pointChange)}p`, 'success');
    } catch (error) {
      console.error('포인트 처리 실패:', error);
      toast.showToast('포인트 처리 실패: ' + error.message, 'error');
    } finally {
      setCsActionLoading(false);
    }
  };

  // 포션 지급/차감 (독립적으로 사용 가능)
  const handlePotionAction = async (action, targetUid = null) => {
    const uid = targetUid || csSearchResult?.uid;
    if (!uid) {
      toast.showToast('UID를 입력하거나 사용자를 검색해주세요.', 'error');
      return;
    }

    const amount = parseInt(csPotionAmount);
    if (!amount || amount <= 0) {
      toast.showToast('올바른 포션 개수를 입력해주세요.', 'error');
      return;
    }

    if (!csPotionReason || !csPotionReason.trim()) {
      toast.showToast('사유를 입력해주세요.', 'error');
      return;
    }

    setCsActionLoading(true);
    toast.showToast(`${action === 'add' ? '포션 지급' : '포션 차감'} 중...`, 'info');

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        toast.showToast('사용자를 찾을 수 없습니다.', 'error');
        return;
      }

      const userData = userDoc.data();
      const currentPotions = userData.potions || {};
      const currentCount = currentPotions[csPotionType] || 0;

      const newCount = action === 'add'
        ? currentCount + amount
        : Math.max(0, currentCount - amount);

      const updatedPotions = {
        ...currentPotions,
        [csPotionType]: newCount
      };

      await updateDoc(doc(db, 'users', uid), {
        potions: updatedPotions,
        updatedAt: Timestamp.now()
      });

      // 검색 결과가 있으면 업데이트
      if (csSearchResult && csSearchResult.uid === uid) {
        setCsSearchResult({ ...csSearchResult, potions: updatedPotions });
      }

      // 입력 필드 초기화
      setCsPotionAmount('');
      setCsPotionReason('');

      toast.showToast(`${action === 'add' ? '포션 지급' : '포션 차감'} 완료: ${csPotionType} ${Math.abs(amount)}개`, 'success');
    } catch (error) {
      console.error('포션 처리 실패:', error);
      toast.showToast('포션 처리 실패: ' + error.message, 'error');
    } finally {
      setCsActionLoading(false);
    }
  };

  // 구독 상태 변경 (독립적으로 사용 가능)
  const handlePremiumToggle = async (premiumType, targetUid = null) => {
    const uid = targetUid || csSearchResult?.uid;
    if (!uid) {
      toast.showToast('UID를 입력하거나 사용자를 검색해주세요.', 'error');
      return;
    }

    setCsActionLoading(true);
    const action = premiumType === 'none' ? '해지' : premiumType === 'monthly' ? '월간 프리미엄 부여' : '연간 프리미엄 부여';
    toast.showToast(`${action} 중...`, 'info');

    try {
      // 사용자 정보 확인
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        toast.showToast('사용자를 찾을 수 없습니다.', 'error');
        return;
      }

      const updateData = {
        isMonthlyPremium: premiumType === 'monthly',
        isYearlyPremium: premiumType === 'yearly',
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'users', uid), updateData);

      // 검색 결과가 있으면 업데이트
      if (csSearchResult && csSearchResult.uid === uid) {
        setCsSearchResult({
          ...csSearchResult,
          isMonthlyPremium: premiumType === 'monthly',
          isYearlyPremium: premiumType === 'yearly'
        });
      }

      toast.showToast(`${action} 완료`, 'success');
    } catch (error) {
      console.error('구독 상태 변경 실패:', error);
      toast.showToast('구독 상태 변경 실패: ' + error.message, 'error');
    } finally {
      setCsActionLoading(false);
    }
  };

  // 조건부 사용자 검색
  const handleSearchUsers = async () => {
    if (!searchValue) {
      setStatus({ type: 'error', message: '검색 값을 입력해주세요.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '사용자 검색 중...' });

    try {
      let value = searchValue;

      // 숫자 필드인 경우 숫자로 변환
      if (['point', 'createdAt', 'lastLoginAt'].includes(searchField)) {
        value = isNaN(searchValue) ? searchValue : parseInt(searchValue);
      }

      // 불린 필드인 경우 불린으로 변환
      if (['reminderEnabled', 'eventEnabled', 'marketingEnabled', 'isActive'].includes(searchField)) {
        value = searchValue === 'true';
      }

      const searchResults = await getUsersByCondition(searchField, searchOperator, value);
      setUsers(searchResults);
      setStatus({
        type: 'success',
        message: `검색 완료: ${searchResults.length}명의 사용자를 찾았습니다.`
      });
    } catch (error) {
      setStatus({ type: 'error', message: '사용자 검색 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 모든 사용자 조회
  const handleLoadAllUsers = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '모든 사용자 로드 중...' });

    try {
      await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
    } finally {
      setLoading(false);
    }
  };


  // 현재 사용자 동기화
  const handleSyncCurrentUser = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '현재 사용자 동기화 중...' });

    try {
      const result = await syncCurrentUser(500);
      if (result.success) {
        if (result.skipped) {
          setStatus({ type: 'success', message: '현재 사용자는 이미 Firestore에 존재합니다.' });
        } else {
          setStatus({ type: 'success', message: '현재 사용자 동기화 완료!' });
        }
        await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
      } else {
        setStatus({ type: 'error', message: '현재 사용자 동기화 실패' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '현재 사용자 동기화 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 테스트 사용자 생성
  const handleCreateTestUsers = async () => {
    if (!window.confirm('테스트 사용자 3명을 생성하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '테스트 사용자 생성 중...' });

    try {
      const result = await createTestUsers();
      setStatus({
        type: 'success',
        message: `테스트 사용자 생성 완료: 성공 ${result.success}명, 실패 ${result.failed}명`
      });

      await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
    } catch (error) {
      setStatus({ type: 'error', message: '테스트 사용자 생성 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 수동 사용자 생성
  const handleCreateManualUser = async () => {
    if (!manualUserData.uid || !manualUserData.email) {
      setStatus({ type: 'error', message: 'UID와 이메일은 필수입니다.' });
      return;
    }

    if (!window.confirm(`사용자 ${manualUserData.email}을 생성하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '수동 사용자 생성 중...' });

    try {
      const result = await createManualUser(manualUserData);
      if (result.success) {
        if (result.skipped) {
          setStatus({ type: 'success', message: '사용자가 이미 존재합니다.' });
        } else {
          setStatus({ type: 'success', message: '수동 사용자 생성 완료!' });
        }
        await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
      } else {
        setStatus({ type: 'error', message: '수동 사용자 생성 실패: ' + result.error });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '수동 사용자 생성 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 디버깅: 사용자 프로필 상태 확인
  const handleCheckAllUserProfiles = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '사용자 프로필 상태 확인 중...' });

    try {
      const result = await checkAllUserProfiles();
      setDebugInfo(result);
      setStatus({
        type: 'success',
        message: result.message
      });
    } catch (error) {
      setStatus({ type: 'error', message: '프로필 상태 확인 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };


  // 디버깅: Firestore 사용자 목록 새로고침
  const handleRefreshFirestoreUsers = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Firestore 사용자 목록 새로고침 중...' });

    try {
      const firestoreUsers = await getAllFirestoreUsers();
      setUsers(firestoreUsers);
      setStatus({
        type: 'success',
        message: `새로고침 완료: ${firestoreUsers.length}명의 사용자`
      });
    } catch (error) {
      setStatus({ type: 'error', message: '새로고침 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 프로필 이미지 업데이트 핸들러
  const handleUpdateEmptyProfileImages = async () => {
    if (!window.confirm('빈 프로필 이미지를 가진 사용자들의 프로필을 기본 이미지로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '프로필 이미지 업데이트 중...' });

    try {
      const result = await updateEmptyProfileImages();

      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message
        });
        await loadUsersPage(); // 페이지 새로고침
      } else {
        setStatus({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '프로필 이미지 업데이트 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndUpdateAllProfileImages = async () => {
    if (!window.confirm('모든 사용자의 프로필 이미지를 확인하고 빈 값이 있으면 기본 이미지로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '프로필 이미지 확인 및 업데이트 중...' });

    try {
      const result = await checkAndUpdateAllProfileImages();

      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message
        });
        await loadUsersPage(); // 페이지 새로고침
      } else {
        setStatus({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '프로필 이미지 업데이트 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmptyDisplayNames = async () => {
    if (!window.confirm('빈 displayName을 가진 사용자들의 닉네임을 이메일의 앞부분으로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'displayName 업데이트 중...' });

    try {
      const result = await updateEmptyDisplayNames();

      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message
        });
        await loadUsersPage(); // 페이지 새로고침
      } else {
        setStatus({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'displayName 업데이트 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndUpdateAllUserProfiles = async () => {
    if (!window.confirm('모든 사용자의 프로필 정보(닉네임, 프로필 이미지)를 확인하고 빈 값이 있으면 기본값으로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '프로필 정보 확인 및 업데이트 중...' });

    try {
      const result = await checkAndUpdateAllUserProfiles();

      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message
        });
        await loadUsersPage(); // 페이지 새로고침
      } else {
        setStatus({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '프로필 정보 업데이트 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 사용자 포인트 일괄 업데이트 (기존 함수)
  const handleBulkUpdatePoints = async () => {
    if (!window.confirm('모든 사용자의 포인트를 1000으로 설정하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '포인트 일괄 업데이트 중...' });

    try {
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        const success = await updateUserData(user.uid, { point: 1000 });
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      setStatus({
        type: 'success',
        message: `포인트 업데이트 완료: 성공 ${successCount}명, 실패 ${failCount}명`
      });

      await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
    } catch (error) {
      setStatus({ type: 'error', message: '포인트 업데이트 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 유저 상세 정보/활동 내역 불러오기
  const openUserDetail = async (u) => {
    setSelectedUser(u);
    setDetailLoading(true);

    // Firestore에서 최신 사용자 정보 가져오기 (previousLoginAt 포함)
    try {
      const userDoc = await getDoc(doc(db, 'users', u.uid));
      if (userDoc.exists()) {
        const latestUserData = { uid: u.uid, ...userDoc.data() };
        setUserDetail(latestUserData);
      } else {
        // 문서가 없으면 기본 정보 사용
        setUserDetail(u);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      setUserDetail(u);
    }

    // 활동 내역 fetch (예시: diaries, novels, comments 컬렉션)
    try {
      const promises = [
        // orderBy를 제거하고 클라이언트에서 정렬 (인덱스 불필요)
        getDocs(query(collection(db, 'diaries'), where('uid', '==', u.uid))),
        getDocs(query(collection(db, 'novels'), where('uid', '==', u.uid))),
        getDocs(query(collection(db, 'comments'), where('uid', '==', u.uid))),
      ];

      const [diariesSnap, novelsSnap, commentsSnap] = await Promise.all(promises);

      // 클라이언트에서 정렬 및 최대 10개 제한
      const sortByCreatedAt = (a, b) => {
        const aTime = a.createdAt?.seconds || a.createdAt || 0;
        const bTime = b.createdAt?.seconds || b.createdAt || 0;
        return bTime - aTime; // 내림차순
      };

      const diaries = diariesSnap.docs.map(d => d.data()).sort(sortByCreatedAt).slice(0, 10);
      const novels = novelsSnap.docs.map(n => n.data()).sort(sortByCreatedAt).slice(0, 10);
      const comments = commentsSnap.docs.map(c => c.data()).sort(sortByCreatedAt).slice(0, 10);

      setUserActivity({
        diaries,
        novels,
        comments,
      });
    } catch (e) {
      console.error('사용자 활동 내역 조회 실패:', e);
      setUserActivity({ diaries: [], novels: [], comments: [] });
    } finally {
      setDetailLoading(false);
    }
  };
  const closeUserDetail = () => { setSelectedUser(null); setUserDetail(null); setUserActivity({ diaries: [], novels: [], comments: [] }); };

  // 가입일/접속일 포맷 함수 (년월일 시간 초까지 표시)
  const formatDate = (val) => {
    if (!val) return '없음';
    const dateOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    let date;
    if (val.seconds) {
      date = new Date(val.seconds * 1000);
    } else if (val.toDate && typeof val.toDate === 'function') {
      date = val.toDate();
    } else if (typeof val === 'string' || typeof val === 'number') {
      date = new Date(val);
    } else {
      return '없음';
    }

    if (isNaN(date.getTime())) return '없음';

    return date.toLocaleString('ko-KR', dateOptions);
  };


  // 계정 정지/해제 핸들러
  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setStatusActionLoading(true);
    setStatusActionStatus(null);
    try {
      const newStatus = selectedUser.status === '정지' ? '정상' : '정지';
      const ok = await updateUserData(selectedUser.uid, { status: newStatus });
      if (ok) {
        setUserDetail({ ...selectedUser, status: newStatus });
        setStatusActionStatus({ type: 'success', message: `상태가 '${newStatus}'로 변경됨` });
      } else {
        setStatusActionStatus({ type: 'error', message: '상태 변경 실패' });
      }
    } catch (e) {
      setStatusActionStatus({ type: 'error', message: '상태 변경 오류: ' + e.message });
    } finally {
      setStatusActionLoading(false);
    }
  };
  // 계정 탈퇴(삭제) 핸들러
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm('정말로 이 계정을 완전히 삭제하시겠습니까?')) return;
    setStatusActionLoading(true);
    setStatusActionStatus(null);
    try {
      await deleteDoc(doc(db, 'users', selectedUser.uid));
      setStatusActionStatus({ type: 'success', message: '계정이 삭제되었습니다.' });
      setTimeout(() => { closeUserDetail(); loadUsersPage(); }, 1000);
    } catch (e) {
      setStatusActionStatus({ type: 'error', message: '계정 삭제 오류: ' + e.message });
    } finally {
      setStatusActionLoading(false);
    }
  };

  // 탈퇴한 회원 찾기
  const handleFindInactiveUsers = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const result = await findInactiveUsers();
      setCleanupResult(result);
      if (result.success) {
        toast.showToast(`${result.count}명의 비활성 사용자를 찾았습니다.`, 'success');
      } else {
        toast.showToast('비활성 사용자 조회 실패: ' + result.message, 'error');
      }
    } catch (error) {
      setCleanupResult({ success: false, error: error.message });
      toast.showToast('오류 발생: ' + error.message, 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

  // 오래된 비활성 사용자 찾기
  const handleFindOldInactiveUsers = async (days = 365) => {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const result = await findOldInactiveUsers(days);
      setCleanupResult(result);
      if (result.success) {
        toast.showToast(`${result.count}명의 오래된 비활성 사용자를 찾았습니다.`, 'success');
      } else {
        toast.showToast('오래된 비활성 사용자 조회 실패: ' + result.message, 'error');
      }
    } catch (error) {
      setCleanupResult({ success: false, error: error.message });
      toast.showToast('오류 발생: ' + error.message, 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

  // 탈퇴한 회원 정리 실행
  const handleCleanupDeletedUsers = async (dryRun = false) => {
    if (!cleanupResult || !cleanupResult.users || cleanupResult.users.length === 0) {
      toast.showToast('먼저 탈퇴한 회원을 찾아주세요.', 'error');
      return;
    }

    const confirmMessage = dryRun
      ? `[DRY RUN] ${cleanupResult.users.length}명의 탈퇴한 회원을 정리하시겠습니까? (실제 삭제는 수행하지 않습니다)`
      : `정말로 ${cleanupResult.users.length}명의 탈퇴한 회원을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`;

    if (!window.confirm(confirmMessage)) return;

    setCleanupLoading(true);
    try {
      const userIds = cleanupResult.users.map(u => u.uid);
      const result = await cleanupDeletedUsers(userIds, { dryRun });

      if (result.success) {
        toast.showToast(
          dryRun
            ? `[DRY RUN] ${result.success}명의 사용자 정리 예정`
            : `탈퇴한 회원 정리 완료: 성공 ${result.success}명, 실패 ${result.failed}명`,
          'success'
        );
        setCleanupResult(null); // 결과 초기화
        loadUsersPage(); // 목록 새로고침
      } else {
        toast.showToast('탈퇴한 회원 정리 실패: ' + result.message, 'error');
      }
    } catch (error) {
      toast.showToast('오류 발생: ' + error.message, 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

  // 자동 정리 (비활성 + 오래된 사용자)
  const handleAutoCleanup = async (daysInactive = 365, dryRun = false) => {
    const confirmMessage = dryRun
      ? `[DRY RUN] ${daysInactive}일 이상 로그인하지 않은 비활성 사용자를 자동으로 정리하시겠습니까? (실제 삭제는 수행하지 않습니다)`
      : `정말로 ${daysInactive}일 이상 로그인하지 않은 비활성 사용자를 자동으로 정리하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`;

    if (!window.confirm(confirmMessage)) return;

    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const result = await cleanupInactiveUsers({ daysInactive, dryRun });

      if (result.success) {
        toast.showToast(
          dryRun
            ? `[DRY RUN] ${result.count || 0}명의 사용자 정리 예정`
            : `자동 정리 완료: 성공 ${result.success}명, 실패 ${result.failed}명`,
          'success'
        );
        loadUsersPage(); // 목록 새로고침
      } else {
        toast.showToast('자동 정리 실패: ' + result.message, 'error');
      }
      setCleanupResult(result);
    } catch (error) {
      toast.showToast('오류 발생: ' + error.message, 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

  // 프리미엄 상태 변경 핸들러



  // 마케팅 알림 수신 사용자 조회
  const handleCheckMarketingUsers = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '마케팅 알림 수신 사용자 조회 중...' });

    try {
      console.log('🔍 마케팅 알림 수신 사용자 조회 시작...');
      const marketingUsers = await getUsersByCondition('marketingEnabled', '==', true);
      console.log('✅ 마케팅 알림 수신 사용자 조회 완료:', marketingUsers.length, '명');

      // 이메일과 이름만 추출
      const simpleList = marketingUsers.map(user => ({
        email: user.email || '이메일 없음',
        displayName: user.displayName || '이름 없음'
      }));

      console.log('📋 마케팅 알림 수신 사용자 목록 (이메일, 이름):');
      simpleList.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      });

      // 간단한 목록 상태에 저장
      setMarketingUsersList(simpleList);

      setStatus({
        type: 'success',
        message: `마케팅 알림 수신 동의한 사용자: ${marketingUsers.length}명`
      });
      toast.showToast(`마케팅 알림 수신 사용자 ${marketingUsers.length}명을 찾았습니다.`, 'success');
    } catch (error) {
      console.error('❌ 마케팅 알림 수신 사용자 조회 실패:', error);
      setStatus({ type: 'error', message: '마케팅 알림 수신 사용자 조회 실패: ' + error.message });
      toast.showToast('마케팅 알림 수신 사용자 조회 실패: ' + error.message, 'error');
      setMarketingUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestMarketingNotification = async () => {
    setNotificationType('marketing');
    setNotificationTitle('스토리포션 테스트 마케팅 알림');
    setNotificationMessage(`안녕하세요, 스토리포션 팀입니다!

이것은 테스트용 마케팅 알림입니다.

새로운 기능과 이벤트 소식을 받아보세요!

감사합니다.
스토리포션 팀 드림`);
    setNotificationImageUrl('');
    setNotificationLinkUrl('');
    toast.showToast('테스트 마케팅 알림 정보가 입력되었습니다. 발송 버튼을 눌러주세요.', 'success');
  };


  return (
    <Container theme={theme}>
      <PageTitle theme={theme}>
        사용자 관리
        <CloseButton theme={theme} onClick={() => navigate('/my')} title="닫기">
          ×
        </CloseButton>
      </PageTitle>

      {/* 사용자 목록 - 모든 관리자 */}
      <Section theme={theme}>
        <SectionTitle theme={theme} onClick={() => toggleSection('userList')}>
          <span>👥 사용자 목록</span>
          <AccordionIcon theme={theme} isOpen={openSections.userList}>▼</AccordionIcon>
        </SectionTitle>
        <SectionContent isOpen={openSections.userList}>
          {/* 검색 영역 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '15px',
            padding: '10px',
            background: theme.theme === 'dark' ? '#2c3e50' : '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minWidth: '200px' }}>
              <Input
                theme={theme}
                type="text"
                placeholder="이름 또는 이메일로 검색..."
                value={simpleSearchTerm}
                onChange={(e) => setSimpleSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSimpleSearch();
                  }
                }}
                style={{
                  width: '100%',
                  paddingRight: simpleSearchTerm ? '80px' : '45px'
                }}
              />
              {simpleSearchTerm && (
                <button
                  onClick={handleResetSearch}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '45px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: loading
                      ? (theme.theme === 'dark' ? '#555' : '#ccc')
                      : (theme.theme === 'dark' ? '#bdc3c7' : '#666'),
                    fontSize: '16px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.backgroundColor = theme.theme === 'dark' ? '#34495e' : '#e0e0e0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  title="초기화"
                >
                  ✕
                </button>
              )}
              <button
                onClick={handleSimpleSearch}
                disabled={loading || !simpleSearchTerm.trim()}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: loading || !simpleSearchTerm.trim() ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: loading || !simpleSearchTerm.trim()
                    ? (theme.theme === 'dark' ? '#555' : '#ccc')
                    : (theme.theme === 'dark' ? '#bdc3c7' : '#666'),
                  fontSize: '18px'
                }}
                title="검색"
              >
                🔍
              </button>
            </div>
          </div>

          {/* 목록개수, 정렬기준, 내림/오름차순 - 한 줄로 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'nowrap',
            marginBottom: '10px'
          }}>
            <Select
              theme={theme}
              value={pageLimit || 'all'}
              onChange={async (e) => {
                const value = e.target.value;
                if (value === 'all') {
                  setPageLimit(null);
                  // 페이지네이션 상태 초기화
                  setLastDoc(null);
                  setPageStack([]);
                  // 전체 로드
                  await loadUsersPage({ limit: 10000 });
                } else {
                  const newLimit = parseInt(value);
                  setPageLimit(newLimit);
                  // 페이지네이션 상태 초기화
                  setLastDoc(null);
                  setPageStack([]);
                  // 목록 즉시 다시 로드
                  await loadUsersPage();
                }
              }}
              style={{ width: '65px', flex: '0 0 auto' }}
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
              <option value="all">전체</option>
            </Select>
            <Select
              theme={theme}
              value={orderByField}
              onChange={(e) => {
                handleSortFieldChange(e.target.value);
              }}
              style={{ flex: '1 1 auto', minWidth: '100px', maxWidth: '150px' }}
            >
              <option value="createdAt">가입일</option>
              <option value="lastLoginAt">최근 접속일</option>
              <option value="point">포인트</option>
              <option value="displayName">이름</option>
              <option value="premium">프리미엄</option>
              <option value="status">상태</option>
            </Select>
            <Select
              theme={theme}
              value={orderDir}
              onChange={(e) => {
                handleSortDirChange(e.target.value);
              }}
              style={{ flex: '0 0 auto', width: '90px' }}
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </Select>
          </div>

          {/* 데스크톱 테이블 */}
          <div style={{ overflowX: 'auto' }}>
            <UserTable theme={theme}>
              <TableHeader theme={theme}>
                <tr>
                  <TableHeaderCell theme={theme}>닉네임</TableHeaderCell>
                  <TableHeaderCell theme={theme}>프리미엄</TableHeaderCell>
                  <TableHeaderCell theme={theme}>포인트</TableHeaderCell>
                  <TableHeaderCell theme={theme}>상태</TableHeaderCell>
                  <TableHeaderCell theme={theme}>가입일</TableHeaderCell>
                  <TableHeaderCell theme={theme}>최근 접속일</TableHeaderCell>
                </tr>
              </TableHeader>
              <tbody>
                {users.map((user) => (
                  <TableRow key={user.uid} theme={theme} onClick={() => openUserDetail(user)}>
                    <TableCell theme={theme}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=3498db&color=fff&size=32`}
                          alt={user.displayName || 'User'}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=3498db&color=fff&size=32`;
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ lineHeight: '1.2' }}>{user.displayName || '이름 없음'}</strong>
                          <div style={{ fontSize: '12px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666', lineHeight: '1.2' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell theme={theme}>
                      {renderPremiumBadge(user)}
                    </TableCell>
                    <TableCell theme={theme}>
                      <span style={{ color: '#3498f3', fontWeight: 'bold', fontSize: '11px' }}>{user.point || 0}p</span>
                    </TableCell>
                    <TableCell theme={theme}>
                      {renderStatusBadge(user.status)}
                    </TableCell>
                    <TableCell theme={theme} style={{ fontSize: '12px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell theme={theme} style={{ fontSize: '12px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </UserTable>
          </div>

          {/* 모바일 카드 - 컴팩트 버전 */}
          <MobileCardContainer>
            {users.map((user) => (
              <MobileUserCard key={user.uid} theme={theme} onClick={() => openUserDetail(user)}>
                <MobileCardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=3498db&color=fff&size=28`}
                      alt={user.displayName || 'User'}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=3498db&color=fff&size=28`;
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <MobileCardTitle theme={theme} style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '13px'
                      }}>{user.displayName || '이름 없음'}</MobileCardTitle>
                      <MobileCardEmail theme={theme} style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '10px'
                      }}>{user.email}</MobileCardEmail>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {renderStatusBadge(user.status)}
                      <span style={{
                        fontSize: '10px',
                        color: getPremiumColor(user),
                        fontWeight: '600',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: getPremiumColor(user) === '#FFC300' ? 'rgba(255, 195, 0, 0.15)' :
                          getPremiumColor(user) === '#3498db' ? 'rgba(52, 152, 219, 0.15)' :
                            'rgba(149, 165, 166, 0.15)',
                        fontSize: '10px'
                      }}>{getPremiumText(user)}</span>
                      <span style={{
                        fontSize: '11px',
                        color: '#3498f3',
                        fontWeight: 'bold'
                      }}>{user.point || 0}p</span>
                    </div>
                  </div>
                </MobileCardHeader>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9px',
                  color: theme.theme === 'dark' ? '#bdc3c7' : '#666',
                  marginTop: '4px',
                  paddingTop: '4px',
                  borderTop: `1px solid ${theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'}`,
                  flexWrap: 'wrap',
                  gap: '4px',
                  lineHeight: '1.3'
                }}>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ fontWeight: '500' }}>가입:</span> {formatDate(user.createdAt)}
                  </span>
                  <span style={{ margin: '0 4px', flexShrink: 0 }}>•</span>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ fontWeight: '500' }}>접속:</span> {formatDate(user.lastLoginAt)}
                  </span>
                </div>
              </MobileUserCard>
            ))}
          </MobileCardContainer>

          {users.length === 0 && (
            <div style={{ textAlign: 'center', color: theme.theme === 'dark' ? '#bdc3c7' : '#666', padding: '20px' }}>사용자가 없습니다.</div>
          )}
          <div style={{
            marginTop: 8,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'nowrap'
          }}>
            <Button
              onClick={handlePrevPage}
              disabled={pageStack.length === 0}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                minHeight: 'auto',
                height: '28px',
                width: '60px'
              }}
            >
              이전
            </Button>
            <span style={{
              color: theme.text,
              fontSize: '14px',
              fontWeight: '500',
              padding: '0 12px',
              whiteSpace: 'nowrap'
            }}>
              {pageStack.length + 1}/{totalUsers ? Math.ceil(totalUsers / pageLimit) : '?'}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={!lastDoc}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                minHeight: 'auto',
                height: '28px',
                width: '60px'
              }}
            >
              다음
            </Button>
          </div>
        </SectionContent>
      </Section>

      {/* 유저 및 포인트 관리 (CS 처리용) - ⭐ 필수 */}
      <Section theme={theme}>
        <SectionTitle theme={theme} onClick={() => toggleSection('userPointManagement')}>
          <span>⭐ 유저 및 포인트 관리 (CS 처리용)</span>
          <AccordionIcon theme={theme} isOpen={openSections.userPointManagement}>▼</AccordionIcon>
        </SectionTitle>
        <SectionContent isOpen={openSections.userPointManagement}>
          <InfoText theme={theme}>
            유저 문의 시("결제했는데 포인트가 안 들어왔어요", "실수로 눌렀어요") 바로 해결할 수 있는 기능입니다.
          </InfoText>

          {/* 유저 검색 */}
          <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
            <ButtonGroupTitle theme={theme}>유저 조회</ButtonGroupTitle>
            <div style={{
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              flexDirection: isMobile ? 'column' : 'row',
              marginBottom: '10px'
            }}>
              <Select
                theme={theme}
                value={csSearchType}
                onChange={(e) => setCsSearchType(e.target.value)}
                style={{
                  width: isMobile ? '100%' : '120px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                <option value="displayName">닉네임</option>
                <option value="email">이메일</option>
                <option value="uid">UID</option>
              </Select>
              <Input
                theme={theme}
                type="text"
                placeholder={csSearchType === 'uid' ? 'UID 입력' : csSearchType === 'email' ? '이메일 입력' : '닉네임 입력'}
                value={csSearchTerm}
                onChange={(e) => setCsSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCsSearch();
                  }
                }}
                style={{
                  flex: isMobile ? 'none' : '1 1 auto',
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 'auto' : '200px'
                }}
              />
              <Button
                theme={theme}
                onClick={handleCsSearch}
                disabled={csActionLoading || !csSearchTerm.trim()}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                검색
              </Button>
            </div>

            {/* 검색 결과 리스트 (여러 개일 때) */}
            {csSearchResults.length > 1 && !csSearchResult && (
              <div style={{
                padding: isMobile ? '12px' : '15px',
                background: theme.theme === 'dark' ? '#2c3e50' : '#f5f5f5',
                borderRadius: '8px',
                marginBottom: isMobile ? '16px' : '20px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <div style={{
                  marginBottom: '10px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 'bold',
                  color: theme.text
                }}>
                  검색 결과 ({csSearchResults.length}명)
                </div>
                {csSearchResults.map((user, index) => (
                  <div
                    key={user.uid}
                    onClick={() => handleSelectUser(user)}
                    style={{
                      padding: isMobile ? '10px' : '12px',
                      marginBottom: index < csSearchResults.length - 1 ? '8px' : '0',
                      background: theme.theme === 'dark' ? '#34495e' : '#ffffff',
                      borderRadius: '6px',
                      border: `1px solid ${theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: isMobile ? '13px' : '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.theme === 'dark' ? '#3d566e' : '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.theme === 'dark' ? '#34495e' : '#ffffff';
                    }}
                  >
                    <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                      {user.displayName || '이름 없음'}
                    </div>
                    <div style={{ marginBottom: '2px', wordBreak: 'break-all', fontSize: isMobile ? '12px' : '13px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>
                      {user.email || '이메일 없음'}
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: theme.theme === 'dark' ? '#95a5a6' : '#999' }}>
                      UID: {user.uid.substring(0, 20)}...
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 선택된 사용자 정보 */}
            {csSearchResult && (
              <div style={{
                padding: isMobile ? '12px' : '15px',
                background: theme.theme === 'dark' ? '#2c3e50' : '#f5f5f5',
                borderRadius: '8px',
                marginBottom: isMobile ? '16px' : '20px',
                fontSize: isMobile ? '14px' : '15px'
              }}>
                <div style={{
                  marginBottom: '10px',
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: 'bold',
                  color: theme.text
                }}>
                  선택된 사용자
                </div>
                <div style={{ marginBottom: isMobile ? '8px' : '10px', wordBreak: 'break-all' }}>
                  <strong>UID:</strong> {csSearchResult.uid}
                </div>
                <div style={{ marginBottom: isMobile ? '8px' : '10px' }}>
                  <strong>닉네임:</strong> {csSearchResult.displayName || '없음'}
                </div>
                <div style={{ marginBottom: isMobile ? '8px' : '10px', wordBreak: 'break-all' }}>
                  <strong>이메일:</strong> {csSearchResult.email || '없음'}
                </div>
                <div style={{ marginBottom: isMobile ? '8px' : '10px' }}>
                  <strong>포인트:</strong> {csSearchResult.point || 0}p
                </div>
                <div style={{ marginBottom: isMobile ? '8px' : '10px' }}>
                  <strong>프리미엄:</strong> {csSearchResult.isYearlyPremium ? '연간' : csSearchResult.isMonthlyPremium ? '월간' : '일반'}
                </div>
                {csSearchResult.potions && (
                  <div style={{ marginBottom: isMobile ? '8px' : '10px' }}>
                    <strong>포션:</strong> {Object.entries(csSearchResult.potions)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => `${type}: ${count}개`)
                      .join(', ') || '없음'}
                  </div>
                )}
                {csSearchResults.length > 1 && (
                  <Button
                    theme={theme}
                    onClick={() => {
                      setCsSearchResult(null);
                      setCsPointUid('');
                      setCsPotionUid('');
                      setCsPremiumUid('');
                    }}
                    style={{
                      marginTop: '10px',
                      fontSize: isMobile ? '12px' : '13px',
                      padding: isMobile ? '8px 12px' : '6px 10px',
                      minHeight: isMobile ? '36px' : 'auto'
                    }}
                  >
                    다른 사용자 선택
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* 포인트 지급/차감 */}
          <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
            <ButtonGroupTitle theme={theme}>포인트 수동 지급 & 차감</ButtonGroupTitle>
            <div style={{
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              marginBottom: '10px'
            }}>
              <Input
                theme={theme}
                type="text"
                placeholder="UID (검색 결과가 있으면 자동 사용)"
                value={csPointUid}
                onChange={(e) => setCsPointUid(e.target.value)}
                style={{
                  flex: isMobile ? 'none' : '0 0 auto',
                  width: isMobile ? '100%' : '200px',
                  minHeight: isMobile ? '44px' : 'auto',
                  backgroundColor: csSearchResult ? (theme.theme === 'dark' ? '#34495e' : '#e8f5e9') : undefined
                }}
                disabled={!!csSearchResult}
              />
              <Input
                theme={theme}
                type="number"
                placeholder="포인트"
                value={csPointAmount}
                onChange={(e) => setCsPointAmount(e.target.value)}
                style={{
                  width: isMobile ? '100%' : '120px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              />
              <Input
                theme={theme}
                type="text"
                placeholder="사유 (예: 서버 오류 보상)"
                value={csPointReason}
                onChange={(e) => setCsPointReason(e.target.value)}
                style={{
                  flex: isMobile ? 'none' : '1 1 auto',
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 'auto' : '200px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              />
              <div style={{
                display: 'flex',
                gap: isMobile ? '8px' : '10px',
                width: isMobile ? '100%' : 'auto'
              }}>
                <Button
                  theme={theme}
                  onClick={() => handlePointAction('add', csPointUid || csSearchResult?.uid)}
                  disabled={csActionLoading || !csPointAmount || !csPointReason.trim() || (!csPointUid && !csSearchResult?.uid)}
                  style={{
                    backgroundColor: '#27ae60',
                    flex: isMobile ? '1 1 auto' : 'none',
                    minHeight: isMobile ? '44px' : 'auto'
                  }}
                >
                  지급
                </Button>
                <Button
                  theme={theme}
                  variant="danger"
                  onClick={() => handlePointAction('deduct', csPointUid || csSearchResult?.uid)}
                  disabled={csActionLoading || !csPointAmount || !csPointReason.trim() || (!csPointUid && !csSearchResult?.uid)}
                  style={{
                    flex: isMobile ? '1 1 auto' : 'none',
                    minHeight: isMobile ? '44px' : 'auto'
                  }}
                >
                  차감
                </Button>
              </div>
            </div>
          </div>

          {/* 포션 지급/차감 */}
          <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
            <ButtonGroupTitle theme={theme}>포션 수동 지급 & 차감</ButtonGroupTitle>
            <div style={{
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              marginBottom: '10px'
            }}>
              <Input
                theme={theme}
                type="text"
                placeholder="UID (검색 결과가 있으면 자동 사용)"
                value={csPotionUid}
                onChange={(e) => setCsPotionUid(e.target.value)}
                style={{
                  flex: isMobile ? 'none' : '0 0 auto',
                  width: isMobile ? '100%' : '200px',
                  minHeight: isMobile ? '44px' : 'auto',
                  backgroundColor: csSearchResult ? (theme.theme === 'dark' ? '#34495e' : '#e8f5e9') : undefined
                }}
                disabled={!!csSearchResult}
              />
              <Select
                theme={theme}
                value={csPotionType}
                onChange={(e) => setCsPotionType(e.target.value)}
                style={{
                  width: isMobile ? '100%' : '150px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                <option value="romance">로맨스</option>
                <option value="historical">사극</option>
                <option value="mystery">미스터리</option>
                <option value="horror">공포</option>
                <option value="fairytale">동화</option>
                <option value="fantasy">판타지</option>
              </Select>
              <Input
                theme={theme}
                type="number"
                placeholder="개수"
                value={csPotionAmount}
                onChange={(e) => setCsPotionAmount(e.target.value)}
                style={{
                  width: isMobile ? '100%' : '120px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              />
              <Input
                theme={theme}
                type="text"
                placeholder="사유"
                value={csPotionReason}
                onChange={(e) => setCsPotionReason(e.target.value)}
                style={{
                  flex: isMobile ? 'none' : '1 1 auto',
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 'auto' : '200px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              />
              <div style={{
                display: 'flex',
                gap: isMobile ? '8px' : '10px',
                width: isMobile ? '100%' : 'auto'
              }}>
                <Button
                  theme={theme}
                  onClick={() => handlePotionAction('add', csPotionUid || csSearchResult?.uid)}
                  disabled={csActionLoading || !csPotionAmount || !csPotionReason.trim() || (!csPotionUid && !csSearchResult?.uid)}
                  style={{
                    backgroundColor: '#27ae60',
                    flex: isMobile ? '1 1 auto' : 'none',
                    minHeight: isMobile ? '44px' : 'auto'
                  }}
                >
                  지급
                </Button>
                <Button
                  theme={theme}
                  variant="danger"
                  onClick={() => handlePotionAction('deduct', csPotionUid || csSearchResult?.uid)}
                  disabled={csActionLoading || !csPotionAmount || !csPotionReason.trim() || (!csPotionUid && !csSearchResult?.uid)}
                  style={{
                    flex: isMobile ? '1 1 auto' : 'none',
                    minHeight: isMobile ? '44px' : 'auto'
                  }}
                >
                  차감
                </Button>
              </div>
            </div>
          </div>

          {/* 구독 상태 변경 */}
          <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
            <ButtonGroupTitle theme={theme}>구독 상태 변경</ButtonGroupTitle>
            <div style={{
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              marginBottom: '10px'
            }}>
              <Input
                theme={theme}
                type="text"
                placeholder="UID (검색 결과가 있으면 자동 사용)"
                value={csPremiumUid}
                onChange={(e) => setCsPremiumUid(e.target.value)}
                style={{
                  flex: isMobile ? 'none' : '0 0 auto',
                  width: isMobile ? '100%' : '200px',
                  minHeight: isMobile ? '44px' : 'auto',
                  backgroundColor: csSearchResult ? (theme.theme === 'dark' ? '#34495e' : '#e8f5e9') : undefined
                }}
                disabled={!!csSearchResult}
              />
            </div>
            <div style={{
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: isMobile ? 'nowrap' : 'wrap'
            }}>
              <Button
                theme={theme}
                onClick={() => handlePremiumToggle('monthly', csPremiumUid || csSearchResult?.uid)}
                disabled={csActionLoading || (!csPremiumUid && !csSearchResult?.uid) || (csSearchResult?.isMonthlyPremium)}
                style={{
                  backgroundColor: csSearchResult?.isMonthlyPremium ? '#95a5a6' : '#3498db',
                  opacity: csSearchResult?.isMonthlyPremium ? 0.6 : 1,
                  width: isMobile ? '100%' : 'auto',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                월간 프리미엄 부여
              </Button>
              <Button
                theme={theme}
                onClick={() => handlePremiumToggle('yearly', csPremiumUid || csSearchResult?.uid)}
                disabled={csActionLoading || (!csPremiumUid && !csSearchResult?.uid) || (csSearchResult?.isYearlyPremium)}
                style={{
                  backgroundColor: csSearchResult?.isYearlyPremium ? '#95a5a6' : '#FFC300',
                  opacity: csSearchResult?.isYearlyPremium ? 0.6 : 1,
                  width: isMobile ? '100%' : 'auto',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                연간 프리미엄 부여
              </Button>
              <Button
                theme={theme}
                variant="danger"
                onClick={() => handlePremiumToggle('none', csPremiumUid || csSearchResult?.uid)}
                disabled={csActionLoading || (!csPremiumUid && !csSearchResult?.uid) || (!csSearchResult?.isMonthlyPremium && !csSearchResult?.isYearlyPremium)}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                프리미엄 해지
              </Button>
            </div>
          </div>
        </SectionContent>
      </Section>

      {/* 프로필 정보 업데이트 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('profileUpdate')}>
            <span>👤 프로필 정보 업데이트</span>
            <AccordionIcon theme={theme} isOpen={openSections.profileUpdate}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.profileUpdate}>
            <ButtonGroup theme={theme}>
              <ButtonGroupTitle theme={theme}>프로필 관리</ButtonGroupTitle>
              <Button
                onClick={handleUpdateEmptyProfileImages}
                disabled={loading}
                style={{ backgroundColor: '#9b59b6' }}
              >
                {loading ? '업데이트 중...' : '빈 프로필 이미지 업데이트'}
              </Button>
              <Button
                onClick={handleUpdateEmptyDisplayNames}
                disabled={loading}
                style={{ backgroundColor: '#e67e22' }}
              >
                {loading ? '업데이트 중...' : '빈 닉네임 업데이트'}
              </Button>
              <Button
                onClick={handleCheckAndUpdateAllUserProfiles}
                disabled={loading}
                style={{ backgroundColor: '#27ae60' }}
              >
                {loading ? '확인 중...' : '전체 프로필 정보 확인 및 업데이트'}
              </Button>
            </ButtonGroup>
          </SectionContent>
        </Section>
      )}


      {/* 디버깅 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('debugging')}>
            <span>🔧 디버깅</span>
            <AccordionIcon theme={theme} isOpen={openSections.debugging}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.debugging}>
            <ButtonGroup theme={theme}>
              <ButtonGroupTitle theme={theme}>디버깅 도구</ButtonGroupTitle>
              <Button
                onClick={handleCheckAllUserProfiles}
                disabled={loading}
                style={{ backgroundColor: '#34495e' }}
              >
                {loading ? '확인 중...' : '사용자 프로필 상태 확인'}
              </Button>


              <Button
                onClick={handleRefreshFirestoreUsers}
                disabled={loading}
                style={{ backgroundColor: '#16a085' }}
              >
                {loading ? '새로고침 중...' : 'Firestore 새로고침'}
              </Button>
            </ButtonGroup>

            {/* 디버깅 결과 표시 */}
            {debugInfo && (
              <div style={{
                background: theme.theme === 'dark' ? '#34495e' : '#f8f9fa',
                padding: '15px',
                borderRadius: '5px',
                marginTop: '15px',
                fontSize: '14px',
                border: theme.theme === 'dark' ? '1px solid #2c3e50' : '1px solid #dee2e6',
                color: theme.text
              }}>
                <strong>🔍 디버깅 결과:</strong><br />
                {debugInfo.missingUsers && debugInfo.missingUsers.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong style={{ color: '#e74c3c' }}>❌ 누락된 사용자 ({debugInfo.missingUsers.length}명):</strong><br />
                    {debugInfo.missingUsers.map((user, index) => (
                      <div key={index} style={{ marginLeft: '10px', marginTop: '5px' }}>
                        • {user.email} (UID: {user.uid})
                        {user.error && <span style={{ color: '#e74c3c' }}> - 오류: {user.error}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {debugInfo.existingUsers && debugInfo.existingUsers.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong style={{ color: '#27ae60' }}>✅ 존재하는 사용자 ({debugInfo.existingUsers.length}명):</strong><br />
                    {debugInfo.existingUsers.map((user, index) => (
                      <div key={index} style={{ marginLeft: '10px', marginTop: '5px' }}>
                        • {user.email} (UID: {user.uid})
                      </div>
                    ))}
                  </div>
                )}

                {debugInfo.issues && debugInfo.issues.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong style={{ color: '#e67e22' }}>⚠️ 문제점:</strong><br />
                    {debugInfo.issues.map((issue, index) => (
                      <div key={index} style={{ marginLeft: '10px', marginTop: '5px' }}>
                        • {issue}
                      </div>
                    ))}
                  </div>
                )}

                {debugInfo.solutions && debugInfo.solutions.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong style={{ color: '#3498db' }}>💡 해결방법:</strong><br />
                    {debugInfo.solutions.map((solution, index) => (
                      <div key={index} style={{ marginLeft: '10px', marginTop: '5px' }}>
                        • {solution}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionContent>
        </Section>
      )}


      {/* 마케팅/이벤트 알림 발송 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('notifications')}>
            <span>📢 마케팅/이벤트 알림 발송</span>
            <AccordionIcon theme={theme} isOpen={openSections.notifications}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.notifications}>
            <div style={{ marginBottom: '15px', color: theme.subText || '#888', fontSize: '14px' }}>
              {notificationType === 'marketing'
                ? '마케팅 알림 수신 동의한 사용자에게 알림을 발송합니다.'
                : '이벤트 알림 수신 동의한 사용자에게 알림을 발송합니다.'}
            </div>

            {/* 마케팅 알림 수신 사용자 조회 버튼 */}
            <div style={{ marginBottom: '15px' }}>
              <Button
                onClick={handleCheckMarketingUsers}
                disabled={loading || notificationSending}
                style={{
                  backgroundColor: '#3498db',
                  width: '100%',
                  fontSize: isMobile ? '14px' : '13px',
                  padding: isMobile ? '12px' : '8px',
                  minHeight: isMobile ? '44px' : 'auto',
                  marginBottom: '10px'
                }}
              >
                {loading ? '조회 중...' : '🔍 마케팅 알림 수신 사용자 조회'}
              </Button>
            </div>

            {/* 마케팅 알림 수신 사용자 목록 표시 */}
            {marketingUsersList.length > 0 && (
              <div style={{
                marginBottom: '15px',
                padding: '15px',
                backgroundColor: theme.theme === 'dark' ? '#2c3e50' : '#f8f9fa',
                borderRadius: '8px',
                border: `1px solid ${theme.theme === 'dark' ? '#34495e' : '#e0e0e0'}`,
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <div style={{
                  marginBottom: '10px',
                  fontWeight: 'bold',
                  color: theme.text,
                  fontSize: '16px'
                }}>
                  마케팅 알림 수신 사용자 ({marketingUsersList.length}명)
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {marketingUsersList.map((user, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '10px',
                        backgroundColor: theme.theme === 'dark' ? '#34495e' : 'white',
                        borderRadius: '6px',
                        border: `1px solid ${theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'}`,
                        fontSize: '14px',
                        color: theme.text
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {user.displayName}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.theme === 'dark' ? '#bdc3c7' : '#666'
                      }}>
                        {user.email}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 테스트 마케팅 알림 생성 버튼 */}
            <div style={{ marginBottom: '15px' }}>
              <Button
                onClick={handleCreateTestMarketingNotification}
                disabled={notificationSending}
                style={{
                  backgroundColor: '#9b59b6',
                  width: '100%',
                  fontSize: isMobile ? '14px' : '13px',
                  padding: isMobile ? '12px' : '8px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                🧪 테스트 마케팅 알림 생성
              </Button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.text }}>
                알림 유형:
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  width: '200px',
                  backgroundColor: theme.theme === 'dark' ? '#2c3e50' : 'white',
                  color: theme.text
                }}
              >
                <option value="marketing">마케팅 알림</option>
                <option value="event">이벤트 알림</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.text }}>
                제목 <span style={{ color: '#e74c3c' }}>*</span>:
              </label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="알림 제목을 입력하세요"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: theme.theme === 'dark' ? '#2c3e50' : 'white',
                  color: theme.text
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.text }}>
                메시지 <span style={{ color: '#e74c3c' }}>*</span>:
              </label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="알림 메시지를 입력하세요"
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: theme.theme === 'dark' ? '#2c3e50' : 'white',
                  color: theme.text,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.text }}>
                이미지 URL (선택):
              </label>
              <input
                type="url"
                value={notificationImageUrl}
                onChange={(e) => setNotificationImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: theme.theme === 'dark' ? '#2c3e50' : 'white',
                  color: theme.text
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.text }}>
                링크 URL (선택):
              </label>
              <input
                type="url"
                value={notificationLinkUrl}
                onChange={(e) => setNotificationLinkUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: theme.theme === 'dark' ? '#2c3e50' : 'white',
                  color: theme.text
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <Button
                onClick={async () => {
                  if (!notificationTitle.trim() || !notificationMessage.trim()) {
                    toast.showToast('제목과 메시지는 필수입니다.', 'error');
                    return;
                  }

                  setNotificationSending(true);
                  try {
                    const functions = getFunctions(undefined, 'us-central1');
                    const sendNotification = httpsCallable(
                      functions,
                      notificationType === 'marketing' ? 'sendMarketingNotification' : 'sendEventNotification'
                    );

                    const result = await sendNotification({
                      title: notificationTitle,
                      message: notificationMessage,
                      imageUrl: notificationImageUrl || undefined,
                      linkUrl: notificationLinkUrl || undefined
                    });

                    const data = result.data;
                    console.log('알림 발송 결과 (전체):', JSON.stringify(data, null, 2));
                    if (data.success) {
                      let successMessage = `✅ 알림 발송 완료!\n\n📊 발송 결과:\n- 전체 대상: ${data.totalUsers || 0}명\n- 성공: ${data.sentCount || 0}명\n- 실패: ${data.failureCount || 0}명\n- 토큰 없음: ${data.tokenMissingCount || 0}명\n\n${data.message || ''}`;

                      // 실패 원인 상세 정보 추가
                      if (data.failureCount > 0) {
                        console.log('실패 원인 데이터 확인:', {
                          hasFailureReasons: !!data.failureReasons,
                          hasFailureDetails: !!data.failureDetails,
                          failureReasons: data.failureReasons,
                          failureDetails: data.failureDetails
                        });

                        if (data.failureReasons && Object.keys(data.failureReasons).length > 0) {
                          successMessage += `\n\n❌ 실패 원인 상세:\n`;
                          Object.entries(data.failureReasons).forEach(([code, count]) => {
                            const reasonText = getFailureReasonText(code);
                            successMessage += `- ${reasonText}: ${count}건\n`;
                          });
                        } else {
                          successMessage += `\n\n⚠️ 실패 원인 정보가 없습니다. Firebase Functions 로그를 확인하세요.`;
                          console.warn('실패 원인 정보가 응답에 포함되지 않았습니다. Functions가 최신 버전으로 배포되었는지 확인하세요.');
                        }

                        // 실패 상세 정보를 콘솔에 출력
                        if (data.failureDetails && data.failureDetails.length > 0) {
                          console.error('실패 상세 정보:', data.failureDetails);
                          console.error('처음 5개 실패 사례:');
                          data.failureDetails.forEach((detail, idx) => {
                            console.error(`${idx + 1}. 코드: ${detail.code}, 메시지: ${detail.message}`);
                          });
                        } else {
                          console.warn('실패 상세 정보가 없습니다. Firebase Functions 로그에서 확인하세요.');
                        }
                      }

                      toast.showToast(successMessage, 'success');

                      // 상세 정보를 콘솔에도 출력
                      if (data.sentCount === 0) {
                        console.warn('⚠️ 알림이 발송되지 않았습니다. 확인 사항:');
                        console.warn('1. marketingEnabled가 true인 사용자가 있는지 확인');
                        console.warn('2. FCM 토큰이 있는 사용자가 있는지 확인');
                        console.warn('3. Firebase Functions 로그 확인:');
                        console.warn('   - Firebase Console > Functions > sendMarketingNotification > Logs');
                        console.warn('   - "[마케팅] 배치 X 실패 원인 통계:" 로그 확인');
                        if (data.failureCount > 0) {
                          console.error('4. FCM 전송 실패 - Firebase Functions 로그에서 실패 원인 확인 필요');
                          console.error('   일반적인 실패 원인:');
                          console.error('   - invalid-registration-token: FCM 토큰이 만료되었거나 유효하지 않음');
                          console.error('   - registration-token-not-registered: 앱이 재설치되어 토큰이 등록 해제됨');
                          console.error('   - 해결: 사용자가 다시 로그인하거나 앱을 재설치해야 함');
                        }
                      }
                      // 폼 초기화
                      setNotificationTitle('');
                      setNotificationMessage('');
                      setNotificationImageUrl('');
                      setNotificationLinkUrl('');
                    } else {
                      toast.showToast(`❌ 알림 발송 실패\n\n${data.message || '알 수 없는 오류가 발생했습니다.'}`, 'error');
                    }
                  } catch (error) {
                    console.error('알림 발송 오류:', error);
                    console.error('오류 상세:', {
                      code: error.code,
                      message: error.message,
                      details: error.details
                    });
                    toast.showToast(
                      `❌ 알림 발송 실패\n\n${error.message || '알림 발송 중 오류가 발생했습니다.'}\n\n브라우저 콘솔을 확인하세요.`,
                      'error'
                    );
                  } finally {
                    setNotificationSending(false);
                  }
                }}
                disabled={notificationSending || !notificationTitle.trim() || !notificationMessage.trim()}
                style={{
                  backgroundColor: notificationType === 'marketing' ? '#e74c3c' : '#3498db',
                  width: '100%'
                }}
              >
                {notificationSending
                  ? '발송 중...'
                  : `${notificationType === 'marketing' ? '마케팅' : '이벤트'} 알림 발송`}
              </Button>
            </div>
          </SectionContent>
        </Section>
      )}

      {/* 탈퇴한 회원 정리 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('cleanupUsers')}>
            <span>🗑️ 탈퇴한 회원 정리</span>
            <AccordionIcon theme={theme} isOpen={openSections.cleanupUsers}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.cleanupUsers}>
            <InfoText theme={theme}>
              Firebase에 남아있는 탈퇴한 회원들을 찾아서 정리할 수 있습니다.
              <br />
              <strong style={{ color: '#e74c3c' }}>⚠️ 주의: 이 작업은 되돌릴 수 없습니다!</strong>
            </InfoText>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 비활성 사용자 찾기 */}
              <Button
                onClick={handleFindInactiveUsers}
                disabled={cleanupLoading}
                style={{
                  backgroundColor: '#3498db',
                  width: '100%',
                  fontSize: isMobile ? '14px' : '13px',
                  padding: isMobile ? '12px' : '8px'
                }}
              >
                {cleanupLoading ? '조회 중...' : '🔍 비활성 사용자 찾기 (isActive=false)'}
              </Button>

              {/* 오래된 비활성 사용자 찾기 */}
              <Button
                onClick={() => handleFindOldInactiveUsers(365)}
                disabled={cleanupLoading}
                style={{
                  backgroundColor: '#9b59b6',
                  width: '100%',
                  fontSize: isMobile ? '14px' : '13px',
                  padding: isMobile ? '12px' : '8px'
                }}
              >
                {cleanupLoading ? '조회 중...' : '🔍 오래된 비활성 사용자 찾기 (1년 이상 미로그인)'}
              </Button>

              {/* 자동 정리 (DRY RUN) */}
              <Button
                onClick={() => handleAutoCleanup(365, true)}
                disabled={cleanupLoading}
                style={{
                  backgroundColor: '#f39c12',
                  width: '100%',
                  fontSize: isMobile ? '14px' : '13px',
                  padding: isMobile ? '12px' : '8px'
                }}
              >
                {cleanupLoading ? '실행 중...' : '🧪 자동 정리 테스트 (DRY RUN)'}
              </Button>

              {/* 자동 정리 (실제 삭제) */}
              <Button
                onClick={() => handleAutoCleanup(365, false)}
                disabled={cleanupLoading}
                style={{
                  backgroundColor: '#e74c3c',
                  width: '100%',
                  fontSize: isMobile ? '14px' : '13px',
                  padding: isMobile ? '12px' : '8px'
                }}
              >
                {cleanupLoading ? '정리 중...' : '🗑️ 자동 정리 실행 (1년 이상 미로그인)'}
              </Button>

              {/* 찾은 사용자 정리 (DRY RUN) */}
              {cleanupResult && cleanupResult.users && cleanupResult.users.length > 0 && (
                <>
                  <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ marginBottom: '10px', fontWeight: 'bold', color: theme.text }}>
                      찾은 사용자: {cleanupResult.users.length}명
                    </div>
                    {cleanupResult.users.slice(0, 5).map((u, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: theme.subText || '#666', marginBottom: '5px' }}>
                        - {u.email || u.displayName || u.uid}
                        {u.lastLoginAt && ` (마지막 로그인: ${new Date(u.lastLoginAt).toLocaleDateString()})`}
                      </div>
                    ))}
                    {cleanupResult.users.length > 5 && (
                      <div style={{ fontSize: '12px', color: theme.subText || '#666' }}>
                        ... 외 {cleanupResult.users.length - 5}명
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleCleanupDeletedUsers(true)}
                    disabled={cleanupLoading}
                    style={{
                      backgroundColor: '#f39c12',
                      width: '100%',
                      fontSize: isMobile ? '14px' : '13px',
                      padding: isMobile ? '12px' : '8px',
                      marginTop: '10px'
                    }}
                  >
                    {cleanupLoading ? '테스트 중...' : `🧪 정리 테스트 (DRY RUN) - ${cleanupResult.users.length}명`}
                  </Button>

                  <Button
                    onClick={() => handleCleanupDeletedUsers(false)}
                    disabled={cleanupLoading}
                    style={{
                      backgroundColor: '#e74c3c',
                      width: '100%',
                      fontSize: isMobile ? '14px' : '13px',
                      padding: isMobile ? '12px' : '8px'
                    }}
                  >
                    {cleanupLoading ? '정리 중...' : `🗑️ 정리 실행 - ${cleanupResult.users.length}명`}
                  </Button>
                </>
              )}

              {/* 결과 표시 */}
              {cleanupResult && (
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: cleanupResult.success ? '#d4edda' : '#f8d7da',
                  borderRadius: '8px',
                  border: `1px solid ${cleanupResult.success ? '#c3e6cb' : '#f5c6cb'}`,
                  color: cleanupResult.success ? '#155724' : '#721c24'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {cleanupResult.success ? '✅ 성공' : '❌ 실패'}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    {cleanupResult.message || cleanupResult.error}
                  </div>
                  {cleanupResult.success && cleanupResult.deletedCount !== undefined && (
                    <div style={{ fontSize: '13px', marginTop: '5px' }}>
                      삭제된 항목: {cleanupResult.deletedCount}개
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionContent>
        </Section>
      )}

      {/* 유저 상세 정보 모달 */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '16px' : '20px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }} onClick={closeUserDetail}>
          <div style={{
            background: theme.theme === 'dark' ? '#2c3e50' : 'white',
            color: theme.text,
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            minWidth: isMobile ? 'auto' : 400,
            maxWidth: isMobile ? '100%' : '90%',
            width: isMobile ? '100%' : 'auto',
            maxHeight: isMobile ? '90vh' : '85vh',
            overflowY: 'auto',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            boxSizing: 'border-box',
            border: theme.theme === 'dark' ? '1px solid #34495e' : 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '10px' : '16px' }}>
              <h2 style={{
                fontSize: isMobile ? '16px' : '20px',
                margin: 0,
                fontWeight: 'bold'
              }}>유저 상세 정보</h2>
              <button onClick={closeUserDetail} style={{
                background: 'none',
                border: 'none',
                fontSize: isMobile ? '24px' : '20px',
                color: theme.text,
                cursor: 'pointer',
                padding: '0',
                width: isMobile ? '32px' : '28px',
                height: isMobile ? '32px' : '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                lineHeight: 1
              }}>×</button>
            </div>
            {detailLoading ? <div style={{ padding: isMobile ? '20px 0' : '40px 0', textAlign: 'center' }}>로딩 중...</div> : userDetail && (
              <div>
                {/* 기본 정보 - 컴팩트하게 */}
                <div style={{
                  marginBottom: isMobile ? '10px' : '12px',
                  padding: isMobile ? '10px' : '12px',
                  background: theme.theme === 'dark' ? '#34495e' : '#f8f9fa',
                  borderRadius: isMobile ? '6px' : '8px',
                  fontSize: isMobile ? '13px' : '14px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: isMobile ? '6px' : '8px',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    <div><b style={{ fontSize: isMobile ? '12px' : '13px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>이메일:</b><br />{userDetail.email}</div>
                    <div><b style={{ fontSize: isMobile ? '12px' : '13px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>닉네임:</b><br />{userDetail.displayName}</div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: isMobile ? '6px' : '8px',
                    fontSize: isMobile ? '12px' : '13px'
                  }}>
                    <div><b style={{ fontSize: isMobile ? '12px' : '13px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>가입일:</b> {formatDate(userDetail.createdAt)}</div>
                    <div><b style={{ fontSize: isMobile ? '12px' : '13px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>최근 접속:</b> {formatDate(userDetail.lastLoginAt) || '없음'}</div>
                    <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                      <b style={{ fontSize: isMobile ? '12px' : '13px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>이전 접속:</b> {formatDate(userDetail.previousLoginAt) || '없음'}
                    </div>
                  </div>
                </div>

                {/* 포인트/프리미엄/상태 - 인라인으로 컴팩트하게 */}
                <div style={{
                  marginBottom: isMobile ? '10px' : '12px',
                  padding: isMobile ? '8px' : '10px',
                  background: theme.theme === 'dark' ? '#34495e' : '#f8f9fa',
                  borderRadius: isMobile ? '6px' : '8px',
                  fontSize: isMobile ? '12px' : '13px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: isMobile ? '8px' : '12px',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>포인트:</span>
                    <span style={{ color: '#3498f3', fontWeight: 'bold', fontSize: '11px' }}>{userDetail.point || 0}p</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>프리미엄:</span>
                    {renderPremiumBadge(userDetail)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>상태:</span>
                    {renderStatusBadge(userDetail.status)}
                  </div>
                </div>

                {/* 관리 버튼 */}
                {isMainAdmin(user) && (
                  <div style={{
                    marginBottom: isMobile ? '10px' : '12px',
                    display: 'flex',
                    gap: isMobile ? '6px' : '8px',
                    flexWrap: 'wrap'
                  }}>
                    <Button
                      onClick={handleToggleStatus}
                      disabled={statusActionLoading}
                      style={{
                        background: '#f39c12',
                        fontSize: isMobile ? '12px' : '13px',
                        padding: isMobile ? '10px 12px' : '8px 16px',
                        flex: isMobile ? '1 1 calc(50% - 3px)' : '1',
                        minHeight: isMobile ? '44px' : 'auto'
                      }}
                    >
                      {userDetail.status === '정지' ? '정지 해제' : '계정 정지'}
                    </Button>
                    <Button
                      onClick={handleDeleteUser}
                      disabled={statusActionLoading}
                      style={{
                        background: '#e74c3c',
                        fontSize: isMobile ? '12px' : '13px',
                        padding: isMobile ? '10px 12px' : '8px 16px',
                        flex: isMobile ? '1 1 calc(50% - 3px)' : '1',
                        minHeight: isMobile ? '44px' : 'auto'
                      }}
                    >
                      계정 삭제
                    </Button>
                  </div>
                )}
                {statusActionStatus && (
                  <div style={{
                    marginBottom: isMobile ? '8px' : '10px',
                    padding: isMobile ? '6px 8px' : '8px 10px',
                    background: statusActionStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: statusActionStatus.type === 'success' ? '#155724' : '#721c24',
                    borderRadius: isMobile ? '4px' : '6px',
                    fontSize: isMobile ? '11px' : '12px'
                  }}>
                    {statusActionStatus.message}
                  </div>
                )}

                {/* 활동 내역 - 컴팩트하게 */}
                {(userActivity.diaries.length > 0 || userActivity.novels.length > 0 || userActivity.comments.length > 0) && (
                  <div style={{ marginTop: isMobile ? '10px' : '12px', paddingTop: isMobile ? '10px' : '12px', borderTop: `1px solid ${theme.theme === 'dark' ? '#34495e' : '#e0e0e0'}` }}>
                    {userActivity.diaries.length > 0 && (
                      <div style={{ marginBottom: isMobile ? '10px' : '12px' }}>
                        <b style={{ fontSize: isMobile ? '13px' : '14px', display: 'block', marginBottom: isMobile ? '6px' : '8px' }}>최근 일기 ({userActivity.diaries.length})</b>
                        <ul style={{ margin: 0, paddingLeft: isMobile ? '18px' : '20px', fontSize: isMobile ? '12px' : '13px' }}>
                          {userActivity.diaries.slice(0, 3).map((d, i) => (
                            <li key={i} style={{ marginBottom: isMobile ? '4px' : '6px', lineHeight: 1.4 }}>
                              {d.title || '(제목 없음)'} <span style={{ color: '#888', fontSize: isMobile ? '11px' : '12px' }}>{formatDate(d.createdAt)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {userActivity.novels.length > 0 && (
                      <div style={{ marginBottom: isMobile ? '10px' : '12px' }}>
                        <b style={{ fontSize: isMobile ? '13px' : '14px', display: 'block', marginBottom: isMobile ? '6px' : '8px' }}>최근 소설 ({userActivity.novels.length})</b>
                        <ul style={{ margin: 0, paddingLeft: isMobile ? '18px' : '20px', fontSize: isMobile ? '12px' : '13px' }}>
                          {userActivity.novels.slice(0, 3).map((n, i) => (
                            <li key={i} style={{ marginBottom: isMobile ? '4px' : '6px', lineHeight: 1.4 }}>
                              {n.title || '(제목 없음)'} <span style={{ color: '#888', fontSize: isMobile ? '11px' : '12px' }}>{formatDate(n.createdAt)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {userActivity.comments.length > 0 && (
                      <div>
                        <b style={{ fontSize: isMobile ? '13px' : '14px', display: 'block', marginBottom: isMobile ? '6px' : '8px' }}>최근 댓글 ({userActivity.comments.length})</b>
                        <ul style={{ margin: 0, paddingLeft: isMobile ? '18px' : '20px', fontSize: isMobile ? '12px' : '13px' }}>
                          {userActivity.comments.slice(0, 3).map((c, i) => (
                            <li key={i} style={{ marginBottom: isMobile ? '4px' : '6px', lineHeight: 1.4 }}>
                              {c.content || '(내용 없음)'} <span style={{ color: '#888', fontSize: isMobile ? '11px' : '12px' }}>{formatDate(c.createdAt)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}

export default UserManagement; 