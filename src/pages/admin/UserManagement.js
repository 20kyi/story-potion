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
  checkAllUserProfiles,
  fixGoogleUserProfiles
} from '../../utils/debugUsers';
import { requireAdmin, isMainAdmin } from '../../utils/adminAuth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit as fsLimit, doc, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    checkGoogleUserProfiles, 
    forceUpdateGoogleUserProfiles, 
    updateGoogleProfilesByEmail 
} from '../../utils/fixGoogleProfiles';
import {
    checkPotionUsageStats,
    cleanupPotionUsageHistory,
    runFullCleanup
} from '../../utils/runPotionHistoryCleanup';
import {
    getPasswordResetRequests,
    approvePasswordResetRequest,
    rejectPasswordResetRequest,
    setTemporaryPassword,
    resetUserPasswordByAdmin
} from '../../utils/adminPasswordResetUtils';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 120px;
  font-family: 'Arial', sans-serif;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 100vh;
  
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

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
  gap: 8px;
  margin-bottom: 15px;
  padding: 15px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : '#f8f9fa'};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  
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
  const db = getFirestore();
  const [pointInput, setPointInput] = useState(0);
  const [pointActionLoading, setPointActionLoading] = useState(false);
  const [pointActionStatus, setPointActionStatus] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionStatus, setStatusActionStatus] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // 아코디언 상태 관리
  const [openSections, setOpenSections] = useState({
    googleProfile: false,
    userList: true, // 사용자 목록은 기본적으로 열림
    profileUpdate: false,
    pointManagement: false,
    debugging: false,
    quickActions: false,
    notifications: false,
    passwordReset: false,
    potionCleanup: false
  });
  
  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  
  // 비밀번호 재설정 요청 관련 상태
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
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

  // 페이지네이션/정렬 상태
  const [pageLimit] = useState(10);
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

  // Firestore에서 유저 목록 불러오기 (페이지네이션/정렬/검색)
  const loadUsersPage = async (opts = {}) => {
    setLoading(true);
    try {
      const { users: loadedUsers, lastDoc: newLastDoc } = await getUsersWithQuery({
        limit: pageLimit,
        orderBy: orderByField,
        orderDir,
        startAfter: opts.startAfter || null,
        where: opts.where || []
      });
      setUsers(loadedUsers);
      setLastDoc(newLastDoc);
      if (opts.isNext) setPageStack([...pageStack, lastDoc]);
      if (opts.isPrev) setLastDoc(pageStack[pageStack.length - 2] || null);
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

  // 정렬 변경 핸들러
  const handleSort = (field) => {
    if (orderByField === field) setOrderDir(orderDir === 'desc' ? 'asc' : 'desc');
    else setOrderByField(field);
  };

  // 다음/이전 페이지
  const handleNextPage = () => loadUsersPage({ startAfter: lastDoc, isNext: true });
  const handlePrevPage = () => {
    const prevStack = [...pageStack];
    prevStack.pop();
    setPageStack(prevStack);
    loadUsersPage({ startAfter: prevStack[prevStack.length - 1] || null, isPrev: true });
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

  // 디버깅: 구글 사용자 프로필 복구
  const handleFixGoogleUserProfiles = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '구글 사용자 프로필 복구 중...' });

    try {
      const result = await fixGoogleUserProfiles();
      setDebugInfo(result);
      setStatus({
        type: 'success',
        message: result.message
      });
    } catch (error) {
      setStatus({ type: 'error', message: '구글 사용자 프로필 복구 실패: ' + error.message });
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
        novels: novelsSnap.docs.map(d => d.data()),
        comments: commentsSnap.docs.map(d => d.data()),
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

  const handleCheckGoogleProfiles = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '구글 사용자 프로필 상태를 확인하는 중...' });
    
    try {
        const result = await checkGoogleUserProfiles();
        if (result.success) {
            setStatus({ 
                type: 'success', 
                message: `✅ 확인 완료!\n\n📊 구글 사용자 현황:\n- 총 구글 사용자: ${result.totalGoogleUsers}명\n- 프로필 사진 있음: ${result.hasProfileImage}명\n- 기본 이미지: ${result.hasDefaultImage}명\n- 이미지 없음: ${result.noImage}명\n\n⚠️ 문제가 있는 사용자: ${result.problematicUsers}명`
            });
            toast.showToast('구글 사용자 프로필 상태 확인 완료', 'success');
        } else {
            setStatus({ type: 'error', message: `❌ 확인 실패: ${result.message}` });
            toast.showToast('확인에 실패했습니다', 'error');
        }
    } catch (error) {
        setStatus({ type: 'error', message: `❌ 오류 발생: ${error.message}` });
        toast.showToast('오류가 발생했습니다', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleForceUpdateProfiles = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '구글 사용자 프로필을 강제로 업데이트하는 중...' });
    
    try {
        const result = await forceUpdateGoogleUserProfiles();
        if (result.success) {
            setStatus({ 
                type: 'success', 
                message: `✅ 강제 업데이트 완료!\n\n📊 결과:\n- 총 구글 사용자: ${result.totalGoogleUsers}명\n- 업데이트된 사용자: ${result.updatedCount}명\n\n${result.message}`
            });
            toast.showToast('프로필 강제 업데이트 완료', 'success');
        } else {
            setStatus({ type: 'error', message: `❌ 업데이트 실패: ${result.message}` });
            toast.showToast('업데이트에 실패했습니다', 'error');
        }
    } catch (error) {
        setStatus({ type: 'error', message: `❌ 오류 발생: ${error.message}` });
        toast.showToast('오류가 발생했습니다', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateByEmail = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '이메일 기반으로 구글 사용자 프로필을 업데이트하는 중...' });
    
    try {
        const result = await updateGoogleProfilesByEmail();
        if (result.success) {
            setStatus({ 
                type: 'success', 
                message: `✅ 이메일 기반 업데이트 완료!\n\n📊 결과:\n- 총 구글 이메일 사용자: ${result.totalGoogleUsers}명\n- 업데이트된 사용자: ${result.updatedCount}명\n\n${result.message}`
            });
            toast.showToast('이메일 기반 프로필 업데이트 완료', 'success');
        } else {
            setStatus({ type: 'error', message: `❌ 업데이트 실패: ${result.message}` });
            toast.showToast('업데이트에 실패했습니다', 'error');
        }
    } catch (error) {
        setStatus({ type: 'error', message: `❌ 오류 발생: ${error.message}` });
        toast.showToast('오류가 발생했습니다', 'error');
    } finally {
        setLoading(false);
    }
  };

  // 비밀번호 재설정 요청 관리 함수들
  const handleLoadPasswordResetRequests = async () => {
    setPasswordResetLoading(true);
    try {
      const result = await getPasswordResetRequests();
      if (result.success) {
        setPasswordResetRequests(result.requests);
        setStatus({ type: 'success', message: `비밀번호 재설정 요청 ${result.requests.length}개를 불러왔습니다.` });
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `비밀번호 재설정 요청 불러오기 실패: ${error.message}` });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setPasswordResetLoading(true);
    try {
      const result = await approvePasswordResetRequest(requestId, adminNote);
      if (result.success) {
        setStatus({ 
          type: 'success', 
          message: `요청이 승인되었습니다. 임시 비밀번호: ${result.temporaryPassword}` 
        });
        // 요청 목록 새로고침
        await handleLoadPasswordResetRequests();
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `요청 승인 실패: ${error.message}` });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setPasswordResetLoading(true);
    try {
      const result = await rejectPasswordResetRequest(requestId, adminNote);
      if (result.success) {
        setStatus({ type: 'success', message: '요청이 거부되었습니다.' });
        // 요청 목록 새로고침
        await handleLoadPasswordResetRequests();
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `요청 거부 실패: ${error.message}` });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleSetTemporaryPassword = async (email) => {
    setPasswordResetLoading(true);
    try {
      const result = await setTemporaryPassword(email);
      if (result.success) {
        setStatus({ 
          type: 'success', 
          message: `임시 비밀번호가 설정되었습니다: ${result.temporaryPassword}` 
        });
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `임시 비밀번호 설정 실패: ${error.message}` });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleResetUserPassword = async (email) => {
    if (!newPassword.trim()) {
      setStatus({ type: 'error', message: '새 비밀번호를 입력해주세요.' });
      return;
    }

    setPasswordResetLoading(true);
    try {
      const result = await resetUserPasswordByAdmin(email, newPassword);
      if (result.success) {
        setStatus({ 
          type: 'success', 
          message: `비밀번호가 재설정되었습니다: ${result.newPassword}` 
        });
        setNewPassword('');
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `비밀번호 재설정 실패: ${error.message}` });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  return (
    <Container theme={theme}>
      <PageTitle>사용자 관리</PageTitle>
      
      <Section theme={theme}>
        <SectionTitle theme={theme} onClick={() => toggleSection('googleProfile')}>
          <span>구글 사용자 프로필 관리</span>
          <AccordionIcon theme={theme} isOpen={openSections.googleProfile}>▼</AccordionIcon>
        </SectionTitle>
        <SectionContent isOpen={openSections.googleProfile}>
          <InfoText theme={theme}>
              구글 연동 회원들의 프로필 이미지가 기본 이미지로 표시되는 문제를 해결할 수 있습니다.
              아래 버튼들을 순서대로 실행해보세요.
          </InfoText>
          
          <ButtonGroup theme={theme}>
            <ButtonGroupTitle theme={theme}>구글 프로필 관리</ButtonGroupTitle>
            <Button 
                onClick={handleCheckGoogleProfiles}
                disabled={loading}
            >
                1. 구글 사용자 프로필 상태 확인
            </Button>
            
            <Button 
                onClick={handleForceUpdateProfiles}
                disabled={loading}
            >
                2. 구글 사용자 프로필 강제 업데이트
            </Button>
            
            <Button 
                onClick={handleUpdateByEmail}
                disabled={loading}
            >
                3. 이메일 기반 프로필 업데이트
            </Button>
          </ButtonGroup>
          
          {loading && (
              <LoadingText>처리 중...</LoadingText>
          )}
          
          {status && (
              <StatusText theme={theme}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                      {typeof status === 'string' ? status : status.message}
                  </pre>
              </StatusText>
          )}
        </SectionContent>
      </Section>

      {/* 사용자 목록 */}
      <Section theme={theme}>
        <SectionTitle theme={theme} onClick={() => toggleSection('userList')}>
          <span>👥 사용자 목록 ({users.length}명)</span>
          <AccordionIcon theme={theme} isOpen={openSections.userList}>▼</AccordionIcon>
        </SectionTitle>
        <SectionContent isOpen={openSections.userList}>
        <ButtonGroup theme={theme}>
          <ButtonGroupTitle theme={theme}>정렬 옵션</ButtonGroupTitle>
          <Button onClick={() => handleSort('createdAt')}>가입일 정렬</Button>
          <Button onClick={() => handleSort('point')}>포인트 정렬</Button>
          <Button onClick={() => handleSort('displayName')}>이름 정렬</Button>
        </ButtonGroup>
        
        {/* 데스크톱 테이블 */}
        <div style={{ overflowX: 'auto' }}>
          <UserTable theme={theme}>
            <TableHeader theme={theme}>
              <tr>
                <TableHeaderCell theme={theme}>닉네임</TableHeaderCell>
                <TableHeaderCell theme={theme}>이메일</TableHeaderCell>
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
                    <strong>{user.displayName || '이름 없음'}</strong>
                  </TableCell>
                  <TableCell theme={theme} style={{ fontSize: '12px', color: theme.theme === 'dark' ? '#bdc3c7' : '#666' }}>
                    {user.email}
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
            </tbody>
          </UserTable>
        </div>
        
        {/* 모바일 카드 */}
        <MobileCardContainer>
          {users.map((user) => (
            <MobileUserCard key={user.uid} theme={theme} onClick={() => openUserDetail(user)}>
              <MobileCardHeader>
                <div>
                  <MobileCardTitle theme={theme}>{user.displayName || '이름 없음'}</MobileCardTitle>
                  <MobileCardEmail theme={theme}>{user.email}</MobileCardEmail>
                </div>
                {renderStatusBadge(user.status)}
              </MobileCardHeader>
              <MobileCardRow theme={theme}>
                <MobileCardLabel theme={theme}>프리미엄</MobileCardLabel>
                <MobileCardValue theme={theme}>{renderPremiumBadge(user)}</MobileCardValue>
              </MobileCardRow>
              <MobileCardRow theme={theme}>
                <MobileCardLabel theme={theme}>포인트</MobileCardLabel>
                <MobileCardValue theme={theme} style={{ color: '#3498f3' }}>{user.point || 0}p</MobileCardValue>
              </MobileCardRow>
              <MobileCardRow theme={theme}>
                <MobileCardLabel theme={theme}>가입일</MobileCardLabel>
                <MobileCardValue theme={theme} style={{ fontSize: '12px' }}>{formatDate(user.createdAt)}</MobileCardValue>
              </MobileCardRow>
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
          <Button onClick={handlePrevPage} disabled={pageStack.length === 0}>이전</Button>
          <span style={{ 
            color: theme.text, 
            fontSize: '14px', 
            fontWeight: '500',
            padding: '0 12px',
            whiteSpace: 'nowrap'
          }}>
            {pageStack.length + 1}/{totalUsers ? Math.ceil(totalUsers / pageLimit) : '?'}
          </span>
          <Button onClick={handleNextPage} disabled={!lastDoc}>다음</Button>
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

      {/* 디버깅 */}
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
              onClick={handleFixGoogleUserProfiles}
              disabled={loading}
              style={{ backgroundColor: '#8e44ad' }}
            >
              {loading ? '복구 중...' : '구글 사용자 프로필 복구'}
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

      {/* 빠른 액션 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('quickActions')}>
            <span>⚡ 빠른 액션</span>
            <AccordionIcon theme={theme} isOpen={openSections.quickActions}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.quickActions}>
            <ButtonGroup theme={theme}>
              <ButtonGroupTitle theme={theme}>빠른 작업</ButtonGroupTitle>
              <Button
                onClick={async () => {
                  const result = await migrationExamples.createSampleUsers();
                  setStatus({ type: 'success', message: `샘플 사용자 생성: 성공 ${result.success}명` });
                  await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
                }}
                disabled={loading}
              >
                샘플 10명 생성
              </Button>

              <Button
                onClick={async () => {
                  const activeUsers = await migrationExamples.getActiveUsers();
                  setUsers(activeUsers);
                  setStatus({ type: 'success', message: `활성 사용자: ${activeUsers.length}명` });
                }}
                disabled={loading}
              >
                활성 사용자만
              </Button>

              <Button
                onClick={async () => {
                  const highPointUsers = await migrationExamples.getHighPointUsers();
                  setUsers(highPointUsers);
                  setStatus({ type: 'success', message: `고포인트 사용자: ${highPointUsers.length}명` });
                }}
                disabled={loading}
              >
                고포인트 사용자
              </Button>

              <Button
                onClick={async () => {
                  const result = await pointUpdateExamples.give500PointsToZeroUsers();
                  setStatus({ type: 'success', message: `500포인트 지급: 성공 ${result.success}명` });
                  await loadUsersPage(); // loadUsersPage를 사용하여 페이지네이션 상태 유지
                  await handleLoadPointsStats();
                }}
                disabled={loading}
                style={{ backgroundColor: '#e74c3c' }}
              >
                500p 즉시 지급
              </Button>
            </ButtonGroup>
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
                  toast.show('제목과 메시지는 필수입니다.', 'error');
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
                    toast.show(
                      `${data.message}\n발송: ${data.sentCount}명, 실패: ${data.failureCount}명`,
                      'success'
                    );
                    // 폼 초기화
                    setNotificationTitle('');
                    setNotificationMessage('');
                    setNotificationImageUrl('');
                    setNotificationLinkUrl('');
                  } else {
                    toast.show('알림 발송에 실패했습니다.', 'error');
                  }
                } catch (error) {
                  console.error('알림 발송 오류:', error);
                  toast.show(
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

      {/* 비밀번호 재설정 요청 관리 */}
      <Section theme={theme}>
        <SectionTitle theme={theme} onClick={() => toggleSection('passwordReset')}>
          <span>🔐 비밀번호 재설정 요청 관리</span>
          <AccordionIcon theme={theme} isOpen={openSections.passwordReset}>▼</AccordionIcon>
        </SectionTitle>
        <SectionContent isOpen={openSections.passwordReset}>
          <div style={{ marginBottom: '15px', color: theme.subText || '#888', fontSize: '14px' }}>
            사용자가 관리자 문의로 요청한 비밀번호 재설정을 처리합니다.
          </div>
        
        <div style={{ marginBottom: '15px' }}>
          <Button
            onClick={handleLoadPasswordResetRequests}
            disabled={passwordResetLoading}
            style={{ backgroundColor: '#3498db' }}
          >
            {passwordResetLoading ? '불러오는 중...' : '비밀번호 재설정 요청 목록'}
          </Button>
        </div>

        {/* 요청 목록 */}
        {passwordResetRequests.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: theme.text, marginBottom: '10px' }}>요청 목록 ({passwordResetRequests.length}개)</h4>
            {passwordResetRequests.map((request, index) => (
              <div
                key={request.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: theme.theme === 'dark' ? '#34495e' : '#f8f9fa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ color: theme.text }}>{request.displayName}</strong>
                    <div style={{ color: theme.subText || '#666', fontSize: '12px' }}>{request.email}</div>
                    <div style={{ color: theme.subText || '#666', fontSize: '12px' }}>요청 ID: {request.requestId}</div>
                  </div>
                  <span style={{
                    background: request.status === 'pending' ? '#f39c12' : 
                               request.status === 'approved' ? '#27ae60' : '#e74c3c',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {request.status === 'pending' ? '대기중' : 
                     request.status === 'approved' ? '승인됨' : '거부됨'}
                  </span>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ color: theme.text, marginBottom: '5px' }}><strong>사유:</strong></div>
                  <div style={{ color: theme.subText || '#666', fontSize: '14px' }}>{request.reason}</div>
                </div>

                {request.additionalInfo && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: theme.text, marginBottom: '5px' }}><strong>추가 정보:</strong></div>
                    <div style={{ color: theme.subText || '#666', fontSize: '14px' }}>{request.additionalInfo}</div>
                  </div>
                )}

                <div style={{ color: theme.subText || '#666', fontSize: '12px', marginBottom: '10px' }}>
                  요청일: {request.createdAt?.toDate?.()?.toLocaleString() || '알 수 없음'}
                </div>

                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="관리자 메모 (선택사항)"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}

                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button
                      onClick={() => handleApproveRequest(request.requestId)}
                      disabled={passwordResetLoading}
                      style={{ backgroundColor: '#27ae60', flex: 1 }}
                    >
                      {passwordResetLoading ? '처리 중...' : '승인'}
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request.requestId)}
                      disabled={passwordResetLoading}
                      style={{ backgroundColor: '#e74c3c', flex: 1 }}
                    >
                      {passwordResetLoading ? '처리 중...' : '거부'}
                    </Button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div style={{
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    padding: '10px',
                    marginTop: '10px'
                  }}>
                    <div style={{ color: '#155724', fontSize: '14px' }}>
                      <strong>승인됨</strong> - 사용자에게 임시 비밀번호를 안전하게 전달해주세요.
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && request.adminNote && (
                  <div style={{
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    padding: '10px',
                    marginTop: '10px'
                  }}>
                    <div style={{ color: '#721c24', fontSize: '14px' }}>
                      <strong>거부 사유:</strong> {request.adminNote}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 직접 비밀번호 재설정 */}
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4 style={{ color: theme.text, marginBottom: '10px' }}>직접 비밀번호 재설정</h4>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="사용자 이메일"
              value={selectedRequest?.email || ''}
              onChange={(e) => setSelectedRequest({ email: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '14px'
              }}
            />
            <input
              type="password"
              placeholder="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              onClick={() => handleSetTemporaryPassword(selectedRequest?.email)}
              disabled={passwordResetLoading || !selectedRequest?.email}
              style={{ backgroundColor: '#f39c12', flex: 1 }}
            >
              {passwordResetLoading ? '처리 중...' : '임시 비밀번호 생성'}
            </Button>
            <Button
              onClick={() => handleResetUserPassword(selectedRequest?.email)}
              disabled={passwordResetLoading || !selectedRequest?.email || !newPassword}
              style={{ backgroundColor: '#9b59b6', flex: 1 }}
            >
              {passwordResetLoading ? '처리 중...' : '비밀번호 직접 설정'}
            </Button>
          </div>
        </div>
        </SectionContent>
      </Section>

      {/* 포션 사용 내역 정리 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme} onClick={() => toggleSection('potionCleanup')}>
            <span>🧹 포션 사용 내역 정리</span>
            <AccordionIcon theme={theme} isOpen={openSections.potionCleanup}>▼</AccordionIcon>
          </SectionTitle>
          <SectionContent isOpen={openSections.potionCleanup}>
            <div style={{ marginBottom: '15px', color: theme.subText || '#888', fontSize: '14px' }}>
              포션 사용은 포인트를 차감하지 않으므로 포인트 내역에서 제거합니다.
            </div>
            <ButtonGroup theme={theme}>
              <ButtonGroupTitle theme={theme}>포션 내역 관리</ButtonGroupTitle>
              <Button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const stats = await checkPotionUsageStats();
                    setStatus({ 
                      type: 'success', 
                      message: `포션 사용 내역 통계: ${stats.usersWithPotionUsage}명의 사용자, 총 ${stats.totalPotionUsage}개 내역` 
                    });
                  } catch (error) {
                    setStatus({ type: 'error', message: `통계 조회 실패: ${error.message}` });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ backgroundColor: '#3498db' }}
              >
                {loading ? '통계 확인 중...' : '포션 사용 내역 통계'}
              </Button>

              <Button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const result = await cleanupPotionUsageHistory();
                    setStatus({ 
                      type: 'success', 
                      message: `포션 사용 내역 삭제 완료: ${result.processedUsers}명 처리, ${result.totalDeleted}개 삭제` 
                    });
                  } catch (error) {
                    setStatus({ type: 'error', message: `삭제 실패: ${error.message}` });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ backgroundColor: '#e74c3c' }}
              >
                {loading ? '삭제 중...' : '포션 사용 내역 삭제'}
              </Button>

              <Button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const result = await runFullCleanup();
                    setStatus({ 
                      type: 'success', 
                      message: `전체 정리 완료: 삭제 전 ${result.stats.totalPotionUsage}개 → 삭제 후 ${result.afterStats.totalPotionUsage}개 (${result.deleted.totalDeleted}개 삭제)` 
                    });
                  } catch (error) {
                    setStatus({ type: 'error', message: `전체 정리 실패: ${error.message}` });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ backgroundColor: '#9b59b6' }}
              >
                {loading ? '전체 정리 중...' : '전체 정리 (통계+삭제)'}
              </Button>
            </ButtonGroup>
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
                  <div><b>가입일:</b> {formatDate(userDetail.createdAt)}</div>
                </div>

                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#e8f4fd', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <b>포인트:</b> <span style={{ color: '#3498f3', fontWeight: 'bold', fontSize: isMobile ? '20px' : '18px' }}>{userDetail.point || 0}p</span>
                  </div>
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
                </div>

                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#fff3cd', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <b>프리미엄 상태:</b> {renderPremiumBadge(userDetail)}
                  </div>
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
                  {statusActionStatus && <div style={{ marginTop: 8, color: statusActionStatus.type === 'success' ? 'green' : 'red', fontSize: '12px' }}>{statusActionStatus.message}</div>}
                </div>

                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <b>상태:</b> {renderStatusBadge(userDetail.status)}
                  </div>
                  <div style={{ margin: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button onClick={handleToggleStatus} disabled={statusActionLoading} style={{ background: '#f39c12', fontSize: isMobile ? '13px' : '12px', padding: isMobile ? '10px 16px' : '6px 12px', flex: isMobile ? '1 1 calc(50% - 4px)' : 'auto' }}>
                      {userDetail.status === '정지' ? '정지 해제' : '계정 정지'}
                    </Button>
                    <Button onClick={handleDeleteUser} disabled={statusActionLoading} style={{ background: '#e74c3c', fontSize: isMobile ? '13px' : '12px', padding: isMobile ? '10px 16px' : '6px 12px', flex: isMobile ? '1 1 calc(50% - 4px)' : 'auto' }}>계정 삭제</Button>
                  </div>
                  {statusActionStatus && <div style={{ marginTop: 8, color: statusActionStatus.type === 'success' ? 'green' : 'red', fontSize: '12px' }}>{statusActionStatus.message}</div>}
                </div>

                <div style={{ marginBottom: '15px', padding: isMobile ? '12px' : '10px', background: '#f8f9fa', borderRadius: '8px', fontSize: isMobile ? '13px' : '12px' }}>
                  <div style={{ marginBottom: '6px' }}><b>최근 접속일:</b> {formatDate(userDetail.lastLoginAt)}</div>
                  <div><b>마지막 활동일:</b> {formatDate(userDetail.lastActivityAt)}</div>
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