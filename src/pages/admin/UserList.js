/**
 * UserList.js - 사용자 목록 페이지
 * 관리자가 사용자 목록을 조회하고 관리할 수 있는 페이지
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Section, SectionTitle, SectionContent, Button, Input, Select } from '../../components/admin/AdminCommon';
import { requireAdmin, isMainAdmin } from '../../utils/adminAuth';
import { getUsersWithQuery, updateUserData } from '../../utils/userMigration';
import { getUsersCollectionStatus } from '../../utils/syncAuthUsers';
import { db } from '../../firebase';
import { collection, query, where, getDocs, limit, doc, deleteDoc, getDoc } from 'firebase/firestore';

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

function UserList({ user }) {
  const theme = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [simpleSearchTerm, setSimpleSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [userActivity, setUserActivity] = useState({ diaries: [], novels: [], comments: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionStatus, setStatusActionStatus] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [pageLimit, setPageLimit] = useState(10);
  const [orderByField, setOrderByField] = useState('createdAt');
  const [orderDir, setOrderDir] = useState('desc');
  const [lastDoc, setLastDoc] = useState(null);
  const [pageStack, setPageStack] = useState([]);
  const [totalUsers, setTotalUsers] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPremiumText = (user) => {
    if (user.isYearlyPremium) return '연간';
    if (user.isMonthlyPremium) return '월간';
    return '일반';
  };

  const getPremiumColor = (user) => {
    if (user.isYearlyPremium) return '#FFC300';
    if (user.isMonthlyPremium) return '#3498db';
    return '#95a5a6';
  };

  const renderStatusBadge = (status) => {
    let color = '#2ecc40', text = '정상';
    if (status === '정지') { color = '#e74c3c'; text = '정지'; }
    if (status === '탈퇴') { color = '#95a5a6'; text = '탈퇴'; }
    return <span style={{ color: color, fontSize: '11px', fontWeight: '500' }}>{text}</span>;
  };

  const renderPremiumBadge = (user) => {
    const premiumText = getPremiumText(user);
    const premiumColor = getPremiumColor(user);
    return <span style={{ color: premiumColor, fontSize: '11px', fontWeight: '500' }}>{premiumText}</span>;
  };

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

  const loadUsersPage = async (opts = {}) => {
    setLoading(true);
    try {
      const needsClientSort = orderByField === 'premium' || orderByField === 'status';
      const firestoreOrderBy = needsClientSort ? 'createdAt' : orderByField;
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

      let finalUsers = loadedUsers;
      if (needsClientSort) {
        finalUsers = [...loadedUsers].sort((a, b) => {
          let aVal, bVal;
          if (orderByField === 'premium') {
            const getPremiumValue = (user) => {
              if (user.isYearlyPremium) return 3;
              if (user.isMonthlyPremium) return 2;
              return 1;
            };
            aVal = getPremiumValue(a);
            bVal = getPremiumValue(b);
          } else if (orderByField === 'status') {
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
        if (pageLimit) {
          finalUsers = finalUsers.slice(0, pageLimit);
        }
      }

      setUsers(finalUsers);

      if (opts.isNext) {
        setPageStack(prev => [...prev, lastDoc]);
        setLastDoc(newLastDoc);
      } else if (opts.isPrev) {
        setPageStack(prev => {
          const newStack = [...prev];
          newStack.pop();
          if (newStack.length === 0) {
            setLastDoc(newLastDoc);
          } else {
            setLastDoc(newStack[newStack.length - 1]);
          }
          return newStack;
        });
      } else {
        setPageStack([]);
        setLastDoc(newLastDoc);
      }
    } catch (e) {
      toast.showToast('유저 목록 불러오기 실패: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadUsersPage();
  }, [orderByField, orderDir]);

  const handleSortFieldChange = (field) => {
    setOrderByField(field);
  };

  const handleSortDirChange = (dir) => {
    setOrderDir(dir);
  };

  const handleNextPage = () => {
    loadUsersPage({ startAfter: lastDoc, isNext: true });
  };

  const handlePrevPage = () => {
    if (pageStack.length === 0) return;
    const prevStack = [...pageStack];
    prevStack.pop();
    const prevLastDoc = prevStack.length > 0 ? prevStack[prevStack.length - 1] : null;
    loadUsersPage({ startAfter: prevLastDoc, isPrev: true });
  };

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

      const nameQuery = query(
        usersRef,
        where('displayName', '>=', searchLower),
        where('displayName', '<=', searchLower + '\uf8ff'),
        limit(100)
      );

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

      const usersMap = new Map();
      nameSnapshot.forEach(doc => {
        const userData = { uid: doc.id, ...doc.data() };
        usersMap.set(userData.uid, userData);
      });
      emailSnapshot.forEach(doc => {
        const userData = { uid: doc.id, ...doc.data() };
        usersMap.set(userData.uid, userData);
      });

      const searchResults = Array.from(usersMap.values());
      setUsers(searchResults);
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

  const handleResetSearch = async () => {
    setSimpleSearchTerm('');
    setLastDoc(null);
    setPageStack([]);
    await loadUsersPage();
  };

  const openUserDetail = async (u) => {
    setSelectedUser(u);
    setDetailLoading(true);

    try {
      const userDoc = await getDoc(doc(db, 'users', u.uid));
      if (userDoc.exists()) {
        const latestUserData = { uid: u.uid, ...userDoc.data() };
        setUserDetail(latestUserData);
      } else {
        setUserDetail(u);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      setUserDetail(u);
    }

    try {
      const promises = [
        getDocs(query(collection(db, 'diaries'), where('uid', '==', u.uid))),
        getDocs(query(collection(db, 'novels'), where('uid', '==', u.uid))),
        getDocs(query(collection(db, 'comments'), where('uid', '==', u.uid))),
      ];

      const [diariesSnap, novelsSnap, commentsSnap] = await Promise.all(promises);
      const sortByCreatedAt = (a, b) => {
        const aTime = a.createdAt?.seconds || a.createdAt || 0;
        const bTime = b.createdAt?.seconds || b.createdAt || 0;
        return bTime - aTime;
      };

      const diaries = diariesSnap.docs.map(d => d.data()).sort(sortByCreatedAt).slice(0, 10);
      const novels = novelsSnap.docs.map(n => n.data()).sort(sortByCreatedAt).slice(0, 10);
      const comments = commentsSnap.docs.map(c => c.data()).sort(sortByCreatedAt).slice(0, 10);

      setUserActivity({ diaries, novels, comments });
    } catch (e) {
      console.error('사용자 활동 내역 조회 실패:', e);
      setUserActivity({ diaries: [], novels: [], comments: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setUserDetail(null);
    setUserActivity({ diaries: [], novels: [], comments: [] });
  };

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
        await loadUsersPage();
      } else {
        setStatusActionStatus({ type: 'error', message: '상태 변경 실패' });
      }
    } catch (e) {
      setStatusActionStatus({ type: 'error', message: '상태 변경 오류: ' + e.message });
    } finally {
      setStatusActionLoading(false);
    }
  };

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
    <AdminLayout user={user} title="👥 사용자 목록">
      <Section theme={theme}>
        <SectionContent isOpen={true}>
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

          {/* 목록개수, 정렬기준, 내림/오름차순 */}
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
                  setLastDoc(null);
                  setPageStack([]);
                  await loadUsersPage({ limit: 10000 });
                } else {
                  const newLimit = parseInt(value);
                  setPageLimit(newLimit);
                  setLastDoc(null);
                  setPageStack([]);
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
              onChange={(e) => handleSortFieldChange(e.target.value)}
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
              onChange={(e) => handleSortDirChange(e.target.value)}
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

          {/* 모바일 카드 */}
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
              {pageStack.length + 1}/{totalUsers ? Math.ceil(totalUsers / (pageLimit || 1)) : '?'}
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
    </AdminLayout>
  );
}

export default UserList;

