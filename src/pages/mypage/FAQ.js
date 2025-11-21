import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import styles from './FAQ.module.css';
import { useTranslation } from '../../LanguageContext';
import { useTheme } from '../../ThemeContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { isAdmin } from '../../utils/adminAuth';
import { FaEdit, FaTrash, FaMinus } from 'react-icons/fa';

const FAQ_DATA = [
    {
        category: '계정 & 기본 기능',
        icon: '📌',
        items: [
            {
                question: '스토리포션은 어떤 앱인가요?',
                answer: '일기를 쓰면 AI가 이를 기반으로 다양한 스타일의 소설로 변환해주는 앱입니다.\n\n일기뿐 아니라 감정 기록, 사진 기록, 소설 생성까지 한곳에서 즐길 수 있어요.'
            },
            {
                question: '회원가입 없이도 사용할 수 있나요?',
                answer: '기본적인 기능은 체험 가능하지만,\n\n일기 저장·소설 생성·구매 기능을 이용하려면 회원가입이 필요합니다.'
            },
            {
                question: '기기를 바꿔도 데이터가 유지되나요?',
                answer: '네! 같은 계정으로 로그인하면 언제든지 모든 기록을 불러올 수 있습니다.'
            }
        ]
    },
    {
        category: '일기 작성 & 저장',
        icon: '📝',
        items: [
            {
                question: '일기는 자동 저장되나요?',
                answer: '네. 작성 중에도 자동 저장되며, 종료 시점에도 서버에 안전하게 저장됩니다.'
            },
            {
                question: '일기를 수정하면 소설도 자동으로 수정되나요?',
                answer: '아니요. 일기 수정은 소설에 자동 반영되지 않습니다.\n\n필요하다면 새로운 소설을 다시 생성하면 됩니다.'
            },
            {
                question: '일기를 삭제하면 소설도 삭제되나요?',
                answer: '아니요. 소설은 일기와 별개로 저장됩니다.'
            }
        ]
    },
    {
        category: '사진 업로드 (프리미엄 기능 포함)',
        icon: '📷',
        items: [
            {
                question: '일기 한 편에 몇 장까지 사진을 올릴 수 있나요?',
                answer: '무료 회원: 1장까지\n프리미엄 회원: 최대 4장까지'
            },
            {
                question: '프리미엄을 해지하면 이전에 올린 사진은 사라지나요?',
                answer: '절대 사라지지 않습니다.\n\n프리미엄 기간에 업로드한 사진은 그대로 보존됩니다.'
            },
            {
                question: '프리미엄 해지 후에도 기존 일기의 4장 사진을 유지할 수 있나요?',
                answer: '네. 기존 사진은 그대로 유지되며 삭제되지 않습니다.'
            },
            {
                question: '프리미엄이 아닐 때 기존 일기에 사진을 추가할 수 있나요?',
                answer: '무료 회원 상태에서는 새로운 사진 추가는 제한됩니다.\n\n기존 사진은 그대로 보존됩니다.'
            }
        ]
    },
    {
        category: 'AI 기능 (일기 다듬기 / 소설 생성)',
        icon: '🤖',
        items: [
            {
                question: 'AI 일기 다듬기 기능은 무엇인가요?',
                answer: '사용자가 쓴 일기를 더 자연스럽고 감성적인 문장으로 다듬어주는 프리미엄 기능입니다.'
            },
            {
                question: '소설은 어떻게 생성되나요?',
                answer: '작성한 일기를 기반으로 AI가 스토리, 분위기, 문체 등을 재구성해 소설 형태로 만들어줍니다.'
            },
            {
                question: '생성되는 소설의 분량은 어느 정도인가요?',
                answer: '선택한 장르와 스타일에 따라 다르며, 기본적으로 일기 내용을 기반으로 1편 분량의 소설이 만들어집니다.'
            },
            {
                question: 'AI가 생성한 소설을 수정할 수 있나요?',
                answer: '네, 생성 후에는 자유롭게 수정/편집이 가능합니다.'
            }
        ]
    },
    {
        category: '소설 공개/비공개 & 삭제',
        icon: '🔒',
        items: [
            {
                question: '내가 만든 소설을 공개하고 싶어요. 어떻게 하나요?',
                answer: '소설 상세 페이지에서 공개/비공개 설정을 변경할 수 있습니다.'
            },
            {
                question: '소설을 비공개로 바꾸면 구매자가 더 이상 볼 수 없나요?',
                answer: '아니요. 구매한 사람은 계속 열람할 수 있습니다.\n\n(구매 당시 버전이 구매자의 \'내 서재\'에 남습니다.)'
            },
            {
                question: '소설을 삭제하면 구매자도 못 보나요?',
                answer: '원본은 삭제되지만, 구매한 사용자는 구매 당시 스냅샷을 계속 볼 수 있습니다.\n\n이건 환불/분쟁을 막기 위한 필수 정책입니다.'
            }
        ]
    },
    {
        category: '소설 구매 & 환불',
        icon: '💰',
        items: [
            {
                question: '내가 만든 소설을 다른 유저가 구매할 수 있나요?',
                answer: '네. 공개 설정을 한 소설은 다른 유저가 구매할 수 있습니다.'
            },
            {
                question: '소설을 구매하면 영구 소장인가요?',
                answer: '네. 구매한 소설은 영구 소장되며, 작가가 비공개/삭제해도 내 서재에서 계속 열람 가능합니다.'
            },
            {
                question: '구매 후 환불이 가능한가요?',
                answer: '환불은 구글/애플 스토어 정책을 따르며,\n\n앱 내에서는 환불 처리가 불가능합니다.'
            }
        ]
    },
    {
        category: '프리미엄 구독 & 해지',
        icon: '👑',
        items: [
            {
                question: '프리미엄 구독하면 어떤 기능을 사용할 수 있나요?',
                answer: '• 일기당 사진 최대 4장\n• AI 일기 다듬기 기능\n• 향상된 편집 도구\n• 광고 제거(도입 시)'
            },
            {
                question: '프리미엄 해지 후에도 기존 데이터는 유지되나요?',
                answer: '네. 프리미엄으로 작성한 일기 및 사진은 그대로 유지됩니다.'
            },
            {
                question: '프리미엄 해지하면 어떤 기능이 제한되나요?',
                answer: '새 일기 작성 시 사진 1장 제한, AI 다듬기 기능 비활성화 등\n\n무료 플랜 기준이 적용됩니다.'
            },
            {
                question: '재구독하면 기능이 다시 활성화되나요?',
                answer: '네. 즉시 모든 프리미엄 기능이 다시 활성화됩니다.'
            }
        ]
    },
    {
        category: '데이터 보관 & 백업',
        icon: '💾',
        items: [
            {
                question: '데이터가 갑자기 사라질 수 있나요?',
                answer: '아니요. 모든 일기/사진/소설은 서버에 안전히 저장됩니다.'
            },
            {
                question: '계정을 삭제하면 데이터도 모두 삭제되나요?',
                answer: '네. 계정 삭제 시 모든 기록이 복구 불가하게 삭제됩니다.'
            }
        ]
    },
    {
        category: '결제 관련 (Google/Apple 스토어)',
        icon: '💳',
        items: [
            {
                question: '구독 환불은 어디에서 신청하나요?',
                answer: '구글 플레이스토어 / 애플 앱스토어에서만 가능합니다.\n\n앱 내부에서는 환불 처리를 지원하지 않습니다.'
            },
            {
                question: '결제가 중복되었어요. 어떻게 하나요?',
                answer: '스토어 고객센터로 문의하시면 확인 후 조치됩니다.'
            }
        ]
    },
    {
        category: '기타 문의',
        icon: '❓',
        items: [
            {
                question: '고객센터 문의는 어디서 하나요?',
                answer: '앱 내 "설정 → 고객센터" 또는\n\n공식 이메일로 문의하시면 빠르게 답변드립니다.'
            },
            {
                question: '소설 내용이 마음에 들지 않으면 다시 생성할 수 있나요?',
                answer: '네, 같은 일기로 여러 번 생성할 수 있으며 결과는 매번 달라질 수 있어요.'
            }
        ]
    }
];

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 0;
  
  @media (min-width: 768px) {
    padding: 20px;
  }
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.card || '#fff'};
  border-radius: 0;
  width: 100%;
  height: 100vh;
  max-width: 900px;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
  
  @media (min-width: 768px) {
    border-radius: 20px;
    height: auto;
    max-height: 90vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  
  @media (min-width: 768px) {
    padding: 20px 24px;
  }
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#333'};
  
  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  color: ${({ theme }) => theme.text || '#666'};
  cursor: pointer;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  
  @media (min-width: 768px) {
    font-size: 24px;
    padding: 0;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
  }
  
  &:hover {
    background: ${({ theme }) => theme.cardHover || '#f5f5f5'};
  }
  
  &:active {
    background: ${({ theme }) => theme.cardHover || '#f5f5f5'};
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
  
  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 768px) {
    margin-bottom: 20px;
  }
`;

const Label = styled.label`
  display: block;
  color: ${({ theme }) => theme.text || '#333'};
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  height: 22px;
  line-height: 22px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  background: ${({ theme }) => theme.card || '#fff'};
  color: ${({ theme }) => theme.text || '#333'};
  font-size: 16px;
  font-family: inherit;
  box-sizing: border-box;
  -webkit-appearance: none;
  
  @media (min-width: 768px) {
    padding: 12px;
    font-size: 15px;
  }
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;


const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  background: ${({ theme }) => theme.card || '#fff'};
  color: ${({ theme }) => theme.text || '#333'};
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
  -webkit-appearance: none;
  
  @media (min-width: 768px) {
    padding: 12px;
    font-size: 15px;
  }
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 12px;
  background: ${({ theme }) => theme.card || '#fff'};
  
  @media (min-width: 768px) {
    margin-bottom: 24px;
    padding: 20px;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;


const DeleteButton = styled.button`
  background: none;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  padding: 8px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  flex-shrink: 0;
  
  @media (min-width: 768px) {
    min-width: 32px;
    min-height: 32px;
    padding: 6px;
    font-size: 14px;
  }
  
  &:hover {
    background-color: rgba(231, 76, 60, 0.1);
  }
  
  &:active {
    background-color: rgba(231, 76, 60, 0.2);
    transform: scale(0.95);
  }
`;

const AddButton = styled.button`
  background-color: #27ae60;
  color: #fff;
  border: none;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  flex: 2;
  
  @media (min-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
    min-height: auto;
  }
  
  &:hover {
    background-color: #229954;
  }
  
  &:active {
    background-color: #229954;
    transform: scale(0.98);
  }
`;

const CategoryActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  gap: 12px;
`;

const CategoryDeleteButton = styled.button`
  background: none;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  @media (min-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
    min-height: auto;
  }
  
  &:hover {
    background-color: rgba(231, 76, 60, 0.1);
  }
  
  &:active {
    background-color: rgba(231, 76, 60, 0.2);
    transform: scale(0.98);
  }
`;

const ItemCard = styled.div`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 8px;
  margin-bottom: 12px;
  background: ${({ theme }) => theme.card || '#fff'};
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ItemNumber = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text || '#333'};
  font-weight: 600;
  
  @media (min-width: 768px) {
    font-size: 13px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  
  @media (min-width: 768px) {
    padding: 20px 24px;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
  
  @media (min-width: 768px) {
    padding: 12px;
    font-size: 15px;
    min-height: auto;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const SaveButton = styled(Button)`
  background-color: #3498db;
  color: #fff;
  
  &:hover:not(:disabled) {
    background-color: #2980b9;
  }
`;

const CancelButton = styled(Button)`
  background-color: #95a5a6;
  color: #fff;
  
  &:hover:not(:disabled) {
    background-color: #7f8c8d;
  }
`;

const EditButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text || '#222'};
  border-radius: 50%;
  transition: background 0.2s;
  font-size: 16px;
  
  &:hover {
    background: ${({ theme }) => theme.cardHover || 'rgba(0, 0, 0, 0.05)'};
  }
`;

function FAQ({ user }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { actualTheme } = useTheme();
    const [openCategories, setOpenCategories] = useState({});
    const [openItems, setOpenItems] = useState({});
    const [faqData, setFaqData] = useState(FAQ_DATA);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const isAdminUser = user && isAdmin(user);

    const toggleCategory = (categoryIndex) => {
        setOpenCategories(prev => ({
            ...prev,
            [categoryIndex]: !prev[categoryIndex]
        }));
    };

    const toggleItem = (categoryIndex, itemIndex) => {
        const key = `${categoryIndex}-${itemIndex}`;
        setOpenItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    useEffect(() => {
        const fetchFAQ = async () => {
            try {
                const faqDoc = await getDoc(doc(db, 'config', 'faq'));
                if (faqDoc.exists() && faqDoc.data().data) {
                    setFaqData(faqDoc.data().data);
                }
            } catch (error) {
                console.error('FAQ 조회 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQ();
    }, []);

    const handleEdit = () => {
        if (!isAdminUser) {
            alert('관리자 권한이 필요합니다.');
            return;
        }
        // 깊은 복사
        setEditForm(JSON.parse(JSON.stringify(faqData)));
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm([]);
    };

    const handleSave = async () => {
        if (!isAdminUser) {
            alert('관리자 권한이 필요합니다.');
            return;
        }

        // 유효성 검사
        for (let i = 0; i < editForm.length; i++) {
            const category = editForm[i];
            if (!category.category || !category.icon) {
                alert(`${i + 1}번째 카테고리를 입력해주세요. (예: 📌 카테고리명)`);
                return;
            }
            if (!category.items || category.items.length === 0) {
                alert(`${category.category} 카테고리에 최소 1개 이상의 질문을 추가해주세요.`);
                return;
            }
            for (let j = 0; j < category.items.length; j++) {
                const item = category.items[j];
                if (!item.question || !item.answer) {
                    alert(`${category.category} 카테고리의 ${j + 1}번째 질문/답변을 모두 입력해주세요.`);
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            const faqRef = doc(db, 'config', 'faq');
            await setDoc(faqRef, {
                data: editForm,
                updatedAt: Timestamp.now(),
                updatedBy: user.email
            }, { merge: true });

            setFaqData(editForm);
            alert('FAQ가 수정되었습니다.');
            setIsEditing(false);
        } catch (error) {
            console.error('FAQ 수정 실패:', error);
            alert('FAQ 수정에 실패했습니다: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCategoryChange = (index, value) => {
        const newForm = [...editForm];
        // "📌 카테고리명" 형식에서 아이콘과 카테고리명 분리
        const trimmedValue = value.trim();
        const iconMatch = trimmedValue.match(/^([^\s]+)\s+(.+)$/);
        
        if (iconMatch) {
            newForm[index] = { 
                ...newForm[index], 
                icon: iconMatch[1],
                category: iconMatch[2]
            };
        } else {
            // 아이콘만 입력된 경우
            newForm[index] = { 
                ...newForm[index], 
                icon: trimmedValue || '📌',
                category: newForm[index].category || ''
            };
        }
        setEditForm(newForm);
    };
    
    const getCategoryDisplayValue = (category) => {
        return `${category.icon || '📌'} ${category.category || ''}`.trim();
    };

    const handleItemChange = (categoryIndex, itemIndex, field, value) => {
        const newForm = [...editForm];
        newForm[categoryIndex].items[itemIndex] = {
            ...newForm[categoryIndex].items[itemIndex],
            [field]: value
        };
        setEditForm(newForm);
    };

    const handleAddCategory = () => {
        setEditForm([...editForm, {
            category: '',
            icon: '📌',
            items: [{ question: '', answer: '' }]
        }]);
    };

    const handleDeleteCategory = (index) => {
        if (window.confirm('이 카테고리를 삭제하시겠습니까?')) {
            const newForm = editForm.filter((_, i) => i !== index);
            setEditForm(newForm);
        }
    };

    const handleAddItem = (categoryIndex) => {
        const newForm = [...editForm];
        newForm[categoryIndex].items.push({ question: '', answer: '' });
        setEditForm(newForm);
    };

    const handleDeleteItem = (categoryIndex, itemIndex) => {
        if (window.confirm('이 질문을 삭제하시겠습니까?')) {
            const newForm = [...editForm];
            newForm[categoryIndex].items = newForm[categoryIndex].items.filter((_, i) => i !== itemIndex);
            setEditForm(newForm);
        }
    };

    const theme = actualTheme === 'dark'
        ? { text: '#fff', card: '#2a2a2a', cardHover: '#333', border: '#444' }
        : { text: '#222', card: '#fff', cardHover: '#f5f5f5', border: '#e0e0e0' };

    return (
        <>
            <Header 
                user={user}
                title="FAQ"
                rightActions={
                    isAdminUser ? (
                        <EditButton theme={theme} onClick={handleEdit} title="수정">
                            <FaEdit />
                        </EditButton>
                    ) : null
                }
            />
            <div className={styles.faqContainer}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>로딩 중...</div>
                ) : (
                    <div className={styles.faqList}>
                        {faqData.map((category, categoryIndex) => (
                        <div key={categoryIndex} className={styles.categorySection}>
                            <div
                                className={styles.categoryHeader}
                                onClick={() => toggleCategory(categoryIndex)}
                            >
                                <span className={styles.categoryIcon}>{category.icon}</span>
                                <span className={styles.categoryTitle}>{category.category}</span>
                                <span className={styles.chevron}>
                                    {openCategories[categoryIndex] ? '▼' : '▶'}
                                </span>
                            </div>

                            {openCategories[categoryIndex] && (
                                <div className={styles.categoryContent}>
                                    {category.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className={styles.faqItem}>
                                            <div
                                                className={styles.question}
                                                onClick={() => toggleItem(categoryIndex, itemIndex)}
                                            >
                                                <span className={styles.questionText}>Q. {item.question}</span>
                                                <span className={styles.itemChevron}>
                                                    {openItems[`${categoryIndex}-${itemIndex}`] ? '▼' : '▶'}
                                                </span>
                                            </div>
                                            {openItems[`${categoryIndex}-${itemIndex}`] && (
                                                <div className={styles.answer}>
                                                    <span className={styles.answerLabel}>A.</span>
                                                    <div className={styles.answerText}>
                                                        {item.answer.split('\n').map((line, lineIndex) => (
                                                            <React.Fragment key={lineIndex}>
                                                                {line}
                                                                {lineIndex < item.answer.split('\n').length - 1 && <br />}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 수정 모달 */}
            {isEditing && (
                <ModalOverlay onClick={handleCancel}>
                    <ModalContent theme={theme} onClick={(e) => e.stopPropagation()}>
                        <ModalHeader theme={theme}>
                            <ModalTitle theme={theme}>FAQ 수정</ModalTitle>
                            <CloseButton theme={theme} onClick={handleCancel}>×</CloseButton>
                        </ModalHeader>
                        <ModalBody>
                            {editForm.map((category, categoryIndex) => (
                                <CategorySection key={categoryIndex} theme={theme}>
                                    <CategoryHeader>
                                        <FormGroup style={{ flex: 1, marginBottom: 0 }}>
                                            <Label theme={theme}>카테고리 (아이콘 + 이름)</Label>
                                            <Input
                                                theme={theme}
                                                type="text"
                                                value={getCategoryDisplayValue(category)}
                                                onChange={(e) => handleCategoryChange(categoryIndex, e.target.value)}
                                                placeholder="예: 📌 계정 & 기본 기능"
                                            />
                                        </FormGroup>
                                    </CategoryHeader>

                                    {category.items.map((item, itemIndex) => (
                                        <ItemCard key={itemIndex} theme={theme}>
                                            <ItemHeader>
                                                <ItemNumber theme={theme}>질문 {itemIndex + 1}</ItemNumber>
                                                <DeleteButton onClick={() => handleDeleteItem(categoryIndex, itemIndex)} title="질문 삭제">
                                                    <FaMinus />
                                                </DeleteButton>
                                            </ItemHeader>
                                            <FormGroup>
                                                <Label theme={theme}>질문</Label>
                                                <Textarea
                                                    theme={theme}
                                                    value={item.question}
                                                    onChange={(e) => handleItemChange(categoryIndex, itemIndex, 'question', e.target.value)}
                                                    placeholder="질문을 입력하세요"
                                                    style={{ minHeight: '80px' }}
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label theme={theme}>답변</Label>
                                                <Textarea
                                                    theme={theme}
                                                    value={item.answer}
                                                    onChange={(e) => handleItemChange(categoryIndex, itemIndex, 'answer', e.target.value)}
                                                    placeholder="답변을 입력하세요 (줄바꿈은 \n으로 표시됩니다)"
                                                />
                                            </FormGroup>
                                        </ItemCard>
                                    ))}

                                    <CategoryActions>
                                        <CategoryDeleteButton onClick={() => handleDeleteCategory(categoryIndex)} title="카테고리 삭제">
                                            <FaTrash />
                                        </CategoryDeleteButton>
                                        <AddButton onClick={() => handleAddItem(categoryIndex)}>
                                            + 질문 추가
                                        </AddButton>
                                    </CategoryActions>
                                </CategorySection>
                            ))}

                            <AddButton onClick={handleAddCategory} style={{ marginTop: '20px' }}>
                                + 카테고리 추가
                            </AddButton>
                        </ModalBody>
                        <ButtonContainer theme={theme}>
                            <CancelButton theme={theme} onClick={handleCancel} disabled={isSaving}>
                                취소
                            </CancelButton>
                            <SaveButton theme={theme} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? '저장 중...' : '저장'}
                            </SaveButton>
                        </ButtonContainer>
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    );
}

export default FAQ;

