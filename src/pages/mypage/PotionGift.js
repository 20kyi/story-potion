import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useTranslation } from '../../LanguageContext';
import { motion } from 'framer-motion';
import { giftPotionToFriend } from '../../utils/potionGift';
import { getFriendsList, searchUsers } from '../../utils/friendSystem';
import { FaGift, FaSearch, FaTimes } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getSafeProfileImageUrl, handleImageError } from '../../utils/profileImageUtils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: transparent;
  color: ${({ theme }) => theme.text};
  position: relative;
`;

const Section = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  ${({ showGiftIcon }) => showGiftIcon && `
    &::before {
      content: '🎁';
      font-size: 24px;
    }
  `}
`;

const SearchSection = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchInput = styled.input.attrs({
    className: 'potion-gift-search-input'
})`
  width: 100%;
  padding: 14px 16px;
  padding-right: ${({ hasClearButton }) => hasClearButton ? '90px' : '50px'};
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

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px ${({ theme }) => theme.background} inset !important;
    -webkit-text-fill-color: ${({ theme }) => theme.text} !important;
    background-color: ${({ theme }) => theme.background} !important;
  }

  &:hover,
  &:active,
  &:focus,
  &:visited {
    background-color: ${({ theme }) => theme.background} !important;
    color: ${({ theme }) => theme.text} !important;
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  color: #e46262;
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
    color: #d45555;
    background: rgba(228, 98, 98, 0.1);
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    background: transparent;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.subText || '#999'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
  font-size: 12px;

  &:hover {
    background: ${({ theme }) => theme.subText || '#666'};
    opacity: 1;
  }
`;

const SearchResultsContainer = styled.div`
  margin-top: 16px;
  background: ${({ theme }) => theme.card || theme.background};
  border-radius: 12px;
  overflow: hidden;
`;

const SearchResultCard = styled(motion.div)`
  background: ${({ theme }) => theme.background};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  padding: 12px 16px;
  margin-bottom: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    background: ${({ theme }) => theme.card || theme.background};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SearchResultAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const SearchResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SearchResultName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SearchResultEmail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#666'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FriendCard = styled(motion.div)`
  background: ${({ theme }) => theme.background};
  border: none;
  border-radius: 14px;
  padding: 12px 0px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 14px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  ${({ selected }) => selected && `
    background: linear-gradient(135deg, rgba(228, 98, 98, 0.1) 0%, rgba(212, 85, 85, 0.1) 100%);
    box-shadow: 0 4px 16px rgba(228, 98, 98, 0.2);
  `}
`;

const FriendAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FriendEmail = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.subText || '#666'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SelectedFriendDisplay = styled.div`
  background: linear-gradient(135deg, rgba(228, 98, 98, 0.1) 0%, rgba(212, 85, 85, 0.1) 100%);
  border: none;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const PotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
`;

const PotionItem = styled(motion.div)`
  background: ${({ selected, theme }) =>
        selected
            ? 'linear-gradient(135deg, rgba(228, 98, 98, 0.1) 0%, rgba(212, 85, 85, 0.1) 100%)'
            : (theme.background || '#f9f9f9')};
  border: 2.5px solid ${({ selected, theme }) =>
        selected
            ? '#e46262'
            : (theme.border || '#e0e0e0')};
  border-radius: 14px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: ${({ disabled }) =>
        !disabled
            ? '0 6px 20px rgba(228, 98, 98, 0.3)'
            : 'none'};
    border-color: ${({ disabled, theme }) =>
        !disabled ? '#e46262' : (theme.border || '#e0e0e0')};
  }
  
  ${({ selected }) => selected && `
    box-shadow: 0 4px 16px rgba(228, 98, 98, 0.25);
  `}
  
  ${({ disabled }) => disabled && `
    opacity: 0.4;
    cursor: not-allowed;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  `}
`;

const PotionImage = styled.img`
  width: 56px;
  height: 56px;
  object-fit: contain;
  margin: 0 auto 10px auto;
  filter: ${({ disabled }) => disabled ? 'grayscale(100%)' : 'none'};
  transition: all 0.2s ease;
  
  ${PotionItem}:hover & {
    transform: ${({ disabled }) => disabled ? 'none' : 'scale(1.1)'};
  }
`;

const PotionName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 6px;
  line-height: 1.3;
`;

