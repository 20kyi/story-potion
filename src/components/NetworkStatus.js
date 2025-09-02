import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { checkNetworkStatus, enableFirestoreNetwork, disableFirestoreNetwork } from '../firebase';

const NetworkBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: ${({ isOnline }) => isOnline ? '#4CAF50' : '#f44336'};
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  transition: all 0.3s ease;
  transform: translateY(${({ isOnline }) => isOnline ? '-100%' : '0'});
`;

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const updateNetworkStatus = () => {
            const online = checkNetworkStatus();
            setIsOnline(online);

            if (!online) {
                setShowBanner(true);
                // 오프라인 상태에서 Firestore 네트워크 비활성화
                disableFirestoreNetwork();
            } else {
                setShowBanner(false);
                // 온라인 상태에서 Firestore 네트워크 활성화
                enableFirestoreNetwork();
            }
        };

        // 초기 상태 확인
        updateNetworkStatus();

        // 네트워크 상태 변경 이벤트 리스너
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

        return () => {
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);
        };
    }, []);

    if (!showBanner) return null;

    return (
        <NetworkBanner isOnline={isOnline}>
            {isOnline ? '네트워크가 복구되었습니다.' : '오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.'}
        </NetworkBanner>
    );
};

export default NetworkStatus;

