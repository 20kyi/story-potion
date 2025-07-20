# 🔧 Firebase 사용자 데이터 마이그레이션 가이드

## 📋 개요
이 가이드는 Firebase Firestore에 사용자 데이터를 일괄 저장하고 관리하는 방법을 설명합니다.

## 🚀 빠른 시작

### 1. 관리자 페이지 접속
브라우저에서 다음 URL로 접속하세요:
```
http://localhost:3000/admin/users
```

### 2. 샘플 사용자 생성
1. **"샘플 사용자 생성"** 섹션에서 생성할 사용자 수를 입력
2. **"샘플 사용자 생성"** 버튼 클릭
3. 확인 메시지에서 **"확인"** 클릭

### 3. 생성되는 사용자 데이터 구조
```javascript
{
  uid: "sample_user_1",
  displayName: "김철수",
  email: "user1@example.com",
  photoURL: "",
  point: 450, // 100-1100 사이 랜덤
  createdAt: Timestamp,
  fcmToken: "",
  reminderEnabled: true, // 50% 확률
  reminderTime: "21:00",
  eventEnabled: true, // 70% 확률
  marketingEnabled: true, // 60% 확률
  lastLoginAt: Timestamp,
  isActive: true
}
```

## 🔍 사용자 검색 및 관리

### 조건부 검색
- **필드 선택**: 닉네임, 이메일, 포인트, 알림 활성화, 활성 상태
- **연산자**: 같음, 다름, 보다 큼, 보다 크거나 같음, 보다 작음, 보다 작거나 같음
- **검색 값**: 찾고자 하는 값 입력

### 빠른 액션
- **샘플 10명 생성**: 10명의 샘플 사용자 즉시 생성
- **활성 사용자만**: 활성 상태인 사용자만 조회
- **고포인트 사용자**: 포인트 500 이상인 사용자 조회

## 📊 데이터 관리 기능

### 일괄 업데이트
- **포인트 일괄 설정**: 모든 사용자의 포인트를 1000으로 설정
- **사용자 정보 업데이트**: 개별 사용자 정보 수정

### 포인트 히스토리
- 사용자 생성 시 자동으로 초기 포인트 적립 내역 생성
- 포인트 사용/적립 내역 추적

## 🛠️ 프로그래밍 방식 사용

### 유틸리티 함수 직접 사용
```javascript
import { 
  generateSampleUsers, 
  batchSaveUsers, 
  getExistingUsers,
  getUsersByCondition 
} from './src/utils/userMigration';

// 샘플 사용자 20명 생성
const sampleUsers = generateSampleUsers(20);
const result = await batchSaveUsers(sampleUsers);
console.log(`성공: ${result.success}명, 실패: ${result.failed}명`);

// 포인트 500 이상인 사용자 조회
const highPointUsers = await getUsersByCondition('point', '>=', 500);
console.log(`고포인트 사용자: ${highPointUsers.length}명`);

// 모든 사용자 조회
const allUsers = await getExistingUsers();
console.log(`전체 사용자: ${allUsers.length}명`);
```

### 조건부 검색 예시
```javascript
// 알림이 활성화된 사용자
const notificationUsers = await getUsersByCondition('reminderEnabled', '==', true);

// 특정 이메일 사용자
const specificUser = await getUsersByCondition('email', '==', 'user@example.com');

// 포인트가 1000 미만인 사용자
const lowPointUsers = await getUsersByCondition('point', '<', 1000);
```

## 🔐 보안 주의사항

### ⚠️ 중요 사항
1. **개발/테스트 목적으로만 사용**: 프로덕션 환경에서는 관리자 권한 확인 필요
2. **데이터 백업**: 대량 데이터 삭제/수정 전 반드시 백업
3. **Firebase 요청 제한**: 너무 많은 요청을 빠르게 보내지 않도록 주의
4. **사용자 개인정보**: 실제 사용자 데이터 사용 시 개인정보 보호법 준수

### 권장사항
- 테스트 환경에서 먼저 실행
- 소량의 데이터로 테스트 후 대량 처리
- Firebase 콘솔에서 실시간 모니터링
- 에러 로그 확인 및 대응

## 📈 성능 최적화

### 배치 처리
- 한 번에 너무 많은 사용자를 생성하지 않음 (권장: 50명 이하)
- Firebase 요청 제한을 피하기 위한 지연 시간 포함
- 에러 발생 시 재시도 로직 구현

### 메모리 관리
- 대량 데이터 처리 시 메모리 사용량 모니터링
- 불필요한 데이터는 즉시 정리

## 🐛 문제 해결

### 일반적인 오류
1. **권한 오류**: Firebase 보안 규칙 확인
2. **네트워크 오류**: 인터넷 연결 상태 확인
3. **데이터 형식 오류**: 필드 타입 및 값 검증

### 디버깅 팁
- 브라우저 개발자 도구 콘솔 확인
- Firebase 콘솔에서 실시간 데이터베이스 모니터링
- 네트워크 탭에서 요청/응답 확인

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우:
1. 콘솔 에러 메시지 확인
2. Firebase 콘솔에서 데이터베이스 상태 확인
3. 개발팀에 문의

---

**⚠️ 주의**: 이 도구는 개발 및 테스트 목적으로만 사용하세요. 프로덕션 환경에서는 적절한 권한 관리와 보안 조치를 취하세요. 