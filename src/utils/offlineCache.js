// 오프라인 캐시 관리 유틸리티

const CACHE_PREFIX = 'storypotion_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24시간

/**
 * 캐시 키 생성
 * @param {string} collection - 컬렉션 이름
 * @param {string} userId - 사용자 ID
 * @param {string} queryType - 쿼리 타입
 * @returns {string} 캐시 키
 */
export const generateCacheKey = (collection, userId, queryType) => {
    return `${CACHE_PREFIX}${collection}_${userId}_${queryType}`;
};

/**
 * 데이터를 캐시에 저장
 * @param {string} key - 캐시 키
 * @param {any} data - 저장할 데이터
 */
export const setCacheData = (key, data) => {
    try {
        const cacheData = {
            data,
            timestamp: Date.now(),
            expiry: Date.now() + CACHE_EXPIRY
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.error('캐시 저장 실패:', error);
    }
};

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {any|null} 캐시된 데이터 또는 null
 */
export const getCacheData = (key) => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const cacheData = JSON.parse(cached);

        // 캐시 만료 확인
        if (Date.now() > cacheData.expiry) {
            localStorage.removeItem(key);
            return null;
        }

        return cacheData.data;
    } catch (error) {
        console.error('캐시 조회 실패:', error);
        return null;
    }
};

/**
 * 캐시 삭제
 * @param {string} key - 캐시 키
 */
export const removeCacheData = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('캐시 삭제 실패:', error);
    }
};

/**
 * 사용자 관련 모든 캐시 삭제
 * @param {string} userId - 사용자 ID
 */
export const clearUserCache = (userId) => {
    try {
        const keys = Object.keys(localStorage);
        const userCacheKeys = keys.filter(key =>
            key.startsWith(CACHE_PREFIX) && key.includes(userId)
        );

        userCacheKeys.forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('사용자 캐시 삭제 실패:', error);
    }
};

/**
 * 모든 캐시 삭제
 */
export const clearAllCache = () => {
    try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

        cacheKeys.forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('전체 캐시 삭제 실패:', error);
    }
};

/**
 * 캐시 상태 확인
 * @returns {Object} 캐시 통계 정보
 */
export const getCacheStats = () => {
    try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

        const stats = {
            totalKeys: cacheKeys.length,
            totalSize: 0,
            expiredKeys: 0
        };

        cacheKeys.forEach(key => {
            const cached = localStorage.getItem(key);
            if (cached) {
                stats.totalSize += cached.length;

                try {
                    const cacheData = JSON.parse(cached);
                    if (Date.now() > cacheData.expiry) {
                        stats.expiredKeys++;
                    }
                } catch (e) {
                    stats.expiredKeys++;
                }
            }
        });

        return stats;
    } catch (error) {
        console.error('캐시 통계 조회 실패:', error);
        return { totalKeys: 0, totalSize: 0, expiredKeys: 0 };
    }
};

