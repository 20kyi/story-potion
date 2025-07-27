# Android APK 빌드 설정 가이드

## 필수 요구사항

1. **Java JDK** (버전 11 이상)
2. **Android Studio** 또는 **Android SDK**
3. **Node.js** 및 **npm**

## 각 컴퓨터별 설정

### 컴퓨터 A (현재: 82106)
- Java 경로: `C:\Program Files\Android\Android Studio\jbr`
- Android SDK: `C:\Users\82106\AppData\Local\Android\Sdk`

### 컴퓨터 B (다른 컴퓨터)
- Java 경로: [각자 확인 필요]
- Android SDK: `C:\Users\[사용자명]\AppData\Local\Android\Sdk`

## 환경 변수 설정 (권장)

### Windows 환경 변수 설정:
1. 시스템 환경 변수에서 `JAVA_HOME` 설정
2. 시스템 환경 변수에서 `ANDROID_HOME` 설정

### 또는 PowerShell에서 임시 설정:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
```

## 빌드 명령어

```bash
# 기본 APK 빌드
npm run build:apk

# Firebase 배포 포함
npm run build:apk:firebase

# 디버그 빌드만
npm run build:android

# 릴리즈 빌드
npm run build:android:release
```

## 문제 해결

### Java 경로를 찾을 수 없는 경우:
1. `where java` 명령어로 Java 설치 경로 확인
2. JAVA_HOME 환경 변수 설정
3. Android Studio 재설치

### Android SDK 경로를 찾을 수 없는 경우:
1. Android Studio에서 SDK Manager 확인
2. `local.properties` 파일의 `sdk.dir` 경로 수정
3. ANDROID_HOME 환경 변수 설정

## 파일 설명

- `scripts/build-and-share.js`: APK 빌드 스크립트
- `android/local.properties`: 로컬 SDK 경로 (gitignore됨)
- `scripts/build-config.json`: 빌드 설정 파일 