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
  compareAuthAndFirestore,
  diagnoseUserIssues,
  findUserByEmail
} from '../../utils/debugUsers';
import { requireAdmin, isMainAdmin } from '../../utils/adminAuth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit as fsLimit, doc, deleteDoc } from 'firebase/firestore';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 120px;
  font-family: 'Arial', sans-serif;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 100vh;
`;

const Header = styled.h1`
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
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.text};
  margin-bottom: 15px;
  border-bottom: 2px solid #3498f3;
  padding-bottom: 10px;
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
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#c0392b' : '#2980b9'};
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
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

function UserManagement({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();

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

  // 페이지네이션/정렬 상태
  const [pageLimit] = useState(10);
  const [orderByField, setOrderByField] = useState('createdAt');
  const [orderDir, setOrderDir] = useState('desc');
  const [lastDoc, setLastDoc] = useState(null);
  const [pageStack, setPageStack] = useState([]); // 이전 페이지 스택

  // 상태 표시용 컬러 뱃지
  const renderStatusBadge = (status) => {
    let color = '#2ecc40', text = '정상';
    if (status === '정지') { color = '#e74c3c'; text = '정지'; }
    if (status === '탈퇴') { color = '#95a5a6'; text = '탈퇴'; }
    return <span style={{ background: color, color: 'white', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{text}</span>;
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

  // 디버깅: Auth와 Firestore 비교
  const handleCompareAuthAndFirestore = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Auth와 Firestore 비교 중...' });

    try {
      const comparison = await compareAuthAndFirestore();
      setDebugInfo(comparison);
      setStatus({
        type: 'success',
        message: `비교 완료: Auth ${comparison.authUsers.length}명, Firestore ${comparison.firestoreUsers.length}명, 누락 ${comparison.missingUsers.length}명`
      });
    } catch (error) {
      setStatus({ type: 'error', message: '비교 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 디버깅: 문제 진단
  const handleDiagnoseIssues = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: '문제 진단 중...' });

    try {
      const diagnosis = await diagnoseUserIssues();
      setDebugInfo(diagnosis);
      setStatus({
        type: 'success',
        message: `진단 완료: ${diagnosis.issues.length}개 문제점 발견`
      });
    } catch (error) {
      setStatus({ type: 'error', message: '진단 실패: ' + error.message });
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

  return (
    <Container theme={theme}>
      <Header theme={theme}>🔧 사용자 데이터 관리</Header>

      {status && (
        <Status type={status.type}>
          {status.message}
        </Status>
      )}

      {/* 사용자 동기화 */}
      <Section theme={theme}>
        <SectionTitle theme={theme}>🔄 사용자 동기화</SectionTitle>

        {/* 현재 상태 표시 */}
        {usersCollectionStats && (
          <div style={{
            background: theme.theme === 'dark' ? '#34495e' : '#e8f4fd',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            fontSize: '14px',
            color: theme.text,
            border: theme.theme === 'dark' ? '1px solid #2c3e50' : 'none'
          }}>
            <strong>📊 Firestore users 컬렉션 현황:</strong><br />
            총 사용자: {usersCollectionStats.totalUsers}명<br />
            이메일 보유: {usersCollectionStats.usersWithEmail}명<br />
            포인트 보유: {usersCollectionStats.usersWithPoints}명<br />
            포인트 미보유: {usersCollectionStats.usersWithoutPoints}명<br />
            평균 포인트: {usersCollectionStats.averagePoints}p<br />
            최근 1주일: {usersCollectionStats.recentUsers}명
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <Button
            onClick={handleSyncCurrentUser}
            disabled={loading}
            style={{ backgroundColor: '#3498db' }}
          >
            {loading ? '동기화 중...' : '현재 사용자 동기화'}
          </Button>

          {isMainAdmin(user) && (
            <Button
              onClick={handleCreateTestUsers}
              disabled={loading}
              style={{ backgroundColor: '#e67e22' }}
            >
              {loading ? '생성 중...' : '테스트 사용자 생성'}
            </Button>
          )}
        </div>

        {/* 수동 사용자 생성 - 메인 관리자만 */}
        {isMainAdmin(user) && (
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: theme.text }}>수동 사용자 생성:</strong><br />
            <Input
              theme={theme}
              type="text"
              value={manualUserData.uid}
              onChange={(e) => setManualUserData({ ...manualUserData, uid: e.target.value })}
              placeholder="UID"
              style={{ width: '200px' }}
            />
            <Input
              theme={theme}
              type="email"
              value={manualUserData.email}
              onChange={(e) => setManualUserData({ ...manualUserData, email: e.target.value })}
              placeholder="이메일"
              style={{ width: '200px' }}
            />
            <Input
              theme={theme}
              type="text"
              value={manualUserData.displayName}
              onChange={(e) => setManualUserData({ ...manualUserData, displayName: e.target.value })}
              placeholder="닉네임"
              style={{ width: '150px' }}
            />
            <Input
              theme={theme}
              type="number"
              value={manualUserData.point}
              onChange={(e) => setManualUserData({ ...manualUserData, point: parseInt(e.target.value) || 0 })}
              placeholder="포인트"
              style={{ width: '100px' }}
            />
            <Button
              onClick={handleCreateManualUser}
              disabled={loading}
              style={{ backgroundColor: '#9b59b6' }}
            >
              {loading ? '생성 중...' : '수동 생성'}
            </Button>
          </div>
        )}

        {/* 샘플 사용자 생성 - 메인 관리자만 */}
        {isMainAdmin(user) && (
          <Section theme={theme}>
            <SectionTitle theme={theme}>📝 샘플 사용자 생성</SectionTitle>
            <div>
              <Input
                theme={theme}
                type="number"
                value={userCount}
                onChange={(e) => setUserCount(e.target.value)}
                placeholder="생성할 사용자 수"
                min="1"
                max="100"
              />
              <Button
                onClick={handleCreateSampleUsers}
                disabled={loading}
              >
                {loading ? '생성 중...' : '샘플 사용자 생성'}
              </Button>
            </div>
          </Section>
        )}
      </Section>

      {/* 사용자 검색 */}
      <Section theme={theme}>
        <SectionTitle theme={theme}>🔍 사용자 검색</SectionTitle>
        <div>
          <Select
            theme={theme}
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="displayName">닉네임</option>
            <option value="email">이메일</option>
            <option value="point">포인트</option>
            <option value="reminderEnabled">알림 활성화</option>
            <option value="isActive">활성 상태</option>
          </Select>

          <Select
            theme={theme}
            value={searchOperator}
            onChange={(e) => setSearchOperator(e.target.value)}
          >
            <option value="==">같음</option>
            <option value="!=">다름</option>
            <option value=">">보다 큼</option>
            <option value=">=">보다 크거나 같음</option>
            <option value="<">보다 작음</option>
            <option value="<=">보다 작거나 같음</option>
          </Select>

          <Input
            theme={theme}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="검색 값"
          />

          <Button onClick={handleSearchUsers} disabled={loading}>
            검색
          </Button>

          <Button onClick={handleLoadAllUsers} disabled={loading}>
            전체 조회
          </Button>
        </div>
      </Section>

      {/* 사용자 목록 */}
      <Section theme={theme}>
        <SectionTitle theme={theme}>👥 사용자 목록 ({users.length}명)</SectionTitle>
        <div style={{ marginBottom: 8 }}>
          <Button onClick={() => handleSort('createdAt')}>가입일 정렬</Button>
          <Button onClick={() => handleSort('point')}>포인트 정렬</Button>
        </div>
        <UserList theme={theme}>
          {users.map((user) => (
            <UserItem key={user.uid} theme={theme} onClick={() => openUserDetail(user)} style={{ cursor: 'pointer' }}>
              <UserInfo>
                <UserName theme={theme}>{user.displayName || '이름 없음'}</UserName>
                <UserEmail theme={theme}>{user.email}</UserEmail>
                <div style={{ marginTop: 4 }}>{renderStatusBadge(user.status)}</div>
              </UserInfo>
              <UserPoints>{user.point || 0}p</UserPoints>
              <div style={{ fontSize: 12, color: '#888', marginLeft: 12 }}>{formatDate(user.createdAt)}</div>
            </UserItem>
          ))}
          {users.length === 0 && (
            <div style={{ textAlign: 'center', color: theme.theme === 'dark' ? '#bdc3c7' : '#666', padding: '20px' }}>사용자가 없습니다.</div>
          )}
        </UserList>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Button onClick={handlePrevPage} disabled={pageStack.length === 0}>이전</Button>
          <Button onClick={handleNextPage} disabled={!lastDoc}>다음</Button>
        </div>
      </Section>

      {/* 프로필 정보 업데이트 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme}>👤 프로필 정보 업데이트</SectionTitle>
          <div style={{ marginBottom: '15px' }}>
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
          </div>
        </Section>
      )}

      {/* 포인트 지급 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme}>💰 포인트 일괄 지급</SectionTitle>
          <div style={{ marginBottom: '15px' }}>
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
          </div>

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
        </Section>
      )}

      {/* 디버깅 */}
      <Section theme={theme}>
        <SectionTitle theme={theme}>🔧 디버깅</SectionTitle>
        <div>
          <Button
            onClick={handleCompareAuthAndFirestore}
            disabled={loading}
            style={{ backgroundColor: '#34495e' }}
          >
            {loading ? '비교 중...' : 'Auth vs Firestore 비교'}
          </Button>

          <Button
            onClick={handleDiagnoseIssues}
            disabled={loading}
            style={{ backgroundColor: '#8e44ad' }}
          >
            {loading ? '진단 중...' : '문제 진단'}
          </Button>

          <Button
            onClick={handleRefreshFirestoreUsers}
            disabled={loading}
            style={{ backgroundColor: '#16a085' }}
          >
            {loading ? '새로고침 중...' : 'Firestore 새로고침'}
          </Button>
        </div>

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
      </Section>

      {/* 빠른 액션 - 메인 관리자만 */}
      {isMainAdmin(user) && (
        <Section theme={theme}>
          <SectionTitle theme={theme}>⚡ 빠른 액션</SectionTitle>
          <div>
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
          </div>
        </Section>
      )}

      {/* 유저 상세 정보 모달 */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeUserDetail}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 24,
            minWidth: 280,
            maxWidth: '95vw',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            boxSizing: 'border-box'
          }} onClick={e => e.stopPropagation()}>
            <h2>유저 상세 정보</h2>
            {detailLoading ? <div>로딩 중...</div> : userDetail && (
              <div>
                <div><b>이메일:</b> {userDetail.email}</div>
                <div><b>닉네임:</b> {userDetail.displayName}</div>
                <div><b>가입일:</b> {formatDate(userDetail.createdAt)}</div>
                <div><b>포인트:</b> {userDetail.point || 0}p</div>
                <div style={{ margin: '8px 0' }}>
                  <input type="number" value={pointInput} onChange={e => setPointInput(Number(e.target.value))} style={{ width: 80, marginRight: 8 }} />
                  <Button onClick={() => handlePointChange(pointInput)} disabled={pointActionLoading || !pointInput}>지급</Button>
                  <Button onClick={() => handlePointChange(-pointInput)} disabled={pointActionLoading || !pointInput} style={{ marginLeft: 4, background: '#e74c3c' }}>차감</Button>
                  {pointActionStatus && <span style={{ marginLeft: 8, color: pointActionStatus.type === 'success' ? 'green' : 'red' }}>{pointActionStatus.message}</span>}
                </div>
                <div><b>상태:</b> {renderStatusBadge(userDetail.status)}</div>
                <div style={{ margin: '8px 0' }}>
                  <Button onClick={handleToggleStatus} disabled={statusActionLoading} style={{ background: '#f39c12' }}>
                    {userDetail.status === '정지' ? '정지 해제' : '계정 정지'}
                  </Button>
                  <Button onClick={handleDeleteUser} disabled={statusActionLoading} style={{ background: '#e74c3c', marginLeft: 8 }}>계정 삭제</Button>
                  {statusActionStatus && <span style={{ marginLeft: 8, color: statusActionStatus.type === 'success' ? 'green' : 'red' }}>{statusActionStatus.message}</span>}
                </div>
                <div><b>최근 접속일:</b> {formatDate(userDetail.lastLoginAt)}</div>
                <div><b>마지막 활동일:</b> {formatDate(userDetail.lastActivityAt)}</div>
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