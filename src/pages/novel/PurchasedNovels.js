import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useTheme } from '../../ThemeContext';
import { createNovelUrl, getGenreKey } from '../../utils/novelUtils';
import { useLanguage, useTranslation } from '../../LanguageContext';
import GridIcon from '../../components/icons/GridIcon';
import ListIcon from '../../components/icons/ListIcon';
import { getTutorialNovel } from '../../utils/tutorialNovel';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: transparent;
  color: ${({ theme }) => theme.text};
  padding: 20px;
  margin-top: 70px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Title = styled.h1`
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? '#000000' : theme.text};
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 24px 0 24px 0;
`;

const ViewToggle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const SortSelect = styled.select`
  padding: 12px 16px;
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid'};
  border-color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(255, 255, 255, 0.5)' : (theme.border || '#ddd')};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '8px'};
  background: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        return theme.card || '#fff';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? '#000000' : (theme.text || '#333')};
  font-size: 14px;
  cursor: pointer;
  width: auto;
  min-width: 140px;
  max-width: 180px;
  transition: all 0.2s;
  font-family: inherit;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: ${({ theme, $isGlassTheme }) => {
        const arrowColor = $isGlassTheme ? '%23000000' : (theme.mode === 'dark' ? '%23ccc' : '%23333');
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${arrowColor}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`;
    }};
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 36px;
  box-shadow: ${({ $isGlassTheme }) => $isGlassTheme ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
  
  &:hover {
    border-color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.7)';
        return theme.primary || '#cb6565';
    }};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.7)';
        return theme.primary || '#cb6565';
    }};
  }
`;

const ViewToggleRight = styled.div`
  display: flex;
  gap: 8px;
`;

const ViewToggleButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 24px;
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : '1.5px solid'};
  border-color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.5)';
        return theme.primary || '#cb6565';
    }};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${({ $isGlassTheme }) => $isGlassTheme ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  min-width: 90px;
  height: 36px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: ${({ $isGlassTheme }) => $isGlassTheme ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
  
  @media (min-width: 480px) {
    font-size: 13px;
    min-width: 100px;
    height: 36px;
  }
`;

const ToggleOption = styled.span`
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  svg {
    transition: stroke 0.3s ease;
    stroke: ${({ $active, $isGlassTheme }) => {
        if ($active && $isGlassTheme) return '#000000';
        if ($active) return '#fff';
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.6)';
        return '#888';
    }};
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  border-radius: 20px;
  transition: all 0.3s ease;
  z-index: 1;
  transform: ${({ $isList }) => $isList ? 'translateX(100%)' : 'translateX(0)'};
  background: ${({ $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        return 'rgba(203, 101, 101, 0.25)';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '1px solid rgba(255, 255, 255, 0.4)' : 'none'};
  box-shadow: ${({ $isGlassTheme }) => $isGlassTheme ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
  
  ${ViewToggleButton}:hover & {
    background: ${({ $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.4)';
        return 'rgba(203, 101, 101, 0.35)';
    }};
    box-shadow: ${({ $isGlassTheme }) => $isGlassTheme ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'};
  }
`;

const NovelListWrapper = styled.div`
  display: ${props => props.$viewMode === 'card' ? 'grid' : 'flex'};
  grid-template-columns: ${props => props.$viewMode === 'card' ? 'repeat(3, 1fr)' : 'none'};
  flex-direction: ${props => props.$viewMode === 'list' ? 'column' : 'row'};
  gap: ${props => props.$viewMode === 'card' ? '32px 16px' : '20px'};
  padding-bottom: 20px;
  
  @media (min-width: 768px) {
    grid-template-columns: ${props => props.$viewMode === 'card' ? 'repeat(4, 1fr)' : 'none'};
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: ${props => props.$viewMode === 'card' ? 'repeat(5, 1fr)' : 'none'};
  }
`;

