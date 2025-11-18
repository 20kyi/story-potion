import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useTranslation } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.card || '#fff'};
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#333'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.text || '#666'};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.cardHover || '#f5f5f5'};
  }
`;

const NotificationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const NotificationItem = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
  cursor: pointer;
  transition: background 0.2s;
  background-color: ${props => props.$isRead ? 'transparent' : props.theme.cardHover || '#f9f9f9'};
  
  &:hover {
    background-color: ${({ theme }) => theme.cardHover || '#f5f5f5'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#333'};
  margin-bottom: 6px;
`;

const NotificationMessage = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText || '#666'};
  margin-bottom: 8px;
  line-height: 1.5;
`;

const NotificationTime = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#999'};
`;

const EmptyState = styled.div`
  padding: 40px 24px;
  text-align: center;
  color: ${({ theme }) => theme.subText || '#999'};
  font-size: 14px;
`;

const MarkAllReadButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.primary || '#cb6565'};
  font-size: 14px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.cardHover || '#f5f5f5'};
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px;
  border-top: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
`;

function NotificationModal({ isOpen, onClose, user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const theme = actualTheme === 'dark' ? { card: '#2a2a2a', text: '#fff', subText: '#aaa', border: '#444', cardHover: '#333', primary: '#cb6565' } : { card: '#fff', text: '#333', subText: '#666', border: '#e0e0e0', cardHover: '#f5f5f5', primary: '#cb6565' };

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsData);
    } catch (error) {
      console.error('알림 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
      await updateDoc(notificationRef, { isRead: true });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const updatePromises = unreadNotifications.map(notif => {
        const notificationRef = doc(db, 'users', user.uid, 'notifications', notif.id);
        return updateDoc(notificationRef, { isRead: true });
      });
      await Promise.all(updatePromises);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent theme={theme} onClick={(e) => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>{t('notifications') || '알림'}</ModalTitle>
          <CloseButton theme={theme} onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <NotificationList>
          {loading ? (
            <EmptyState theme={theme}>로딩 중...</EmptyState>
          ) : notifications.length === 0 ? (
            <EmptyState theme={theme}>{t('no_notifications') || '알림이 없습니다.'}</EmptyState>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                theme={theme}
                $isRead={notification.isRead}
                onClick={() => markAsRead(notification.id)}
              >
                <NotificationTitle theme={theme}>{notification.title}</NotificationTitle>
                <NotificationMessage theme={theme}>{notification.message}</NotificationMessage>
                <NotificationTime theme={theme}>{formatTime(notification.createdAt)}</NotificationTime>
              </NotificationItem>
            ))
          )}
        </NotificationList>
        {unreadCount > 0 && (
          <ModalFooter theme={theme}>
            <MarkAllReadButton theme={theme} onClick={markAllAsRead}>
              {t('mark_all_read') || '모두 읽음'}
            </MarkAllReadButton>
          </ModalFooter>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

export default NotificationModal;

