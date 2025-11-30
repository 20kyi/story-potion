import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/Header';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useTheme } from '../../ThemeContext';
import { isAdmin } from '../../utils/adminAuth';
import { FaEdit } from 'react-icons/fa';

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
    background: ${({ theme }) => theme.cardHover || '#fdfdfd'};
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

const NoticeTitle = styled.h2`
  color: ${({ $textColor }) => $textColor};
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: left;
  font-weight: 700 !important;
  font-size: 1.3rem !important;
  
  @media (min-width: 768px) {
    font-size: 2.5rem !important;
  }
`;

function NoticeDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);
  const isAdminUser = user && isAdmin(user);

  // 다크모드에 따른 색상 설정
  const textColor = actualTheme === 'dark' ? '#f1f1f1' : '#222';
  const secondaryTextColor = actualTheme === 'dark' ? '#ccc' : '#888';
  const contentTextColor = actualTheme === 'dark' ? '#e0e0e0' : '#333';

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const noticeDoc = await getDoc(doc(db, 'announcements', id));
        if (noticeDoc.exists()) {
          const data = noticeDoc.data();
          const createdAt = data.createdAt?.toDate() || new Date();
          const dateStr = createdAt.toISOString().split('T')[0];
          const timeStr = createdAt.toTimeString().split(' ')[0].slice(0, 5); // HH:MM 형식

          setNotice({
            id: noticeDoc.id,
            ...data,
            date: dateStr,
            time: timeStr,
            createdAt: createdAt
          });
          setEditForm({
            title: data.title || '',
            content: data.content || ''
          });
        }
      } catch (error) {
        console.error('공지사항 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotice();
    }
  }, [id]);

  const handleEdit = () => {
    if (!isAdminUser) {
      alert('관리자 권한이 필요합니다.');
      return;
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // 원래 값으로 복원
    if (notice) {
      setEditForm({
        title: notice.title || '',
        content: notice.content || ''
      });
    }
  };

  const handleSave = async () => {
    if (!isAdminUser) {
      alert('관리자 권한이 필요합니다.');
      return;
    }

    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const noticeRef = doc(db, 'announcements', id);
      await updateDoc(noticeRef, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        updatedAt: Timestamp.now()
      });

      // 로컬 상태 업데이트
      setNotice({
        ...notice,
        title: editForm.title.trim(),
        content: editForm.content.trim()
      });

      alert('공지사항이 수정되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      alert('공지사항 수정에 실패했습니다: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const theme = actualTheme === 'dark'
    ? { text: '#fff', card: '#2a2a2a', cardHover: '#333', border: '#444' }
    : { text: '#222', card: '#fff', cardHover: '#fdfdfd', border: '#e0e0e0' };

  return (
    <>
      <Header
        user={user}
        title="공지사항"
        rightActions={
          isAdminUser && notice ? (
            <EditButton theme={theme} onClick={handleEdit} title="수정">
              <FaEdit />
            </EditButton>
          ) : null
        }
      />
      <div style={{ maxWidth: 600, margin: '50px auto', marginTop: 50, padding: 20, paddingTop: 20, paddingBottom: 20 }}>
        {loading ? (
          <div style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 80 }}>로딩 중...</div>
        ) : notice ? (
          <>
            <NoticeTitle $textColor={textColor}>{notice.title}</NoticeTitle>
            <div style={{ color: secondaryTextColor, fontSize: 14, textAlign: 'left', marginBottom: 20 }}>
              {notice.date} {notice.time && `· ${notice.time}`}
            </div>
            <div style={{ fontSize: 16, color: contentTextColor, lineHeight: 1.7, whiteSpace: 'pre-line', textAlign: 'left', marginBottom: 40 }}>{notice.content}</div>
          </>
        ) : (
          <div style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 80 }}>존재하지 않는 공지입니다.</div>
        )}
      </div>

      {/* 수정 모달 */}
      {isEditing && (
        <ModalOverlay onClick={handleCancel}>
          <ModalContent theme={theme} onClick={(e) => e.stopPropagation()}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>공지사항 수정</ModalTitle>
              <CloseButton theme={theme} onClick={handleCancel}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label theme={theme}>제목</Label>
                <Input
                  theme={theme}
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                />
              </FormGroup>
              <FormGroup>
                <Label theme={theme}>내용</Label>
                <Textarea
                  theme={theme}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                />
              </FormGroup>
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

export default NoticeDetail; 