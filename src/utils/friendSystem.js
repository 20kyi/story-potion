/**
 * 친구 찾기 시스템 유틸리티
 * 
 * 주요 기능:
 * - 사용자 검색 (닉네임, 이메일)
 * - 친구 요청 보내기/받기
 * - 친구 목록 관리
 * - 친구 상태 확인
 */

import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    addDoc,
    onSnapshot
} from 'firebase/firestore';
import {
    sendFriendRequestNotification,
    sendFriendRequestAcceptedNotification,
    sendFriendRemovedNotification
} from './friendNotification';

/**
 * 사용자 검색 (닉네임 또는 이메일로)
 * @param {string} searchTerm - 검색어
 * @param {string} currentUserId - 현재 사용자 ID (자신 제외)
 * @returns {Promise<Array>} 검색 결과
 */
export const searchUsers = async (searchTerm, currentUserId) => {
    try {
        if (!searchTerm || searchTerm.trim().length < 2) {
            return [];
        }

        const searchLower = searchTerm.toLowerCase().trim();
        const usersRef = collection(db, 'users');

        // 닉네임으로 검색
        const nameQuery = query(
            usersRef,
            where('displayName', '>=', searchLower),
            where('displayName', '<=', searchLower + '\uf8ff'),
            limit(10)
        );

        // 이메일로 검색
        const emailQuery = query(
            usersRef,
            where('email', '>=', searchLower),
            where('email', '<=', searchLower + '\uf8ff'),
            limit(10)
        );

        const [nameSnapshot, emailSnapshot] = await Promise.all([
            getDocs(nameQuery),
            getDocs(emailQuery)
        ]);

        const users = new Map(); // 중복 제거를 위해 Map 사용

        // 닉네임 검색 결과 처리
        nameSnapshot.forEach(doc => {
            const userData = { uid: doc.id, ...doc.data() };
            if (userData.uid !== currentUserId) {
                users.set(userData.uid, userData);
            }
        });

        // 이메일 검색 결과 처리
        emailSnapshot.forEach(doc => {
            const userData = { uid: doc.id, ...doc.data() };
            if (userData.uid !== currentUserId) {
                users.set(userData.uid, userData);
            }
        });

        return Array.from(users.values());
    } catch (error) {
        console.error('사용자 검색 실패:', error);
        return [];
    }
};

/**
 * 친구 요청 보내기
 * @param {string} fromUserId - 요청을 보내는 사용자 ID
 * @param {string} toUserId - 요청을 받는 사용자 ID
 * @returns {Promise<Object>} 요청 결과
 */
