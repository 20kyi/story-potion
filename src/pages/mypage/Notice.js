import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { useTheme } from '../../ThemeContext';
import { isAdmin } from '../../utils/adminAuth';
import { FaPlus } from 'react-icons/fa';
import styled from 'styled-components';
import styles from './Notice.module.css';

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
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.card || '#fff'};
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#333'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.text || '#666'};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.cardHover || '#f5f5f5'};
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: ${({ theme }) => theme.text || '#333'};
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  background: ${({ theme }) => theme.card || '#fff'};
  color: ${({ theme }) => theme.text || '#333'};
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 300px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  background: ${({ theme }) => theme.card || '#fff'};
  color: ${({ theme }) => theme.text || '#333'};
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

const AddButton = styled.button`
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

function Notice({ user }) {
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState({ title: '', content: '' });
    const [isSaving, setIsSaving] = useState(false);
    const isAdminUser = user && isAdmin(user);

    // 다크모드에 따른 색상 설정
    const textColor = actualTheme === 'dark' ? '#f1f1f1' : '#222';
    const secondaryTextColor = actualTheme === 'dark' ? '#ccc' : '#888';
    const borderColor = actualTheme === 'dark' ? '#333' : '#f1f1f1';
    const arrowColor = actualTheme === 'dark' ? '#f1f1f1' : '#000000';

    const fetchNotices = async () => {
        try {
            const noticesRef = collection(db, 'announcements');
            const q = query(noticesRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const noticesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate() ? doc.data().createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            }));
            setNotices(noticesData);
        } catch (error) {
            console.error('공지사항 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleAdd = () => {
        if (!isAdminUser) {
            alert('관리자 권한이 필요합니다.');
            return;
        }
        setIsAdding(true);
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setAddForm({ title: '', content: '' });
    };

    const handleSaveAdd = async () => {
        if (!isAdminUser) {
            alert('관리자 권한이 필요합니다.');
            return;
        }

        if (!addForm.title.trim() || !addForm.content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, 'announcements'), {
                title: addForm.title.trim(),
                content: addForm.content.trim(),
                createdAt: Timestamp.now()
            });

            alert('공지사항이 추가되었습니다.');
            setIsAdding(false);
            setAddForm({ title: '', content: '' });
            // 목록 새로고침
            setLoading(true);
            await fetchNotices();
        } catch (error) {
            console.error('공지사항 추가 실패:', error);
            alert('공지사항 추가에 실패했습니다: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const theme = actualTheme === 'dark'
        ? { text: '#fff', card: '#2a2a2a', cardHover: '#333', border: '#444' }
        : { text: '#222', card: '#fff', cardHover: '#f5f5f5', border: '#e0e0e0' };

    return (
        <>
            <Header
                leftAction={() => navigate(-1)}
                leftIconType="back"
                title="공지사항"
                rightActions={
                    isAdminUser ? (
                        <AddButton theme={theme} onClick={handleAdd} title="추가">
                            <FaPlus />
                        </AddButton>
                    ) : null
                }
            />
            <div className={styles.noticeContainer}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: secondaryTextColor }}>로딩 중...</div>
                ) : notices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: secondaryTextColor }}>등록된 공지사항이 없습니다.</div>
                ) : (
                    <ul className={styles.noticeList}>
                        {notices.map(notice => (
                            <li key={notice.id} className={styles.noticeItem} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                <Link to={`/my/notice/${notice.id}`} className={styles.noticeLink} style={{ color: 'inherit' }}>
                                    <div>
                                        <div className={styles.noticeTitle} style={{ color: textColor }}>{notice.title}</div>
                                        <div className={styles.noticeDate} style={{ color: secondaryTextColor }}>{notice.date}</div>
                                    </div>
                                    <span className={styles.noticeArrow}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 6l6 6-6 6" stroke={arrowColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 공지사항 추가 모달 */}
            {isAdding && (
                <ModalOverlay onClick={handleCancelAdd}>
                    <ModalContent theme={theme} onClick={(e) => e.stopPropagation()}>
                        <ModalHeader theme={theme}>
                            <ModalTitle theme={theme}>공지사항 추가</ModalTitle>
                            <CloseButton theme={theme} onClick={handleCancelAdd}>×</CloseButton>
                        </ModalHeader>
                        <ModalBody>
                            <FormGroup>
                                <Label theme={theme}>제목</Label>
                                <Input
                                    theme={theme}
                                    type="text"
                                    value={addForm.title}
                                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                                    placeholder="공지사항 제목을 입력하세요"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label theme={theme}>내용</Label>
                                <Textarea
                                    theme={theme}
                                    value={addForm.content}
                                    onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                                    placeholder="공지사항 내용을 입력하세요"
                                />
                            </FormGroup>
                        </ModalBody>
                        <ButtonContainer theme={theme}>
                            <CancelButton theme={theme} onClick={handleCancelAdd} disabled={isSaving}>
                                취소
                            </CancelButton>
                            <SaveButton theme={theme} onClick={handleSaveAdd} disabled={isSaving}>
                                {isSaving ? '저장 중...' : '저장'}
                            </SaveButton>
                        </ButtonContainer>
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    );
}

export default Notice; 