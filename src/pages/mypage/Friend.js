import React, { useState, useEffect } from 'react';
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
  padding: 20px;
  margin: 40px auto;
  margin-top: 50px;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  position: relative;
`;

const TabContainer = styled.div`
  margin-bottom: 20px;
`;

const TabHeader = styled.div`
  display: flex;
  background: ${({ theme }) => theme.card};
  border-radius: 15px 15px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Tab = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  background: ${({ active, theme }) => active ? '#e46262' : 'transparent'};
  color: ${({ active, theme }) => active ? 'white' : theme.text};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${({ active }) => active ? '#d45555' : 'rgba(228, 98, 98, 0.1)'};
  }
`;

const TabContent = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 0 0 15px 15px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-height: 400px;
`;

const SearchSection = styled.div`
  margin-bottom: 24px;
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

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  padding-right: 50px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 12px;
  font-size: 16px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #e46262;
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #e46262;
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
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

const UserCard = styled(motion.div)`
  background: ${({ theme }) => theme.background};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
  gap: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const UserAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText || '#666'};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 64px;
  height: 40px;
  justify-content: center;
  margin-left: auto;
  box-sizing: border-box;

  &.primary {
    background: #e46262;
    color: white;
    
    &:hover {
      background: #d45555;
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
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;

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
  margin: 24px 0 16px 0;
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
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  opacity: 0.8;
`;

const RequestCount = styled.span`
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const RejectButton = styled(ActionButton)`
  flex: 0 0 64px;
  height: 40px;
  background: none !important;
  color: #e74c3c !important;
  border: none;
  box-shadow: none;
  &:hover {
    background: none !important;
  }
`;

const AcceptButton = styled(ActionButton)`
  flex: 1 1 0;
  height: 40px;
  background: #e46262 !important;
  color: #fff !important;
  &:hover {
    background: #d45555 !important;
  }
`;

const TrashIconButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  padding: 4px;
  color: rgba(209, 20, 20, 0.82);
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  z-index: 2;
  &:hover, &:focus {
    background: #fff0f0;
    color: rgba(201, 59, 59, 1);
  }
`;

function Friend({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('friends');  // 기본 탭 설정
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.showToast('검색어를 입력해주세요.', 'error');
            return;
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

    const renderSearchTab = () => (
        <SearchSection theme={theme}>
            <SearchTitle theme={theme}>사용자 검색</SearchTitle>
            <SearchInputContainer>
                <SearchInput
                    type="text"
                    placeholder="이메일로 사용자를 검색하세요"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    theme={theme}
                />
                <SearchButton
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                >
                    <FaSearch />
                </SearchButton>
            </SearchInputContainer>

            {searchResults.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <SectionTitle theme={theme}>검색 결과</SectionTitle>
                    {searchResults.map((user) => (
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
                                    <UserEmail theme={theme}>{user.email}</UserEmail>
                                </UserDetails>
                            </UserInfo>
                            <ActionButton
                                className="primary"
                                onClick={() => handleSendFriendRequest(user.uid)}
                                disabled={isLoading}
                            >
                                <FaUserPlus />
                                친구 요청
                            </ActionButton>
                        </UserCard>
                    ))}
                </div>
            )}
        </SearchSection>
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
                                    request.fromUser.photoURL &&
                                        typeof request.fromUser.photoURL === 'string' &&
                                        request.fromUser.photoURL.trim() !== '' &&
                                        request.fromUser.photoURL !== 'null' &&
                                        request.fromUser.photoURL !== 'undefined'
                                        ? request.fromUser.photoURL
                                        : '/default-profile.svg'
                                }
                                alt={request.fromUser.displayName}
                            />
                            <UserDetails>
                                <UserName theme={theme}>
                                    {request.fromUser.displayName || '사용자'}
                                </UserName>
                                <UserEmail theme={theme}>{request.fromUser.email}</UserEmail>
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
                                    request.toUser.photoURL &&
                                        typeof request.toUser.photoURL === 'string' &&
                                        request.toUser.photoURL.trim() !== '' &&
                                        request.toUser.photoURL !== 'null' &&
                                        request.toUser.photoURL !== 'undefined'
                                        ? request.toUser.photoURL
                                        : '/default-profile.svg'
                                }
                                alt={request.toUser.displayName}
                            />
                            <UserDetails>
                                <UserName theme={theme}>
                                    {request.toUser.displayName || '사용자'}
                                </UserName>
                                <UserEmail theme={theme}>{request.toUser.email}</UserEmail>
                            </UserDetails>
                        </UserInfo>
                        <ActionRow>
                            <RejectButton
                                className="danger"
                                onClick={() => {/* 요청 취소 함수 구현 필요 */ }}
                                disabled={isLoading}
                            >
                                요청 취소
                            </RejectButton>
                        </ActionRow>
                    </UserCard>
                ))
            )}
        </div>
    );

    const renderFriendsTab = () => (
        <div>
            <SectionTitle theme={theme}>
                <FaUsers />
                내 친구 목록
            </SectionTitle>

            {friends.length === 0 ? (
                <EmptyState theme={theme}>
                    <EmptyIcon>👥</EmptyIcon>
                    <EmptyText>친구가 없습니다</EmptyText>
                    <EmptySubtext>친구를 찾아서 요청을 보내보세요</EmptySubtext>
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
                                <UserEmail theme={theme}>{friend.user.email}</UserEmail>
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

    return (
        <Container theme={theme}>
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
                        active={activeTab === 'search'}
                        onClick={() => setActiveTab('search')}
                        theme={theme}
                    >
                        검색
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
                    {activeTab === 'search' && renderSearchTab()}
                    {activeTab === 'requests' && renderRequestsTab()}
                </TabContent>
            </TabContainer>

            <Navigation />
        </Container>
    );
}

export default Friend; 