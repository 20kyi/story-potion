import React, { useEffect } from "react";
import './Toast.css';

const icons = {
    success: '✔️',
    error: '❌',
    info: 'ℹ️',
};

const Toast = ({ open, message, type = 'info', onClose, duration = 2000 }) => {
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                onClose && onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [open, duration, onClose]);

    if (!open) return null;
    return (
        <div className={`toast-container toast-${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
        </div>
    );
};

export default Toast; 