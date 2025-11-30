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

const defaultPrivacyContent = `1. 총칙

회사는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.

2. 수집하는 개인정보 항목

• 이메일, 비밀번호(또는 소셜 로그인 정보)
• 프로필 이미지(선택)
• 서비스 이용 기록, 접속 로그, 기기 정보

3. 개인정보의 수집 및 이용 목적

• 회원가입 및 계정 관리
• 일기 생성 및 콘텐츠 저장
• 서비스 개선 및 오류 분석
• CS 응대

4. 보유 및 이용기간

• 회원 탈퇴 시 즉시 삭제
• 단, 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관

5. 개인정보의 제3자 제공

회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.

다만 법률에 의해 요구되는 경우 예외적으로 제공될 수 있습니다.

6. 개인정보 처리 위탁

서비스 운영에 필요한 경우 일부 업무를 외부 업체에 위탁할 수 있습니다.

위탁 시 필요한 보호조치를 취합니다.

7. 이용자의 권리

이용자는 언제든 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.

8. 쿠키의 이용

회사는 이용자 경험 개선을 위해 쿠키를 사용할 수 있습니다.

9. 개인정보 보호 책임자

storypotion.team@gmail.com`;

function PrivacyPolicy({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [privacyContent, setPrivacyContent] = useState(defaultPrivacyContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdminUser(isAdmin(user));
      loadPrivacyFromFirestore();
    }
  }, [user]);

  const loadPrivacyFromFirestore = async () => {
    try {
      const docRef = doc(db, 'config', 'terms');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().privacy) {
        setPrivacyContent(docSnap.data().privacy);
      }
    } catch (error) {
      console.error('개인정보처리방침 로드 실패:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadPrivacyFromFirestore();
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
        privacy: privacyContent,
        updatedAt: new Date(),
        updatedBy: user.email
      }, { merge: true });

      alert('개인정보처리방침이 저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('개인정보처리방침 저장 실패:', error);
      alert('개인정보처리방침 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header
        user={user}
        title="개인정보 처리방침"
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
                value={privacyContent}
                onChange={(e) => setPrivacyContent(e.target.value)}
              />
              <ButtonContainer>
                <CancelButton onClick={handleCancel}>취소</CancelButton>
                <SaveButton onClick={handleSave} disabled={isSaving}>
                  {isSaving ? '저장 중...' : '저장'}
                </SaveButton>
              </ButtonContainer>
            </>
          ) : (
            <SectionContent theme={theme}>{privacyContent}</SectionContent>
          )}
        </Section>
      </Container>
    </>
  );
}

export default PrivacyPolicy;

