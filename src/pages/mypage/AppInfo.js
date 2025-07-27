import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { auth } from '../../firebase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  min-height: calc(100vh - 120px);
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 10px;
  margin-bottom: 16px;
  box-shadow: ${({ theme }) => theme.cardShadow};
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.subText || '#666'};
  font-weight: 500;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #e46262;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DangerButton = styled.button`
  background: #e46262;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  width: 100%;
  
  &:hover {
    background: #cb6565;
  }
`;

const WarningText = styled.p`
  color: #e46262;
  font-size: 10px;
  margin: 12px 0 0 0;
  text-align: center;
`;

function AppInfo({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [cacheSize, setCacheSize] = useState('0 MB');

  useEffect(() => {
    // 앱 버전 정보 가져오기 (실제로는 package.json에서 가져올 수 있음)
    setAppVersion('1.0.0');
    
    // 저장공간 사용량 계산 (실제로는 localStorage나 IndexedDB 크기 계산)
    const calculateStorage = () => {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length * 2; // UTF-16 characters
        }
      }
      setStorageUsed(`${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    };
    
    calculateStorage();
    setCacheSize('2.5 MB'); // 예시 값
  }, []);

  const handleClearCache = () => {
    if (window.confirm('캐시를 삭제하시겠습니까?')) {
      // 캐시 삭제 로직
      localStorage.clear();
      setCacheSize('0 MB');
      alert('캐시가 삭제되었습니다.');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      if (window.confirm('마지막 확인: 모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?')) {
        // 계정 삭제 로직
        alert('계정 삭제 기능은 준비 중입니다.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert('로그아웃되었습니다.');
    } catch (error) {
      alert('로그아웃에 실패했습니다.');
    }
  };

  return (
    <>
      <Header leftAction={() => navigate(-1)} leftIconType="back" title="앱 정보" />
      <Container theme={theme}>
        <InfoCard theme={theme}>
          <CardTitle theme={theme}>
            📱 앱 정보
          </CardTitle>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>앱 버전</InfoLabel>
            <InfoValue theme={theme}>{appVersion}</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>개발자</InfoLabel>
            <InfoValue theme={theme}>Story Potion Team</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>이용약관</InfoLabel>
            <ActionButton onClick={() => alert('이용약관 페이지로 이동')}>
              보기
            </ActionButton>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>개인정보처리방침</InfoLabel>
            <ActionButton onClick={() => alert('개인정보처리방침 페이지로 이동')}>
              보기
            </ActionButton>
          </InfoItem>
        </InfoCard>

        <InfoCard theme={theme}>
          <CardTitle theme={theme}>
            💾 데이터 관리
          </CardTitle>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>저장공간 사용량</InfoLabel>
            <InfoValue theme={theme}>{storageUsed}</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>캐시 크기</InfoLabel>
            <InfoValue theme={theme}>{cacheSize}</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>캐시 삭제</InfoLabel>
            <ActionButton onClick={handleClearCache}>
              삭제
            </ActionButton>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>데이터 내보내기</InfoLabel>
            <ActionButton onClick={() => alert('데이터 내보내기 기능은 준비 중입니다.')}>
              내보내기
            </ActionButton>
          </InfoItem>
        </InfoCard>

        <InfoCard theme={theme}>
          <CardTitle theme={theme}>
            🔐 계정 관리
          </CardTitle>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>로그아웃</InfoLabel>
            <ActionButton onClick={handleLogout}>
              로그아웃
            </ActionButton>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>계정 삭제</InfoLabel>
            <ActionButton onClick={handleDeleteAccount}>
              삭제
            </ActionButton>
          </InfoItem>
          
          <WarningText>
            ⚠️ 계정 삭제 시 모든 데이터가 영구적으로 삭제됩니다.
          </WarningText>
        </InfoCard>
      </Container>
    </>
  );
}

export default AppInfo; 