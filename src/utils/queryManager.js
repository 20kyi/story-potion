// 쿼리 중복 등록 방지 유틸리티

class QueryManager {
    constructor() {
        this.activeQueries = new Map();
        this.queryCounters = new Map();
    }

    /**
     * 쿼리 키 생성
     */
    generateQueryKey(collection, constraints) {
        const constraintStr = constraints
            .map(c => `${c.type}-${c.field}-${c.operator}-${c.value}`)
            .join('|');
        return `${collection}:${constraintStr}`;
    }

    /**
     * 쿼리가 이미 활성화되어 있는지 확인
     */
    isQueryActive(queryKey) {
        return this.activeQueries.has(queryKey);
    }

    /**
     * 쿼리 등록
     */
    registerQuery(queryKey, unsubscribe) {
        if (this.isQueryActive(queryKey)) {
            console.warn(`쿼리가 이미 활성화되어 있습니다: ${queryKey}`);
            return false;
        }

        this.activeQueries.set(queryKey, unsubscribe);
        this.queryCounters.set(queryKey, (this.queryCounters.get(queryKey) || 0) + 1);
        console.log(`쿼리 등록됨: ${queryKey} (총 ${this.queryCounters.get(queryKey)}개)`);
        return true;
    }

    /**
     * 쿼리 해제
     */
    unregisterQuery(queryKey) {
        if (!this.isQueryActive(queryKey)) {
            console.warn(`등록되지 않은 쿼리를 해제하려고 합니다: ${queryKey}`);
            return false;
        }

        const unsubscribe = this.activeQueries.get(queryKey);
        if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
        }

        this.activeQueries.delete(queryKey);
        const count = (this.queryCounters.get(queryKey) || 1) - 1;

        if (count <= 0) {
            this.queryCounters.delete(queryKey);
        } else {
            this.queryCounters.set(queryKey, count);
        }

        console.log(`쿼리 해제됨: ${queryKey} (남은 ${count}개)`);
        return true;
    }

    /**
     * 모든 쿼리 해제
     */
    unregisterAllQueries() {
        const queryKeys = Array.from(this.activeQueries.keys());
        queryKeys.forEach(key => this.unregisterQuery(key));
        console.log('모든 쿼리가 해제되었습니다.');
    }

    /**
     * 활성 쿼리 목록 조회
     */
    getActiveQueries() {
        return Array.from(this.activeQueries.keys());
    }

    /**
     * 쿼리 통계 조회
     */
    getQueryStats() {
        return {
            activeQueries: this.activeQueries.size,
            totalRegistrations: Array.from(this.queryCounters.values()).reduce((sum, count) => sum + count, 0),
            queryDetails: Object.fromEntries(this.queryCounters)
        };
    }
}

// 싱글톤 인스턴스
const queryManager = new QueryManager();

export default queryManager;

/**
 * 쿼리 중복 방지 래퍼 함수
 */
export const withQueryProtection = (queryFn, queryKey) => {
    return async (...args) => {
        if (queryManager.isQueryActive(queryKey)) {
            console.warn(`중복 쿼리 방지: ${queryKey}`);
            return null;
        }

        try {
            const result = await queryFn(...args);
            return result;
        } catch (error) {
            console.error(`쿼리 실행 실패: ${queryKey}`, error);
            throw error;
        }
    };
};

/**
 * 컴포넌트 언마운트 시 쿼리 정리 훅
 */
export const useQueryCleanup = (queryKeys = []) => {
    React.useEffect(() => {
        return () => {
            queryKeys.forEach(key => {
                queryManager.unregisterQuery(key);
            });
        };
    }, [queryKeys]);
};
