import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { motion } from 'framer-motion';
import {
    searchUsers,
    sendFriendRequest,
    getReceivedFriendRequests,
    getSentFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendsList,
    removeFriend,
    subscribeToFriendRequests
} from '../../utils/friendSystem';
import { FaSearch, FaUserPlus, FaUserCheck, FaUserTimes, FaTrash, FaUsers } from 'react-icons/fa';
import { HiOutlineTrash } from 'react-icons/hi';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '../../firebase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px;
  margin: 40px auto;
  margin-top: 50px;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  position: relative;
`;

const TabContainer = styled.div`
  margin-bottom: 16px;
`;

const TabHeader = styled.div`
  display: flex;
  background: ${({ theme }) => theme.card};
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Tab = styled.button.attrs({
  className: 'friend-tab'
})`
  flex: 1;
  padding: 14px 12px;
  border: none;
  background: ${({ active, theme }) => active ? '#e46262' : 'transparent'};
  color: ${({ active, theme }) => active ? 'white' : (theme.mode === 'dark' ? '#fff' : theme.text)};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TabContent = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 0 0 12px 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-height: 500px;
`;

const SearchSection = styled.div`
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const SearchTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text};
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchInput = styled.input.attrs({
  className: 'friend-search-input'
})`
  width: 100%;
  padding: 14px 16px;
  padding-right: 50px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 10px;
  font-size: 16px;
  background-color: ${({ theme }) => theme.background} !important;
  color: ${({ theme }) => theme.text} !important;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  &::placeholder {
    color: ${({ theme }) => theme.subText || '#666'} !important;
    opacity: 1;
  }

  &:focus {
    border-color: #e46262;
    box-shadow: 0 0 0 2px rgba(228, 98, 98, 0.1);
    background-color: ${({ theme }) => theme.background} !important;
    color: ${({ theme }) => theme.text} !important;
  }

  /* 다크모드에서 자동완성 배경색 방지 */
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px ${({ theme }) => theme.background} inset !important;
    -webkit-text-fill-color: ${({ theme }) => theme.text} !important;
    background-color: ${({ theme }) => theme.background} !important;
  }

  /* 모든 상태에서 배경색 강제 적용 */
  &:hover,
  &:active,
  &:focus,
  &:visited {
    background-color: ${({ theme }) => theme.background} !important;
    color: ${({ theme }) => theme.text} !important;
  }
`;

// 전역 스타일 추가
const GlobalStyle = styled.div`
  .friend-search-input {
    background-color: ${({ theme }) => theme.background} !important;
    color: ${({ theme }) => theme.text} !important;
  }
  
  .friend-search-input::placeholder {
    color: ${({ theme }) => theme.subText || '#666'} !important;
  }
  
  .friend-search-input:focus {
    background-color: ${({ theme }) => theme.background} !important;
    color: ${({ theme }) => theme.text} !important;
  }
  
  .friend-search-input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 30px ${({ theme }) => theme.background} inset !important;
    -webkit-text-fill-color: ${({ theme }) => theme.text} !important;
    background-color: ${({ theme }) => theme.background} !important;
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: #e46262;
  color: white;
  border: none;
  border-radius: 8px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #d45555;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;
/* 유저카드 */
const UserCard = styled(motion.div)`
  background: ${({ theme }) => theme.background};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const UserAvatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  max-width: calc(100% - 110px); // 버튼/배지 공간 조정 (90px + 여백)
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText || '#666'};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
  cursor: help;
  position: relative;
  
  &:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    margin-bottom: 4px;
  }
`;

const ActionButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  height: 42px;
  justify-content: center;
  margin-left: auto;
  box-sizing: border-box;

  &.primary {
    background: #e46262;
    color: white;
    
    &:hover {
      background: #d45555;
      transform: translateY(-1px);
    }
  }

  &.success {
    background: #27ae60;
    color: white;
    
    &:hover {
      background: #229954;
    }
  }

  &.danger {
    background: #e74c3c;
    color: white;
    
    &:hover {
      background: #c0392b;
    }
  }

  &.secondary {
    background: #95a5a6;
    color: white;
    
    &:hover {
      background: #7f8c8d;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span`
  padding: 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: system-ui, sans-serif;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  justify-content: center;
  box-sizing: border-box;

  &.pending {
    background: #f39c12;
    color: white;
  }

  &.accepted {
    background: #27ae60;
    color: white;
  }

  &.rejected {
    background: #e74c3c;
    color: white;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.subText || '#666'};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  opacity: 0.8;
`;

const RequestCount = styled.span`
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
`;

const RejectButton = styled(ActionButton)`
  background: none !important;
  color: #e74c3c !important;
  border: none !important;
  box-shadow: none !important;
  flex: 1 !important;
  padding: 8px 12px !important;
  &:hover {
    background: none !important;
    color: #c0392b !important;
  }
`;

const AcceptButton = styled.button`
  background: #e46262;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex: 4;
  height: 42px;
  box-sizing: border-box;
  
  &:hover {
    background: #d45555;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TrashIconButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  padding: 6px;
  color: rgba(209, 20, 20, 0.82);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  z-index: 2;
  border-radius: 6px;
  
  &:hover, &:focus {
    background: #fff0f0;
    color: rgba(201, 59, 59, 1);
  }
`;

function Friend({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('friends');  // 기본 탭을 친구로 변경
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 디바운싱을 위한 타이머
    const [searchTimeout, setSearchTimeout] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            loadData();
            const unsubscribe = subscribeToFriendRequests(user.uid, (requests) => {
                setReceivedRequests(requests.filter(req => req.status === 'pending'));
            });
            return unsubscribe;
        }
    }, [user]);

    const getAllMyFriendRequests = async (userId) => {
        try {
            const requestsRef = collection(db, 'friendRequests');
            // Firestore v9 이상에서 or 쿼리 지원
            const q = query(
                requestsRef,
                or(
                    where('toUserId', '==', userId),
                    where('fromUserId', '==', userId)
                )
            );
            const snapshot = await getDocs(q);
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('내가 관련된 모든 친구 요청:', requests);
            return requests;
        } catch (error) {
            console.error('내가 관련된 친구 요청 불러오기 실패:', error);
            return [];
        }
    };

    const loadData = async () => {
        try {
            const [received, sent, friendsList] = await Promise.all([
                getReceivedFriendRequests(user.uid),
                getSentFriendRequests(user.uid),
                getFriendsList(user.uid)
            ]);
            console.log('받은 친구 요청:', received);
            console.log('보낸 친구 요청:', sent);
            console.log('친구 목록:', friendsList);
            await getAllMyFriendRequests(user.uid);
            setReceivedRequests(received);
            setSentRequests(sent);
            setFriends(friendsList);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    };

    // 디바운싱된 검색 함수
    const debouncedSearch = useCallback(async (query) => {
        if (!query.trim() || query.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchUsers(query, user.uid);
            setSearchResults(results);
        } catch (error) {
            console.error('사용자 검색 실패:', error);
            toast.showToast('사용자 검색에 실패했습니다.', 'error');
        } finally {
            setIsSearching(false);
        }
    }, [user.uid, toast]);

    // 검색어 변경 핸들러
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        // 이전 타이머 클리어
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // 새로운 타이머 설정 (500ms 후 검색 실행)
        const newTimeout = setTimeout(() => {
            debouncedSearch(value);
        }, 500);

        setSearchTimeout(newTimeout);
    };

    // 수동 검색 함수 (검색 버튼 클릭 시)
    const handleManualSearch = async () => {
        if (!searchQuery.trim()) {
            toast.showToast('검색어를 입력해주세요.', 'error');
            return;
        }

        // 타이머 클리어
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery, user.uid);
            setSearchResults(results);
        } catch (error) {
            console.error('사용자 검색 실패:', error);
            toast.showToast('사용자 검색에 실패했습니다.', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    // 컴포넌트 언마운트 시 타이머 클리어
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    const handleSendFriendRequest = async (targetUserId) => {
        setIsLoading(true);
        try {
            await sendFriendRequest(user.uid, targetUserId);
            toast.showToast('친구 요청을 보냈습니다.', 'success');
            loadData();
        } catch (error) {
            console.error('친구 요청 실패:', error);
            toast.showToast('친구 요청에 실패했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId, fromUserId, toUserId) => {
        setIsLoading(true);
        try {
            await acceptFriendRequest(requestId, fromUserId, toUserId);
            toast.showToast('친구 요청을 수락했습니다.', 'success');
            loadData();
        } catch (error) {
            console.error('친구 요청 수락 실패:', error);
            toast.showToast('친구 요청 수락에 실패했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectRequest = async (requestId) => {
        setIsLoading(true);
        try {
            await rejectFriendRequest(requestId);
            toast.showToast('친구 요청을 거절했습니다.', 'success');
            loadData();
        } catch (error) {
            console.error('친구 요청 거절 실패:', error);
            toast.showToast('친구 요청 거절에 실패했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFriend = async (friendshipId) => {
        setIsLoading(true);
        try {
            await removeFriend(friendshipId, user.uid);
            toast.showToast('친구를 삭제했습니다.', 'success');
            loadData();
        } catch (error) {
            console.error('친구 삭제 실패:', error);
            toast.showToast('친구 삭제에 실패했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const renderFriendsTab = () => (
        <div>
            <SearchSection theme={theme}>
                <SearchTitle theme={theme}>친구 찾기</SearchTitle>
                <SearchInputContainer>
                    <SearchInput
                        type="text"
                        placeholder="이름 또는 이메일로 검색"
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                        theme={theme}
                        style={{
                            backgroundColor: theme.background,
                            color: theme.text
                        }}
                    />
                    <SearchButton
                        onClick={handleManualSearch}
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        <FaSearch />
                    </SearchButton>
                </SearchInputContainer>

                {searchResults.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <SectionTitle theme={theme}>검색 결과 ({searchResults.length}명)</SectionTitle>
                        {searchResults.map((user) => {
                            // 사용자 상태 확인
                            const isFriend = friends.some(friend => friend.user.uid === user.uid);
                            const hasSentRequest = sentRequests.some(req => req.toUserId === user.uid);
                            const hasReceivedRequest = receivedRequests.some(req => req.fromUserId === user.uid);
                            
                            return (
                                <UserCard
                                    key={user.uid}
                                    theme={theme}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <UserInfo>
                                        <UserAvatar
                                            src={
                                                user.photoURL &&
                                                    typeof user.photoURL === 'string' &&
                                                    user.photoURL.trim() !== '' &&
                                                    user.photoURL !== 'null' &&
                                                    user.photoURL !== 'undefined'
                                                    ? user.photoURL
                                                    : '/default-profile.svg'
                                            }
                                            alt={user.displayName}
                                        />
                                        <UserDetails>
                                            <UserName theme={theme}>{user.displayName || '사용자'}</UserName>
                                            <UserEmail 
                                                theme={theme} 
                                                title={user.email}
                                            >
                                                {user.email}
                                            </UserEmail>
                                        </UserDetails>
                                    </UserInfo>
                                    {!isFriend && !hasSentRequest && !hasReceivedRequest && (
                                        <ActionButton
                                            className="primary"
                                            onClick={() => handleSendFriendRequest(user.uid)}
                                            disabled={isLoading}
                                        >
                                            <FaUserPlus />
                                            친구 요청
                                        </ActionButton>
                                    )}
                                    {isFriend && (
                                        <StatusBadge className="accepted" style={{ marginLeft: 'auto'}}>
                                            <FaUserCheck style={{ marginRight: '6px' }} />
                                            친구
                                        </StatusBadge>
                                    )}
                                    {hasSentRequest && (
                                        <StatusBadge className="pending" style={{ marginLeft: 'auto'}}>
                                            <FaUserTimes style={{ marginRight: '6px' }} />
                                            요청중
                                        </StatusBadge>
                                    )}
                                    {hasReceivedRequest && (
                                        <ActionRow>
                                            <RejectButton
                                                className="danger"
                                                onClick={() => handleRejectRequest(
                                                    receivedRequests.find(req => req.fromUserId === user.uid)?.id
                                                )}
                                                disabled={isLoading}
                                            >
                                                거절
                                            </RejectButton>
                                            <AcceptButton
                                                className="success"
                                                onClick={() => handleAcceptRequest(
                                                    receivedRequests.find(req => req.fromUserId === user.uid)?.id,
                                                    user.uid,
                                                    user.uid
                                                )}
                                                disabled={isLoading}
                                            >
                                                수락
                                            </AcceptButton>
                                        </ActionRow>
                                    )}
                                </UserCard>
                            );
                        })}
                    </div>
                )}

                {isSearching && (
                    <div style={{ marginTop: '20px', textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '16px', color: theme.subText || '#666' }}>
                            검색 중...
                        </div>
                    </div>
                )}

                {!isSearching && searchQuery.trim() && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <EmptyState theme={theme}>
                            <EmptyIcon>🔍</EmptyIcon>
                            <EmptyText>검색 결과가 없습니다</EmptyText>
                            <EmptySubtext>다른 검색어를 시도해보세요</EmptySubtext>
                        </EmptyState>
                    </div>
                )}

                {searchQuery.trim() && searchQuery.trim().length < 2 && (
                    <div style={{ marginTop: '20px', textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '14px', color: theme.subText || '#666' }}>
                            2글자 이상 입력해주세요
                        </div>
                    </div>
                )}
            </SearchSection>

            <SectionTitle theme={theme}>
                <FaUsers />
                내 친구 목록 ({friends.length}명)
            </SectionTitle>

            {friends.length === 0 ? (
                <EmptyState theme={theme}>
                    <EmptyIcon>👥</EmptyIcon>
                    <EmptyText>친구가 없습니다</EmptyText>
                    <EmptySubtext>위에서 친구를 찾아서 요청을 보내보세요</EmptySubtext>
                </EmptyState>
            ) : (
                friends.map((friend) => (
                    <UserCard
                        key={friend.id}
                        theme={theme}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{ position: 'relative' }}
                    >
                        <UserInfo
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/friend-novels?userId=${friend.user.uid}`)}
                        >
                            <UserAvatar
                                src={
                                    friend.user.photoURL &&
                                        typeof friend.user.photoURL === 'string' &&
                                        friend.user.photoURL.trim() !== '' &&
                                        friend.user.photoURL !== 'null' &&
                                        friend.user.photoURL !== 'undefined'
                                        ? friend.user.photoURL
                                        : '/default-profile.svg'
                                }
                                alt={friend.user.displayName}
                            />
                            <UserDetails>
                                <UserName theme={theme}>
                                    {friend.user.displayName || '사용자'}
                                </UserName>
                                <UserEmail 
                                    theme={theme} 
                                    title={friend.user.email}
                                >
                                    {friend.user.email}
                                </UserEmail>
                            </UserDetails>
                        </UserInfo>
                        <TrashIconButton
                            onClick={() => handleRemoveFriend(friend.id)}
                            disabled={isLoading}
                            title="친구 삭제"
                        >
                            <HiOutlineTrash />
                        </TrashIconButton>
                    </UserCard>
                ))
            )}
        </div>
    );

    const renderRequestsTab = () => (
        <div>
            <SectionTitle theme={theme}>
                받은 친구 요청
                {receivedRequests.length > 0 && (
                    <RequestCount>{receivedRequests.length}</RequestCount>
                )}
            </SectionTitle>

            {receivedRequests.length === 0 ? (
                <EmptyState theme={theme}>
                    <EmptyIcon>📭</EmptyIcon>
                    <EmptyText>받은 친구 요청이 없습니다</EmptyText>
                    <EmptySubtext>새로운 친구 요청이 오면 여기에 표시됩니다</EmptySubtext>
                </EmptyState>
            ) : (
                receivedRequests.map((request) => (
                    <UserCard
                        key={request.id}
                        theme={theme}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <UserInfo>
                            <UserAvatar
                                src={
                                    request.fromUser?.photoURL &&
                                        typeof request.fromUser.photoURL === 'string' &&
                                        request.fromUser.photoURL.trim() !== '' &&
                                        request.fromUser.photoURL !== 'null' &&
                                        request.fromUser.photoURL !== 'undefined'
                                        ? request.fromUser.photoURL
                                        : '/default-profile.svg'
                                }
                                alt={request.fromUser?.displayName || '사용자'}
                            />
                            <UserDetails>
                                <UserName theme={theme}>
                                    {request.fromUser?.displayName || '사용자'}
                                </UserName>
                                <UserEmail 
                                    theme={theme} 
                                    title={request.fromUser?.email || ''}
                                >
                                    {request.fromUser?.email || ''}
                                </UserEmail>
                            </UserDetails>
                        </UserInfo>
                        <ActionRow>
                            <RejectButton
                                className="danger"
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={isLoading}
                            >
                                거절
                            </RejectButton>
                            <AcceptButton
                                className="success"
                                onClick={() => handleAcceptRequest(request.id, request.fromUserId, user.uid)}
                                disabled={isLoading}
                            >
                                수락
                            </AcceptButton>
                        </ActionRow>
                    </UserCard>
                ))
            )}

            <SectionTitle theme={theme}>보낸 친구 요청</SectionTitle>
            {sentRequests.length === 0 ? (
                <EmptyState theme={theme}>
                    <EmptyIcon>📤</EmptyIcon>
                    <EmptyText>보낸 친구 요청이 없습니다</EmptyText>
                    <EmptySubtext>친구 요청을 보내면 여기에 표시됩니다</EmptySubtext>
                </EmptyState>
            ) : (
                sentRequests.map((request) => (
                    <UserCard
                        key={request.id}
                        theme={theme}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <UserInfo>
                            <UserAvatar
                                src={
                                    request.toUser?.photoURL &&
                                        typeof request.toUser.photoURL === 'string' &&
                                        request.toUser.photoURL.trim() !== '' &&
                                        request.toUser.photoURL !== 'null' &&
                                        request.toUser.photoURL !== 'undefined'
                                        ? request.toUser.photoURL
                                        : '/default-profile.svg'
                                }
                                alt={request.toUser?.displayName || '사용자'}
                            />
                            <UserDetails>
                                <UserName theme={theme}>
                                    {request.toUser?.displayName || '사용자'}
                                </UserName>
                                <UserEmail 
                                    theme={theme} 
                                    title={request.toUser?.email || ''}
                                >
                                    {request.toUser?.email || ''}
                                </UserEmail>
                            </UserDetails>
                        </UserInfo>
                        <RejectButton
                            className="danger"
                            onClick={() => {/* 요청 취소 함수 구현 필요 */ }}
                            disabled={isLoading}
                            style={{ marginLeft: 'auto' }}
                        >
                            요청 취소
                        </RejectButton>
                    </UserCard>
                ))
            )}
        </div>
    );

    return (
        <Container theme={theme}>
            <GlobalStyle theme={theme} />
            <Header user={user} title="친구" />

            <TabContainer>
                <TabHeader theme={theme}>
                    <Tab
                        active={activeTab === 'friends'}
                        onClick={() => setActiveTab('friends')}
                        theme={theme}
                    >
                        친구
                    </Tab>
                    <Tab
                        active={activeTab === 'requests'}
                        onClick={() => setActiveTab('requests')}
                        theme={theme}
                    >
                        요청
                        {receivedRequests.length > 0 && (
                            <RequestCount>{receivedRequests.length}</RequestCount>
                        )}
                    </Tab>
                </TabHeader>
                <TabContent theme={theme}>
                    {activeTab === 'friends' && renderFriendsTab()}
                    {activeTab === 'requests' && renderRequestsTab()}
                </TabContent>
            </TabContainer>

            <Navigation />
        </Container>
    );
}

export default Friend; 