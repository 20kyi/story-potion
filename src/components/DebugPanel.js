import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import styled from 'styled-components';

const DebugPanelContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99999;
  font-family: monospace;
  font-size: 12px;
`;

const ToggleButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e46262;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &:active {
    transform: scale(0.95);
  }
`;

const Panel = styled.div`
  position: absolute;
  bottom: 60px;
  right: 0;
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

  // 모바일 환경에서만 렌더링
  if (Capacitor.getPlatform() === 'web') {
    return null;
  }

  return (
    <DebugPanelContainer>
      <ToggleButton 
        onClick={() => setIsOpen(!isOpen)}
        title="디버깅 패널 열기/닫기"
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

