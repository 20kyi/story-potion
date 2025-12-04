import React, { useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from '../../LanguageContext';

// 포인트 지급 애니메이션 스타일 (카카오 로딩 화면 스타일)
const PointEarnOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  pointer-events: none;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const PointEarnAnimation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  animation: pointEarnPop 2s ease-out forwards;
  
  @keyframes pointEarnPop {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    15% {
      opacity: 1;
      transform: scale(1.1);
    }
    30% {
      transform: scale(1);
    }
    70% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    100% {
      opacity: 0;
      transform: scale(0.9) translateY(-30px);
    }
  }
`;

const PointEarnIcon = styled.div`
  font-size: 48px;
  animation: coinSpin 0.6s ease-out;
  
  @keyframes coinSpin {
    0% {
      transform: rotateY(0deg) scale(0.5);
    }
    50% {
      transform: rotateY(180deg) scale(1.2);
    }
    100% {
      transform: rotateY(360deg) scale(1);
    }
  }
`;

const PointEarnText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-align: center;
`;

const PointEarnAmount = styled.div`
  font-size: 42px;
  font-weight: 700;
  color: #FFD700;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
  animation: numberPop 0.4s ease-out 0.2s both;
  
  @keyframes numberPop {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const PointEarnDesc = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin-top: 70px;
  margin-bottom: 100px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const TestButton = styled.button`
  padding: 16px 24px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  background: #3498f3;
  color: white;
  cursor: pointer;
  margin: 10px;
  transition: all 0.2s;
  
  &:hover {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 243, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const InputGroup = styled.div`
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const Input = styled.input`
  padding: 12px;
  font-size: 16px;
  border: 2px solid ${({ theme }) => theme.mode === 'dark' ? '#444' : '#ddd'};
  border-radius: 8px;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text};
  outline: none;
  
  &:focus {
    border-color: #3498f3;
  }
`;

const InfoBox = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.mode === 'dark' ? 'rgba(52, 152, 243, 0.1)' : 'rgba(52, 152, 243, 0.05)'};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.mode === 'dark' ? 'rgba(52, 152, 243, 0.3)' : 'rgba(52, 152, 243, 0.2)'};
  margin: 20px 0;
`;

const InfoText = styled.p`
  margin: 8px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  line-height: 1.6;
`;

function PointAnimationTest({ user }) {
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(10);
  const [customPoints, setCustomPoints] = useState('10');
  const theme = useTheme();
  const isDark = theme.actualTheme === 'dark';
  const { t } = useTranslation();

  const triggerAnimation = (points) => {
    setEarnedPoints(points);
    setShowPointAnimation(true);
    setTimeout(() => {
      setShowPointAnimation(false);
    }, 2000);
  };

  const handleCustomTest = () => {
    const points = parseInt(customPoints) || 10;
    triggerAnimation(points);
  };

  return (
    <Container theme={theme}>
      <Header user={user} title="포인트 애니메이션 테스트" />

      <InfoBox theme={theme}>
        <InfoText theme={theme}><strong>테스트 안내</strong></InfoText>
        <InfoText theme={theme}>• 버튼을 클릭하면 포인트 지급 애니메이션이 표시됩니다.</InfoText>
        <InfoText theme={theme}>• 애니메이션은 2초 동안 표시된 후 자동으로 사라집니다.</InfoText>
        <InfoText theme={theme}>• 커스텀 포인트 값을 입력하여 테스트할 수 있습니다.</InfoText>
      </InfoBox>

      <h2 style={{ marginTop: '20px', marginBottom: '10px' }}>빠른 테스트</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <TestButton onClick={() => triggerAnimation(10)}>
          10p 테스트
        </TestButton>
        <TestButton onClick={() => triggerAnimation(50)}>
          50p 테스트
        </TestButton>
        <TestButton onClick={() => triggerAnimation(100)}>
          100p 테스트
        </TestButton>
        <TestButton onClick={() => triggerAnimation(500)}>
          500p 테스트
        </TestButton>
      </div>

      <h2 style={{ marginTop: '30px', marginBottom: '10px' }}>커스텀 테스트</h2>
      <InputGroup>
        <Label theme={theme}>포인트 값 입력</Label>
        <Input
          type="number"
          value={customPoints}
          onChange={(e) => setCustomPoints(e.target.value)}
          placeholder="포인트 값을 입력하세요"
          theme={theme}
        />
        <TestButton onClick={handleCustomTest} style={{ margin: '10px 0' }}>
          커스텀 포인트 테스트
        </TestButton>
      </InputGroup>

      <div style={{ marginTop: '40px', padding: '20px', background: theme.mode === 'dark' ? '#2a2a2a' : '#fdfdfd', borderRadius: '12px' }}>
        <h3 style={{ marginTop: 0 }}>현재 상태</h3>
        <InfoText theme={theme}>애니메이션 표시: {showPointAnimation ? '✅ 표시 중' : '❌ 숨김'}</InfoText>
        <InfoText theme={theme}>다음 표시될 포인트: {earnedPoints}p</InfoText>
        <InfoText theme={theme}>다크모드: {isDark ? '✅ 켜짐' : '❌ 꺼짐'}</InfoText>
      </div>

      {/* 포인트 지급 애니메이션 */}
      {showPointAnimation && (
        <PointEarnOverlay>
          <PointEarnAnimation>
            <PointEarnIcon>🪙</PointEarnIcon>
            <PointEarnText>{t('point_earned')}</PointEarnText>
            <PointEarnAmount>
              +{earnedPoints}p
            </PointEarnAmount>
            <PointEarnDesc>{t('today_diary')}</PointEarnDesc>
          </PointEarnAnimation>
        </PointEarnOverlay>
      )}

      <Navigation />
    </Container>
  );
}

export default PointAnimationTest;