const PotionCount = styled.div`
  font-size: 12px;
  color: ${({ disabled }) => disabled ? '#999' : '#3498f3'};
  font-weight: 600;
  background: ${({ disabled }) => disabled ? 'transparent' : 'rgba(52, 152, 243, 0.1)'};
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
`;

const GiftButton = styled.button`
  width: 100%;
  background: ${({ disabled }) =>
        disabled
            ? 'linear-gradient(135deg, #ccc 0%, #bbb 100%)'
            : 'linear-gradient(135deg, #e46262 0%, #d45555 100%)'};
  color: white;
  border: none;
  border-radius: 14px;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.25s ease;
  box-shadow: ${({ disabled }) =>
        disabled
            ? 'none'
            : '0 4px 12px rgba(228, 98, 98, 0.3)'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #d45555 0%, #c44a4a 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(228, 98, 98, 0.4);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(228, 98, 98, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.subText || '#666'};
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  opacity: 0.8;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  &::after {
    content: '';
    width: 32px;
    height: 32px;
    border: 3px solid ${({ theme }) => theme.border || '#e0e0e0'};
    border-top: 3px solid #e46262;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function PotionGift({ user }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const theme = useTheme();
    const toast = useToast();
    const { t } = useTranslation();

    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [selectedPotion, setSelectedPotion] = useState(null);
    const [ownedPotions, setOwnedPotions] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    // 포션 데이터
    const potions = [
        { id: 'romance', name: '로맨스', image: '/potion/romance.png' },
        { id: 'historical', name: '역사', image: '/potion/historical.png' },
        { id: 'mystery', name: '추리', image: '/potion/mystery.png' },
        { id: 'horror', name: '공포', image: '/potion/horror.png' },
        { id: 'fairytale', name: '동화', image: '/potion/fairytale.png' },
        { id: 'fantasy', name: '판타지', image: '/potion/fantasy.png' },
    ];

    // URL 파라미터에서 친구 ID 가져오기
    const friendIdFromUrl = searchParams.get('friendId');

    useEffect(() => {
        if (user?.uid) {
            loadFriends();
            loadOwnedPotions();
        }
    }, [user, friendIdFromUrl]);

    // 친구 목록 로드
    const loadFriends = async () => {
        if (!user?.uid) return;
        setIsLoadingFriends(true);
        try {
            const friendsList = await getFriendsList(user.uid);
            setFriends(friendsList);

            // URL 파라미터에 friendId가 있으면 해당 친구 선택
            if (friendIdFromUrl) {
                const friend = friendsList.find(f => f.user.uid === friendIdFromUrl);
                if (friend) {
                    setSelectedFriend(friend);
                }
            }
        } catch (error) {
            console.error('친구 목록 로드 실패:', error);
            toast.showToast('친구 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setIsLoadingFriends(false);
        }
    };

    // 보유 포션 조회
    const loadOwnedPotions = async () => {
        if (!user?.uid) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setOwnedPotions(userData.potions || {});
            }
        } catch (error) {
            console.error('보유 포션 조회 실패:', error);
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
            // 친구 목록이 아직 로드되지 않았다면 먼저 로드
            let friendsList = friends;
            if (friendsList.length === 0) {
                friendsList = await getFriendsList(user.uid);
                setFriends(friendsList);
            }

            const results = await searchUsers(query, user.uid);

            // 친구만 필터링
            const friendIds = friendsList.map(f => f.user.uid);
            const friendResults = results.filter(user => friendIds.includes(user.uid));

            setSearchResults(friendResults);
        } catch (error) {
            console.error('친구 검색 실패:', error);
            toast.showToast('친구 검색에 실패했습니다.', 'error');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [user.uid, friends, toast]);

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
    const handleSearch = async () => {
        // 타이머 클리어
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        await debouncedSearch(searchQuery);
    };

    // 컴포넌트 언마운트 시 타이머 클리어
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    // 검색 결과에서 친구 선택
    const handleSelectSearchResult = (user) => {
        // friends 배열에서 해당 친구 찾기
        const friend = friends.find(f => f.user.uid === user.uid);
        if (friend) {
            setSelectedFriend(friend);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    // 검색어 초기화
    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    // 검색어가 비어있을 때 검색 결과 초기화
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
        }
    }, [searchQuery]);

    // 포션 선물하기
    const handleGiftPotion = async () => {
        if (!selectedFriend || !selectedPotion) {
            toast.showToast(t('potion_gift_select'), 'error');
            return;
        }

        const potion = potions.find(p => p.id === selectedPotion);
        if (!potion) return;

        // 보유 포션 확인
        const potionCount = ownedPotions[selectedPotion] || 0;
        if (potionCount <= 0) {
            toast.showToast(t('potion_gift_no_potion', { name: potion.name }), 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await giftPotionToFriend(
                user.uid,
                selectedFriend.user.uid,
                selectedPotion,
                potion.name
            );

            if (result.success) {
                toast.showToast(t('potion_gift_success', { name: potion.name }), 'success');
                await loadOwnedPotions(); // 보유 포션 새로고침
                // 성공 후 친구 페이지로 이동
                setTimeout(() => {
                    navigate('/my/friend');
                }, 1000);
            } else {
                toast.showToast(result.error || t('potion_gift_failed'), 'error');
            }
        } catch (error) {
            console.error('포션 선물 실패:', error);
            toast.showToast(t('potion_gift_failed'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container theme={theme}>
            <Header user={user} title={t('potion_gift_title')} />

            {!selectedFriend ? (
                <>
                    <Section theme={theme}>
                        <SectionTitle theme={theme} showGiftIcon={false}>
                            선물할 친구 선택
                        </SectionTitle>

                        <SearchInputContainer>
                            <SearchInput
                                type="text"
                                placeholder={t('friend_search_placeholder') || '친구 이름이나 이메일로 검색'}
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                theme={theme}
                                hasClearButton={searchQuery.trim().length > 0}
                                style={{
                                    backgroundColor: theme.background,
                                    color: theme.text
                                }}
                            />
                            {searchQuery.trim().length > 0 && (
                                <ClearButton
                                    onClick={handleClearSearch}
                                    theme={theme}
                                >
                                    <FaTimes />
                                </ClearButton>
                            )}
                            <SearchButton
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim() || searchQuery.trim().length < 2}
                                hasClearButton={searchQuery.trim().length > 0}
                            >
                                <FaSearch />
                            </SearchButton>
                        </SearchInputContainer>

                        {isSearching && (
                            <div style={{ textAlign: 'center', padding: '20px', color: theme.subText || '#666' }}>
                                검색 중...
                            </div>
                        )}

                        {!isSearching && searchQuery.trim() && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: theme.subText || '#666' }}>
                                검색 결과가 없습니다.
                            </div>
                        )}

                        {/* 검색어가 없을 때만 친구 목록 표시 */}
                        {!searchQuery.trim() || searchQuery.trim().length < 2 ? (
                            <>
                                {isLoadingFriends ? (
                                    <LoadingSpinner theme={theme} />
                                ) : friends.length === 0 ? (
                                    <EmptyState theme={theme}>
                                        <EmptyIcon>👥</EmptyIcon>
                                        <EmptyText>친구가 없습니다</EmptyText>
                                        <EmptySubtext>친구를 추가한 후 포션을 선물할 수 있습니다.</EmptySubtext>
                                    </EmptyState>
                                ) : (
                                    friends.map((friend) => (
                                        <FriendCard
                                            key={friend.id}
                                            theme={theme}
                                            selected={false}
                                            onClick={() => setSelectedFriend(friend)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FriendAvatar
                                                src={getSafeProfileImageUrl(friend.user.photoURL)}
                                                alt={friend.user.displayName}
                                                onError={(e) => handleImageError(e)}
                                                theme={theme}
                                            />
                                            <FriendInfo>
                                                <FriendName theme={theme}>
                                                    {friend.user.displayName || t('friend_default_name')}
                                                </FriendName>
                                                <FriendEmail theme={theme}>
                                                    {friend.user.email}
                                                </FriendEmail>
                                            </FriendInfo>
                                            <FaGift style={{ color: '#e46262', fontSize: '20px' }} />
                                        </FriendCard>
                                    ))
                                )}
                            </>
                        ) : null}
                    </Section>

                    {/* 검색 결과를 별도 섹션에 표시 */}
                    {searchResults.length > 0 && (
                        <Section theme={theme}>
                            <SectionTitle theme={theme} showGiftIcon={false}>
                                검색 결과
                            </SectionTitle>
                            <SearchResultsContainer>
                                {searchResults.map((user) => (
                                    <SearchResultCard
                                        key={user.uid}
                                        theme={theme}
                                        onClick={() => handleSelectSearchResult(user)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <SearchResultAvatar
                                            src={getSafeProfileImageUrl(user.photoURL)}
                                            alt={user.displayName}
                                            onError={(e) => handleImageError(e)}
                                            theme={theme}
                                        />
                                        <SearchResultInfo>
                                            <SearchResultName theme={theme}>
                                                {user.displayName || t('friend_default_name')}
                                            </SearchResultName>
                                            <SearchResultEmail theme={theme}>
                                                {user.email}
                                            </SearchResultEmail>
                                        </SearchResultInfo>
                                        <FaGift style={{ color: '#e46262', fontSize: '18px' }} />
                                    </SearchResultCard>
                                ))}
                            </SearchResultsContainer>
                        </Section>
                    )}
                </>
            ) : (
                <>
                    <Section theme={theme}>
                        <SectionTitle theme={theme} showGiftIcon={true}>선물할 친구</SectionTitle>
                        <SelectedFriendDisplay>
                            <FriendAvatar
                                src={getSafeProfileImageUrl(selectedFriend.user.photoURL)}
                                alt={selectedFriend.user.displayName}
                                onError={(e) => handleImageError(e)}
                                theme={theme}
                            />
                            <FriendInfo>
                                <FriendName theme={theme}>
                                    {selectedFriend.user.displayName || t('friend_default_name')}
                                </FriendName>
                                <FriendEmail theme={theme}>
                                    {selectedFriend.user.email}
                                </FriendEmail>
                            </FriendInfo>
                            <button
                                onClick={() => setSelectedFriend(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.text,
                                    cursor: 'pointer',
                                    padding: '8px',
                                    fontSize: '18px'
                                }}
                            >
                                ✕
                            </button>
                        </SelectedFriendDisplay>
                    </Section>

                    <Section theme={theme}>
                        <SectionTitle theme={theme} showGiftIcon={true}>선물할 포션 선택</SectionTitle>

                        <div style={{
                            marginBottom: '20px',
                            fontSize: '15px',
                            color: theme.subText || '#666',
                            lineHeight: '1.6',
                            padding: '12px',
                            background: theme.background || '#f9f9f9',
                            borderRadius: '10px',
                            border: `1px solid ${theme.border || '#e0e0e0'}`
                        }}>
                            <strong style={{ color: theme.text, fontWeight: 600 }}>
                                {selectedFriend.user.displayName || t('friend_default_name')}
                            </strong>님에게 선물할 포션을 선택해주세요
                        </div>

                        <PotionGrid>
                            {potions.map((potion) => {
                                const count = ownedPotions[potion.id] || 0;
                                const hasPotion = count > 0;

                                return (
                                    <PotionItem
                                        key={potion.id}
                                        selected={selectedPotion === potion.id}
                                        disabled={!hasPotion}
                                        onClick={() => hasPotion && setSelectedPotion(potion.id)}
                                        theme={theme}
                                        whileHover={hasPotion ? { scale: 1.05 } : {}}
                                        whileTap={hasPotion ? { scale: 0.95 } : {}}
                                    >
                                        <PotionImage src={potion.image} alt={potion.name} disabled={!hasPotion} />
                                        <PotionName theme={theme}>{potion.name}</PotionName>
                                        <PotionCount disabled={!hasPotion}>보유: {count}개</PotionCount>
                                    </PotionItem>
                                );
                            })}
                        </PotionGrid>

                        <GiftButton
                            onClick={handleGiftPotion}
                            disabled={!selectedPotion || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }} />
                                    선물 중...
                                </>
                            ) : selectedPotion ? (
                                <>
                                    <FaGift style={{ fontSize: '18px' }} />
                                    {potions.find(p => p.id === selectedPotion)?.name || ''} 포션 선물하기
                                </>
                            ) : (
                                <>
                                    <FaGift style={{ fontSize: '18px', opacity: 0.7 }} />
                                    {t('potion_gift_select')}
                                </>
                            )}
                        </GiftButton>
                    </Section>
                </>
            )}

            <Navigation />

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </Container>
    );
}

export default PotionGift;

