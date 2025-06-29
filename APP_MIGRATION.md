# 앱 전환 가이드

## 개요
현재 웹 애플리케이션을 React Native 앱으로 전환하기 위한 준비 작업이 완료되었습니다.

## 주요 변경사항

### 1. 저장소 추상화 (`src/utils/storage.js`)
- 웹: `localStorage` 사용
- 앱: `AsyncStorage` 사용 (주석 처리됨)
- 환경에 따라 자동으로 적절한 저장소 선택

### 2. 앱 설정 관리 (`src/utils/appConfig.js`)
- 환경별 설정 관리
- 저장소 키 표준화
- 데이터 마이그레이션 도구

### 3. 알림 시스템
- 웹: 브라우저 알림
- 앱: 푸시 알림 (구현 예정)

## 앱 전환 시 필요한 작업

### 1. React Native 프로젝트 설정
```bash
# React Native 프로젝트 생성
npx react-native init StoryPotionApp

# 필요한 패키지 설치
npm install @react-native-async-storage/async-storage
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install react-native-push-notification
```

### 2. 저장소 매니저 활성화
`src/utils/storage.js`에서 주석 처리된 AsyncStorage 코드를 활성화:

```javascript
// React Native 환경 감지
this.isApp = typeof global !== 'undefined' && global.HermesInternal;

// AsyncStorage 사용
const AsyncStorage = require('@react-native-async-storage/async-storage');
```

### 3. 푸시 알림 설정
- Firebase Cloud Messaging 설정
- 알림 권한 요청
- 백그라운드 알림 처리

### 4. 네비게이션 변경
- React Router → React Navigation
- 웹 라우팅 → 앱 네비게이션

### 5. UI 컴포넌트 변경
- HTML/CSS → React Native Components
- 웹 스타일 → 앱 스타일

## 데이터 마이그레이션

### 웹 → 앱
1. 웹에서 데이터 내보내기
2. 앱에서 데이터 가져오기
3. `migrateData` 함수 사용

### 앱 → 웹
1. 앱에서 데이터 내보내기
2. 웹에서 데이터 가져오기
3. 동일한 저장소 키 사용

## 현재 상태
- ✅ 저장소 추상화 완료
- ✅ 설정 관리 시스템 구축
- ✅ 알림 시스템 기반 구축
- ⏳ React Native 프로젝트 설정 (예정)
- ⏳ 푸시 알림 구현 (예정)
- ⏳ UI 컴포넌트 변환 (예정)

## 테스트 방법
현재 웹 버전에서 모든 기능이 정상 작동하는지 확인:
1. 알림 설정 저장/불러오기
2. 일기 작성 리마인더
3. 테마 변경
4. 사용자 설정 저장

모든 기능이 정상 작동하면 앱 전환 준비가 완료된 것입니다. 