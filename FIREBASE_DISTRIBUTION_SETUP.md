# Firebase App Distribution 설정 가이드

## 1. Firebase Console에서 설정

### 1.1 App Distribution 활성화
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 "App Distribution" 클릭
4. "시작하기" 버튼 클릭

### 1.2 Android 앱 등록
1. "Android 앱 추가" 클릭
2. 패키지 이름 입력: `com.example.storypotion`
3. 앱 등록 후 앱 ID 복사 (예: `1:123456789:android:abcdef`)

### 1.3 테스터 그룹 생성
1. "테스터" 탭 클릭
2. "그룹 추가" 클릭
3. 그룹 이름: `testers`
4. 테스터 이메일 추가

## 2. Firebase CLI 설정

### 2.1 Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 2.2 Firebase 로그인
```bash
firebase login
```

### 2.3 프로젝트 초기화
```bash
firebase init
# App Distribution 선택
```

## 3. 환경 변수 설정

### 3.1 GitHub Secrets 설정 (GitHub Actions 사용 시)
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 시크릿 추가:
   - `FIREBASE_APP_ID`: Firebase 앱 ID
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase 서비스 계정 키 (JSON)

### 3.2 로컬 환경 변수 설정
```bash
# .env 파일 생성
FIREBASE_APP_ID=1:123456789:android:abcdef
```

## 4. 사용 방법

### 4.1 로컬에서 배포
```bash
# 일반 빌드
npm run build:apk

# Firebase App Distribution으로 배포
npm run build:apk:firebase
```

### 4.2 GitHub Actions 자동 배포
- `main` 브랜치에 푸시하면 자동으로 배포됩니다.

## 5. 테스터 설치 방법

### 5.1 Firebase App Distribution 앱 설치
1. 테스터가 [Firebase App Distribution 앱](https://play.google.com/store/apps/details?id=com.google.firebase.appdistribution) 설치
2. Firebase Console에서 받은 초대 이메일 클릭
3. 앱 다운로드 및 설치

### 5.2 수동 APK 설치
1. 개발자가 APK 파일 공유
2. 테스터가 "알 수 없는 소스" 설치 허용
3. APK 파일 실행하여 설치

## 6. 문제 해결

### 6.1 빌드 오류
```bash
# Android SDK 경로 확인
echo $ANDROID_HOME

# Gradle 캐시 정리
cd android && ./gradlew clean
```

### 6.2 배포 오류
```bash
# Firebase CLI 재로그인
firebase logout
firebase login

# 프로젝트 재설정
firebase use --add
```

## 7. 추가 팁

### 7.1 릴리즈 노트 자동화
- 커밋 메시지를 릴리즈 노트로 사용
- GitHub Issues와 연동하여 변경사항 자동 추적

### 7.2 테스터 관리
- Google Groups와 연동하여 테스터 그룹 관리
- Slack/Discord 봇과 연동하여 알림 자동화 