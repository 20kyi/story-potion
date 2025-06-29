import React from 'react';
import styled from 'styled-components';

const ToastContainer = styled.div`
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${({ type }) => {
        switch (type) {
            case 'reminder':
                return 'linear-gradient(135deg, #ff8a8a 0%, #e46262 100%)';
            case 'success':
                return 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            case 'error':
                return 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
            default:
                return 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
        }
    }};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-width: 90%;
    width: auto;
    min-width: 300px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: slideDown 0.3s ease-out;
    font-size: 16px;
    font-weight: 500;

    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
`;

const Message = styled.span`
    flex: 1;
    margin-right: 12px;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

const Icon = styled.span`
    margin-right: 8px;
    font-size: 18px;
`;

const NotificationToast = ({ notification, onClose }) => {
    if (!notification) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'reminder':
                return '📝';
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            default:
                return 'ℹ️';
        }
    };

    return (
        <ToastContainer type={notification.type}>
            <Icon>{getIcon(notification.type)}</Icon>
            <Message>{notification.message}</Message>
            <CloseButton onClick={onClose}>×</CloseButton>
        </ToastContainer>
    );
};

export default NotificationToast; 