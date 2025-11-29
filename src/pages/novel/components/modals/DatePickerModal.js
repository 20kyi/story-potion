import React from 'react';
import { useLanguage, useTranslation } from '../../../../LanguageContext';
import './DatePickerModal.css';

const DatePickerModal = ({ 
    isOpen, 
    currentDate, 
    onClose, 
    onYearChange, 
    onMonthChange 
}) => {
    const { language } = useLanguage();
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="novel-date-picker-modal" onClick={onClose}>
            <div className="novel-date-picker-content" onClick={(e) => e.stopPropagation()}>
                <div className="novel-date-picker-header">
                    <h3 className="novel-date-picker-title">{t('novel_month_label')}</h3>
                    <button className="novel-date-picker-close" onClick={onClose}>×</button>
                </div>
                <h3 className="novel-date-picker-title">{t('year')}</h3>
                <div className="novel-date-picker-grid">
                    {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((year) => (
                        <button
                            key={year}
                            className={`novel-date-picker-button ${year === currentDate.getFullYear() ? 'selected' : ''}`}
                            onClick={() => onYearChange(year)}
                        >
                            {year}
                        </button>
                    ))}
                </div>
                <h3 className="novel-date-picker-title">{t('month')}</h3>
                <div className="novel-date-picker-grid">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <button
                            key={month}
                            className={`novel-date-picker-button ${month === currentDate.getMonth() + 1 ? 'selected' : ''}`}
                            onClick={() => onMonthChange(month)}
                        >
                            {language === 'en' ? month : `${month}월`}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DatePickerModal;

