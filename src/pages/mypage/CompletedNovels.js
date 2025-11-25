import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useTranslation } from '../../LanguageContext';
import { createNovelUrl } from '../../utils/novelUtils';
import { useTheme } from '../../ThemeContext';
import GridIcon from '../../components/icons/GridIcon';
import ListIcon from '../../components/icons/ListIcon';
import ConfirmModal from '../../components/ui/ConfirmModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  margin-top: 60px;
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

const ViewToggle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const BottomBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const SelectAllCheckbox = styled.input`
  width: 24px;
  height: 24px;
  cursor: pointer;
  accent-color: #cb6565;
  min-width: 24px;
  min-height: 24px;
  touch-action: manipulation;
  flex-shrink: 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.border || '#ddd'};
  border-radius: 8px;
  background: ${({ theme }) => theme.card || '#fff'};
  color: ${({ theme }) => theme.text || '#333'};
  font-size: 14px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: ${({ theme }) => {
    const arrowColor = theme.mode === 'dark' ? '%23ccc' : '%23333';
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${arrowColor}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`;
  }};
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 36px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary || '#cb6565'};
  }
`;

const ViewToggleRight = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
`;

const ToggleButton = styled.button`
  padding: 10px;
  background: ${props => props.$active ? '#cb6565' : 'transparent'};
  border: 1px solid ${props => props.$active ? '#cb6565' : '#ddd'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
  
  &:hover {
    background: ${props => props.$active ? '#cb6565' : '#f5f5f5'};
    border-color: ${props => props.$active ? '#cb6565' : '#cb6565'};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    stroke: ${props => props.$active ? '#fff' : '#888'};
    transition: stroke 0.2s;
  }
  
  &:hover svg {
    stroke: ${props => props.$active ? '#fff' : '#cb6565'};
  }
`;

const NovelListWrapper = styled.div`
  display: ${props => props.$viewMode === 'card' ? 'grid' : 'flex'};
  grid-template-columns: ${props => props.$viewMode === 'card' ? 'repeat(2, 1fr)' : 'none'};
  flex-direction: ${props => props.$viewMode === 'list' ? 'column' : 'row'};
  gap: 20px;
  padding-bottom: 20px;
`;

const NovelItem = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 12px;
  padding: ${props => props.$viewMode === 'card' ? '20px' : '16px'};
  box-shadow: ${({ theme }) => theme.cardShadow};
  border: 1px solid ${({ theme, $selected }) => $selected ? '#cb6565' : theme.border};
  cursor: pointer;
  transition: box-shadow 0.15s;
  display: flex;
  flex-direction: ${props => props.$viewMode === 'card' ? 'column' : 'row'};
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'center'};
  gap: ${props => props.$viewMode === 'card' ? '12px' : '16px'};
  width: 100%;
  position: relative;
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  }
`;

const NovelCover = styled.img`
  width: ${props => props.$viewMode === 'card' ? '100%' : '80px'};
  max-width: ${props => props.$viewMode === 'card' ? '180px' : '80px'};
  aspect-ratio: 2/3;
  height: ${props => props.$viewMode === 'card' ? 'auto' : '120px'};
  object-fit: cover;
  border-radius: 12px;
  background: #E5E5E5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-shrink: 0;
`;

const NovelInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'flex-start'};
  justify-content: ${props => props.$viewMode === 'card' ? 'flex-start' : 'center'};
  gap: 8px;
  flex: 1;
  width: 100%;
`;

const NovelTitle = styled.div`
  font-size: 15px;
  color: ${({ theme }) => theme.text};
  font-weight: 600;
  margin-bottom: 4px;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
  word-break: keep-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NovelMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.cardSubText || '#666'};
  display: flex;
  justify-content: ${props => props.$viewMode === 'card' ? 'center' : 'space-between'};
  align-items: center;
  width: 100%;
  gap: ${props => props.$viewMode === 'card' ? '8px' : '0'};
`;

const PurchaseBadge = styled.span`
  background: ${({ theme }) => theme.primary || '#cb6565'};
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.cardSubText || '#999'};
  font-size: 16px;
`;

