import React from "react";
import './ConfirmModal.css';

const ConfirmModal = ({ open, title, description, onCancel, onConfirm, confirmText = '삭제' }) => {
    if (!open) return null;
    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-container">
                {title && <h3 className="confirm-modal-title">{title}</h3>}
                {description && <p className="confirm-modal-desc">{description}</p>}
                <div className="confirm-modal-actions">
                    <button className="confirm-modal-btn cancel" onClick={onCancel}>취소</button>
                    <button className="confirm-modal-btn delete" onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal; 