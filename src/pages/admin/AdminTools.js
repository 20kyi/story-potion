/**
 * AdminTools.js - 관리 도구 페이지
 * 프로필 업데이트, 디버깅, 사용자 정리 기능
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Section, SectionTitle, SectionContent, Button, ButtonGroup, ButtonGroupTitle, InfoText } from '../../components/admin/AdminCommon';
import { isMainAdmin } from '../../utils/adminAuth';
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

function AdminTools({ user }) {
  const theme = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMainAdmin(user)) {
    return (
      <AdminLayout user={user} title="🔧 관리 도구">
        <Section theme={theme}>
          <SectionContent isOpen={true}>
            <div style={{ textAlign: 'center', padding: '20px', color: theme.text }}>
              메인 관리자만 접근할 수 있습니다.
            </div>
          </SectionContent>
        </Section>
      </AdminLayout>
    );
  }

  const handleUpdateEmptyProfileImages = async () => {
    if (!window.confirm('빈 프로필 이미지를 가진 사용자들의 프로필을 기본 이미지로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    toast.showToast('프로필 이미지 업데이트 중...', 'info');

    try {
      const result = await updateEmptyProfileImages();
      if (result.success) {
        toast.showToast(result.message, 'success');
      } else {
        toast.showToast(result.message, 'error');
      }
    } catch (error) {
      toast.showToast('프로필 이미지 업데이트 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndUpdateAllProfileImages = async () => {
    if (!window.confirm('모든 사용자의 프로필 이미지를 확인하고 빈 값이 있으면 기본 이미지로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    toast.showToast('프로필 이미지 확인 및 업데이트 중...', 'info');

    try {
      const result = await checkAndUpdateAllProfileImages();
      if (result.success) {
        toast.showToast(result.message, 'success');
      } else {
        toast.showToast(result.message, 'error');
      }
    } catch (error) {
      toast.showToast('프로필 이미지 업데이트 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmptyDisplayNames = async () => {
    if (!window.confirm('빈 displayName을 가진 사용자들의 닉네임을 이메일의 앞부분으로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    toast.showToast('displayName 업데이트 중...', 'info');

    try {
      const result = await updateEmptyDisplayNames();
      if (result.success) {
        toast.showToast(result.message, 'success');
      } else {
        toast.showToast(result.message, 'error');
      }
    } catch (error) {
      toast.showToast('displayName 업데이트 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndUpdateAllUserProfiles = async () => {
    if (!window.confirm('모든 사용자의 프로필 정보(닉네임, 프로필 이미지)를 확인하고 빈 값이 있으면 기본값으로 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    toast.showToast('프로필 정보 확인 및 업데이트 중...', 'info');

    try {
      const result = await checkAndUpdateAllUserProfiles();
      if (result.success) {
        toast.showToast(result.message, 'success');
      } else {
        toast.showToast(result.message, 'error');
      }
    } catch (error) {
      toast.showToast('프로필 정보 업데이트 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAllUserProfiles = async () => {
    setLoading(true);
    toast.showToast('사용자 프로필 상태 확인 중...', 'info');

    try {
      const result = await checkAllUserProfiles();
      setDebugInfo(result);
      toast.showToast(result.message, 'success');
    } catch (error) {
      toast.showToast('프로필 상태 확인 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFirestoreUsers = async () => {
    setLoading(true);
    toast.showToast('Firestore 사용자 목록 새로고침 중...', 'info');

    try {
      const firestoreUsers = await getAllFirestoreUsers();
      toast.showToast(`새로고침 완료: ${firestoreUsers.length}명의 사용자`, 'success');
    } catch (error) {
      toast.showToast('새로고침 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

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
        setCleanupResult(null);
      } else {
        toast.showToast('탈퇴한 회원 정리 실패: ' + result.message, 'error');
      }
    } catch (error) {
      toast.showToast('오류 발생: ' + error.message, 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

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

  return (
    <AdminLayout user={user} title="🔧 관리 도구">
      {/* 프로필 정보 업데이트 */}
      <Section theme={theme}>
        <SectionTitle theme={theme}>
          <span>👤 프로필 정보 업데이트</span>
        </SectionTitle>
        <SectionContent isOpen={true}>
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

      {/* 디버깅 */}
      <Section theme={theme}>
        <SectionTitle theme={theme}>
          <span>🔧 디버깅</span>
        </SectionTitle>
        <SectionContent isOpen={true}>
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

      {/* 탈퇴한 회원 정리 */}
      <Section theme={theme}>
        <SectionTitle theme={theme}>
          <span>🗑️ 탈퇴한 회원 정리</span>
        </SectionTitle>
        <SectionContent isOpen={true}>
          <InfoText theme={theme}>
            Firebase에 남아있는 탈퇴한 회원들을 찾아서 정리할 수 있습니다.
            <br />
            <strong style={{ color: '#e74c3c' }}>⚠️ 주의: 이 작업은 되돌릴 수 없습니다!</strong>
          </InfoText>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

            {/* 찾은 사용자 정리 */}
            {cleanupResult && cleanupResult.users && cleanupResult.users.length > 0 && (
              <>
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: theme.theme === 'dark' ? '#34495e' : '#f8f9fa',
                  borderRadius: '8px',
                  border: `1px solid ${theme.theme === 'dark' ? '#2c3e50' : '#ddd'}`
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
    </AdminLayout>
  );
}

export default AdminTools;

