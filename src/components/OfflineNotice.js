import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { checkNetworkStatus } from '../firebase';
import { getQueueStats } from '../utils/offlineQueue';

const OfflineNoticeContainer = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ isOnline }) => isOnline ? '#4CAF50' : '#f44336'};
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  opacity: ${({ show }) => show ? 1 : 0};
  transform: translateX(-50%) translateY(${({ show }) => show ? '0' : '20px'});
  pointer-events: ${({ show }) => show ? 'auto' : 'none'};
  max-width: 90vw;
  text-align: center;
`;

const QueueInfo = styled.div`
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.9;
`;

const OfflineNotice = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [showNotice, setShowNotice] = useState(false);
    const [queueStats, setQueueStats] = useState({ totalItems: 0 });

    useEffect(() => {
        const updateStatus = () => {
            const online = checkNetworkStatus();
            setIsOnline(online);

            if (!online) {
                setShowNotice(true);
                // 오프라인 상태에서 큐 정보 업데이트
                const stats = getQueueStats();
                setQueueStats(stats);
            } else {
                setShowNotice(false);
            }
        };

        // 초기 상태 확인
        updateStatus();

        // 네트워크 상태 변경 이벤트 리스너
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        // 주기적으로 큐 상태 확인 (오프라인 상태에서만)
        const interval = setInterval(() => {
            if (!navigator.onLine) {
                const stats = getQueueStats();
                setQueueStats(stats);
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            clearInterval(interval);
        };
    }, []);

    if (!showNotice) return null;

    return (
        <OfflineNoticeContainer isOnline={isOnline} show={showNotice}>
            {isOnline ? (
                '네트워크가 복구되었습니다!'
            ) : (
                <>
                    오프라인 상태입니다
                    {queueStats.totalItems > 0 && (
                        <QueueInfo>
                            {queueStats.totalItems}개의 작업이 대기 중입니다
                        </QueueInfo>
                    )}
                </>
            )}
        </OfflineNoticeContainer>
    );
};

export default OfflineNotice;

