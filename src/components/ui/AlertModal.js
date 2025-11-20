import React from "react";
import './AlertModal.css';
import { useTranslation } from '../../LanguageContext';

const AlertModal = ({ open, title, message, onClose, confirmText }) => {
    const { t } = useTranslation();
    if (!open) return null;
    return (
        <div className="alert-modal-overlay" onClick={onClose}>
            <div className="alert-modal-container" onClick={(e) => e.stopPropagation()}>
                {title && <h3 className="alert-modal-title">{title}</h3>}
                {message && <p className="alert-modal-message">{message}</p>}
                <div className="alert-modal-actions">
                    <button className="alert-modal-btn confirm" onClick={onClose}>{confirmText || t('confirm')}</button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;

