// Helper functions for dynamic styles
export const getDayIndicatorBackground = (hasDiary, barColor, theme, isCompleted) => {
    const themeMode = theme?.mode || 'light';
    if (!hasDiary) {
        if (barColor === 'fill') return themeMode === 'dark' ? '#4A4A4A' : '#E5E5E5';
        return themeMode === 'dark' ? '#3A3A3A' : '#E5E5E5';
    }
    if (isCompleted && hasDiary) {
        return 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)';
    }
    if (barColor === 'fill') return themeMode === 'dark' ? '#BFBFBF' : '#868E96';
    if (barColor === 'create') return themeMode === 'dark' ? '#FFB3B3' : '#e07e7e';
    if (barColor === 'free') return '#e4a30d';
    if (barColor === 'view') {
        const primaryColor = theme?.primary;
        if (primaryColor) return primaryColor;
        return '#cb6565';
    }
    return hasDiary ? (themeMode === 'dark' ? '#FFB3B3' : '#e07e7e') : (themeMode === 'dark' ? '#3A3A3A' : '#E5E5E5');
};

export const getCreateButtonStyle = (children, completed, theme, isFree, disabled, isListMode) => {
    const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));
    const style = {
        width: isListMode ? '130px' : '100%',
        minWidth: isListMode ? '130px' : 'auto',
        margin: 0,
        marginTop: isListMode ? '0' : '2px',
        padding: isListMode ? '6px 12px' : '8px',
        fontSize: isListMode ? '11px' : '12px',
        whiteSpace: 'nowrap',
        borderRadius: '10px',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: (childrenStr.includes('다른 장르') || childrenStr.includes('Other Genre') || childrenStr.includes('other genre')) ? 'opacity 0.2s ease, color 0.2s ease, border-color 0.2s ease' : 'all 0.2s ease',
        overflow: 'visible',
        boxShadow: children === '소설 보기' ? '0 2px 8px rgba(228,98,98,0.08)' : 'none'
    };

    if (disabled) {
        style.background = theme.mode === 'dark' ? '#2A2A2A' : '#E5E5E5';
        style.color = theme.mode === 'dark' ? '#666666' : '#999999';
        style.border = theme.mode === 'dark' ? '2px solid #3A3A3A' : '2px solid #CCCCCC';
    } else if (isFree) {
        style.background = 'transparent';
        style.color = '#e4a30d';
        style.border = '2px solid #e4a30d';
    } else if (childrenStr.includes('PREMIUM')) {
        style.background = theme.premiumBannerBg || 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)';
        style.color = theme.premiumBannerText || '#8B4513';
        style.border = 'none';
    } else if (children === '일기 채우기' || children === 'Write diary') {
        style.background = theme.mode === 'dark' ? '#3A3A3A' : '#F5F6FA';
        style.color = theme.mode === 'dark' ? '#BFBFBF' : '#868E96';
        style.border = theme.mode === 'dark' ? '2px solid #BFBFBF' : '2px solid #868E96';
    } else if (childrenStr.includes('다른 장르') || childrenStr.includes('Other Genre') || childrenStr.includes('other genre')) {
        style.background = 'transparent';
        style.color = '#C99A9A';
        style.border = '2px solid #C99A9A';
    } else if (children === 'AI 소설 쓰기' || children === 'Create novel' || children === '완성 ✨') {
        style.background = theme.mode === 'dark' ? '#3A3A3A' : '#f5f5f5';
        style.color = theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e';
        style.border = theme.mode === 'dark' ? '2px solid #FFB3B3' : '2px solid #e07e7e';
    } else if (children === '소설 보기') {
        style.background = theme.primary;
        style.color = '#fff';
        style.border = 'none';
    } else {
        style.background = theme.primary;
        style.color = '#fff';
        style.border = 'none';
    }

    return style;
};

export const getWeeklyCardTransform = (isDiaryTheme, index) => {
    if (!isDiaryTheme) return 'none';
    const rotations = [0.2, -0.3, 0.1, -0.2, 0.3, -0.1];
    return `rotate(${rotations[index % rotations.length] || 0}deg)`;
};

