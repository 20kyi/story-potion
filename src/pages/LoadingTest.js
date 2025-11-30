import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import LoadingScreen from '../components/LoadingScreen';
import Header from '../components/Header';

const Container = styled.div`
  min-height: 100vh;
  padding: 80px 20px 100px;
  max-width: 600px;
  margin: 0 auto;
  background: ${({ theme }) => theme.background};
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 8px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.subText || '#888'};
  text-align: center;
  margin-bottom: 40px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
`;

const TestButton = styled.button`
  width: 100%;
  padding: 18px 24px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  background: ${({ variant, theme }) => {
    if (variant === 'primary') return '#e46262';
    if (variant === 'secondary') return theme.card || '#fdfdfd';
    return theme.card || '#fdfdfd';
  }};
  color: ${({ variant }) => variant === 'primary' ? '#fff' : '#222'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ variant }) => variant === 'primary'
    ? '0 4px 12px rgba(228, 98, 98, 0.3)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ variant }) => variant === 'primary'
    ? '0 6px 16px rgba(228, 98, 98, 0.4)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)'};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const PreviewSection = styled.div`
  margin-top: 40px;
  padding: 24px;
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.cardShadow || '0 2px 8px rgba(0,0,0,0.1)'};
  min-height: 400px;
  position: relative;
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 20px;
  text-align: center;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.subText || '#888'};
  text-align: center;
  margin-top: 16px;
  line-height: 1.6;
`;

function LoadingTest({ user }) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showInline, setShowInline] = useState(false);
  const [showDark, setShowDark] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleFullscreenTest = () => {
    setShowFullscreen(true);
    setTimeout(() => {
      setShowFullscreen(false);
    }, 3000);
  };

  const handleInlineTest = () => {
    setShowInline(!showInline);
  };

  const handleDarkTest = () => {
    setShowDark(true);
    setTimeout(() => {
      setShowDark(false);
    }, 3000);
  };

  return (
    <>
      <Header user={user} title="로딩 화면 테스트" />
      <Container>
        <Title>로딩 화면 테스트</Title>
        <Subtitle>다양한 로딩 화면 스타일을 테스트해보세요</Subtitle>

        <ButtonGroup>
          <TestButton
            variant="primary"
            onClick={handleFullscreenTest}
          >
            전체 화면 로딩 (3초)
          </TestButton>

          <TestButton
            variant="secondary"
            onClick={handleInlineTest}
          >
            {showInline ? '인라인 로딩 숨기기' : '인라인 로딩 보기'}
          </TestButton>

          <TestButton
            variant="secondary"
            onClick={handleDarkTest}
          >
            다크 모드 로딩 (3초)
          </TestButton>
        </ButtonGroup>

        {showInline && (
          <PreviewSection>
            <SectionTitle>인라인 로딩 미리보기</SectionTitle>
            <LoadingScreen
              fullscreen={false}
              darkMode={theme.theme === 'dark'}
              text="로딩 중..."
            />
            <InfoText>
              이 로딩 화면은 컨테이너 내부에 표시됩니다.
            </InfoText>
          </PreviewSection>
        )}

        {showFullscreen && (
          <LoadingScreen
            fullscreen={true}
            darkMode={false}
            text="전체 화면 로딩 중..."
          />
        )}

        {showDark && (
          <LoadingScreen
            fullscreen={true}
            darkMode={true}
            text="다크 모드 로딩 중..."
          />
        )}
      </Container>
    </>
  );
}

export default LoadingTest;

