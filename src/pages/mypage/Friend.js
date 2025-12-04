import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useTranslation } from '../../LanguageContext';
import { motion } from 'framer-motion';
import {
  searchUsers,
  sendFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriendsList,
  removeFriend,
  subscribeToFriendRequests
} from '../../utils/friendSystem';
import { FaSearch, FaUserPlus, FaUserCheck, FaUserTimes, FaTrash, FaUsers } from 'react-icons/fa';
import { HiOutlineTrash } from 'react-icons/hi';
import { collection, query, where, getDocs, or, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getSafeProfileImageUrl, handleImageError } from '../../utils/profileImageUtils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px;
  margin-top: 70px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: ${({ $isDiaryTheme }) => $isDiaryTheme ? '#faf8f3' : 'transparent'};
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  position: relative;
`;

const TabContainer = styled.div`
  margin-bottom: 16px;
`;

const TabHeader = styled.div`
  display: flex;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  border-bottom: none;
`;

const Tab = styled.button.attrs({
  className: 'friend-tab'
})`
  flex: 1;
  padding: 14px 12px;
  border: none;
  background: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (active) {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
      if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.8)';
      return '#e46262';
    }
    return 'transparent';
  }};
  color: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (active) {
      if ($isGlassTheme) return '#000000';
      return 'white';
    }
    if ($isDiaryTheme) return '#8B6F47';
    return theme.mode === 'dark' ? '#fff' : theme.text;
  }};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (active) {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.4)';
      if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.9)';
      return '#d45555';
    }
    if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.1)';
    return 'rgba(228, 98, 98, 0.1)';
  }};
  }
