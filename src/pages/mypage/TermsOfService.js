import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { isAdmin } from '../../utils/adminAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaEdit } from 'react-icons/fa';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: transparent;
  min-height: calc(100vh - 120px);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.text || '#222'};
  margin-bottom: 24px;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: ${({ theme }) => theme.text || '#222'};
`;

const SectionContent = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText || '#666'};
  white-space: pre-line;
  line-height: 1.8;
`;

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 600px;
  height: calc(100vh - 200px);
  padding: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.text || '#222'};
  background: ${({ theme }) => theme.card || '#fff'};
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 8px;
  line-height: 1.8;
  font-family: inherit;
  resize: vertical;
  outline: none;
  
  @media (max-width: 768px) {
    height: calc(100vh - 180px);
    min-height: 400px;
  }
  
  &:focus {
    border-color: #e46262;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
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

const SaveButton = styled.button`
  background: #5cb85c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #4cae4c;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background: #fdfdfd;
  color: #666;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #e8e8e8;
  }
`;

const defaultTermsContent = `제1조 목적

본 약관은 Story Potion(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 용어의 정의

"이용자"란 본 약관에 따라 서비스에 접속하여 이용하는 자를 말합니다.

"계정"이란 이용자가 서비스를 이용하기 위해 생성한 로그인 정보를 말합니다.

제3조 약관의 효력 및 변경

본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.

회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.

제4조 서비스의 제공 및 변경

회사는 이용자에게 일기 생성, 콘텐츠 저장 등의 기능을 제공합니다.

회사는 운영상 필요에 따라 서비스 내용을 변경할 수 있습니다.

제5조 서비스의 중단

천재지변, 시스템 점검 등 불가피한 경우 서비스 제공이 일시 중단될 수 있습니다.

제6조 회원가입

이용자는 회사가 정한 절차에 따라 회원가입을 신청합니다.

회사는 정당한 사유가 없는 한 회원가입을 승낙합니다.

제7조 회원 탈퇴 및 자격 상실

이용자는 언제든지 서비스 내 설정을 통해 탈퇴할 수 있습니다.

회사는 부정 이용, 법령 위반 등의 경우 회원 자격을 제한하거나 상실시킬 수 있습니다.

제8조 이용자의 의무

타인의 개인정보를 도용해서는 안 됩니다.

서비스 운영을 방해해서는 안 됩니다.

제9조 저작권 및 콘텐츠 관리

이용자가 생성한 콘텐츠의 저작권은 이용자에게 있으며, 회사는 서비스 운영을 위해 필요한 범위 내에서 이를 이용할 수 있습니다.

제10조 개인정보 보호

회사는 관련 법령에 따라 이용자의 개인정보를 보호합니다.

제11조 책임 제한

서비스 이용 과정에서 발생한 문제에 대해 회사의 고의 또는 중과실이 없는 경우 책임을 지지 않습니다.

제12조 준거법 및 분쟁 해결

본 약관은 대한민국 법령을 따르며, 분쟁 발생 시 회사 소재지 관할 법원에 따릅니다.`;

function TermsOfService({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [termsContent, setTermsContent] = useState(defaultTermsContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdminUser(isAdmin(user));
      loadTermsFromFirestore();
    }
  }, [user]);

  const loadTermsFromFirestore = async () => {
    try {
      const docRef = doc(db, 'config', 'terms');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().service) {
        setTermsContent(docSnap.data().service);
      }
    } catch (error) {
      console.error('약관 로드 실패:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadTermsFromFirestore();
  };

  const handleSave = async () => {
    if (!isAdminUser) {
      alert('관리자 권한이 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(db, 'config', 'terms');
      await setDoc(docRef, {
        service: termsContent,
        updatedAt: new Date(),
        updatedBy: user.email
      }, { merge: true });

      alert('약관이 저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('약관 저장 실패:', error);
      alert('약관 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header
        user={user}
        title="이용약관"
        rightActions={
          isAdminUser && !isEditing ? (
            <EditButton theme={theme} onClick={handleEdit} title="수정">
              <FaEdit />
            </EditButton>
          ) : null
        }
      />
      <Container theme={theme}>
        <Section>
          {isEditing ? (
            <>
              <EditTextarea
                theme={theme}
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
              />
              <ButtonContainer>
                <CancelButton onClick={handleCancel}>취소</CancelButton>
                <SaveButton onClick={handleSave} disabled={isSaving}>
                  {isSaving ? '저장 중...' : '저장'}
                </SaveButton>
              </ButtonContainer>
            </>
          ) : (
            <SectionContent theme={theme}>{termsContent}</SectionContent>
          )}
        </Section>
      </Container>
    </>
  );
}

export default TermsOfService;

