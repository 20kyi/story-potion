import React from 'react';
import styled, { keyframes } from 'styled-components';

// 로딩 애니메이션 정의
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const LoadingContainer = styled.div`
  position: ${props => props.fullscreen ? 'fixed' : 'relative'};
  top: ${props => props.fullscreen ? '0' : 'auto'};
  left: ${props => props.fullscreen ? '0' : 'auto'};
  width: ${props => props.fullscreen ? '100vw' : '100%'};
  height: ${props => props.fullscreen ? '100vh' : '100%'};
  min-height: ${props => props.fullscreen ? '100vh' : '400px'};
  background: ${props => props.darkMode
    ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
    : 'linear-gradient(135deg, #fdfdfd 0%, #ffffff 100%)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: ${props => props.fullscreen ? '9999' : '1'};
  animation: ${fadeIn} 0.3s ease-in;
`;

const LogoImage = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 32px;
  animation: ${pulse} 2s ease-in-out infinite;
  object-fit: contain;
  
  /* 배경 완전히 투명하게 */
  background: transparent !important;
  background-color: transparent !important;
  
  /* 이미지 자체의 투명도 유지 */
  image-rendering: -webkit-optimize-contrast;
  
  /* 혹시 모를 배경색 제거 */
  -webkit-background-clip: padding-box;
  background-clip: padding-box;
`;

const SpinnerContainer = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 24px;
`;

const SpinnerRing = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top: 4px solid #e46262;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  
  &:nth-child(2) {
    width: 80%;
    height: 80%;
    top: 10%;
    left: 10%;
    border-top-color: #ff8a8a;
    animation-duration: 1.2s;
    animation-direction: reverse;
  }
  
  &:nth-child(3) {
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    border-top-color: #ffb3b3;
    animation-duration: 0.8s;
  }
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: ${props => props.darkMode ? '#ccc' : '#888'};
  font-weight: 500;
  letter-spacing: 0.5px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

/**
 * 로딩 화면 컴포넌트
 * @param {boolean} fullscreen - 전체 화면 모드 여부 (기본값: true)
 * @param {boolean} darkMode - 다크 모드 여부 (기본값: false)
 * @param {string} text - 로딩 텍스트 (기본값: '로딩 중...')
 */
function LoadingScreen({ fullscreen = true, darkMode = false, text = '로딩 중...' }) {
  return (
    <LoadingContainer fullscreen={fullscreen} darkMode={darkMode}>
      <LogoImage
        src={darkMode ? "/app_logo/logo5.png" : "/app_logo/logo3.png"}
        alt="로딩"
        darkMode={darkMode}
      />
      <SpinnerContainer>
        <SpinnerRing />
        <SpinnerRing />
        <SpinnerRing />
      </SpinnerContainer>
      <LoadingText darkMode={darkMode}>{text}</LoadingText>
    </LoadingContainer>
  );
}

export default LoadingScreen;

