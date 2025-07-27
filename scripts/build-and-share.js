const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 APK 빌드 및 배포 시작...\n');

try {
    // 1. 웹 앱 빌드
    console.log('📦 웹 앱 빌드 중...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Capacitor 동기화
    console.log('🔄 Capacitor 동기화 중...');
    execSync('npx cap sync android', { stdio: 'inherit' });

    // 3. Android APK 빌드
    console.log('🤖 Android APK 빌드 중...');
    
    // JAVA_HOME 설정 - 환경 변수 우선, 없으면 자동 탐지
    let javaHome = process.env.JAVA_HOME;
    
    // 잘못된 경로가 설정되어 있으면 초기화
    if (javaHome && javaHome.includes('jdk-11.0.28.6-hotspot\\jdk-11.0.28.6-hotspot')) {
        console.log('⚠️  잘못된 JAVA_HOME 경로 감지, 자동 탐지로 재설정합니다...');
        javaHome = null;
    }
    
    if (!javaHome) {
        console.log('🔍 JAVA_HOME 환경 변수가 설정되지 않았습니다. 자동으로 탐지합니다...');
        
        // 일반적인 Java 설치 경로들 시도
        const possiblePaths = [
            // Android Studio JDK 경로들
            'C:\\Program Files\\Android\\Android Studio\\jbr',
            'C:\\Program Files\\Android\\Android Studio\\jre',
            // 다른 일반적인 Java 경로들
            'C:\\Program Files\\Eclipse Adoptium\\jdk-11.0.28.6-hotspot',
            'C:\\Program Files\\Java\\jdk-11',
            'C:\\Program Files\\Java\\jdk-17',
            'C:\\Program Files\\Java\\jdk-21',
            // 사용자별 경로 (현재 사용자)
            `${process.env.USERPROFILE}\\AppData\\Local\\Android\\Sdk\\jbr`,
            `${process.env.USERPROFILE}\\AppData\\Local\\Android\\Sdk\\jre`
        ];
        
        for (const path of possiblePaths) {
            if (require('fs').existsSync(path)) {
                javaHome = path;
                console.log(`✅ Java 경로 발견: ${path}`);
                break;
            }
        }
        
        if (!javaHome) {
            console.log('❌ Java 설치 경로를 찾을 수 없습니다.');
            console.log('💡 해결 방법:');
            console.log('   1. JAVA_HOME 환경 변수를 설정하세요');
            console.log('   2. Android Studio 또는 JDK를 설치하세요');
            console.log('   3. 또는 다음 명령어로 Java 경로를 확인하세요: where java');
            process.exit(1);
        }
    }
    
    process.env.JAVA_HOME = javaHome;
    process.env.PATH = `${javaHome}\\bin;${process.env.PATH}`;
    console.log(`🔧 JAVA_HOME 설정: ${javaHome}`);
    
    execSync('cd android && gradlew.bat assembleDebug', { stdio: 'inherit' });

    // 4. APK 파일 경로 확인
    const apkPath = path.join(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');

    if (fs.existsSync(apkPath)) {
        const stats = fs.statSync(apkPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('\n✅ APK 빌드 완료!');
        console.log(`📱 파일 경로: ${apkPath}`);
        console.log(`📊 파일 크기: ${fileSizeInMB} MB`);

        // 5. Firebase App Distribution으로 배포 (선택사항)
        const deployToFirebase = process.argv.includes('--firebase');
        if (deployToFirebase) {
            console.log('\n🔥 Firebase App Distribution으로 배포 중...');
            execSync(`firebase appdistribution:distribute "${apkPath}" --app 1:607033226027:android:0090a554ad21bf47370b6e --groups testers --release-notes "새로운 버전 업데이트"`, { stdio: 'inherit' });
        }

        console.log('\n📋 다음 단계:');
        console.log('1. APK 파일을 테스터들에게 직접 전송');
        console.log('2. Google Drive나 Dropbox에 업로드 후 링크 공유');
        console.log('3. Firebase App Distribution 사용 (--firebase 옵션 추가)');
        console.log('4. GitHub Releases에 업로드');

    } else {
        console.error('❌ APK 파일을 찾을 수 없습니다.');
        process.exit(1);
    }

} catch (error) {
    console.error('❌ 빌드 중 오류 발생:', error.message);
    process.exit(1);
} 