const PublicToggleButton = styled.button`
  width: 50px;
  height: 28px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background-color: ${({ active }) => active ? '#cb6565' : '#ccc'};
  flex-shrink: 0;
  
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: white;
    top: 2px;
    left: ${({ active }) => active ? '24px' : '2px'};
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

const PublicStatus = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.cardSubText || '#666'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BatchActionBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.card || '#fff'};
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const BatchActionTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const BatchActionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const Checkbox = styled.input`
  width: 24px;
  height: 24px;
  cursor: pointer;
  accent-color: #cb6565;
  min-width: 24px;
  min-height: 24px;
  touch-action: manipulation;
`;

const BatchActionText = styled.span`
  font-size: 15px;
  color: ${({ theme }) => theme.text || '#333'};
  font-weight: 500;
`;

const BatchActionButtons = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  flex-direction: column;
  
  @media (min-width: 400px) {
    flex-direction: row;
  }
`;

const BatchActionButton = styled.button`
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
  touch-action: manipulation;
  background: ${({ variant, theme }) => {
        if (variant === 'public') return '#cb6565';
        if (variant === 'private') return '#666';
        return theme.card || '#f5f5f5';
    }};
  color: ${({ variant }) => variant ? '#fff' : '#333'};
  flex: 1;
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const QuickActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  animation: slideIn 0.2s ease;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const QuickActionButton = styled.button`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  touch-action: manipulation;
  white-space: nowrap;
  background: ${({ variant }) => {
        if (variant === 'public') return '#cb6565';
        if (variant === 'private') return '#666';
        return 'transparent';
    }};
  color: #fff;
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const NovelCheckbox = styled.input`
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  z-index: 10;
  accent-color: #cb6565;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
  border: 1px solid ${({ theme }) => theme.border || '#ddd'};
  border-radius: 8px;
  background: ${({ theme, $active }) => $active ? '#cb6565' : theme.card || '#fff'};
  color: ${({ $active }) => $active ? '#fff' : '#333'};
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
  
  &:hover:not(:disabled) {
    background: ${({ theme, $active }) => $active ? '#cb6565' : '#f5f5f5'};
    border-color: ${({ theme }) => theme.primary || '#cb6565'};
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
  color: ${({ theme }) => theme.cardSubText || '#666'};
  margin: 0 8px;
  white-space: nowrap;
`;