`;

const TabContent = styled.div`
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: 0 0 12px 12px;
  padding: 20px;
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  border-top: none;
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
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
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
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.3)';
    return `1px solid ${theme.border || '#e0e0e0'}`;
  }};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '20px';
    return $isDiaryTheme ? '10px 14px 12px 11px' : '10px';
  }};
  font-size: 16px;
  background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2) !important';
    if ($isDiaryTheme) return '#fffef9 !important';
    return `${theme.background} !important`;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 1px 3px rgba(0, 0, 0, 0.05)';
    return 'none';
  }};

  &::placeholder {
    color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#8B6F47 !important';
    return `${theme.subText || '#666'} !important`;
  }};
    opacity: 1;
  }

  &:focus {
    border-color: #e46262;
    box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 0 0 3px rgba(228, 98, 98, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 0 0 2px rgba(228, 98, 98, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)';
    return '0 0 0 2px rgba(228, 98, 98, 0.1)';
  }};
    background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.25) !important';
    if ($isDiaryTheme) return '#fffef9 !important';
    return `${theme.background} !important`;
  }};
    color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
  }

  /* 다크모드에서 자동완성 배경색 방지 */
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.background;
  }} inset !important;
    -webkit-text-fill-color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
    background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.background;
  }} !important;
  }

  /* 모든 상태에서 배경색 강제 적용 */
  &:hover,
  &:active,
  &:focus,
  &:visited {
    background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.25) !important';
    if ($isDiaryTheme) return '#fffef9 !important';
    return `${theme.background} !important`;
  }};
    color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
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
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.15)';
    if ($isDiaryTheme) return 'rgba(255, 254, 249, 0.8)';
    return theme.background;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  border-radius: ${({ $isDiaryTheme }) => $isDiaryTheme ? '12px 16px 14px 13px' : '12px'};
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 1px 4px rgba(0, 0, 0, 0.06)';
    return '0 2px 6px rgba(0,0,0,0.08)';
  }};
  display: flex;
  flex-direction: column;
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.3)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.1)';
    return `1px solid ${theme.border || '#f0f0f0'}`;
  }};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 16px rgba(0, 0, 0, 0.15)';
    if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.08)';
    return '0 4px 12px rgba(0,0,0,0.12)';
  }};
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
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#666')};
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
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#666')};
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
  const { actualTheme } = useTheme();
  const isDiaryTheme = actualTheme === 'diary';
  const isGlassTheme = actualTheme === 'glass';
  const toast = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('friends');  // 기본 탭을 친구로 변경
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);

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
      toast.showToast(t('friend_search_failed'), 'error');
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
      toast.showToast(t('friend_search_input_required'), 'error');
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
      const result = await sendFriendRequest(user.uid, targetUserId);
      if (result.success) {
        toast.showToast(result.message || t('friend_request_sent'), 'success');
        await loadData();
        // 검색 결과가 있다면 검색을 다시 실행하여 상태 업데이트
        if (searchQuery.trim() && searchQuery.trim().length >= 2) {
          const results = await searchUsers(searchQuery, user.uid);
          setSearchResults(results);
        }
      } else {
        toast.showToast(result.error || t('friend_request_failed'), 'error');
      }
    } catch (error) {
      console.error('친구 요청 실패:', error);
      toast.showToast(t('friend_request_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId, fromUserId, toUserId) => {
    setIsLoading(true);
    try {
      const result = await acceptFriendRequest(requestId, fromUserId, toUserId);
      if (result.success) {
        toast.showToast(result.message || t('friend_request_accept_success'), 'success');
        await loadData();
        // 검색 결과가 있다면 검색을 다시 실행하여 상태 업데이트
        if (searchQuery.trim() && searchQuery.trim().length >= 2) {
          const results = await searchUsers(searchQuery, user.uid);
          setSearchResults(results);
        }
      } else {
        toast.showToast(result.error || t('friend_request_accept_failed'), 'error');
      }
    } catch (error) {
      console.error('친구 요청 수락 실패:', error);
      toast.showToast(t('friend_request_accept_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setIsLoading(true);
    try {
      const result = await rejectFriendRequest(requestId);
      if (result.success) {
        toast.showToast(result.message || t('friend_request_reject_success'), 'success');
        await loadData();
        // 검색 결과가 있다면 검색을 다시 실행하여 상태 업데이트
        if (searchQuery.trim() && searchQuery.trim().length >= 2) {
          const results = await searchUsers(searchQuery, user.uid);
          setSearchResults(results);
        }
      } else {
        toast.showToast(result.error || t('friend_request_reject_failed'), 'error');
      }
    } catch (error) {
      console.error('친구 요청 거절 실패:', error);
      toast.showToast(t('friend_request_reject_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    setIsLoading(true);
    try {
      const result = await removeFriend(friendshipId);
      if (result.success) {
        toast.showToast(t('friend_remove_success'), 'success');
        await loadData();
        // 검색 결과가 있다면 검색을 다시 실행하여 상태 업데이트
        if (searchQuery.trim() && searchQuery.trim().length >= 2) {
          const results = await searchUsers(searchQuery, user.uid);
          setSearchResults(results);
        }
      } else {
        toast.showToast(result.error || t('friend_remove_failed'), 'error');
      }
    } catch (error) {
      console.error('친구 삭제 실패:', error);
      toast.showToast(t('friend_remove_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (friend) => {
    console.log('친구 삭제 모달 열기:', friend);
    const name = friend.user.displayName || t('friend_default_name');
    const confirmed = window.confirm(t('friend_remove_confirm', { name }));
    if (confirmed) {
      handleRemoveFriend(friend.id);
    }
  };

  const closeDeleteModal = () => {
    console.log('친구 삭제 모달 닫기');
    setShowDeleteModal(false);
    setFriendToDelete(null);
  };

  const confirmDeleteFriend = async () => {
    if (friendToDelete) {
      await handleRemoveFriend(friendToDelete.id);
      closeDeleteModal();
    }
  };


  const handleCancelRequest = async (requestId) => {
    setIsLoading(true);
    try {
      await cancelFriendRequest(requestId);
      toast.showToast(t('friend_request_cancel_success'), 'success');
      await loadData();
      // 검색 결과가 있다면 검색을 다시 실행하여 상태 업데이트
      if (searchQuery.trim() && searchQuery.trim().length >= 2) {
        const results = await searchUsers(searchQuery, user.uid);
        setSearchResults(results);
      }
    } catch (error) {
      console.error('친구 요청 취소 실패:', error);
      toast.showToast(t('friend_request_cancel_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFriendsTab = () => (
    <div>
      <SearchSection theme={theme}>
        <SearchTitle theme={theme} $isDiaryTheme={isDiaryTheme}>{t('friend_search_title')}</SearchTitle>
        <SearchInputContainer>
          <SearchInput
            type="text"
            placeholder={t('friend_search_placeholder')}
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
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
            <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme}>
              {t('friend_search_results', { count: searchResults.length })}
            </SectionTitle>
            {searchResults.map((user) => {
              // 사용자 상태 확인
              const isFriend = friends.some(friend => friend.user.uid === user.uid);
              const hasSentRequest = sentRequests.some(req => req.toUserId === user.uid);
              const hasReceivedRequest = receivedRequests.some(req => req.fromUserId === user.uid);

              return (
                <UserCard
                  key={user.uid}
                  theme={theme}
                  $isDiaryTheme={isDiaryTheme}
                  $isGlassTheme={isGlassTheme}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <UserInfo>
                    <UserAvatar
                      src={getSafeProfileImageUrl(user.photoURL)}
                      alt={user.displayName}
                      onError={(e) => handleImageError(e)}
                    />
                    <UserDetails>
                      <UserName theme={theme} $isDiaryTheme={isDiaryTheme}>{user.displayName || t('default_user_name')}</UserName>
                      <UserEmail
                        theme={theme}
                        $isDiaryTheme={isDiaryTheme}
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
                      {t('friend_request_button')}
                    </ActionButton>
                  )}
                  {isFriend && (
                    <StatusBadge className="accepted" style={{ marginLeft: 'auto' }}>
                      <FaUserCheck style={{ marginRight: '6px' }} />
                      {t('friends')}
                    </StatusBadge>
                  )}
                  {hasSentRequest && (
                    <StatusBadge className="pending" style={{ marginLeft: 'auto' }}>
                      <FaUserTimes style={{ marginRight: '6px' }} />
                      {t('friend_request_pending')}
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
                        {t('friend_request_reject')}
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
                        {t('friend_request_accept')}
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
              {t('friend_search_loading')}
            </div>
          </div>
        )}

        {!isSearching && searchQuery.trim() && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div style={{ marginTop: '20px' }}>
            <EmptyState theme={theme} $isDiaryTheme={isDiaryTheme}>
              <EmptyIcon>🔍</EmptyIcon>
              <EmptyText>{t('friend_search_no_results')}</EmptyText>
              <EmptySubtext>{t('friend_search_no_results_sub')}</EmptySubtext>
            </EmptyState>
          </div>
        )}

        {searchQuery.trim() && searchQuery.trim().length < 2 && (
          <div style={{ marginTop: '20px', textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '14px', color: theme.subText || '#666' }}>
              {t('friend_search_min_length')}
            </div>
          </div>
        )}
      </SearchSection>

      <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme}>
        <FaUsers />
        {t('friend_list_title', { count: friends.length })}
      </SectionTitle>

      {friends.length === 0 ? (
        <EmptyState theme={theme} $isDiaryTheme={isDiaryTheme}>
          <EmptyIcon>👥</EmptyIcon>
          <EmptyText>{t('friend_list_empty')}</EmptyText>
          <EmptySubtext>{t('friend_list_empty_sub')}</EmptySubtext>
        </EmptyState>
      ) : (
        friends.map((friend) => (
          <UserCard
            key={friend.id}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{ position: 'relative' }}
          >
            <UserInfo
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/friend-novels?userId=${friend.user.uid}`)}
            >
              <UserAvatar
                src={getSafeProfileImageUrl(friend.user.photoURL)}
                alt={friend.user.displayName}
                onError={(e) => handleImageError(e)}
              />
              <UserDetails>
                <UserName theme={theme} $isDiaryTheme={isDiaryTheme}>
                  {friend.user.displayName || t('default_user_name')}
                </UserName>
                <UserEmail
                  theme={theme}
                  $isDiaryTheme={isDiaryTheme}
                  title={friend.user.email}
                >
                  {friend.user.email}
                </UserEmail>
              </UserDetails>
            </UserInfo>
            <TrashIconButton
              onClick={(e) => {
                e.stopPropagation();
                console.log('휴지통 클릭됨:', friend);
                openDeleteModal(friend);
              }}
              disabled={isLoading}
              title={t('friend_remove_title')}
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
      <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme}>
        {t('friend_received_requests')}
        {receivedRequests.length > 0 && (
          <RequestCount>{receivedRequests.length}</RequestCount>
        )}
      </SectionTitle>

      {receivedRequests.length === 0 ? (
        <EmptyState theme={theme} $isDiaryTheme={isDiaryTheme}>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyText>{t('friend_received_empty')}</EmptyText>
          <EmptySubtext>{t('friend_received_empty_sub')}</EmptySubtext>
        </EmptyState>
      ) : (
        receivedRequests.map((request) => (
          <UserCard
            key={request.id}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <UserInfo>
              <UserAvatar
                src={getSafeProfileImageUrl(request.fromUser?.photoURL)}
                alt={request.fromUser?.displayName || '사용자'}
                onError={(e) => handleImageError(e)}
              />
              <UserDetails>
                <UserName theme={theme} $isDiaryTheme={isDiaryTheme}>
                  {request.fromUser?.displayName || t('default_user_name')}
                </UserName>
                <UserEmail
                  theme={theme}
                  $isDiaryTheme={isDiaryTheme}
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
                {t('friend_request_reject')}
              </RejectButton>
              <AcceptButton
                className="success"
                onClick={() => handleAcceptRequest(request.id, request.fromUserId, user.uid)}
                disabled={isLoading}
              >
                {t('friend_request_accept')}
              </AcceptButton>
            </ActionRow>
          </UserCard>
        ))
      )}

      <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme}>{t('friend_sent_requests')}</SectionTitle>
      {sentRequests.length === 0 ? (
        <EmptyState theme={theme} $isDiaryTheme={isDiaryTheme}>
          <EmptyIcon>📤</EmptyIcon>
          <EmptyText>{t('friend_sent_empty')}</EmptyText>
          <EmptySubtext>{t('friend_sent_empty_sub')}</EmptySubtext>
        </EmptyState>
      ) : (
        sentRequests.map((request) => (
          <UserCard
            key={request.id}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <UserInfo>
              <UserAvatar
                src={getSafeProfileImageUrl(request.toUser?.photoURL)}
                alt={request.toUser?.displayName || '사용자'}
                onError={(e) => handleImageError(e)}
              />
              <UserDetails>
                <UserName theme={theme} $isDiaryTheme={isDiaryTheme}>
                  {request.toUser?.displayName || t('default_user_name')}
                </UserName>
                <UserEmail
                  theme={theme}
                  $isDiaryTheme={isDiaryTheme}
                  title={request.toUser?.email || ''}
                >
                  {request.toUser?.email || ''}
                </UserEmail>
              </UserDetails>
            </UserInfo>
            <RejectButton
              className="danger"
              onClick={() => handleCancelRequest(request.id)}
              disabled={isLoading}
              style={{ marginLeft: 'auto' }}
            >
              {t('friend_request_cancel')}
            </RejectButton>
          </UserCard>
        ))
      )}
    </div>
  );

  return (
    <Container theme={theme} $isDiaryTheme={isDiaryTheme}>
      <GlobalStyle theme={theme} />
      <Header user={user} title={t('friends')} />

      <TabContainer>
        <TabHeader theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
          <Tab
            active={activeTab === 'friends'}
            onClick={() => setActiveTab('friends')}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
          >
            {t('friends')}
          </Tab>
          <Tab
            active={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
          >
            {t('friend_requests_tab')}
            {receivedRequests.length > 0 && (
              <RequestCount>{receivedRequests.length}</RequestCount>
            )}
          </Tab>
        </TabHeader>
        <TabContent theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
          {activeTab === 'friends' && renderFriendsTab()}
          {activeTab === 'requests' && renderRequestsTab()}
        </TabContent>
      </TabContainer>

      <Navigation />

      {/* 친구 삭제 확인 모달 */}
      <ConfirmModal
        open={showDeleteModal}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeleteFriend}
        title={t('friend_remove_title')}
        description={t('friend_remove_confirm', { name: friendToDelete?.user?.displayName || t('friend_default_name') })}
        confirmText={t('delete')}
      />

    </Container>
  );
}

export default Friend; 