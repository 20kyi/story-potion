import React, { useRef, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { getStartLoadingVideoScale } from '../config/videoScaleConfig';

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
  overflow: hidden;
`;

const VideoBackground = styled.video`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  object-fit: cover;
  z-index: 1;
`;

const LoadingContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.5s ease-in;
`;

const LoadingText = styled.div`
  font-size: 18px;
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  animation: ${pulse} 2s ease-in-out infinite;
  margin-top: 20px;
`;

const FallbackContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

const LogoImage = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 32px;
  animation: ${pulse} 2s ease-in-out infinite;
  object-fit: contain;
  background: transparent !important;
  background-color: transparent !important;
  image-rendering: -webkit-optimize-contrast;
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
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
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

const FallbackText = styled.div`
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
 * @param {function} onVideoReady - 동영상이 재생 준비되었을 때 호출되는 콜백
 */
function LoadingScreen({ fullscreen = true, darkMode = false, text = '로딩 중...', onVideoReady }) {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let timeoutId;

    // 동영상 로드 시도
    const handleLoadedData = () => {
      console.log('동영상 데이터 로드 완료');
      setVideoReady(true);
      video.play().catch(err => {
        console.warn('동영상 자동 재생 실패:', err);
        // 재생 실패해도 동영상은 표시
        setVideoReady(true);
      });
    };

    const handleCanPlay = () => {
      console.log('동영상 재생 준비 완료');
      setVideoReady(true);
      video.play().catch(err => {
        console.warn('동영상 자동 재생 실패:', err);
        setVideoReady(true);
      });
    };

    const handleError = (e) => {
      console.error('동영상 로드 실패:', e);
      console.error('동영상 경로:', video.src || '/videos/책과포션.mp4');
      console.error('동영상 에러 코드:', video.error?.code);
      console.error('동영상 에러 메시지:', video.error?.message);
      setVideoError(true);
      setVideoReady(false);
    };

    const handleLoadStart = () => {
      console.log('동영상 로드 시작');
    };

    const handlePlaying = () => {
      console.log('동영상 재생 중');
      setVideoReady(true);
      setVideoPlaying(true);
      // 동영상이 재생되기 시작하면 부모 컴포넌트에 알림
      if (onVideoReady) {
        onVideoReady();
      }
      // 전역 이벤트도 발생시켜서 App.js에서 감지할 수 있도록
      window.dispatchEvent(new CustomEvent('loadingVideoPlaying'));
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('playing', handlePlaying);

    // 동영상 소스 설정 및 로드
    const videoSrc = '/videos/책과포션.mp4';
    video.src = videoSrc;
    video.load();

    // 타임아웃 설정 (5초 후에도 로드되지 않으면 에러로 간주)
    timeoutId = setTimeout(() => {
      if (!videoReady && !videoError) {
        console.warn('동영상 로드 타임아웃');
        // 타임아웃이어도 동영상을 표시 시도
        setVideoReady(true);
        video.play().catch(() => {
          setVideoError(true);
        });
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  // 저장된 확대 비율 가져오기
  const savedScale = getStartLoadingVideoScale();

  return (
    <LoadingContainer fullscreen={fullscreen} darkMode={darkMode}>
      {/* 동영상은 항상 렌더링 (에러가 있을 때만 숨김) */}
      {!videoError && (
        <VideoBackground
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.5s ease-in',
            transform: `translate(-50%, -50%) scale(${savedScale})`
          }}
        >
          <source src="/videos/책과포션.mp4" type="video/mp4" />
        </VideoBackground>
      )}

      {/* fullscreen 모드가 아닐 때만 fallback 표시 (인라인 로딩 등) */}
      {!fullscreen && (!videoReady || videoError) && (
        <FallbackContainer
          style={{
            opacity: videoReady && !videoError ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: videoReady && !videoError ? 'none' : 'auto'
          }}
        >
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
          <FallbackText darkMode={darkMode}>{text}</FallbackText>
        </FallbackContainer>
      )}

      {/* 로딩 텍스트는 동영상이 준비되었을 때만 표시 (fullscreen 모드에서만) */}
      {fullscreen && videoReady && !videoError && (
        <LoadingContent>
          <LoadingText>{text}</LoadingText>
        </LoadingContent>
      )}
    </LoadingContainer>
  );
}

export default LoadingScreen;

