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
  givePointsToAllUsers,
  givePointsToUsersByCondition,
  getPointsStatistics,
  pointUpdateExamples
} from '../../utils/bulkPointUpdate';
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
import { collection, query, where, getDocs, orderBy, limit as fsLimit, doc, deleteDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.2' : '0.1'});
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 2px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.2' : '0.1'});
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
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 12px;
    opacity: 0.5;
    min-height: 120px;
  }
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 12px;
`;

const MobileCardTitle = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
`;

const MobileCardEmail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  word-break: break-all;
`;

const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#e0e0e0'};
`;

const MobileCardLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
`;

const MobileCardValue = styled.span`
  font-size: 14px;
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
  const [pointAmount, setPointAmount] = useState(500);
  const [pointReason, setPointReason] = useState('기본 포인트 지급');
  const [pointsStats, setPointsStats] = useState(null);
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
  const [pointInput, setPointInput] = useState(0);
  const [pointActionLoading, setPointActionLoading] = useState(false);
  const [pointActionStatus, setPointActionStatus] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionStatus, setStatusActionStatus] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 아코디언 상태 관리
  const [openSections, setOpenSections] = useState({
    userList: false, // 사용자 목록은 기본적으로 닫힘
    profileUpdate: false,
    pointManagement: false,
    debugging: false,
    notifications: false,
    announcements: false,
    cleanupUsers: false
  });
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

  // 공지사항 관리 상태
  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: ''
  });

  // 페이지네이션/정렬 상태
  const [pageLimit, setPageLimit] = useState(10);
  const [orderByField, setOrderByField] = useState('createdAt');
  const [orderDir, setOrderDir] = useState('desc');
  const [lastDoc, setLastDoc] = useState(null);
  const [pageStack, setPageStack] = useState([]); // 이전 페이지 스택
  const [totalUsers, setTotalUsers] = useState(null); // 전체 사용자 수

  // 상태 표시용 컬러 뱃지
  const renderStatusBadge = (status) => {
    let color = '#2ecc40', text = '정상';
    if (status === '정지') { color = '#e74c3c'; text = '정지'; }
    if (status === '탈퇴') { color = '#95a5a6'; text = '탈퇴'; }
    return <span style={{ background: color, color: 'white', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{text}</span>;
  };

  // 프리미엄 뱃지 렌더링
  const renderPremiumBadge = (user) => {
    if (user.isYearlyPremium) {
      return <PremiumBadge type="yearly" theme={theme}>연간 프리미엄</PremiumBadge>;
    } else if (user.isMonthlyPremium) {
      return <PremiumBadge type="monthly" theme={theme}>월간 프리미엄</PremiumBadge>;
    } else {
      return <PremiumBadge theme={theme}>일반</PremiumBadge>;
    }
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

      const { users: loadedUsers, lastDoc: newLastDoc } = await getUsersWithQuery({
        limit: needsClientSort ? 1000 : pageLimit, // 클라이언트 정렬을 위해 더 많이 가져옴
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

        // 페이지네이션 적용
        finalUsers = finalUsers.slice(0, pageLimit);
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

  // 포인트 통계 조회
  const handleLoadPointsStats = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '포인트 통계 조회 중...' });

    try {
      const stats = await getPointsStatistics();
      setPointsStats(stats);
      setStatus({ type: 'success', message: '포인트 통계 조회 완료' });
    } catch (error) {
      setStatus({ type: 'error', message: '포인트 통계 조회 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 포인트가 없는 사용자들에게 포인트 지급
  const handleGivePointsToZeroUsers = async () => {
    if (!window.confirm(`포인트가 0인 사용자들에게 ${pointAmount}포인트씩 지급하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '포인트 지급 중...' });

    try {
      const result = await givePointsToAllUsers(pointAmount, pointReason);
      setStatus({
        type: 'success',
        message: `포인트 지급 완료: 성공 ${result.success}명, 실패 ${result.failed}명 (총 ${result.total}명 중 ${result.usersWithoutPoints}명에게 지급)`
      });

      await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
      await handleLoadPointsStats();
    } catch (error) {
      setStatus({ type: 'error', message: '포인트 지급 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 조건부 포인트 지급
  const handleGivePointsByCondition = async () => {
    if (!searchValue) {
      setStatus({ type: 'error', message: '검색 조건을 입력해주세요.' });
      return;
    }

    if (!window.confirm(`조건에 맞는 사용자들에게 ${pointAmount}포인트씩 지급하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '조건부 포인트 지급 중...' });

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

      const result = await givePointsToUsersByCondition(
        { field: searchField, operator: searchOperator, value: value },
        pointAmount,
        pointReason
      );

      setStatus({
        type: 'success',
        message: `조건부 포인트 지급 완료: 성공 ${result.success}명, 실패 ${result.failed}명`
      });

      await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
      await handleLoadPointsStats();
    } catch (error) {
      setStatus({ type: 'error', message: '조건부 포인트 지급 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 현재 사용자 동기화
  const handleSyncCurrentUser = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '현재 사용자 동기화 중...' });

    try {
      const result = await syncCurrentUser(pointAmount);
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
    // 기본 정보
    setUserDetail(u);
    // 활동 내역 fetch (예시: diaries, novels, comments 컬렉션)
    try {
      const [diariesSnap, novelsSnap, commentsSnap] = await Promise.all([
        getDocs(query(collection(db, 'diaries'), where('uid', '==', u.uid), orderBy('createdAt', 'desc'), fsLimit(10))),
        getDocs(query(collection(db, 'novels'), where('uid', '==', u.uid), orderBy('createdAt', 'desc'), fsLimit(10))),
        getDocs(query(collection(db, 'comments'), where('uid', '==', u.uid), orderBy('createdAt', 'desc'), fsLimit(10))),
      ]);
      setUserActivity({
        diaries: diariesSnap.docs.map(d => d.data()),
        novels: novelsSnap.docs.map(n => n.data()),
        comments: commentsSnap.docs.map(c => c.data()),
      });
    } catch (e) {
      setUserActivity({ diaries: [], novels: [], comments: [] });
    } finally {
      setDetailLoading(false);
    }
  };
  const closeUserDetail = () => { setSelectedUser(null); setUserDetail(null); setUserActivity({ diaries: [], novels: [], comments: [] }); };

  // 가입일/접속일 포맷 함수
  const formatDate = (val) => {
    if (!val) return '';
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
    if (typeof val === 'string' || typeof val === 'number') return new Date(val).toLocaleString();
    return '';
  };

  // 포인트 지급/차감 핸들러
  const handlePointChange = async (delta) => {
    if (!selectedUser) return;
    setPointActionLoading(true);
    setPointActionStatus(null);
    try {
      const newPoint = (selectedUser.point || 0) + delta;
      const ok = await updateUserData(selectedUser.uid, { point: newPoint });
      if (ok) {
        setUserDetail({ ...selectedUser, point: newPoint });
        setPointActionStatus({ type: 'success', message: `포인트 ${delta > 0 ? '지급' : '차감'} 완료` });
      } else {
        setPointActionStatus({ type: 'error', message: '포인트 변경 실패' });
      }
    } catch (e) {
      setPointActionStatus({ type: 'error', message: '포인트 변경 오류: ' + e.message });
    } finally {
      setPointActionLoading(false);
    }
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
  const handleTogglePremium = async (premiumType) => {
    if (!selectedUser) return;
    setStatusActionLoading(true);
    setStatusActionStatus(null);
    try {
      let updateData = {};
      if (premiumType === 'monthly') {
        updateData = {
          isMonthlyPremium: !selectedUser.isMonthlyPremium,
          isYearlyPremium: false,
          premiumType: !selectedUser.isMonthlyPremium ? 'monthly' : null,
          premiumStartDate: !selectedUser.isMonthlyPremium ? new Date() : null,
          premiumRenewalDate: !selectedUser.isMonthlyPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        };
      } else if (premiumType === 'yearly') {
        updateData = {
          isYearlyPremium: !selectedUser.isYearlyPremium,
          isMonthlyPremium: false,
          premiumType: !selectedUser.isYearlyPremium ? 'yearly' : null,
          premiumStartDate: !selectedUser.isYearlyPremium ? new Date() : null,
          premiumRenewalDate: !selectedUser.isYearlyPremium ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null
        };
      } else {
        // 프리미엄 해제
        updateData = {
          isMonthlyPremium: false,
          isYearlyPremium: false,
          premiumType: null,
          premiumCancelled: true
        };
      }

      const ok = await updateUserData(selectedUser.uid, updateData);
      if (ok) {
        setUserDetail({ ...selectedUser, ...updateData });
        setStatusActionStatus({
          type: 'success',
          message: `프리미엄 상태가 ${premiumType === 'monthly' ? '월간' : premiumType === 'yearly' ? '연간' : '해제'}로 변경되었습니다.`
        });
        // 목록 새로고침
        setTimeout(() => loadUsersPage(), 500);
      } else {
        setStatusActionStatus({ type: 'error', message: '프리미엄 상태 변경 실패' });
      }
    } catch (e) {
      setStatusActionStatus({ type: 'error', message: '프리미엄 상태 변경 오류: ' + e.message });
    } finally {
      setStatusActionLoading(false);
    }
  };

  // 공지사항 관리 함수들
  const fetchAnnouncements = async () => {
    setAnnouncementLoading(true);
    try {
      const announcementsRef = collection(db, 'announcements');
      const q = query(announcementsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const announcementsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || null
        };
      });
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      toast.showToast('공지사항 조회 실패: ' + error.message, 'error');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin(user)) {
      fetchAnnouncements();
    }
  }, [user]);

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.showToast('제목과 내용을 입력해주세요.', 'error');
      return;
    }

    setAnnouncementLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: announcementForm.title,
        content: announcementForm.content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      toast.showToast('공지사항이 생성되었습니다.', 'success');
      setAnnouncementForm({ title: '', content: '' });
      fetchAnnouncements();
    } catch (error) {
      console.error('공지사항 생성 실패:', error);
      toast.showToast('공지사항 생성 실패: ' + error.message, 'error');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content
    });
  };

  const handleUpdateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.showToast('제목과 내용을 입력해주세요.', 'error');
      return;
    }

    setAnnouncementLoading(true);
    try {
      const announcementRef = doc(db, 'announcements', editingAnnouncement.id);
      await updateDoc(announcementRef, {
        title: announcementForm.title,
        content: announcementForm.content,
        updatedAt: Timestamp.now()
      });
      toast.showToast('공지사항이 수정되었습니다.', 'success');
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '' });
      fetchAnnouncements();
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      toast.showToast('공지사항 수정 실패: ' + error.message, 'error');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    setAnnouncementLoading(true);
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      toast.showToast('공지사항이 삭제되었습니다.', 'success');
      fetchAnnouncements();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      toast.showToast('공지사항 삭제 실패: ' + error.message, 'error');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: '', content: '' });
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

  const handleCreateTestAnnouncement = async () => {
    setAnnouncementLoading(true);
    try {
      const testAnnouncement = {
        title: '테스트 공지사항',
        content: `안녕하세요, 스토리포션 팀입니다.

이것은 테스트용 공지사항입니다.

테스트 내용:
- 공지사항 기능 테스트
- 관리자 페이지에서 생성 가능
- 사용자 페이지에서 확인 가능

감사합니다.
스토리포션 팀 드림`
      };

      await addDoc(collection(db, 'announcements'), {
        title: testAnnouncement.title,
        content: testAnnouncement.content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      toast.showToast('테스트 공지사항이 생성되었습니다.', 'success');
      fetchAnnouncements();
    } catch (error) {
      console.error('테스트 공지사항 생성 실패:', error);
      toast.showToast('테스트 공지사항 생성 실패: ' + error.message, 'error');
    } finally {
      setAnnouncementLoading(false);
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <Select
              theme={theme}
              value={pageLimit}
              onChange={(e) => {
                const newLimit = parseInt(e.target.value);
                setPageLimit(newLimit);
                // 목록 다시 로드
                setTimeout(() => {
                  loadUsersPage();
                }, 100);
              }}
              style={{ width: '100px', flex: '0 0 auto' }}
            >
              <option value={5}>5개</option>
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={30}>30개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </Select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flex: '1 1 auto' }}>
              <Select
                theme={theme}
                value={orderByField}
                onChange={(e) => {
                  handleSortFieldChange(e.target.value);
                }}
                style={{ flex: '1 1 auto', minWidth: '120px' }}
              >
                <option value="createdAt">가입일</option>
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
                style={{ flex: '1 1 auto', minWidth: '100px' }}
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </Select>
            </div>
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
                      <span style={{ color: '#3498f3', fontWeight: 'bold' }}>{user.point || 0}p</span>
                    </TableCell>
                    <TableCell theme={theme}>
                      {renderStatusBadge(user.status)}
                    </TableCell>
                    <TableCell theme={theme} style={{ fontSize: '12px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* 빈 행 추가 (10명 미만일 때) */}
                {Array.from({ length: Math.max(0, pageLimit - users.length) }).map((_, index) => (
                  <EmptyTableRow key={`empty-${index}`} theme={theme}>
                    <EmptyTableCell theme={theme} colSpan={5} style={{ textAlign: 'center' }}>
                      -
                    </EmptyTableCell>
                  </EmptyTableRow>
                ))}
              </tbody>
            </UserTable>
          </div>

          {/* 모바일 카드 */}
          <MobileCardContainer>
            {users.map((user) => (
              <MobileUserCard key={user.uid} theme={theme} onClick={() => openUserDetail(user)}>
                <MobileCardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=3498db&color=fff&size=40`}
                      alt={user.displayName || 'User'}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=3498db&color=fff&size=40`;
                      }}
                    />
                    <div>
                      <MobileCardTitle theme={theme}>{user.displayName || '이름 없음'}</MobileCardTitle>
                      <MobileCardEmail theme={theme}>{user.email}</MobileCardEmail>
                    </div>
                  </div>
                </MobileCardHeader>
                <MobileCardRow theme={theme} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '8px'
                }}>
                  <span>{renderStatusBadge(user.status)}</span>
                  <span style={{
                    fontSize: '12px',
                    color: theme.text,
                    fontWeight: '500'
                  }}>•</span>
                  <span style={{
                    fontSize: '13px',
                    color: getPremiumColor(user),
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: getPremiumColor(user) === '#FFC300' ? 'rgba(255, 195, 0, 0.15)' :
                      getPremiumColor(user) === '#3498db' ? 'rgba(52, 152, 219, 0.15)' :
                        'rgba(149, 165, 166, 0.15)'
                  }}>{getPremiumText(user)}</span>
                  <span style={{
                    fontSize: '12px',
                    color: theme.text,
                    fontWeight: '500'
                  }}>•</span>
                  <span style={{
                    fontSize: '14px',
                    color: '#3498f3',
                    fontWeight: 'bold'
                  }}>{user.point || 0}p</span>
                </MobileCardRow>
                <MobileCardRow theme={theme}>
                  <MobileCardLabel theme={theme}>가입일</MobileCardLabel>
                  <MobileCardValue theme={theme} style={{ fontSize: '12px' }}>{formatDate(user.createdAt)}</MobileCardValue>
                </MobileCardRow>
              </MobileUserCard>
            ))}
            {/* 빈 카드 추가 (10명 미만일 때) */}
            {Array.from({ length: Math.max(0, pageLimit - users.length) }).map((_, index) => (
              <EmptyMobileCard key={`empty-mobile-${index}`} theme={theme}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.theme === 'dark' ? '#555' : '#ccc',
                  fontSize: '14px'
                }}>
                  -
                </div>
              </EmptyMobileCard>
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

      {/* 포인트 지급 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('pointManagement')}>
            <span>💰 포인트 일괄 지급</span>
            <AccordionIcon theme={theme} isOpen={openSections.pointManagement}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.pointManagement}>
            <ButtonGroup theme={theme}>
              <ButtonGroupTitle theme={theme}>포인트 지급 설정</ButtonGroupTitle>
              <Input
                theme={theme}
                type="number"
                value={pointAmount}
                onChange={(e) => setPointAmount(parseInt(e.target.value) || 0)}
                placeholder="지급할 포인트"
                min="1"
                style={{ width: '120px' }}
              />
              <Input
                theme={theme}
                type="text"
                value={pointReason}
                onChange={(e) => setPointReason(e.target.value)}
                placeholder="지급 사유"
                style={{ width: '200px' }}
              />
              <Button
                onClick={handleGivePointsToZeroUsers}
                disabled={loading}
                style={{ backgroundColor: '#27ae60' }}
              >
                {loading ? '지급 중...' : '포인트 0인 사용자에게 지급'}
              </Button>
              <Button
                onClick={handleGivePointsByCondition}
                disabled={loading}
                style={{ backgroundColor: '#f39c12' }}
              >
                조건부 포인트 지급
              </Button>
            </ButtonGroup>

            {/* 포인트 통계 */}
            <div style={{ marginBottom: '15px' }}>
              <Button
                onClick={handleLoadPointsStats}
                disabled={loading}
                style={{ backgroundColor: '#9b59b6' }}
              >
                포인트 통계 조회
              </Button>

              {pointsStats && (
                <div style={{
                  background: theme.theme === 'dark' ? '#34495e' : '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  marginTop: '10px',
                  fontSize: '14px',
                  color: theme.text,
                  border: theme.theme === 'dark' ? '1px solid #2c3e50' : 'none'
                }}>
                  <strong>📊 포인트 통계:</strong><br />
                  총 사용자: {pointsStats.totalUsers}명<br />
                  포인트 보유: {pointsStats.usersWithPoints}명<br />
                  포인트 미보유: {pointsStats.usersWithoutPoints}명<br />
                  총 포인트: {pointsStats.totalPoints.toLocaleString()}p<br />
                  평균 포인트: {pointsStats.averagePoints}p<br />
                  최대 포인트: {pointsStats.maxPoints}p<br />
                  최소 포인트: {pointsStats.minPoints}p<br />
                  <strong>포인트 분포:</strong><br />
                  • 0p: {pointsStats.pointDistribution['0']}명<br />
                  • 1-100p: {pointsStats.pointDistribution['1-100']}명<br />
                  • 101-500p: {pointsStats.pointDistribution['101-500']}명<br />
                  • 501-1000p: {pointsStats.pointDistribution['501-1000']}명<br />
                  • 1000p+: {pointsStats.pointDistribution['1000+']}명
                </div>
              )}
            </div>
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

      {/* 공지사항 관리 - 모든 관리자 */}
      {isAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('announcements')}>
            <span>📢 공지사항 관리</span>
            <AccordionIcon theme={theme} isOpen={openSections.announcements}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.announcements}>
            <InfoText theme={theme}>
              공지사항을 생성, 수정, 삭제할 수 있습니다. 공지사항은 사용자 페이지의 공지사항 목록에 표시됩니다.
            </InfoText>

            {/* 테스트 공지사항 생성 버튼 */}
            <div style={{ marginBottom: isMobile ? '12px' : '15px' }}>
              <Button
                onClick={handleCreateTestAnnouncement}
                disabled={announcementLoading}
                style={{
                  backgroundColor: '#9b59b6',
                  width: '100%',
                  fontSize: isMobile ? '14px' : '13px',
                  padding: isMobile ? '12px' : '8px',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                {announcementLoading ? '생성 중...' : '🧪 테스트 공지사항 생성'}
              </Button>
            </div>

            {/* 공지사항 작성/수정 폼 */}
            <div style={{
              marginBottom: '20px',
              padding: isMobile ? '12px' : '15px',
              border: `1px solid ${theme.border || '#ddd'}`,
              borderRadius: '8px',
              backgroundColor: theme.theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9f9f9'
            }}>
              <h3 style={{ color: theme.text, marginBottom: isMobile ? '12px' : '15px', fontSize: isMobile ? '15px' : '16px' }}>
                {editingAnnouncement ? '공지사항 수정' : '새 공지사항 작성'}
              </h3>
              <div style={{ marginBottom: isMobile ? '12px' : '10px' }}>
                <label style={{ display: 'block', color: theme.text, marginBottom: '5px', fontSize: isMobile ? '13px' : '14px' }}>제목</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px' : '8px',
                    borderRadius: '4px',
                    border: `1px solid ${theme.border || '#ddd'}`,
                    backgroundColor: theme.theme === 'dark' ? '#2c3e50' : 'white',
                    color: theme.text,
                    fontSize: isMobile ? '15px' : '14px',
                    minHeight: isMobile ? '44px' : 'auto',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: isMobile ? '15px' : '15px' }}>
                <label style={{ display: 'block', color: theme.text, marginBottom: '5px', fontSize: isMobile ? '13px' : '14px' }}>내용</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={isMobile ? 6 : 8}
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px' : '8px',
                    borderRadius: '4px',
                    border: `1px solid ${theme.border || '#ddd'}`,
                    backgroundColor: theme.theme === 'dark' ? '#2c3e50' : 'white',
                    color: theme.text,
                    fontSize: isMobile ? '15px' : '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                {editingAnnouncement ? (
                  <>
                    <Button
                      onClick={handleUpdateAnnouncement}
                      disabled={announcementLoading}
                      style={{
                        backgroundColor: '#3498db',
                        flex: 1,
                        fontSize: isMobile ? '14px' : '13px',
                        padding: isMobile ? '12px' : '8px',
                        minHeight: isMobile ? '44px' : 'auto'
                      }}
                    >
                      {announcementLoading ? '수정 중...' : '수정하기'}
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      disabled={announcementLoading}
                      style={{
                        backgroundColor: '#95a5a6',
                        flex: 1,
                        fontSize: isMobile ? '14px' : '13px',
                        padding: isMobile ? '12px' : '8px',
                        minHeight: isMobile ? '44px' : 'auto'
                      }}
                    >
                      취소
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleCreateAnnouncement}
                    disabled={announcementLoading}
                    style={{
                      backgroundColor: '#27ae60',
                      width: '100%',
                      fontSize: isMobile ? '14px' : '13px',
                      padding: isMobile ? '12px' : '8px',
                      minHeight: isMobile ? '44px' : 'auto'
                    }}
                  >
                    {announcementLoading ? '생성 중...' : '공지사항 생성'}
                  </Button>
                )}
              </div>
            </div>

            {/* 공지사항 목록 */}
            <div>
              <h3 style={{ color: theme.text, marginBottom: isMobile ? '12px' : '15px', fontSize: isMobile ? '15px' : '16px' }}>
                공지사항 목록 ({announcements.length}개)
              </h3>
              {announcementLoading && announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: isMobile ? '30px 20px' : '20px', color: theme.subText || '#888', fontSize: isMobile ? '14px' : '13px' }}>
                  로딩 중...
                </div>
              ) : announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: isMobile ? '30px 20px' : '20px', color: theme.subText || '#888', fontSize: isMobile ? '14px' : '13px' }}>
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '10px' }}>
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      style={{
                        padding: isMobile ? '12px' : '15px',
                        border: `1px solid ${theme.border || '#ddd'}`,
                        borderRadius: '8px',
                        backgroundColor: theme.theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'flex-start',
                        marginBottom: isMobile ? '12px' : '10px',
                        gap: isMobile ? '10px' : '0'
                      }}>
                        <div style={{ flex: 1, width: '100%' }}>
                          <h4 style={{
                            color: theme.text,
                            margin: '0 0 5px 0',
                            fontSize: isMobile ? '15px' : '16px',
                            fontWeight: 'bold',
                            wordBreak: 'break-word'
                          }}>
                            {announcement.title}
                          </h4>
                          <div style={{
                            color: theme.subText || '#888',
                            fontSize: isMobile ? '11px' : '12px',
                            lineHeight: '1.4'
                          }}>
                            작성일: {announcement.createdAt.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            {announcement.updatedAt && (() => {
                              const updatedAt = announcement.updatedAt?.toDate ? announcement.updatedAt.toDate() : announcement.updatedAt;
                              const createdAt = announcement.createdAt;
                              if (updatedAt && createdAt && updatedAt.getTime() !== createdAt.getTime()) {
                                return (
                                  <div style={{ marginTop: isMobile ? '4px' : '0', marginLeft: isMobile ? '0' : '10px' }}>
                                    (수정일: {updatedAt.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })})
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: isMobile ? '8px' : '5px',
                          width: isMobile ? '100%' : 'auto',
                          marginTop: isMobile ? '0' : '0'
                        }}>
                          <Button
                            onClick={() => handleEditAnnouncement(announcement)}
                            disabled={announcementLoading || editingAnnouncement?.id === announcement.id}
                            style={{
                              backgroundColor: '#3498db',
                              padding: isMobile ? '10px 12px' : '5px 10px',
                              fontSize: isMobile ? '13px' : '12px',
                              flex: isMobile ? 1 : 'none',
                              minHeight: isMobile ? '40px' : 'auto'
                            }}
                          >
                            수정
                          </Button>
                          <Button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            disabled={announcementLoading}
                            style={{
                              backgroundColor: '#e74c3c',
                              padding: isMobile ? '10px 12px' : '5px 10px',
                              fontSize: isMobile ? '13px' : '12px',
                              flex: isMobile ? 1 : 'none',
                              minHeight: isMobile ? '40px' : 'auto'
                            }}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                      <div
                        style={{
                          color: theme.text,
                          fontSize: isMobile ? '13px' : '14px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          maxHeight: isMobile ? '120px' : '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word'
                        }}
                      >
                        {announcement.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                    const functions = getFunctions();
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
                    if (data.success) {
                      const successMessage = `✅ 알림 발송 완료!\n\n📊 발송 결과:\n- 성공: ${data.sentCount || 0}명\n- 실패: ${data.failureCount || 0}명\n\n${data.message || ''}`;
                      toast.showToast(successMessage, 'success');
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
                    toast.showToast(
                      error.message || '알림 발송 중 오류가 발생했습니다.',
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
          background: 'rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '10px' : '20px',
          boxSizing: 'border-box'
        }} onClick={closeUserDetail}>
          <div style={{
            background: theme.theme === 'dark' ? '#2c3e50' : 'white',
            color: theme.text,
            borderRadius: isMobile ? 12 : 8,
            padding: isMobile ? 16 : 24,
            minWidth: 280,
            maxWidth: '100%',
            width: '100%',
            maxHeight: isMobile ? '90vh' : '80vh',
            overflowY: 'auto',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            boxSizing: 'border-box',
            border: theme.theme === 'dark' ? '1px solid #34495e' : 'none'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{
              fontSize: isMobile ? '18px' : '20px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>유저 상세 정보</h2>
            {detailLoading ? <div>로딩 중...</div> : userDetail && (
              <div>
                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#f8f9fa', borderRadius: '8px', fontSize: isMobile ? '14px' : '13px' }}>
                  <div style={{ marginBottom: '6px' }}><b>이메일:</b> {userDetail.email}</div>
                  <div style={{ marginBottom: '6px' }}><b>닉네임:</b> {userDetail.displayName}</div>
                  <div style={{ marginBottom: '6px' }}><b>가입일:</b> {formatDate(userDetail.createdAt)}</div>
                  <div><b>최근 접속일:</b> {formatDate(userDetail.lastLoginAt) || '없음'}</div>
                </div>

                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#e8f4fd', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <b>포인트:</b> <span style={{ color: '#3498f3', fontWeight: 'bold', fontSize: isMobile ? '20px' : '18px' }}>{userDetail.point || 0}p</span>
                  </div>
                  {isMainAdmin(user) && (
                    <div style={{ margin: '8px 0', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        value={pointInput}
                        onChange={e => setPointInput(Number(e.target.value))}
                        placeholder="포인트 입력"
                        style={{
                          flex: isMobile ? '1 1 100%' : '0 0 100px',
                          padding: isMobile ? '12px' : '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: isMobile ? '16px' : '14px',
                          minHeight: isMobile ? '44px' : 'auto'
                        }}
                      />
                      <Button onClick={() => handlePointChange(pointInput)} disabled={pointActionLoading || !pointInput} style={{ fontSize: isMobile ? '14px' : '12px', padding: isMobile ? '10px 16px' : '6px 12px', flex: isMobile ? '1 1 calc(50% - 4px)' : 'auto' }}>지급</Button>
                      <Button onClick={() => handlePointChange(-pointInput)} disabled={pointActionLoading || !pointInput} style={{ fontSize: isMobile ? '14px' : '12px', padding: isMobile ? '10px 16px' : '6px 12px', background: '#e74c3c', flex: isMobile ? '1 1 calc(50% - 4px)' : 'auto' }}>차감</Button>
                      {pointActionStatus && <span style={{ width: '100%', marginTop: 8, color: pointActionStatus.type === 'success' ? 'green' : 'red', fontSize: '12px' }}>{pointActionStatus.message}</span>}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#fff3cd', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <b>프리미엄 상태:</b> {renderPremiumBadge(userDetail)}
                  </div>
                  {isMainAdmin(user) && (
                    <div style={{ margin: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        onClick={() => handleTogglePremium('monthly')}
                        disabled={statusActionLoading}
                        style={{
                          background: userDetail.isMonthlyPremium ? '#e74c3c' : '#3498db',
                          fontSize: isMobile ? '13px' : '12px',
                          padding: isMobile ? '10px 12px' : '6px 12px',
                          flex: isMobile ? '1 1 100%' : 'auto'
                        }}
                      >
                        {userDetail.isMonthlyPremium ? '월간 프리미엄 해제' : '월간 프리미엄 설정'}
                      </Button>
                      <Button
                        onClick={() => handleTogglePremium('yearly')}
                        disabled={statusActionLoading}
                        style={{
                          background: userDetail.isYearlyPremium ? '#e74c3c' : '#FFC300',
                          fontSize: isMobile ? '13px' : '12px',
                          padding: isMobile ? '10px 12px' : '6px 12px',
                          color: userDetail.isYearlyPremium ? 'white' : 'black',
                          flex: isMobile ? '1 1 100%' : 'auto'
                        }}
                      >
                        {userDetail.isYearlyPremium ? '연간 프리미엄 해제' : '연간 프리미엄 설정'}
                      </Button>
                      {(userDetail.isMonthlyPremium || userDetail.isYearlyPremium) && (
                        <Button
                          onClick={() => handleTogglePremium('remove')}
                          disabled={statusActionLoading}
                          style={{
                            background: '#95a5a6',
                            fontSize: isMobile ? '13px' : '12px',
                            padding: isMobile ? '10px 12px' : '6px 12px',
                            flex: isMobile ? '1 1 100%' : 'auto'
                          }}
                        >
                          프리미엄 해제
                        </Button>
                      )}
                    </div>
                  )}
                  {statusActionStatus && <div style={{ marginTop: 8, color: statusActionStatus.type === 'success' ? 'green' : 'red', fontSize: '12px' }}>{statusActionStatus.message}</div>}
                </div>

                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <b>상태:</b> {renderStatusBadge(userDetail.status)}
                  </div>
                  {isMainAdmin(user) && (
                    <div style={{ margin: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button onClick={handleToggleStatus} disabled={statusActionLoading} style={{ background: '#f39c12', fontSize: isMobile ? '13px' : '12px', padding: isMobile ? '10px 16px' : '6px 12px', flex: isMobile ? '1 1 calc(50% - 4px)' : 'auto' }}>
                        {userDetail.status === '정지' ? '정지 해제' : '계정 정지'}
                      </Button>
                      <Button onClick={handleDeleteUser} disabled={statusActionLoading} style={{ background: '#e74c3c', fontSize: isMobile ? '13px' : '12px', padding: isMobile ? '10px 16px' : '6px 12px', flex: isMobile ? '1 1 calc(50% - 4px)' : 'auto' }}>계정 삭제</Button>
                    </div>
                  )}
                  {statusActionStatus && <div style={{ marginTop: 8, color: statusActionStatus.type === 'success' ? 'green' : 'red', fontSize: '12px' }}>{statusActionStatus.message}</div>}
                </div>

                <hr />
                <div><b>최근 일기</b>
                  <ul>{userActivity.diaries.map((d, i) => <li key={i}>{d.title || '(제목 없음)'} <span style={{ color: '#888' }}>{formatDate(d.createdAt)}</span></li>)}</ul>
                </div>
                <div><b>최근 소설</b>
                  <ul>{userActivity.novels.map((n, i) => <li key={i}>{n.title || '(제목 없음)'} <span style={{ color: '#888' }}>{formatDate(n.createdAt)}</span></li>)}</ul>
                </div>
                <div><b>최근 댓글</b>
                  <ul>{userActivity.comments.map((c, i) => <li key={i}>{c.content || '(내용 없음)'} <span style={{ color: '#888' }}>{formatDate(c.createdAt)}</span></li>)}</ul>
                </div>
              </div>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' }}><Button onClick={closeUserDetail}>닫기</Button></div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default UserManagement; 