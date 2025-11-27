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

// 소설 URL 생성 (year-month-weekNum-genre-id 형식)
export const createNovelUrl = (year, month, weekNum, genre, id = null) => {
    const genreKey = genre ? getGenreKey(genre) : null;
    if (genreKey) {
        if (id) {
            return `${year}-${month}-${weekNum}-${genreKey}-${id}`;
        }
        return `${year}-${month}-${weekNum}-${genreKey}`;
    }
    // 장르가 없으면 기존 형식 (호환성)
    if (id) {
        return `${year}-${month}-${weekNum}-${id}`;
    }
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
            genreKey: null,
            id: null
        };
    }
    
    // 새로운 형식: year-month-weekNum-genre-id (5개 파트)
    if (parts.length === 5) {
        const [year, month, weekNum, genreKey, novelId] = parts;
        if (!isNaN(Number(year)) && !isNaN(Number(month)) && !isNaN(Number(weekNum))) {
            return {
                year: Number(year),
                month: Number(month),
                weekNum: Number(weekNum),
                genre: getGenreFromKey(genreKey),
                genreKey: genreKey,
                id: novelId
            };
        }
    }
    
    // 형식: year-month-weekNum-genre (4개 파트) - ID 없음
    // 또는 year-month-weekNum-id (4개 파트, 장르 없음)
    if (parts.length === 4) {
        const [year, month, weekNum, fourthPart] = parts;
        if (!isNaN(Number(year)) && !isNaN(Number(month)) && !isNaN(Number(weekNum))) {
            // 네 번째 파트가 장르 키인지 확인
            const genre = getGenreFromKey(fourthPart);
            if (genre) {
                // 장르 키인 경우
                return {
                    year: Number(year),
                    month: Number(month),
                    weekNum: Number(weekNum),
                    genre: genre,
                    genreKey: fourthPart,
                    id: null
                };
            } else {
                // 장르 키가 아니면 ID로 간주
                return {
                    year: Number(year),
                    month: Number(month),
                    weekNum: Number(weekNum),
                    genre: null,
                    genreKey: null,
                    id: fourthPart
                };
            }
        }
    }
    
    return null;
};

