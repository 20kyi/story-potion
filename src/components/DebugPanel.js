import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import styled from 'styled-components';

const DebugPanelContainer = styled.div`
  position: fixed;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  z-index: 99999;
  font-family: monospace;
  font-size: 12px;
  transform: translate(-50%, -50%);
  user-select: none;
`;

const ToggleButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e46262;
  color: white;
  border: none;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  touch-action: none;
  
  &:active {
    transform: ${props => props.isDragging ? 'scale(1)' : 'scale(0.95)'};
  }
  
  &:hover {
    background: ${props => props.isDragging ? '#e46262' : '#d45555'};
  }
`;

const Panel = styled.div`
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  max-height: 400px;
  background: rgba(0, 0, 0, 0.9);
  color: #0f0;
  border-radius: 8px;
  padding: 12px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  display: ${props => props.show ? 'block' : 'none'};
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
  }
  
  /* 화면 밖으로 나가지 않도록 조정 */
  @media (max-width: 400px) {
    width: calc(100vw - 40px);
    max-width: 300px;
  }
`;

const LogEntry = styled.div`
  margin-bottom: 8px;
  padding: 4px;
  border-left: 2px solid ${props => {
    if (props.type === 'error') return '#f44';
    if (props.type === 'warn') return '#ff4';
    if (props.type === 'info') return '#4ff';
    return '#0f0';
  }};
  padding-left: 8px;
  word-break: break-word;
  line-height: 1.4;
`;

const ClearButton = styled.button`
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: #333;
  color: #0f0;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  
  &:active {
    background: #444;
  }
`;

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logCount, setLogCount] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [debugModeEnabled, setDebugModeEnabled] = useState(false);
  const dragStateRef = useRef({ isDragging: false, dragStart: { x: 0, y: 0 }, position: { x: 0, y: 0 } });

  // 디버그 모드 상태 확인
  useEffect(() => {
    const checkDebugMode = () => {
      const enabled = localStorage.getItem('debugModeEnabled') === 'true';
      setDebugModeEnabled(enabled);
    };
    
    checkDebugMode();
    
    // storage 이벤트 리스너 추가 (다른 탭에서 변경된 경우 감지)
    window.addEventListener('storage', checkDebugMode);
    
    // 커스텀 이벤트 리스너 추가 (같은 탭에서 변경된 경우 감지)
    const handleDebugModeChange = (event) => {
      // 이벤트에 detail이 있으면 직접 사용, 없으면 localStorage 확인
      if (event.detail && typeof event.detail.enabled === 'boolean') {
        setDebugModeEnabled(event.detail.enabled);
      } else {
        checkDebugMode();
      }
    };
    window.addEventListener('debugModeChanged', handleDebugModeChange);
    
    return () => {
      window.removeEventListener('storage', checkDebugMode);
      window.removeEventListener('debugModeChanged', handleDebugModeChange);
    };
  }, []);

  // 저장된 위치 불러오기
  useEffect(() => {
    const savedPosition = localStorage.getItem('debugPanelPosition');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        // 기본 위치 사용
        setPosition({ 
          x: window.innerWidth - 45, 
          y: window.innerHeight - 45 
        });
      }
    } else {
      // 기본 위치 (오른쪽 하단)
      setPosition({ 
        x: window.innerWidth - 45, 
        y: window.innerHeight - 45 
      });
    }
  }, []);

  // 위치 저장
  useEffect(() => {
    if (position.x > 0 && position.y > 0) {
      localStorage.setItem('debugPanelPosition', JSON.stringify(position));
    }
  }, [position]);

  // dragStateRef 업데이트
  useEffect(() => {
    dragStateRef.current.isDragging = isDragging;
    dragStateRef.current.dragStart = dragStart;
    dragStateRef.current.position = position;
  }, [isDragging, dragStart, position]);

  // 드래그 핸들러
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newDragStart = {
      x: clientX - position.x,
      y: clientY - position.y
    };
    setDragStart(newDragStart);
    dragStateRef.current.dragStart = newDragStart;
  };

  // 전역 드래그 이벤트 리스너
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.isDragging) return;
      e.preventDefault();
      
      const clientX = e.clientX;
      const clientY = e.clientY;
      
      let newX = clientX - dragStateRef.current.dragStart.x;
      let newY = clientY - dragStateRef.current.dragStart.y;
      
      // 화면 경계 체크
      const buttonSize = 50;
      const minX = buttonSize / 2;
      const maxX = window.innerWidth - buttonSize / 2;
      const minY = buttonSize / 2;
      const maxY = window.innerHeight - buttonSize / 2;
      
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!dragStateRef.current.isDragging) return;
      e.preventDefault();
      
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      
      let newX = clientX - dragStateRef.current.dragStart.x;
      let newY = clientY - dragStateRef.current.dragStart.y;
      
      // 화면 경계 체크
      const buttonSize = 50;
      const minX = buttonSize / 2;
      const maxX = window.innerWidth - buttonSize / 2;
      const minY = buttonSize / 2;
      const maxY = window.innerHeight - buttonSize / 2;
      
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    // 모바일 환경에서만 표시
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    // 콘솔 오버라이드
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (message, type = 'log') => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = {
        id: Date.now() + Math.random(),
        message: String(message),
        type,
        timestamp
      };
      
      setLogs(prev => {
        const newLogs = [logEntry, ...prev].slice(0, 100); // 최대 100개만 유지
        setLogCount(newLogs.length);
        return newLogs;
      });
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '), 'log');
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '), 'error');
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '), 'warn');
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      addLog(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '), 'info');
    };

    // 초기 로그
    addLog('디버깅 패널 활성화됨', 'info');
    addLog(`플랫폼: ${Capacitor.getPlatform()}`, 'info');

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  // 디버그 모드가 활성화되지 않았거나 웹 환경이면 렌더링하지 않음
  if (!debugModeEnabled || Capacitor.getPlatform() === 'web') {
    return null;
  }

  return (
    <DebugPanelContainer left={position.x} top={position.y}>
      <ToggleButton 
        onClick={(e) => {
          // 드래그 중이면 클릭 이벤트 무시
          if (!isDragging) {
            setIsOpen(!isOpen);
          }
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        isDragging={isDragging}
        title="드래그하여 이동, 클릭하여 열기/닫기"
      >
        🐛
        {logCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: '#f44',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}>
            {logCount > 99 ? '99+' : logCount}
          </span>
        )}
      </ToggleButton>
      <Panel show={isOpen}>
        <div style={{ 
          marginBottom: '8px', 
          paddingBottom: '8px', 
          borderBottom: '1px solid #555',
          fontSize: '11px',
          color: '#aaa'
        }}>
          디버깅 로그 ({logs.length}개)
        </div>
        {logs.map(log => (
          <LogEntry key={log.id} type={log.type}>
            <span style={{ color: '#888', fontSize: '10px' }}>
              [{log.timestamp}]
            </span>
            <span style={{ 
              color: log.type === 'error' ? '#f44' : 
                     log.type === 'warn' ? '#ff4' : 
                     log.type === 'info' ? '#4ff' : '#0f0'
            }}>
              {log.message}
            </span>
          </LogEntry>
        ))}
        <ClearButton onClick={() => setLogs([])}>
          로그 지우기
        </ClearButton>
      </Panel>
    </DebugPanelContainer>
  );
};

export default DebugPanel;

