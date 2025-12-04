/**
 * NotificationManagement.js - 알림 발송 페이지
 * 마케팅/이벤트 알림을 발송할 수 있는 페이지
 */

import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Section, SectionTitle, SectionContent, Button, InfoText } from '../../components/admin/AdminCommon';
import { isMainAdmin } from '../../utils/adminAuth';
import { getUsersByCondition } from '../../utils/userMigration';
import { getFunctions, httpsCallable } from 'firebase/functions';

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

function NotificationManagement({ user }) {
  const theme = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [notificationType, setNotificationType] = useState('marketing');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationImageUrl, setNotificationImageUrl] = useState('');
  const [notificationLinkUrl, setNotificationLinkUrl] = useState('');
  const [notificationSending, setNotificationSending] = useState(false);
  const [marketingUsersList, setMarketingUsersList] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCheckMarketingUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 마케팅 알림 수신 사용자 조회 시작...');
      const marketingUsers = await getUsersByCondition('marketingEnabled', '==', true);
      console.log('✅ 마케팅 알림 수신 사용자 조회 완료:', marketingUsers.length, '명');

      const simpleList = marketingUsers.map(user => ({
        email: user.email || '이메일 없음',
        displayName: user.displayName || '이름 없음'
      }));

      console.log('📋 마케팅 알림 수신 사용자 목록 (이메일, 이름):');
      simpleList.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      });

      setMarketingUsersList(simpleList);
      toast.showToast(`마케팅 알림 수신 사용자 ${marketingUsers.length}명을 찾았습니다.`, 'success');
    } catch (error) {
      console.error('❌ 마케팅 알림 수신 사용자 조회 실패:', error);
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

  const handleSendNotification = async () => {
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
  };

  if (!isMainAdmin(user)) {
    return (
      <AdminLayout user={user} title="📢 알림 발송">
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

  return (
    <AdminLayout user={user} title="📢 알림 발송">
      <Section theme={theme}>
        <SectionContent isOpen={true}>
          <InfoText theme={theme}>
            {notificationType === 'marketing'
              ? '마케팅 알림 수신 동의한 사용자에게 알림을 발송합니다.'
              : '이벤트 알림 수신 동의한 사용자에게 알림을 발송합니다.'}
          </InfoText>

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
              onClick={handleSendNotification}
              disabled={notificationSending || !notificationTitle.trim() || !notificationMessage.trim()}
              style={{
                backgroundColor: notificationType === 'marketing' ? '#e74c3c' : '#3498db',
                width: '100%',
                fontSize: isMobile ? '14px' : '13px',
                padding: isMobile ? '12px' : '8px',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              {notificationSending
                ? '발송 중...'
                : `${notificationType === 'marketing' ? '마케팅' : '이벤트'} 알림 발송`}
            </Button>
          </div>
        </SectionContent>
      </Section>
    </AdminLayout>
  );
}

export default NotificationManagement;