export const sendFriendRequest = async (fromUserId, toUserId) => {
    try {
        // 이미 친구인지 확인
        const isFriend = await checkFriendship(fromUserId, toUserId);
        if (isFriend) {
            return { success: false, error: '이미 친구입니다.' };
        }

        // 기존 친구 요청 확인 (pending 상태만 체크)
        const existingRequest = await getFriendRequest(fromUserId, toUserId);
        if (existingRequest && existingRequest.status === 'pending') {
            return { success: false, error: '이미 친구 요청을 보냈습니다.' };
        }

        // 거절된 요청이 있다면 삭제하고 새로 생성
        if (existingRequest && existingRequest.status === 'rejected') {
            await deleteDoc(doc(db, 'friendRequests', existingRequest.id));
        }

        // 친구 요청 생성
        const requestData = {
            fromUserId,
            toUserId,
            status: 'pending', // pending, accepted, rejected
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await addDoc(collection(db, 'friendRequests'), requestData);

        // 친구 요청 알림 보내기
        await sendFriendRequestNotification(fromUserId, toUserId);

        return { success: true, message: '친구 요청을 보냈습니다.' };
    } catch (error) {
        console.error('친구 요청 보내기 실패:', error);
        return { success: false, error: '친구 요청 전송에 실패했습니다.' };
    }
};

/**
 * 친구 요청 조회 (양방향 확인)
 * @param {string} fromUserId - 요청을 보낸 사용자 ID
 * @param {string} toUserId - 요청을 받은 사용자 ID
 * @returns {Promise<Object|null>} 친구 요청 정보
 */
export const getFriendRequest = async (fromUserId, toUserId) => {
    try {
        const requestsRef = collection(db, 'friendRequests');
        
        // 양방향 요청 확인 (A→B, B→A 모두 체크)
        const q1 = query(
            requestsRef,
            where('fromUserId', '==', fromUserId),
            where('toUserId', '==', toUserId)
        );
        const q2 = query(
            requestsRef,
            where('fromUserId', '==', toUserId),
            where('toUserId', '==', fromUserId)
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        // 첫 번째 방향의 요청이 있으면 반환
        if (!snapshot1.empty) {
            const doc = snapshot1.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        
        // 두 번째 방향의 요청이 있으면 반환
        if (!snapshot2.empty) {
            const doc = snapshot2.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        
        return null;
    } catch (error) {
        console.error('친구 요청 조회 실패:', error);
        return null;
    }
};

/**
 * 친구 요청 수락
 * @param {string} requestId - 친구 요청 ID
 * @param {string} fromUserId - 요청을 보낸 사용자 ID
 * @param {string} toUserId - 요청을 받은 사용자 ID
 * @returns {Promise<Object>} 수락 결과
 */
export const acceptFriendRequest = async (requestId, fromUserId, toUserId) => {
    console.log('acceptFriendRequest 호출:', requestId, fromUserId, toUserId);
    try {
        // 친구 관계 생성
        await createFriendship(fromUserId, toUserId);

        // 두 사용자 간의 모든 친구 요청 삭제 (수락된 요청 포함)
        const requestsRef = collection(db, 'friendRequests');
        const q1 = query(
            requestsRef,
            where('fromUserId', '==', fromUserId),
            where('toUserId', '==', toUserId)
        );
        const q2 = query(
            requestsRef,
            where('fromUserId', '==', toUserId),
            where('toUserId', '==', fromUserId)
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        // 모든 관련 요청 삭제
        const deletePromises = [];
        snapshot1.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
        snapshot2.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
        
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
        }

        // 친구 요청 수락 알림 보내기
        await sendFriendRequestAcceptedNotification(toUserId, fromUserId);

        return { success: true, message: '친구 요청을 수락했습니다.' };
    } catch (error) {
        console.error('친구 요청 수락 실패:', error);
        return { success: false, error: '친구 요청 수락에 실패했습니다.' };
    }
};

/**
 * 친구 요청 거절
 * @param {string} requestId - 친구 요청 ID
 * @returns {Promise<Object>} 거절 결과
 */
export const rejectFriendRequest = async (requestId) => {
    try {
        const requestRef = doc(db, 'friendRequests', requestId);
        await deleteDoc(requestRef); // 거절된 요청은 완전히 삭제

        return { success: true, message: '친구 요청을 거절했습니다.' };
    } catch (error) {
        console.error('친구 요청 거절 실패:', error);
        return { success: false, error: '친구 요청 거절에 실패했습니다.' };
    }
};

/**
 * 친구 요청 취소 (보낸 요청)
 * @param {string} requestId - 요청 ID
 * @returns {Promise<Object>} 취소 결과
 */
export const cancelFriendRequest = async (requestId) => {
    try {
        const requestRef = doc(db, 'friendRequests', requestId);
        await deleteDoc(requestRef);

        return { success: true, message: '친구 요청을 취소했습니다.' };
    } catch (error) {
        console.error('친구 요청 취소 실패:', error);
        return { success: false, error: '친구 요청 취소에 실패했습니다.' };
    }
};

/**
 * 친구 관계 생성
 * @param {string} userId1 - 사용자 1 ID
 * @param {string} userId2 - 사용자 2 ID
 * @returns {Promise<boolean>} 생성 성공 여부
 */
export const createFriendship = async (userId1, userId2) => {
    try {
        const friendshipData = {
            users: [userId1, userId2].sort(), // 정렬하여 일관성 유지
            createdAt: Timestamp.now()
        };

        // 친구 관계 문서 생성 (정렬된 ID로 문서 ID 생성)
        const friendshipId = `${userId1}_${userId2}`.split('_').sort().join('_');
        console.log('friendships 문서 생성 시도:', friendshipId, friendshipData);
        await setDoc(doc(db, 'friendships', friendshipId), friendshipData);
        console.log('friendships 문서 생성 성공:', friendshipId);
        return true;
    } catch (error) {
        console.error('친구 관계 생성 실패:', error);
        return false;
    }
};

/**
 * 친구 관계 확인
 * @param {string} userId1 - 사용자 1 ID
 * @param {string} userId2 - 사용자 2 ID
 * @returns {Promise<boolean>} 친구 여부
 */
export const checkFriendship = async (userId1, userId2) => {
    try {
        const friendshipId = `${userId1}_${userId2}`.split('_').sort().join('_');
        const friendshipRef = doc(db, 'friendships', friendshipId);
        const friendshipSnap = await getDoc(friendshipRef);

        return friendshipSnap.exists();
    } catch (error) {
        console.error('친구 관계 확인 실패:', error);
        return false;
    }
};

/**
 * 친구 목록 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 친구 목록
 */
export const getFriendsList = async (userId) => {
    try {
        const friendshipsRef = collection(db, 'friendships');
        const q = query(
            friendshipsRef,
            where('users', 'array-contains', userId)
        );

        const snapshot = await getDocs(q);
        console.log('friendships 쿼리 결과:', snapshot.docs.map(d => d.data()));
        const friends = [];

        for (const docSnap of snapshot.docs) {
            const friendship = docSnap.data();
            console.log('friendship.users:', friendship.users);
            const friendId = friendship.users.find(id => id !== userId);
            console.log('내가 아닌 친구 id:', friendId);

            if (friendId) {
                // 친구 정보 조회
                const friendRef = doc(db, 'users', friendId);
                const friendSnap = await getDoc(friendRef);

                if (friendSnap.exists()) {
                    friends.push({
                        id: docSnap.id,
                        user: {
                            uid: friendId,
                            ...friendSnap.data()
                        }
                    });
                }
            }
        }
        console.log('최종 friends 배열:', friends);
        return friends;
    } catch (error) {
        console.error('친구 목록 조회 실패:', error);
        return [];
    }
};

/**
 * 받은 친구 요청 목록 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 받은 친구 요청 목록
 */
export const getReceivedFriendRequests = async (userId) => {
    try {
        const requestsRef = collection(db, 'friendRequests');
        const q = query(
            requestsRef,
            where('toUserId', '==', userId),
            where('status', '==', 'pending')
            // orderBy('createdAt', 'desc') // 임시로 제거
        );

        const snapshot = await getDocs(q);
        const requests = [];

        for (const docSnap of snapshot.docs) {
            const request = { id: docSnap.id, ...docSnap.data() };

            // 요청을 보낸 사용자 정보 조회
            const fromUserRef = doc(db, 'users', request.fromUserId);
            const fromUserSnap = await getDoc(fromUserRef);

            if (fromUserSnap.exists()) {
                requests.push({
                    ...request,
                    fromUser: {
                        uid: request.fromUserId,
                        ...fromUserSnap.data()
                    }
                });
            }
        }

        // 클라이언트에서 정렬
        return requests.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());
    } catch (error) {
        console.error('받은 친구 요청 조회 실패:', error);
        return [];
    }
};

/**
 * 보낸 친구 요청 목록 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 보낸 친구 요청 목록
 */
export const getSentFriendRequests = async (userId) => {
    try {
        const requestsRef = collection(db, 'friendRequests');
        const q = query(
            requestsRef,
            where('fromUserId', '==', userId),
            where('status', '==', 'pending')
            // orderBy('createdAt', 'desc') // 임시로 제거
        );

        const snapshot = await getDocs(q);
        const requests = [];

        for (const docSnap of snapshot.docs) {
            const request = { id: docSnap.id, ...docSnap.data() };

            // 요청을 받은 사용자 정보 조회
            const toUserRef = doc(db, 'users', request.toUserId);
            const toUserSnap = await getDoc(toUserRef);

            if (toUserSnap.exists()) {
                requests.push({
                    ...request,
                    toUser: {
                        uid: request.toUserId,
                        ...toUserSnap.data()
                    }
                });
            }
        }

        // 클라이언트에서 정렬
        return requests.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());
    } catch (error) {
        console.error('보낸 친구 요청 조회 실패:', error);
        return [];
    }
};

/**
 * 친구 삭제
 * @param {string} friendshipId - 친구 관계 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const removeFriend = async (friendshipId) => {
    try {
        const friendshipRef = doc(db, 'friendships', friendshipId);
        const friendshipSnap = await getDoc(friendshipRef);
        
        if (!friendshipSnap.exists()) {
            return { success: false, error: '친구 관계를 찾을 수 없습니다.' };
        }

        const friendshipData = friendshipSnap.data();
        const users = friendshipData.users || [];
        
        await deleteDoc(friendshipRef);

        // 친구 관계 삭제 시 관련된 모든 친구 요청도 정리
        if (users.length >= 2) {
            const [user1, user2] = users;
            
            // 두 사용자 간의 모든 친구 요청 삭제
            const requestsRef = collection(db, 'friendRequests');
            const q1 = query(
                requestsRef,
                where('fromUserId', '==', user1),
                where('toUserId', '==', user2)
            );
            const q2 = query(
                requestsRef,
                where('fromUserId', '==', user2),
                where('toUserId', '==', user1)
            );

            const [snapshot1, snapshot2] = await Promise.all([
                getDocs(q1),
                getDocs(q2)
            ]);

            // 모든 관련 요청 삭제
            const deletePromises = [];
            snapshot1.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
            snapshot2.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
            
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
            }

            // 친구 삭제 알림 보내기 (두 사용자 모두에게)
            await sendFriendRemovedNotification(user1, user2);
        }

        return { success: true, message: '친구를 삭제했습니다.' };
    } catch (error) {
        console.error('친구 삭제 실패:', error);
        return { success: false, error: '친구 삭제에 실패했습니다.' };
    }
};

/**
 * 친구 요청 실시간 리스너
 * @param {string} userId - 사용자 ID
 * @param {Function} callback - 콜백 함수
 * @returns {Function} 구독 해제 함수
 */
export const subscribeToFriendRequests = (userId, callback) => {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
        requestsRef,
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        callback(requests);
    });
}; 