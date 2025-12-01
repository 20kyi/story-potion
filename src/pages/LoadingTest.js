import React, { useState, useRef, useEffect } from 'react';
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

const VideoContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  background: #000;
`;

const VideoPlayer = styled.video`
  width: 100%;
  height: auto;
  display: block;
`;

const VideoControls = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.card};
  border-top: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
`;

const ControlButton = styled.button`
  flex: 1;
  padding: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: ${({ variant, theme }) => {
    if (variant === 'primary') return '#e46262';
    if (variant === 'secondary') return theme.card || '#fdfdfd';
    return '#f0f0f0';
  }};
  color: ${({ variant }) => variant === 'primary' ? '#fff' : '#222'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const genreVideos = [
  { name: '로맨스', src: '/videos/로맨스.mp4' },
  { name: '역사', src: '/videos/역사.mp4' },
  { name: '추리', src: '/videos/추리.mp4' },
  { name: '공포', src: '/videos/공포.mp4' },
  { name: '동화', src: '/videos/동화.mp4' },
  { name: '판타지', src: '/videos/판타지.mp4' },
];

const GenreVideoContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  background: #000;
  aspect-ratio: 16 / 9;
  position: relative;
`;

const GenreVideoPlayer = styled.video`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transform: scale(1.2);
`;

const GenreSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const GenreButton = styled.button`
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid ${({ selected, theme }) => selected ? '#e46262' : theme.border || '#e0e0e0'};
  border-radius: 8px;
  background: ${({ selected }) => selected ? '#e46262' : '#fff'};
  color: ${({ selected }) => selected ? '#fff' : '#222'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const SizeControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: ${({ theme }) => theme.card || '#f5f5f5'};
  border-radius: 8px;
`;

const SizeLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#222'};
`;

const SizeInput = styled.input`
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid ${({ theme }) => theme.border || '#ddd'};
  border-radius: 4px;
`;

const SizeButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SizeButton = styled.button`
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.border || '#ddd'};
  border-radius: 4px;
  background: ${({ active }) => active ? '#e46262' : '#fff'};
  color: ${({ active }) => active ? '#fff' : '#222'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ active }) => active ? '#d05050' : '#f5f5f5'};
  }
