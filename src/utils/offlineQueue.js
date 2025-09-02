// 오프라인 작업 큐 관리

const QUEUE_KEY = 'storypotion_offline_queue';
const MAX_QUEUE_SIZE = 100;

/**
 * 작업 타입 정의
 */
export const QUEUE_OPERATIONS = {
    CREATE_DIARY: 'create_diary',
    UPDATE_DIARY: 'update_diary',
    DELETE_DIARY: 'delete_diary',
    CREATE_NOVEL: 'create_novel',
    UPDATE_USER: 'update_user',
    ADD_POINT_HISTORY: 'add_point_history'
};

/**
 * 큐에서 작업 가져오기
 */
export const getOfflineQueue = () => {
    try {
        const queue = localStorage.getItem(QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error('오프라인 큐 조회 실패:', error);
        return [];
    }
};

/**
 * 큐에 작업 추가
 */
export const addToOfflineQueue = (operation) => {
    try {
        const queue = getOfflineQueue();

        // 큐 크기 제한 확인
        if (queue.length >= MAX_QUEUE_SIZE) {
            console.warn('오프라인 큐가 가득 찼습니다. 가장 오래된 작업을 제거합니다.');
            queue.shift();
        }

        const queueItem = {
            id: Date.now() + Math.random(),
            operation,
            timestamp: Date.now(),
            retryCount: 0
        };

        queue.push(queueItem);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        console.log('오프라인 큐에 작업 추가됨:', queueItem);
        return queueItem.id;
    } catch (error) {
        console.error('오프라인 큐에 작업 추가 실패:', error);
        return null;
    }
};

/**
 * 큐에서 작업 제거
 */
export const removeFromOfflineQueue = (id) => {
    try {
        const queue = getOfflineQueue();
        const filteredQueue = queue.filter(item => item.id !== id);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));

        console.log('오프라인 큐에서 작업 제거됨:', id);
    } catch (error) {
        console.error('오프라인 큐에서 작업 제거 실패:', error);
    }
};

/**
 * 큐 비우기
 */
export const clearOfflineQueue = () => {
    try {
        localStorage.removeItem(QUEUE_KEY);
        console.log('오프라인 큐가 비워졌습니다.');
    } catch (error) {
        console.error('오프라인 큐 비우기 실패:', error);
    }
};

/**
 * 큐 상태 확인
 */
export const getQueueStats = () => {
    const queue = getOfflineQueue();
    return {
        totalItems: queue.length,
        oldestItem: queue.length > 0 ? new Date(queue[0].timestamp) : null,
        newestItem: queue.length > 0 ? new Date(queue[queue.length - 1].timestamp) : null
    };
};

/**
 * 네트워크 상태 모니터링 및 큐 처리
 */
export const setupOfflineQueueProcessor = (processFunction) => {
    const processQueue = async () => {
        const queue = getOfflineQueue();
        if (queue.length === 0) return;

        console.log(`오프라인 큐 처리 시작: ${queue.length}개 작업`);

        for (const item of queue) {
            try {
                await processFunction(item);
                removeFromOfflineQueue(item.id);
                console.log(`작업 처리 완료: ${item.id}`);
            } catch (error) {
                console.error(`작업 처리 실패: ${item.id}`, error);
                item.retryCount++;

                // 재시도 횟수 제한 (3회)
                if (item.retryCount >= 3) {
                    console.error(`작업 최대 재시도 횟수 초과: ${item.id}`);
                    removeFromOfflineQueue(item.id);
                }
            }
        }
    };

    // 온라인 상태 감지 시 큐 처리
    const handleOnline = () => {
        console.log('네트워크 연결 복구됨, 오프라인 큐 처리 시작');
        setTimeout(processQueue, 1000); // 1초 후 처리 시작
    };

    window.addEventListener('online', handleOnline);

    // 초기 상태 확인
    if (navigator.onLine) {
        processQueue();
    }

    return () => {
        window.removeEventListener('online', handleOnline);
    };
};

