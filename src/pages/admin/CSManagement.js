/**
 * CSManagement.js - CS 관리 페이지
 * 유저 문의 시 포인트, 포션, 프리미엄을 관리할 수 있는 페이지
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Section, SectionTitle, SectionContent, Button, Input, Select, ButtonGroupTitle, InfoText } from '../../components/admin/AdminCommon';
import { db } from '../../firebase';
import { collection, query, where, getDocs, limit, doc, getDoc, updateDoc, addDoc, Timestamp, increment } from 'firebase/firestore';

function CSManagement({ user }) {
  const theme = useTheme();
  const toast = useToast();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [csSearchTerm, setCsSearchTerm] = useState('');
  const [csSearchType, setCsSearchType] = useState('displayName');
  const [csSearchResult, setCsSearchResult] = useState(null);
  const [csSearchResults, setCsSearchResults] = useState([]);
  const [csPointAmount, setCsPointAmount] = useState('');
  const [csPointReason, setCsPointReason] = useState('');
  const [csPointUid, setCsPointUid] = useState('');
  const [csPotionType, setCsPotionType] = useState('romance');
  const [csPotionAmount, setCsPotionAmount] = useState('');
  const [csPotionReason, setCsPotionReason] = useState('');
  const [csPotionUid, setCsPotionUid] = useState('');
  const [csPremiumUid, setCsPremiumUid] = useState('');
  const [csActionLoading, setCsActionLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        const usersRef = collection(db, 'users');
        const searchLower = searchTerm.toLowerCase();

        let searchQuery;
        if (csSearchType === 'displayName') {
          searchQuery = query(
            usersRef,
            where('displayName', '>=', searchLower),
            where('displayName', '<=', searchLower + '\uf8ff'),
            limit(50)
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
            setCsSearchResult(users[0]);
            toast.showToast('사용자를 찾았습니다.', 'success');
          } else {
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

  const handleSelectUser = (user) => {
    setCsSearchResult(user);
    setCsPointUid(user.uid);
    setCsPotionUid(user.uid);
    setCsPremiumUid(user.uid);
  };

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

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        toast.showToast('사용자를 찾을 수 없습니다.', 'error');
        return;
      }

      await updateDoc(doc(db, 'users', uid), {
        point: increment(pointChange),
        updatedAt: Timestamp.now()
      });

      await addDoc(collection(db, 'users', uid, 'pointHistory'), {
        type: action === 'add' ? 'admin_give' : 'admin_deduct',
        amount: pointChange,
        desc: `[관리자 ${action === 'add' ? '지급' : '차감'}] ${reason}`,
        createdAt: Timestamp.now()
      });

      if (csSearchResult && csSearchResult.uid === uid) {
        const updatedPoint = (csSearchResult.point || 0) + pointChange;
        setCsSearchResult({ ...csSearchResult, point: updatedPoint });
      }

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

      if (csSearchResult && csSearchResult.uid === uid) {
        setCsSearchResult({ ...csSearchResult, potions: updatedPotions });
      }

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

  return (
    <AdminLayout user={user} title="⭐ CS 관리">
      <Section theme={theme}>
        <SectionContent isOpen={true}>
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

            {/* 검색 결과 리스트 */}
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
    </AdminLayout>
  );
}

export default CSManagement;