`;

function LoadingTest({ user }) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showInline, setShowInline] = useState(false);
  const [showDark, setShowDark] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showGenreVideos, setShowGenreVideos] = useState(false);
  const [showFullscreenGenre, setShowFullscreenGenre] = useState(false);
  const [showFullscreenStartVideo, setShowFullscreenStartVideo] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [fullscreenGenreIndex, setFullscreenGenreIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoScale, setVideoScale] = useState(() => {
    const saved = localStorage.getItem('novelLoadingVideoScale');
    return saved ? parseFloat(saved) : 1.2;
  });
  const [startVideoScale, setStartVideoScale] = useState(() => {
    const saved = localStorage.getItem('startLoadingVideoScale');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [testWidth, setTestWidth] = useState(window.innerWidth);
  const [testHeight, setTestHeight] = useState(window.innerHeight);
  const videoRef = useRef(null);
  const genreVideoRef = useRef(null);
  const fullscreenGenreVideoRef = useRef(null);
  const fullscreenStartVideoRef = useRef(null);
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

  const handleVideoToggle = () => {
    setShowVideo(!showVideo);
    if (!showVideo && videoRef.current) {
      videoRef.current.load();
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleGenreVideoToggle = () => {
    setShowGenreVideos(!showGenreVideos);
    if (!showGenreVideos && genreVideos.length > 0) {
      setSelectedGenre(0);
      if (genreVideoRef.current) {
        genreVideoRef.current.load();
      }
    }
  };

  const handleGenreSelect = (index) => {
    setSelectedGenre(index);
    if (genreVideoRef.current) {
      genreVideoRef.current.load();
      genreVideoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleGenreVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleGenreVideoPause = () => {
    setIsPlaying(false);
  };

  const handleFullscreenGenreTest = (index) => {
    setFullscreenGenreIndex(index);
    setShowFullscreenGenre(true);
  };

  const handleCloseFullscreenGenre = () => {
    setShowFullscreenGenre(false);
    setFullscreenGenreIndex(null);
    if (fullscreenGenreVideoRef.current) {
      fullscreenGenreVideoRef.current.pause();
    }
  };

  const handleFullscreenStartVideoTest = () => {
    setShowFullscreenStartVideo(true);
  };

  const handleCloseFullscreenStartVideo = () => {
    setShowFullscreenStartVideo(false);
    if (fullscreenStartVideoRef.current) {
      fullscreenStartVideoRef.current.pause();
    }
  };

  const handlePresetSize = (preset) => {
    const presets = {
      'mobile': { width: 375, height: 667 }, // iPhone
      'tablet': { width: 768, height: 1024 }, // iPad
      'desktop': { width: 1920, height: 1080 }, // Desktop
      'full': { width: window.innerWidth, height: window.innerHeight }, // Full screen
    };
    if (presets[preset]) {
      setTestWidth(presets[preset].width);
      setTestHeight(presets[preset].height);
    }
  };

  const handleSaveNovelVideoScale = () => {
    localStorage.setItem('novelLoadingVideoScale', videoScale.toString());
    alert(`소설 생성 로딩 동영상 확대 비율이 ${videoScale.toFixed(1)}x로 저장되었습니다!`);
  };

  const handleSaveStartVideoScale = () => {
    localStorage.setItem('startLoadingVideoScale', startVideoScale.toString());
    alert(`앱 시작 로딩 동영상 확대 비율이 ${startVideoScale.toFixed(1)}x로 저장되었습니다!`);
  };

  // ESC 키로 닫기
  useEscapeKey(handleCloseFullscreenGenre, showFullscreenGenre);
  useEscapeKey(handleCloseFullscreenStartVideo, showFullscreenStartVideo);

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

          <TestButton
            variant="primary"
            onClick={handleVideoToggle}
          >
            {showVideo ? '동영상 숨기기' : '로딩 동영상 보기'}
          </TestButton>

          <TestButton
            variant="primary"
            onClick={handleFullscreenStartVideoTest}
          >
            앱 시작 동영상 전체 화면 테스트
          </TestButton>

          <TestButton
            variant="primary"
            onClick={handleGenreVideoToggle}
          >
            {showGenreVideos ? '장르별 동영상 숨기기' : '장르별 동영상 보기'}
          </TestButton>
        </ButtonGroup>

        {showGenreVideos && selectedGenre !== null && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <TestButton
              variant="primary"
              onClick={() => handleFullscreenGenreTest(selectedGenre)}
            >
              전체 화면으로 테스트 (실제 로딩 화면과 동일)
            </TestButton>
          </div>
        )}

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

        {showVideo && (
          <PreviewSection>
            <SectionTitle>로딩 동영상 미리보기</SectionTitle>
            <VideoContainer>
              <VideoPlayer
                ref={videoRef}
                controls
                onEnded={handleVideoEnded}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
              >
                <source src="/videos/책과포션.mp4" type="video/mp4" />
                브라우저가 동영상 태그를 지원하지 않습니다.
              </VideoPlayer>
              <VideoControls>
                <ControlButton
                  variant="primary"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? '일시정지' : '재생'}
                </ControlButton>
                <ControlButton
                  variant="secondary"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.pause();
                      setIsPlaying(false);
                    }
                  }}
                >
                  처음으로
                </ControlButton>
              </VideoControls>
            </VideoContainer>
            <InfoText>
              이 동영상은 앱 시작 시 로딩 화면에 표시됩니다.
            </InfoText>
          </PreviewSection>
        )}

        {showGenreVideos && (
          <PreviewSection>
            <SectionTitle>장르별 소설 생성 로딩 동영상</SectionTitle>
            <GenreSelector>
              {genreVideos.map((genre, index) => (
                <GenreButton
                  key={index}
                  selected={selectedGenre === index}
                  onClick={() => handleGenreSelect(index)}
                >
                  {genre.name}
                </GenreButton>
              ))}
            </GenreSelector>
            {selectedGenre !== null && (
              <>
                <GenreVideoContainer>
                  <GenreVideoPlayer
                    ref={genreVideoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    onPlay={handleGenreVideoPlay}
                    onPause={handleGenreVideoPause}
                  >
                    <source src={genreVideos[selectedGenre].src} type="video/mp4" />
                    브라우저가 동영상 태그를 지원하지 않습니다.
                  </GenreVideoPlayer>
                </GenreVideoContainer>
                <VideoControls>
                  <ControlButton
                    variant="primary"
                    onClick={() => {
                      if (genreVideoRef.current) {
                        if (isPlaying) {
                          genreVideoRef.current.pause();
                        } else {
                          genreVideoRef.current.play();
                        }
                      }
                    }}
                  >
                    {isPlaying ? '일시정지' : '재생'}
                  </ControlButton>
                  <ControlButton
                    variant="secondary"
                    onClick={() => {
                      if (genreVideoRef.current) {
                        genreVideoRef.current.currentTime = 0;
                        genreVideoRef.current.play();
                      }
                    }}
                  >
                    처음으로
                  </ControlButton>
                </VideoControls>
                <InfoText>
                  {genreVideos[selectedGenre].name} 장르의 포션으로 소설을 생성할 때 표시되는 동영상입니다.
                </InfoText>
              </>
            )}
          </PreviewSection>
        )}

        {/* 앱 시작 동영상 전체 화면 테스트 */}
        {showFullscreenStartVideo && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#000000',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${testWidth}px`,
                height: `${testHeight}px`,
                position: 'relative',
                background: '#000',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
              }}
            >
              <video
                ref={fullscreenStartVideoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${startVideoScale})`,
                  minWidth: '100%',
                  minHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'cover',
                  zIndex: 1,
                }}
              >
                <source src="/videos/책과포션.mp4" type="video/mp4" />
              </video>

              {/* 로딩 텍스트 (동영상 위에 표시) */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  로딩 중...
                </div>
              </div>
            </div>

            {/* 컨트롤 패널 */}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                minWidth: '300px',
                maxWidth: '90vw',
              }}
            >
              <SizeControl>
                <SizeLabel>화면 크기</SizeLabel>
                <SizeButtonGroup>
                  <SizeButton active={testWidth === 375} onClick={() => handlePresetSize('mobile')}>
                    모바일
                  </SizeButton>
                  <SizeButton active={testWidth === 768} onClick={() => handlePresetSize('tablet')}>
                    태블릿
                  </SizeButton>
                  <SizeButton active={testWidth === 1920} onClick={() => handlePresetSize('desktop')}>
                    데스크톱
                  </SizeButton>
                  <SizeButton active={testWidth === window.innerWidth} onClick={() => handlePresetSize('full')}>
                    전체화면
                  </SizeButton>
                </SizeButtonGroup>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <SizeLabel>너비: {testWidth}px</SizeLabel>
                    <SizeInput
                      type="number"
                      value={testWidth}
                      onChange={(e) => setTestWidth(Number(e.target.value))}
                      min="200"
                      max="3840"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <SizeLabel>높이: {testHeight}px</SizeLabel>
                    <SizeInput
                      type="number"
                      value={testHeight}
                      onChange={(e) => setTestHeight(Number(e.target.value))}
                      min="200"
                      max="2160"
                    />
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <SizeLabel>동영상 확대: {startVideoScale.toFixed(1)}x</SizeLabel>
                  <SizeInput
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={startVideoScale}
                    onChange={(e) => setStartVideoScale(Number(e.target.value))}
                  />
                </div>
                <TestButton
                  variant="primary"
                  onClick={handleSaveStartVideoScale}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  이 확대 비율 저장 (앱 시작 로딩 화면에 적용)
                </TestButton>
              </SizeControl>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseFullscreenStartVideo}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 4,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.8)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.6)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              닫기 (ESC)
            </button>
          </div>
        )}

        {/* 실제 로딩 화면과 동일한 전체 화면 테스트 */}
        {showFullscreenGenre && fullscreenGenreIndex !== null && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#000000',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${testWidth}px`,
                height: `${testHeight}px`,
                position: 'relative',
                background: '#000',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
              }}
            >
              <video
                ref={fullscreenGenreVideoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${videoScale})`,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1,
                }}
              >
                <source src={genreVideos[fullscreenGenreIndex].src} type="video/mp4" />
              </video>

              {/* 로딩 텍스트 (동영상 위에 표시) */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: 12,
                    fontFamily: 'inherit',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  소설을 만드는 중입니다...
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {genreVideos[fullscreenGenreIndex].name} 장르 소설 생성 중
                </div>
              </div>
            </div>

            {/* 컨트롤 패널 */}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                minWidth: '300px',
                maxWidth: '90vw',
              }}
            >
              <SizeControl>
                <SizeLabel>화면 크기</SizeLabel>
                <SizeButtonGroup>
                  <SizeButton active={testWidth === 375} onClick={() => handlePresetSize('mobile')}>
                    모바일
                  </SizeButton>
                  <SizeButton active={testWidth === 768} onClick={() => handlePresetSize('tablet')}>
                    태블릿
                  </SizeButton>
                  <SizeButton active={testWidth === 1920} onClick={() => handlePresetSize('desktop')}>
                    데스크톱
                  </SizeButton>
                  <SizeButton active={testWidth === window.innerWidth} onClick={() => handlePresetSize('full')}>
                    전체화면
                  </SizeButton>
                </SizeButtonGroup>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <SizeLabel>너비: {testWidth}px</SizeLabel>
                    <SizeInput
                      type="number"
                      value={testWidth}
                      onChange={(e) => setTestWidth(Number(e.target.value))}
                      min="200"
                      max="3840"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <SizeLabel>높이: {testHeight}px</SizeLabel>
                    <SizeInput
                      type="number"
                      value={testHeight}
                      onChange={(e) => setTestHeight(Number(e.target.value))}
                      min="200"
                      max="2160"
                    />
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <SizeLabel>동영상 확대: {videoScale.toFixed(1)}x</SizeLabel>
                  <SizeInput
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={videoScale}
                    onChange={(e) => setVideoScale(Number(e.target.value))}
                  />
                </div>
                <TestButton
                  variant="primary"
                  onClick={handleSaveNovelVideoScale}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  이 확대 비율 저장 (소설 생성 로딩 화면에 적용)
                </TestButton>
              </SizeControl>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseFullscreenGenre}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 4,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.8)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.6)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              닫기 (ESC)
            </button>
          </div>
        )}

      </Container>
    </>
  );
}

// ESC 키로 닫기 기능을 위한 별도 useEffect
function useEscapeKey(handler, isActive) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isActive, handler]);
}

export default LoadingTest;

