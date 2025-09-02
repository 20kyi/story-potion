# 구글 플레이스토어 배포 가이드

## 📋 사전 준비사항

### 1. Google Play Console 계정
- [Google Play Console](https://play.google.com/console)에 로그인
- 개발자 계정 등록 (25달러 일회성 등록비)
- 앱 서명 키 관리 권한

### 2. 앱 정보 준비
- 앱 이름: "Story Potion"
- 앱 설명 (한국어/영어)
- 스크린샷 (최소 2장, 최대 8장)
- 앱 아이콘 (512x512 PNG)
- 기능 그래픽 (선택사항)
- 개인정보처리방침 URL

## 🚀 배포 단계

### 1단계: 키스토어 생성
```bash
npm run generate:keystore
```

### 2단계: AAB 빌드
```bash
npm run build:playstore
```

### 3단계: Google Play Console 설정

#### 3.1 새 앱 생성
1. Google Play Console 로그인
2. "앱 만들기" 클릭
3. 앱 이름: "Story Potion"
4. 기본 언어: 한국어
5. 앱 또는 게임: 앱
6. 무료 또는 유료: 무료
7. "앱 만들기" 클릭

#### 3.2 앱 정보 입력
1. **앱 액세스 권한**
   - 앱을 테스트할 수 있는 사용자: 내부 테스트
   - 테스터 이메일 주소 추가

2. **앱 정보**
   - 앱 이름: Story Potion
   - 간단한 설명: AI 기반 스토리 생성 앱
   - 전체 설명: 
     ```
     Story Potion은 AI를 활용한 창작 도구입니다.
     
     주요 기능:
     • AI 기반 스토리 생성
     • 일기 작성 및 관리
     • 감정 분석 및 추천
     • 커뮤니티 기능
     
     창작의 영감을 찾고 계신다면 Story Potion과 함께하세요!
     ```

3. **그래픽 자산**
   - 앱 아이콘: 512x512 PNG
   - 스크린샷: 최소 2장 (1080x1920 권장)
   - 기능 그래픽: 선택사항

4. **분류**
   - 앱 카테고리: 도구
   - 태그: 창작, AI, 스토리, 일기

5. **콘텐츠 등급**
   - 모든 연령대

6. **개인정보처리방침**
   - 개인정보처리방침 URL 입력

### 4단계: AAB 업로드

#### 4.1 내부 테스트 트랙
1. 왼쪽 메뉴에서 "테스트" → "내부 테스트" 선택
2. "새 버전 만들기" 클릭
3. AAB 파일 업로드 (android/app/build/outputs/bundle/release/app-release.aab)
4. 릴리즈 노트 작성
5. "저장" 클릭

#### 4.2 테스터 추가
1. "테스터 관리" 탭
2. 테스터 이메일 주소 추가
3. "저장" 클릭

### 5단계: 결제 기능 테스트

#### 5.1 테스트 계정 설정
1. Google Play Console → "설정" → "라이선스 테스트"
2. 테스트 계정 이메일 추가
3. 테스트용 결제 카드 설정

#### 5.2 인앱 결제 테스트
1. 테스트 기기에서 앱 설치
2. 결제 기능 테스트
3. 테스트 결제 진행
4. 환불 테스트 (필요시)

## 🔧 문제 해결

### 빌드 오류
```bash
# Java 환경 확인
java -version

# JAVA_HOME 설정
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr

# Gradle 캐시 정리
cd android
gradlew clean
```

### 서명 오류
```bash
# 키스토어 재생성
rm android/app/story-potion-release-key.keystore
npm run generate:keystore
```

### 업로드 오류
- AAB 파일 크기 확인 (150MB 이하)
- 앱 버전 코드 증가
- 서명 키 일치 확인

## 📱 테스트 체크리스트

- [ ] 앱 설치 및 실행
- [ ] 로그인/회원가입
- [ ] 주요 기능 동작
- [ ] 결제 기능 테스트
- [ ] 푸시 알림
- [ ] 오프라인 동작
- [ ] 다양한 화면 크기 대응
- [ ] 성능 테스트

## 🎯 다음 단계

1. **내부 테스트 완료 후**
   - 클로즈드 테스트 (베타 테스트)
   - 오픈 테스트 (공개 베타)

2. **프로덕션 출시**
   - 모든 테스트 완료 후
   - 앱 검토 승인 대기
   - 출시 일정 설정

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. [Google Play Console 도움말](https://support.google.com/googleplay/android-developer)
2. [Android 개발자 문서](https://developer.android.com/guide/app-bundle)
3. 프로젝트 이슈 트래커

---

**⚠️ 중요**: 키스토어 파일과 비밀번호를 안전한 곳에 백업하세요. 키스토어를 잃어버리면 앱 업데이트가 불가능합니다!