const NovelItem = styled.div`
  background: ${({ theme, $viewMode, $isGlassTheme }) => {
        if ($viewMode === 'card') return 'transparent';
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        return theme.card;
    }};
  backdrop-filter: ${({ $isGlassTheme, $viewMode }) => ($isGlassTheme && $viewMode !== 'card') ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme, $viewMode }) => ($isGlassTheme && $viewMode !== 'card') ? 'blur(15px)' : 'none'};
  border-radius: ${({ $viewMode, $isGlassTheme }) => {
        if ($viewMode === 'card') return '0';
        return $isGlassTheme ? '24px' : '12px';
    }};
  padding: ${props => props.$viewMode === 'card' ? '0' : '16px'};
  box-shadow: ${({ theme, $viewMode, $isGlassTheme }) => {
        if ($viewMode === 'card') return 'none';
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        return theme.cardShadow;
    }};
  border: ${({ theme, $viewMode, $isGlassTheme }) => {
        if ($viewMode === 'card') return 'none';
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        return `1px solid ${theme.border}`;
    }};
  cursor: pointer;
  transition: ${props => props.$viewMode === 'card' ? 'transform 0.2s' : 'box-shadow 0.15s'};
  display: flex;
  flex-direction: ${props => props.$viewMode === 'card' ? 'column' : 'row'};
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'center'};
  gap: ${props => props.$viewMode === 'card' ? '12px' : '16px'};
  width: 100%;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
  &:hover {
    ${({ $viewMode, $isGlassTheme }) => {
        if ($viewMode === 'card') {
            return 'transform: translateY(-4px);';
        }
        if ($isGlassTheme) {
            return 'box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12);';
        }
        return 'box-shadow: 0 4px 16px rgba(0,0,0,0.10);';
    }}
  }
`;

const NovelCover = styled.img`
  width: ${props => props.$viewMode === 'card' ? '100%' : '80px'};
  max-width: ${props => props.$viewMode === 'card' ? 'none' : '80px'};
  aspect-ratio: 2/3;
  height: ${props => props.$viewMode === 'card' ? 'auto' : '120px'};
  object-fit: cover;
  border-radius: ${props => props.$viewMode === 'card' ? '4px' : '12px'};
  background: #E5E5E5;
  box-shadow: ${props => props.$viewMode === 'card' ? '0 2px 8px rgba(0,0,0,0.07)' : '0 2px 8px rgba(0,0,0,0.1)'};
  margin-bottom: 0;
  flex-shrink: 0;
`;

const TutorialCover = styled.div`
  width: ${props => props.$viewMode === 'card' ? '100%' : '80px'};
  max-width: ${props => props.$viewMode === 'card' ? 'none' : '80px'};
  aspect-ratio: 2/3;
  height: ${props => props.$viewMode === 'card' ? 'auto' : '120px'};
  background: #ffffff;
  border-radius: ${props => props.$viewMode === 'card' ? '4px' : '12px'};
  box-shadow: ${props => props.$viewMode === 'card' ? '0 2px 8px rgba(0,0,0,0.07)' : '0 2px 8px rgba(0,0,0,0.1)'};
  margin-bottom: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.$viewMode === 'card' ? '20px' : '10px'};
  box-sizing: border-box;
  border: 1px solid #e0e0e0;
`;

const TutorialCoverTitle = styled.div`
  font-size: ${props => props.$viewMode === 'card' ? '14px' : '11px'};
  font-weight: 700;
  color: #cb6565;
  text-align: center;
  word-break: keep-all;
  line-height: 1.4;
`;

const NovelInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'flex-start'};
  gap: ${props => props.$viewMode === 'card' ? '4px' : '8px'};
  flex: 1;
  width: 100%;
`;

const NovelTitle = styled.div`
  font-size: ${props => props.$viewMode === 'card' ? '14px' : '15px'};
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? '#000000' : theme.text};
  font-weight: ${props => props.$viewMode === 'card' ? '500' : '600'};
  margin-bottom: ${props => props.$viewMode === 'card' ? '0' : '4px'};
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
  word-break: keep-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  height: ${props => props.$viewMode === 'card' ? '2.8em' : 'auto'};
`;

const NovelOwner = styled.div`
  font-size: ${props => props.$viewMode === 'card' ? '12px' : '14px'};
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#888')};
  margin-bottom: 0;
  font-weight: 400;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
`;

const NovelMeta = styled.div`
  font-size: 12px;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#666')};
  margin-bottom: 0;
  font-weight: 400;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
