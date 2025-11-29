import React from 'react';
import { useTheme } from '../../../../ThemeContext';
import './CreateOptionModal.css';

const CreateOptionModal = ({ 
    isOpen, 
    onClose, 
    onSelectFree, 
    onSelectPotion 
}) => {
    const theme = useTheme();

    if (!isOpen) return null;

    return (
        <div className="novel-create-option-modal" onClick={onClose}>
            <div className="novel-create-option-content" onClick={(e) => e.stopPropagation()}>
                <button className="novel-close-button" onClick={onClose} style={{ color: theme.text }}>×</button>
                <h3 className="novel-create-option-title" style={{ color: theme.text }}>소설 생성 방법 선택</h3>
                <button
                    className="novel-create-option-button free"
                    onClick={onSelectFree}
                >
                    🪄 프리미엄 무료권 사용
                </button>
                <div className="novel-create-option-desc" style={{ color: theme.subText || '#666', marginBottom: '12px' }}>
                    무료로 소설을 생성합니다 (매월 자동 충전)
                </div>
                <button
                    className="novel-create-option-button"
                    onClick={onSelectPotion}
                >
                    🔮 포션 사용
                </button>
                <div className="novel-create-option-desc" style={{ color: theme.subText || '#666' }}>
                    보유한 포션 1개를 사용합니다
                </div>
            </div>
        </div>
    );
};

export default CreateOptionModal;

