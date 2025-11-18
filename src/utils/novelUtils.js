// 장르를 영어 키로 변환
export const getGenreKey = (genre) => {
    const genreMap = {
        '로맨스': 'romance',
        '추리': 'mystery',
        '역사': 'historical',
        '동화': 'fairytale',
        '판타지': 'fantasy',
        '공포': 'horror'
    };
    return genreMap[genre] || null;
};

// 영어 키를 장르로 변환
export const getGenreFromKey = (genreKey) => {
    const reverseMap = {
        'romance': '로맨스',
        'mystery': '추리',
        'historical': '역사',
        'fairytale': '동화',
        'fantasy': '판타지',
        'horror': '공포'
    };
    return reverseMap[genreKey] || null;
};

// 소설 URL 생성 (year-month-weekNum-genre 형식)
export const createNovelUrl = (year, month, weekNum, genre) => {
    const genreKey = genre ? getGenreKey(genre) : null;
    if (genreKey) {
        return `${year}-${month}-${weekNum}-${genreKey}`;
    }
    // 장르가 없으면 기존 형식 (호환성)
    return `${year}-${month}-${weekNum}`;
};

// 소설 URL 파싱
export const parseNovelUrl = (urlId) => {
    if (!urlId) return null;
    
    const parts = urlId.split('-');
    
    // 기존 형식: year-month-weekNum (3개 파트)
    if (parts.length === 3 && parts.every(part => !isNaN(Number(part)))) {
        return {
            year: Number(parts[0]),
            month: Number(parts[1]),
            weekNum: Number(parts[2]),
            genre: null,
            genreKey: null
        };
    }
    
    // 새로운 형식: year-month-weekNum-genre (4개 파트)
    if (parts.length === 4) {
        const [year, month, weekNum, genreKey] = parts;
        if (!isNaN(Number(year)) && !isNaN(Number(month)) && !isNaN(Number(weekNum))) {
            return {
                year: Number(year),
                month: Number(month),
                weekNum: Number(weekNum),
                genre: getGenreFromKey(genreKey),
                genreKey: genreKey
            };
        }
    }
    
    return null;
};

