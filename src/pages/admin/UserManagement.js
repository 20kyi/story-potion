/**
 * UserManagement.js - 사용자 데이터 관리 페이지
 * 
 * 관리자가 Firebase에 사용자 데이터를 일괄 저장하고 관리할 수 있는 페이지
 * 개발/테스트 목적으로만 사용해야 함
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  generateSampleUsers, 
  batchSaveUsers, 
  getExistingUsers,
  getUsersByCondition,
  updateUserData,
  migrationExamples 
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
  createExistingUsers,
  createSpecificUser,
  createUsersByEmails
} from '../../utils/createExistingUsers';
import {
  getAllFirestoreUsers,
  compareAuthAndFirestore,
  diagnoseUserIssues,
  findUserByEmail
} from '../../utils/debugUsers';
import { requireAdmin } from '../../utils/adminAuth';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
`;

const Header = styled.h1`
  color: #333;
  text-align: center;
  margin-bottom: 30px;
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  color: #555;
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
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 5px;
  font-size: 14px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 5px;
  font-size: 14px;
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
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
`;

const UserItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.strong`
  color: #333;
`;

const UserEmail = styled.div`
  color: #666;
  font-size: 12px;
`;

const UserPoints = styled.div`
  color: #3498f3;
  font-weight: bold;
`;

function UserManagement({ user }) {
  const navigate = useNavigate();

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
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  // 기존 사용자 목록 로드
  useEffect(() => {
    loadExistingUsers();
    loadUsersCollectionStatus();
  }, []);

  const loadExistingUsers = async () => {
    setLoading(true);
    try {
      const existingUsers = await getExistingUsers();
      setUsers(existingUsers);
      setStatus({ type: 'success', message: `${existingUsers.length}명의 사용자를 불러왔습니다.` });
    } catch (error) {
      setStatus({ type: 'error', message: '사용자 목록 로드 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadUsersCollectionStatus = async () => {
    try {
      const { stats } = await getUsersCollectionStatus();
      setUsersCollectionStats(stats);
    } catch (error) {
      console.error('users 컬렉션 현황 로드 실패:', error);
    }
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
      await loadExistingUsers();
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
      await loadExistingUsers();
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
      
      await loadExistingUsers();
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
      
      await loadExistingUsers();
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
        await loadExistingUsers();
        await loadUsersCollectionStatus();
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
      
      await loadExistingUsers();
      await loadUsersCollectionStatus();
    } catch (error) {
      setStatus({ type: 'error', message: '테스트 사용자 생성 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 기존 사용자 일괄 생성
  const handleCreateExistingUsers = async () => {
    if (!window.confirm('Firebase Authentication의 5명 사용자를 모두 Firestore에 생성하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '기존 사용자 일괄 생성 중...' });

    try {
      const result = await createExistingUsers();
      setStatus({ 
        type: 'success', 
        message: `기존 사용자 생성 완료: 성공 ${result.success}명, 실패 ${result.failed}명, 건너뜀 ${result.skipped}명` 
      });
      
      await loadExistingUsers();
      await loadUsersCollectionStatus();
    } catch (error) {
      setStatus({ type: 'error', message: '기존 사용자 생성 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 선택된 이메일로 사용자 생성
  const handleCreateUsersByEmails = async () => {
    if (selectedEmails.length === 0) {
      setStatus({ type: 'error', message: '생성할 사용자 이메일을 선택해주세요.' });
      return;
    }

    if (!window.confirm(`선택된 ${selectedEmails.length}명의 사용자를 생성하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '선택된 사용자 생성 중...' });

    try {
      const result = await createUsersByEmails(selectedEmails);
      setStatus({ 
        type: 'success', 
        message: `선택된 사용자 생성 완료: 성공 ${result.success}명, 실패 ${result.failed}명` 
      });
      
      await loadExistingUsers();
      await loadUsersCollectionStatus();
    } catch (error) {
      setStatus({ type: 'error', message: '선택된 사용자 생성 실패: ' + error.message });
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
        await loadExistingUsers();
        await loadUsersCollectionStatus();
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
      
      await loadExistingUsers();
    } catch (error) {
      setStatus({ type: 'error', message: '포인트 업데이트 실패: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>🔧 사용자 데이터 관리</Header>
      
      {status && (
        <Status type={status.type}>
          {status.message}
        </Status>
      )}

      {/* 사용자 동기화 */}
      <Section>
        <SectionTitle>🔄 사용자 동기화</SectionTitle>
        
        {/* 현재 상태 표시 */}
        {usersCollectionStats && (
          <div style={{ 
            background: '#e8f4fd', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            <strong>📊 Firestore users 컬렉션 현황:</strong><br/>
            총 사용자: {usersCollectionStats.totalUsers}명<br/>
            이메일 보유: {usersCollectionStats.usersWithEmail}명<br/>
            포인트 보유: {usersCollectionStats.usersWithPoints}명<br/>
            포인트 미보유: {usersCollectionStats.usersWithoutPoints}명<br/>
            평균 포인트: {usersCollectionStats.averagePoints}p<br/>
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
          
          <Button 
            onClick={handleCreateTestUsers} 
            disabled={loading}
            style={{ backgroundColor: '#e67e22' }}
          >
            {loading ? '생성 중...' : '테스트 사용자 생성'}
          </Button>
        </div>
        
        {/* 수동 사용자 생성 */}
        <div style={{ marginBottom: '15px' }}>
          <strong>수동 사용자 생성:</strong><br/>
          <Input
            type="text"
            value={manualUserData.uid}
            onChange={(e) => setManualUserData({...manualUserData, uid: e.target.value})}
            placeholder="UID"
            style={{ width: '200px' }}
          />
          <Input
            type="email"
            value={manualUserData.email}
            onChange={(e) => setManualUserData({...manualUserData, email: e.target.value})}
            placeholder="이메일"
            style={{ width: '200px' }}
          />
          <Input
            type="text"
            value={manualUserData.displayName}
            onChange={(e) => setManualUserData({...manualUserData, displayName: e.target.value})}
            placeholder="닉네임"
            style={{ width: '150px' }}
          />
          <Input
            type="number"
            value={manualUserData.point}
            onChange={(e) => setManualUserData({...manualUserData, point: parseInt(e.target.value) || 0})}
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
        
        {/* 기존 사용자 생성 */}
        <div style={{ marginBottom: '15px' }}>
          <strong>기존 Auth 사용자 생성:</strong><br/>
          <Button 
            onClick={handleCreateExistingUsers} 
            disabled={loading}
            style={{ backgroundColor: '#e74c3c', marginTop: '10px' }}
          >
            {loading ? '생성 중...' : '5명 기존 사용자 일괄 생성'}
          </Button>
          
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>Firebase Auth 사용자 목록:</strong><br/>
            • acho180201@naver.com (2025. 7. 4.)<br/>
            • 20kyi@naver.com (2025. 7. 1.)<br/>
            • acho1821@gmail.com (2025. 6. 20.)<br/>
            • hyejin@sungkyul.ac.kr (2025. 6. 20.)<br/>
            • 0521kimyi@gmail.com (2025. 6. 20.)
          </div>
        </div>
        
        {/* 선택적 사용자 생성 */}
        <div style={{ marginBottom: '15px' }}>
          <strong>선택적 사용자 생성:</strong><br/>
          <div style={{ marginTop: '5px' }}>
            {['acho180201@naver.com', '20kyi@naver.com', 'acho1821@gmail.com', 'hyejin@sungkyul.ac.kr', '0521kimyi@gmail.com'].map(email => (
              <label key={email} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={selectedEmails.includes(email)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEmails([...selectedEmails, email]);
                    } else {
                      setSelectedEmails(selectedEmails.filter(e => e !== email));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                {email}
              </label>
            ))}
          </div>
          <Button 
            onClick={handleCreateUsersByEmails} 
            disabled={loading || selectedEmails.length === 0}
            style={{ backgroundColor: '#f39c12', marginTop: '10px' }}
          >
            {loading ? '생성 중...' : `선택된 ${selectedEmails.length}명 생성`}
          </Button>
        </div>
      </Section>

      {/* 샘플 사용자 생성 */}
      <Section>
        <SectionTitle>📝 샘플 사용자 생성</SectionTitle>
        <div>
          <Input
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

      {/* 사용자 검색 */}
      <Section>
        <SectionTitle>🔍 사용자 검색</SectionTitle>
        <div>
          <Select 
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
      <Section>
        <SectionTitle>👥 사용자 목록 ({users.length}명)</SectionTitle>
        <div style={{ marginBottom: '10px' }}>
          <Button 
            onClick={handleBulkUpdatePoints} 
            disabled={loading || users.length === 0}
            variant="danger"
          >
            포인트 1000으로 일괄 설정
          </Button>
        </div>
        
        <UserList>
          {users.map((user) => (
            <UserItem key={user.uid}>
              <UserInfo>
                <UserName>{user.displayName || '이름 없음'}</UserName>
                <UserEmail>{user.email}</UserEmail>
              </UserInfo>
              <UserPoints>{user.point || 0}p</UserPoints>
            </UserItem>
          ))}
          {users.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              사용자가 없습니다.
            </div>
          )}
        </UserList>
      </Section>

      {/* 포인트 지급 */}
      <Section>
        <SectionTitle>💰 포인트 일괄 지급</SectionTitle>
        <div style={{ marginBottom: '15px' }}>
          <Input
            type="number"
            value={pointAmount}
            onChange={(e) => setPointAmount(parseInt(e.target.value) || 0)}
            placeholder="지급할 포인트"
            min="1"
            style={{ width: '120px' }}
          />
          <Input
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
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '5px', 
              marginTop: '10px',
              fontSize: '14px'
            }}>
              <strong>📊 포인트 통계:</strong><br/>
              총 사용자: {pointsStats.totalUsers}명<br/>
              포인트 보유: {pointsStats.usersWithPoints}명<br/>
              포인트 미보유: {pointsStats.usersWithoutPoints}명<br/>
              총 포인트: {pointsStats.totalPoints.toLocaleString()}p<br/>
              평균 포인트: {pointsStats.averagePoints}p<br/>
              최대 포인트: {pointsStats.maxPoints}p<br/>
              최소 포인트: {pointsStats.minPoints}p<br/>
              <strong>포인트 분포:</strong><br/>
              • 0p: {pointsStats.pointDistribution['0']}명<br/>
              • 1-100p: {pointsStats.pointDistribution['1-100']}명<br/>
              • 101-500p: {pointsStats.pointDistribution['101-500']}명<br/>
              • 501-1000p: {pointsStats.pointDistribution['501-1000']}명<br/>
              • 1000p+: {pointsStats.pointDistribution['1000+']}명
            </div>
          )}
        </div>
      </Section>

      {/* 디버깅 */}
      <Section>
        <SectionTitle>🔧 디버깅</SectionTitle>
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
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px', 
            marginTop: '15px',
            fontSize: '14px',
            border: '1px solid #dee2e6'
          }}>
            <strong>🔍 디버깅 결과:</strong><br/>
            {debugInfo.missingUsers && debugInfo.missingUsers.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong style={{ color: '#e74c3c' }}>❌ 누락된 사용자 ({debugInfo.missingUsers.length}명):</strong><br/>
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
                <strong style={{ color: '#27ae60' }}>✅ 존재하는 사용자 ({debugInfo.existingUsers.length}명):</strong><br/>
                {debugInfo.existingUsers.map((user, index) => (
                  <div key={index} style={{ marginLeft: '10px', marginTop: '5px' }}>
                    • {user.email} (UID: {user.uid})
                  </div>
                ))}
              </div>
            )}
            
            {debugInfo.issues && debugInfo.issues.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong style={{ color: '#e67e22' }}>⚠️ 문제점:</strong><br/>
                {debugInfo.issues.map((issue, index) => (
                  <div key={index} style={{ marginLeft: '10px', marginTop: '5px' }}>
                    • {issue}
                  </div>
                ))}
              </div>
            )}
            
            {debugInfo.solutions && debugInfo.solutions.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong style={{ color: '#3498db' }}>💡 해결방법:</strong><br/>
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

      {/* 빠른 액션 */}
      <Section>
        <SectionTitle>⚡ 빠른 액션</SectionTitle>
        <div>
          <Button 
            onClick={async () => {
              const result = await migrationExamples.createSampleUsers();
              setStatus({ type: 'success', message: `샘플 사용자 생성: 성공 ${result.success}명` });
              await loadExistingUsers();
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
              await loadExistingUsers();
              await handleLoadPointsStats();
            }}
            disabled={loading}
            style={{ backgroundColor: '#e74c3c' }}
          >
            500p 즉시 지급
          </Button>
        </div>
      </Section>
    </Container>
  );
}

export default UserManagement; 