function CompletedNovels({ user }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();
    const [novels, setNovels] = useState([]);
    const [filteredNovels, setFilteredNovels] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'popular'
    const [novelsLoading, setNovelsLoading] = useState(true);
    // localStorage에서 저장된 viewMode를 가져오거나 기본값 'card' 사용
    const [viewMode, setViewMode] = useState(() => {
        const savedViewMode = localStorage.getItem('completedNovelsViewMode');
        return savedViewMode === 'list' ? 'list' : 'card';
    });
    const [privateConfirmOpen, setPrivateConfirmOpen] = useState(false);
    const [novelToToggle, setNovelToToggle] = useState(null);
    const [selectedNovels, setSelectedNovels] = useState(new Set());
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
    const [batchAction, setBatchAction] = useState(null); // 'public' or 'private'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // 완성된 소설 목록 가져오기
    useEffect(() => {
        if (!user) return;

        const fetchNovels = async () => {
            setNovelsLoading(true);
            try {
                const novelsRef = collection(db, 'novels');
                const novelsQ = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                const novelsSnap = await getDocs(novelsQ);
                const fetchedNovels = novelsSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(novel => novel.deleted !== true); // 삭제되지 않은 소설만

                // 구매자 수 조회 (최적화: 모든 사용자의 viewedNovels를 한 번에 조회)
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const purchaseCountMap = {};

                // 각 사용자의 viewedNovels를 조회하여 구매자 수 집계
                const countPromises = usersSnapshot.docs.map(async (userDoc) => {
                    try {
                        const viewedNovelsRef = collection(db, 'users', userDoc.id, 'viewedNovels');
                        const viewedSnap = await getDocs(viewedNovelsRef);
                        viewedSnap.docs.forEach(viewedDoc => {
                            const novelId = viewedDoc.id;
                            purchaseCountMap[novelId] = (purchaseCountMap[novelId] || 0) + 1;
                        });
                    } catch (error) {
                        // 개별 사용자 조회 실패는 무시
                    }
                });

                await Promise.all(countPromises);

                // 소설에 구매자 수 추가
                const novelsWithPurchaseCount = fetchedNovels.map(novel => ({
                    ...novel,
                    purchaseCount: purchaseCountMap[novel.id] || 0
                }));

                setNovels(novelsWithPurchaseCount);
            } catch (error) {
                console.error('소설 목록 가져오기 실패:', error);
                setNovels([]);
            } finally {
                setNovelsLoading(false);
            }
        };

        fetchNovels();
    }, [user]);

    // 필터링 및 정렬
    useEffect(() => {
        let filtered = [...novels];

        // 장르 필터
        if (selectedGenre !== 'all') {
            filtered = filtered.filter(novel => novel.genre === selectedGenre);
        }

        // 정렬
        if (sortBy === 'latest') {
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        } else if (sortBy === 'oldest') {
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateA - dateB;
            });
        } else if (sortBy === 'popular') {
            filtered.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
        }

        setFilteredNovels(filtered);
        // 필터/정렬 변경 시 첫 페이지로 리셋
        setCurrentPage(1);
    }, [novels, selectedGenre, sortBy]);

    // 사용 가능한 장르 목록
    const availableGenres = ['all', ...new Set(novels.map(n => n.genre).filter(Boolean))];

    const getGenreKey = (genre) => {
        const genreMap = {
            '로맨스': 'romance',
            '추리': 'mystery',
            '역사': 'historical',
            '동화': 'fairytale',
            '판타지': 'fantasy',
            '공포': 'horror'
        };
        return genreMap[genre] || null;
    };

    const handleTogglePublic = async (novel, e) => {
        e.stopPropagation(); // 소설 클릭 이벤트 방지
        if (!novel || !novel.id) return;

        // 비공개로 전환하는 경우에만 확인 모달 표시
        if (novel.isPublic !== false) {
            setNovelToToggle(novel);
            setPrivateConfirmOpen(true);
            return;
        }

        // 공개로 전환하는 경우 바로 실행
        const newIsPublic = !novel.isPublic;
        try {
            await updateDoc(doc(db, 'novels', novel.id), {
                isPublic: newIsPublic
            });
            // 로컬 상태 업데이트
            setNovels(prevNovels =>
                prevNovels.map(n =>
                    n.id === novel.id ? { ...n, isPublic: newIsPublic } : n
                )
            );
        } catch (error) {
            console.error('공개 설정 변경 실패:', error);
        }
    };

    const confirmTogglePrivate = async () => {
        setPrivateConfirmOpen(false);
        if (!novelToToggle || !novelToToggle.id) return;

        const newIsPublic = false;
        try {
            await updateDoc(doc(db, 'novels', novelToToggle.id), {
                isPublic: newIsPublic
            });
            // 로컬 상태 업데이트
            setNovels(prevNovels =>
                prevNovels.map(n =>
                    n.id === novelToToggle.id ? { ...n, isPublic: newIsPublic } : n
                )
            );
            setNovelToToggle(null);
        } catch (error) {
            console.error('공개 설정 변경 실패:', error);
        }
    };


    // 개별 소설 선택/해제
    const toggleNovelSelection = (novelId, e) => {
        e.stopPropagation();
        setSelectedNovels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(novelId)) {
                newSet.delete(novelId);
            } else {
                newSet.add(novelId);
            }
            return newSet;
        });
    };

    // 전체 선택/해제
    const toggleSelectAll = () => {
        if (!showCheckboxes) {
            // 처음 체크박스를 보이게 하고 전체 선택
            setShowCheckboxes(true);
            setSelectedNovels(new Set(filteredNovels.map(n => n.id)));
        } else if (selectedNovels.size === filteredNovels.length) {
            // 전체 해제 시 체크박스도 숨김
            setSelectedNovels(new Set());
            setShowCheckboxes(false);
        } else {
            // 전체 선택
            setSelectedNovels(new Set(filteredNovels.map(n => n.id)));
        }
    };

    // 일괄 처리
    const handleBatchAction = (action) => {
        if (selectedNovels.size === 0) return;

        // 비공개로 전환하는 경우에만 확인 모달 표시
        if (action === 'private') {
            setBatchAction(action);
            setBatchConfirmOpen(true);
        } else {
            // 공개로 전환하는 경우 바로 실행
            executeBatchAction(action);
        }
    };

    const executeBatchAction = async (action) => {
        if (selectedNovels.size === 0) return;

        const newIsPublic = action === 'public';
        const batch = writeBatch(db);
        const novelIds = Array.from(selectedNovels);

        try {
            // Firestore 배치 업데이트
            novelIds.forEach(novelId => {
                const novelRef = doc(db, 'novels', novelId);
                batch.update(novelRef, { isPublic: newIsPublic });
            });

            await batch.commit();

            // 로컬 상태 업데이트
            setNovels(prevNovels =>
                prevNovels.map(n =>
                    selectedNovels.has(n.id) ? { ...n, isPublic: newIsPublic } : n
                )
            );

            // 선택 초기화
            setSelectedNovels(new Set());
            setShowCheckboxes(false);
            setBatchConfirmOpen(false);
            setBatchAction(null);
        } catch (error) {
            console.error('일괄 처리 실패:', error);
        }
    };

    const confirmBatchPrivate = async () => {
        setBatchConfirmOpen(false);
        await executeBatchAction('private');
    };

    return (
        <Container theme={theme}>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="완성된 소설" />

            <ViewToggle>
                <TopBar>
                    <FilterRow>
                        <FilterContainer>
                            <Select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} theme={theme} disabled={showCheckboxes}>
                                <option value="all">전체 장르</option>
                                {availableGenres.filter(g => g !== 'all').map(genre => (
                                    <option key={genre} value={genre}>
                                        {getGenreKey(genre) ? t(`novel_genre_${getGenreKey(genre)}`) : genre}
                                    </option>
                                ))}
                            </Select>
                            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} theme={theme} disabled={showCheckboxes}>
                                <option value="latest">최신순</option>
                                <option value="oldest">오래된순</option>
                                <option value="popular">인기순</option>
                            </Select>
                        </FilterContainer>
                    </FilterRow>
                    <BottomBar>
                        <SelectAllCheckbox
                            type="checkbox"
                            checked={selectedNovels.size === filteredNovels.length && filteredNovels.length > 0 && showCheckboxes}
                            onChange={toggleSelectAll}
                        />
                        {showCheckboxes && selectedNovels.size > 0 && (
                            <QuickActionButtons>
                                <QuickActionButton
                                    variant="public"
                                    onClick={() => handleBatchAction('public')}
                                >
                                    공개
                                </QuickActionButton>
                                <QuickActionButton
                                    variant="private"
                                    onClick={() => handleBatchAction('private')}
                                >
                                    비공개
                                </QuickActionButton>
                            </QuickActionButtons>
                        )}
                        <ActionButtonsContainer>
                            <ToggleButton
                                $active={viewMode === 'card'}
                                onClick={() => {
                                    setViewMode('card');
                                    localStorage.setItem('completedNovelsViewMode', 'card');
                                }}
                                title="그리드형"
                            >
                                <GridIcon width={20} height={20} />
                            </ToggleButton>
                            <ToggleButton
                                $active={viewMode === 'list'}
                                onClick={() => {
                                    setViewMode('list');
                                    localStorage.setItem('completedNovelsViewMode', 'list');
                                }}
                                title="목록형"
                            >
                                <ListIcon width={20} height={20} />
                            </ToggleButton>
                        </ActionButtonsContainer>
                    </BottomBar>
                </TopBar>
            </ViewToggle>

            {showCheckboxes && selectedNovels.size > 0 && (
                <BatchActionBar theme={theme}>
                    <BatchActionText theme={theme}>
                        {selectedNovels.size}개 선택됨
                    </BatchActionText>
                </BatchActionBar>
            )}

            {novelsLoading ? (
                <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>{t('loading')}</div>
            ) : filteredNovels.length === 0 ? (
                <EmptyMessage theme={theme}>완성된 소설이 없습니다.</EmptyMessage>
            ) : (
                <>
                    <NovelListWrapper $viewMode={viewMode}>
                        {filteredNovels
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((novel) => {
                                const genreKey = getGenreKey(novel.genre);
                                return (
                                    <NovelItem
                                        key={novel.id}
                                        $viewMode={viewMode}
                                        $selected={selectedNovels.has(novel.id)}
                                        onClick={() => {
                                            if (!showCheckboxes) {
                                                navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre)}`);
                                            }
                                        }}
                                    >
                                        {showCheckboxes && (
                                            <NovelCheckbox
                                                type="checkbox"
                                                checked={selectedNovels.has(novel.id)}
                                                onChange={(e) => toggleNovelSelection(novel.id, e)}
                                            />
                                        )}
                                        <NovelCover
                                            src={novel.imageUrl || '/novel_banner/default.png'}
                                            alt={novel.title}
                                            $viewMode={viewMode}
                                        />
                                        <NovelInfo $viewMode={viewMode}>
                                            <NovelTitle $viewMode={viewMode} theme={theme}>{novel.title}</NovelTitle>
                                            <NovelMeta theme={theme} $viewMode={viewMode}>
                                                <span>{genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}</span>
                                                {novel.purchaseCount > 0 && (
                                                    <PurchaseBadge theme={theme}>{novel.purchaseCount}</PurchaseBadge>
                                                )}
                                            </NovelMeta>
                                            {!showCheckboxes && (
                                                <PublicStatus theme={theme} style={{ marginTop: viewMode === 'card' ? '4px' : '0' }}>
                                                    <span>{novel.isPublic !== false ? '공개' : '비공개'}</span>
                                                    <PublicToggleButton
                                                        active={novel.isPublic !== false}
                                                        onClick={(e) => handleTogglePublic(novel, e)}
                                                    />
                                                </PublicStatus>
                                            )}
                                            {showCheckboxes && (
                                                <PublicStatus theme={theme} style={{ marginTop: viewMode === 'card' ? '4px' : '0' }}>
                                                    <span>{novel.isPublic !== false ? '공개' : '비공개'}</span>
                                                </PublicStatus>
                                            )}
                                        </NovelInfo>
                                    </NovelItem>
                                );
                            })}
                    </NovelListWrapper>

                    {/* 페이지네이션 */}
                    {filteredNovels.length > itemsPerPage && (
                        <PaginationContainer theme={theme}>
                            <PaginationButton
                                theme={theme}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                이전
                            </PaginationButton>
                            <PaginationInfo theme={theme}>
                                {currentPage} / {Math.ceil(filteredNovels.length / itemsPerPage)}
                            </PaginationInfo>
                            <PaginationButton
                                theme={theme}
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredNovels.length / itemsPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(filteredNovels.length / itemsPerPage)}
                            >
                                다음
                            </PaginationButton>
                        </PaginationContainer>
                    )}
                </>
            )}

            <ConfirmModal
                open={privateConfirmOpen}
                title="소설 비공개 전환"
                description={`비공개로 전환하더라도 이미 구매한 이용자의 '내 서재'에서는 구매 당시 버전을 계속 볼 수 있습니다.\n\n계속하시겠습니까?`}
                onCancel={() => {
                    setPrivateConfirmOpen(false);
                    setNovelToToggle(null);
                }}
                onConfirm={confirmTogglePrivate}
                confirmText="확인"
            />
            <ConfirmModal
                open={batchConfirmOpen}
                title="소설 일괄 비공개 전환"
                description={`선택한 ${selectedNovels.size}개의 소설을 비공개로 전환합니다.\n\n비공개로 전환하더라도 이미 구매한 이용자의 '내 서재'에서는 구매 당시 버전을 계속 볼 수 있습니다.\n\n계속하시겠습니까?`}
                onCancel={() => {
                    setBatchConfirmOpen(false);
                    setBatchAction(null);
                }}
                onConfirm={confirmBatchPrivate}
                confirmText="확인"
            />

            <Navigation />
        </Container>
    );
}

export default CompletedNovels;