`;

const PurchaseDate = styled.div`
  font-size: 11px;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#888')};
  margin-bottom: 0;
  margin-top: 4px;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#999')};
  font-size: 16px;
  padding: 60px 20px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: 10px 16px;
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid'};
  border-color: ${({ theme, $isGlassTheme, $active }) => {
        if ($isGlassTheme) {
            if ($active) return 'rgba(203, 101, 101, 0.8)';
            return 'rgba(255, 255, 255, 0.5)';
        }
        if ($active) return theme.primary || '#cb6565';
        return theme.border || '#ddd';
    }};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '8px'};
  background: ${({ theme, $active, $isGlassTheme }) => {
        if ($isGlassTheme) {
            if ($active) {
                const primary = theme.primary || '#cb6565';
                const r = parseInt(primary.slice(1, 3), 16);
                const g = parseInt(primary.slice(3, 5), 16);
                const b = parseInt(primary.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, 0.8)`;
            }
            return 'rgba(255, 255, 255, 0.2)';
        }
        if ($active) return theme.primary || '#cb6565';
        return theme.card || '#fff';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  color: ${({ $active, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($active) return '#fff';
        return '#333';
    }};
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
  box-shadow: ${({ $isGlassTheme, $active, theme }) => {
        if ($isGlassTheme && $active) {
            const primary = theme.primary || '#cb6565';
            const r = parseInt(primary.slice(1, 3), 16);
            const g = parseInt(primary.slice(3, 5), 16);
            const b = parseInt(primary.slice(5, 7), 16);
            return `0 4px 12px rgba(${r}, ${g}, ${b}, 0.3)`;
        }
        if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
        return 'none';
    }};
  
  &:hover:not(:disabled) {
    background: ${({ theme, $active, $isGlassTheme }) => {
        if ($isGlassTheme) {
            if ($active) {
                const primary = theme.primary || '#cb6565';
                const r = parseInt(primary.slice(1, 3), 16);
                const g = parseInt(primary.slice(3, 5), 16);
                const b = parseInt(primary.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, 0.9)`;
            }
            return 'rgba(255, 255, 255, 0.3)';
        }
        if ($active) return theme.primary || '#cb6565';
        return '#fdfdfd';
    }};
    border-color: ${({ theme, $isGlassTheme, $active }) => {
        if ($isGlassTheme && $active) {
            const primary = theme.primary || '#cb6565';
            const r = parseInt(primary.slice(1, 3), 16);
            const g = parseInt(primary.slice(3, 5), 16);
            const b = parseInt(primary.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 1)`;
        }
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.7)';
        return theme.primary || '#cb6565';
    }};
    box-shadow: ${({ $isGlassTheme, $active, theme }) => {
        if ($isGlassTheme && $active) {
            const primary = theme.primary || '#cb6565';
            const r = parseInt(primary.slice(1, 3), 16);
            const g = parseInt(primary.slice(3, 5), 16);
            const b = parseInt(primary.slice(5, 7), 16);
            return `0 6px 16px rgba(${r}, ${g}, ${b}, 0.4)`;
        }
        if ($isGlassTheme) return '0 4px 12px rgba(0, 0, 0, 0.15)';
        return 'none';
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const PaginationInfo = styled.div`
  font-size: 14px;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#666')};
  margin: 0 8px;
  white-space: nowrap;
`;

function PurchasedNovels({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const { actualTheme } = theme;
    const isGlassTheme = actualTheme === 'glass';
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [novels, setNovels] = useState([]);
    const [sortedNovels, setSortedNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // localStorage에서 저장된 viewMode를 가져오거나 기본값 'card' 사용
    const [viewMode, setViewMode] = useState(() => {
        const savedViewMode = localStorage.getItem('purchasedNovelsViewMode');
        return savedViewMode === 'list' ? 'list' : 'card';
    });
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'author'
    const [userCreatedAt, setUserCreatedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // 사용자 가입일 가져오기
    useEffect(() => {
        if (!user) return;

        const fetchUserCreatedAt = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserCreatedAt(userData.createdAt || null);
                }
            } catch (error) {
                console.error('사용자 가입일 조회 실패:', error);
            }
        };

        fetchUserCreatedAt();
    }, [user]);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchPurchasedNovels = async () => {
            setIsLoading(true);
            try {
                // 사용자가 구매한 소설 ID 목록과 구매 날짜 가져오기
                const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                const viewedSnapshot = await getDocs(viewedNovelsRef);

                if (viewedSnapshot.empty) {
                    setNovels([]);
                    setIsLoading(false);
                    return;
                }

                // viewedNovels 문서에서 novelId와 viewedAt 정보 추출
                const viewedNovelsData = viewedSnapshot.docs.map(doc => ({
                    novelId: doc.id,
                    viewedAt: doc.data().viewedAt || doc.data().createdAt || null
                }));

                // novelId로 novels 컬렉션에서 데이터 fetch
                const novelsRef = collection(db, 'novels');
                const novelDocs = await Promise.all(
                    viewedNovelsData.map(item => getDoc(doc(novelsRef, item.novelId)))
                );

                // 백업 데이터(purchasedNovels)도 함께 조회
                const purchasedNovelsRef = collection(db, 'users', user.uid, 'purchasedNovels');
                const purchasedNovelsSnapshot = await getDocs(purchasedNovelsRef);
                const purchasedNovelsMap = {};
                purchasedNovelsSnapshot.docs.forEach(doc => {
                    purchasedNovelsMap[doc.id] = { id: doc.id, ...doc.data() };
                });

                let purchased = novelDocs
                    .map((snap, idx) => {
                        const novelId = viewedNovelsData[idx].novelId;
                        // 소설이 삭제되었거나 존재하지 않는 경우 백업 데이터 사용
                        if (!snap.exists() || snap.data().deleted === true) {
                            const backupNovel = purchasedNovelsMap[novelId];
                            if (backupNovel) {
                                return {
                                    ...backupNovel,
                                    purchasedAt: viewedNovelsData[idx].viewedAt,
                                    isDeleted: true // 삭제된 소설임을 표시
                                };
                            }
                            return null;
                        }
                        return {
                            ...snap.data(),
                            id: snap.id,
                            purchasedAt: viewedNovelsData[idx].viewedAt
                        };
                    })
                    .filter(novel => novel !== null);

                // 각 소설의 userId로 닉네임/아이디 조회
                const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
                const userDocs = await Promise.all(
                    ownerIds.map(uid => getDoc(doc(db, 'users', uid)))
                );

                const ownerMap = {};
                userDocs.forEach((snap, idx) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        ownerMap[ownerIds[idx]] = data.nickname || data.nick || data.displayName || ownerIds[idx];
                    } else {
                        ownerMap[ownerIds[idx]] = ownerIds[idx];
                    }
                });

                // novel에 ownerName 필드 추가
                purchased = purchased.map(novel => ({
                    ...novel,
                    ownerName: ownerMap[novel.userId] || novel.userId
                }));

                setNovels(purchased);
            } catch (error) {
                console.error('구매한 소설 목록 가져오기 실패:', error);
                setNovels([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPurchasedNovels();
    }, [user]);

    // 정렬 로직
    useEffect(() => {
        if (novels.length === 0) {
            // 소설이 없을 때만 튜토리얼 책 표시
            const tutorialNovel = getTutorialNovel(userCreatedAt);
            const tutorialNovelData = {
                ...tutorialNovel,
                purchasedAt: userCreatedAt || new Date(0),
                ownerName: tutorialNovel.ownerName
            };
            setSortedNovels([tutorialNovelData]);
            return;
        }

        const sorted = [...novels].sort((a, b) => {
            if (sortBy === 'newest') {
                // 구매일 기준 최신순
                const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                return bDate - aDate;
            } else if (sortBy === 'oldest') {
                // 구매일 기준 오래된순
                const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                return aDate - bDate;
            } else if (sortBy === 'author') {
                // 작가순 (가나다순)
                const aName = a.ownerName || '';
                const bName = b.ownerName || '';
                return aName.localeCompare(bName, 'ko');
            }
            return 0;
        });

        // 소설이 3개 미만일 때만 튜토리얼 책 추가
        if (sorted.length < 3) {
            const tutorialNovel = getTutorialNovel(userCreatedAt);
            const tutorialNovelData = {
                ...tutorialNovel,
                purchasedAt: userCreatedAt || new Date(0),
                ownerName: tutorialNovel.ownerName
            };
            setSortedNovels([tutorialNovelData, ...sorted]);
        } else {
            setSortedNovels(sorted);
        }
        // 정렬 변경 시 첫 페이지로 리셋
        setCurrentPage(1);
    }, [novels, sortBy, userCreatedAt]);

    return (
        <Container theme={theme} $isGlassTheme={isGlassTheme}>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('home_purchased_novel')} />
            {isLoading ? (
                <div style={{ textAlign: 'center', marginTop: 40, color: isGlassTheme ? '#000000' : theme.text }}>로딩 중...</div>
            ) : (
                <>
                    <ViewToggle>
                        <SortSelect
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            theme={theme}
                            $isGlassTheme={isGlassTheme}
                        >
                            <option value="newest">구매일 최신순</option>
                            <option value="oldest">구매일 오래된순</option>
                            <option value="author">작가순</option>
                        </SortSelect>
                        <ViewToggleRight>
                            <ViewToggleButton
                                $isGlassTheme={isGlassTheme}
                                theme={theme}
                                onClick={() => {
                                    const newMode = viewMode === 'card' ? 'list' : 'card';
                                    setViewMode(newMode);
                                    localStorage.setItem('purchasedNovelsViewMode', newMode);
                                }}
                                aria-label={viewMode === 'card' ? '목록형으로 전환' : '카드형으로 전환'}
                            >
                                <ToggleOption $active={viewMode === 'card'} $isGlassTheme={isGlassTheme}>
                                    <GridIcon width={16} height={16} />
                                </ToggleOption>
                                <ToggleOption $active={viewMode === 'list'} $isGlassTheme={isGlassTheme}>
                                    <ListIcon width={16} height={16} />
                                </ToggleOption>
                                <ToggleSlider $isList={viewMode === 'list'} $isGlassTheme={isGlassTheme} />
                            </ViewToggleButton>
                        </ViewToggleRight>
                    </ViewToggle>
                    <NovelListWrapper $viewMode={viewMode}>
                        {sortedNovels
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((novel) => {
                                const formatPurchaseDate = (purchasedAt) => {
                                    if (!purchasedAt) return '';
                                    const date = purchasedAt.toDate ? purchasedAt.toDate() : new Date(purchasedAt);
                                    if (isNaN(date.getTime())) return '';
                                    const year = date.getFullYear();
                                    const month = date.getMonth() + 1;
                                    const day = date.getDate();
                                    return `${year}. ${month}. ${day}`;
                                };

                                // 튜토리얼 책인지 확인
                                const isTutorial = novel.id === 'tutorial' || novel.isTutorial === true;

                                return (
                                    <NovelItem
                                        key={novel.id}
                                        $viewMode={viewMode}
                                        $isGlassTheme={isGlassTheme}
                                        theme={theme}
                                        onClick={() => {
                                            if (isTutorial) {
                                                navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}?userId=${novel.userId}`, {
                                                    state: { tutorialNovel: novel, returnPath: '/purchased-novels' }
                                                });
                                            } else {
                                                navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}?userId=${novel.userId}`, {
                                                    state: { returnPath: '/purchased-novels' }
                                                });
                                            }
                                        }}
                                    >
                                        <NovelCover
                                            src={novel.imageUrl || '/novel_banner/default.png'}
                                            alt={novel.title || '소설 표지'}
                                            $viewMode={viewMode}
                                        />
                                        {viewMode === 'card' ? (
                                            <NovelInfo $viewMode={viewMode}>
                                                <NovelTitle $viewMode={viewMode}>{novel.title}</NovelTitle>
                                                <NovelOwner $viewMode={viewMode}>by {novel.ownerName}</NovelOwner>
                                            </NovelInfo>
                                        ) : (
                                            <NovelInfo $viewMode={viewMode}>
                                                {novel.genre && (
                                                    <NovelMeta $viewMode={viewMode} theme={theme} $isGlassTheme={isGlassTheme}>
                                                        {(() => {
                                                            const genreKey = getGenreKey(novel.genre);
                                                            return genreKey ? t(`novel_genre_${genreKey}`) : novel.genre;
                                                        })()}
                                                    </NovelMeta>
                                                )}
                                                <NovelTitle $viewMode={viewMode}>{novel.title}</NovelTitle>
                                                <NovelOwner $viewMode={viewMode}>by {novel.ownerName}</NovelOwner>
                                                <PurchaseDate $viewMode={viewMode}>
                                                    {isTutorial ? '튜토리얼' : `구매일: ${formatPurchaseDate(novel.purchasedAt)}`}
                                                </PurchaseDate>
                                            </NovelInfo>
                                        )}
                                    </NovelItem>
                                );
                            })}
                    </NovelListWrapper>

                    {/* 페이지네이션 */}
                    {sortedNovels.length > itemsPerPage && (
                        <PaginationContainer theme={theme}>
                            <PaginationButton
                                theme={theme}
                                $isGlassTheme={isGlassTheme}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                이전
                            </PaginationButton>
                            <PaginationInfo theme={theme} $isGlassTheme={isGlassTheme}>
                                {currentPage} / {Math.ceil(sortedNovels.length / itemsPerPage)}
                            </PaginationInfo>
                            <PaginationButton
                                theme={theme}
                                $isGlassTheme={isGlassTheme}
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(sortedNovels.length / itemsPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(sortedNovels.length / itemsPerPage)}
                            >
                                다음
                            </PaginationButton>
                        </PaginationContainer>
                    )}
                </>
            )}
            <Navigation />
        </Container>
    );
}

export default PurchasedNovels;

