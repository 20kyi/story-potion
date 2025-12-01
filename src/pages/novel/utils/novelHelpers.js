// Helper functions for dynamic styles
export const getDayIndicatorBackground = (hasDiary, barColor, theme, isCompleted, isGlassTheme) => {
    const themeMode = theme?.mode || 'light';

    const hexToRgba = (hex, alpha = 0.3) => {
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return hex;
    };

    const gradientToRgba = (gradient) => {
        // linear-gradient에서 색상 추출
        const colors = gradient.match(/#[0-9A-Fa-f]{6}/g);
        if (colors && colors.length >= 2) {
            const color1 = hexToRgba(colors[0], 0.3);
            const color2 = hexToRgba(colors[1], 0.3);
            return `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
        }
        return gradient;
    };

    if (!hasDiary) {
        // 비활성화된 진행도는 반투명하게
        if (barColor === 'fill') {
            const color = themeMode === 'dark' ? '#4A4A4A' : '#E5E5E5';
            return isGlassTheme ? hexToRgba(color, 0.3) : color;
        }
        const color = themeMode === 'dark' ? '#3A3A3A' : '#E5E5E5';
        return isGlassTheme ? hexToRgba(color, 0.3) : color;
    }
    // 활성화된 진행도(hasDiary === true)는 불투명하게 유지
    if (isCompleted && hasDiary) {
        const gradient = 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)';
        return gradient; // 완료 색상은 원래대로
    }
    if (barColor === 'fill') {
        if (isGlassTheme) {
            return '#d1c4e9'; // 글래스 테마에서 일기 작성 중 색상
        }
        const color = themeMode === 'dark' ? '#BFBFBF' : '#868E96';
        return color; // 불투명 유지
    }
    if (barColor === 'create') {
        const color = themeMode === 'dark' ? '#FFB3B3' : '#e07e7e';
        return color; // 불투명 유지
    }
    if (barColor === 'free') {
        return '#e4a30d'; // 불투명 유지
    }
    if (barColor === 'view') {
        const primaryColor = theme?.primary || '#cb6565';
        return primaryColor; // 불투명 유지
    }
    const color = hasDiary ? (themeMode === 'dark' ? '#FFB3B3' : '#e07e7e') : (themeMode === 'dark' ? '#3A3A3A' : '#E5E5E5');
    return color; // hasDiary가 true면 불투명 유지
};

export const getCreateButtonStyle = (children, completed, theme, isFree, disabled, isListMode, isGlassTheme) => {
    const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));

    const hexToRgba = (hex, alpha = 0.3) => {
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return hex;
    };

    const makeTransparent = (color) => {
        if (!isGlassTheme) return color;

        if (color.startsWith('rgba')) return color;
        if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', ', 0.3)');
        }
        if (color.startsWith('#')) {
            return hexToRgba(color, 0.3);
        }
        if (color.includes('gradient')) {
            // gradient 처리
            const colors = color.match(/#[0-9A-Fa-f]{6}/g);
            if (colors && colors.length >= 2) {
                const color1 = hexToRgba(colors[0], 0.3);
                const color2 = hexToRgba(colors[1], 0.3);
                return `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
            }
        }
        return color;
    };

    const style = {
        width: isListMode ? '130px' : '100%',
        minWidth: isListMode ? '130px' : 'auto',
        margin: 0,
        marginTop: isListMode ? '0' : '2px',
        padding: isListMode ? '6px 12px' : '8px',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        borderRadius: isGlassTheme ? '24px' : '10px',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: (childrenStr.includes('다른 장르') || childrenStr.includes('Other Genre') || childrenStr.includes('other genre')) ? 'opacity 0.2s ease, color 0.2s ease, border-color 0.2s ease' : 'all 0.2s ease',
        overflow: 'visible',
        boxShadow: children === '소설 보기' ? '0 2px 8px rgba(228,98,98,0.08)' : 'none'
    };

    if (disabled) {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            const bg = theme.mode === 'dark' ? '#2A2A2A' : '#E5E5E5';
            style.background = makeTransparent(bg);
            style.color = theme.mode === 'dark' ? '#666666' : '#999999';
            const borderColor = theme.mode === 'dark' ? '#3A3A3A' : '#CCCCCC';
            style.border = `2px solid ${borderColor}`;
        }
    } else if (isFree) {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            style.background = 'transparent';
            style.color = '#e4a30d';
            style.border = `2px solid #e4a30d`;
        }
    } else if (childrenStr.includes('PREMIUM')) {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            const bg = theme.premiumBannerBg || 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)';
            style.background = makeTransparent(bg);
            style.color = theme.premiumBannerText || '#8B4513';
            style.border = 'none';
        }
    } else if (children === '일기 채우기' || children === 'Write diary') {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            const bg = theme.mode === 'dark' ? '#3A3A3A' : '#F5F6FA';
            style.background = bg;
            style.color = theme.mode === 'dark' ? '#BFBFBF' : '#868E96';
            const borderColor = theme.mode === 'dark' ? '#BFBFBF' : '#868E96';
            style.border = `2px solid ${borderColor}`;
        }
    } else if (childrenStr.includes('다른 장르') || childrenStr.includes('Other Genre') || childrenStr.includes('other genre')) {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            style.background = 'transparent';
            style.color = '#C99A9A';
            style.border = `2px solid #C99A9A`;
        }
    } else if (children === 'AI 소설 쓰기' || children === 'Create novel' || children === '완성 ✨') {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            const bg = theme.mode === 'dark' ? '#3A3A3A' : '#fdfdfd';
            style.background = makeTransparent(bg);
            style.color = theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e';
            const borderColor = theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e';
            style.border = `2px solid ${borderColor}`;
        }
    } else if (children === '소설 보기') {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            const primaryColor = theme.primary || '#cb6565';
            style.background = makeTransparent(primaryColor);
            style.color = '#fff';
            style.border = 'none';
        }
    } else {
        if (isGlassTheme) {
            style.background = 'transparent';
            style.color = '#000000';
            style.border = `2px solid rgba(255, 255, 255, 0.5)`;
        } else {
            const primaryColor = theme.primary || '#cb6565';
            style.background = makeTransparent(primaryColor);
            style.color = '#fff';
            style.border = 'none';
        }
    }

    return style;
};

export const getWeeklyCardTransform = (isDiaryTheme, index) => {
    if (!isDiaryTheme) return 'none';
    const rotations = [0.2, -0.3, 0.1, -0.2, 0.3, -0.1];
    return `rotate(${rotations[index % rotations.length] || 0}deg)`;
};

