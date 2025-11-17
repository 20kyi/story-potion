const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 플레이스토어 배포용 AAB 빌드 시작...\n');

try {
    // 0. 버전 자동 증가
    console.log('🔢 버전 자동 증가 중...');
    execSync('node scripts/increment-version.js', { stdio: 'inherit' });
    console.log('');

    // 1. 웹 앱 빌드
    console.log('📦 웹 앱 빌드 중...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Capacitor 동기화
    console.log('🔄 Capacitor 동기화 중...');
    execSync('npx cap sync android', { stdio: 'inherit' });

    // 3. 키스토어 확인
    const keystorePath = path.join(__dirname, '../android/app/story-potion-release-key.keystore');
    if (!fs.existsSync(keystorePath)) {
        console.log('❌ 키스토어가 존재하지 않습니다.');
        console.log('💡 먼저 키스토어를 생성하세요: node scripts/generate-keystore.js');
        process.exit(1);
    }

    // 4. Java 환경 설정
    let javaHome = process.env.JAVA_HOME;
    if (!javaHome) {
        console.log('🔍 JAVA_HOME 환경 변수가 설정되지 않았습니다. 자동으로 탐지합니다...');

        const possiblePaths = [
            'C:\\Program Files\\Android\\Android Studio\\jbr',
            'C:\\Program Files\\Android\\Android Studio\\jre',
            'C:\\Program Files\\Java\\jdk-17',
            'C:\\Program Files\\Eclipse Adoptium\\jdk-17',
            'C:\\Program Files\\Microsoft\\jdk-17',
            'C:\\Program Files\\Java\\jdk-11',
            `${process.env.USERPROFILE}\\AppData\\Local\\Android\\Sdk\\jbr`
        ];

        for (const path of possiblePaths) {
            if (fs.existsSync(path)) {
                javaHome = path;
                console.log(`✅ Java 경로 발견: ${path}`);
                break;
            }
        }

        if (!javaHome) {
            console.log('❌ Java 설치 경로를 찾을 수 없습니다.');
            process.exit(1);
        }
    }

    process.env.JAVA_HOME = javaHome;
    process.env.PATH = `${javaHome}\\bin;${process.env.PATH}`;
    console.log(`🔧 JAVA_HOME 설정: ${javaHome}`);

    // 5. AAB 빌드 실행
    console.log('🤖 Android App Bundle (AAB) 빌드 중...');
    execSync('cd android && gradlew.bat bundleRelease', { stdio: 'inherit' });

    // 6. AAB 파일 경로 확인
    const aabPath = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');

    if (fs.existsSync(aabPath)) {
        const stats = fs.statSync(aabPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('\n✅ AAB 빌드 완료!');
        console.log(`📱 파일 경로: ${aabPath}`);
        console.log(`📊 파일 크기: ${fileSizeInMB} MB`);
        console.log('\n🎉 플레이스토어에 업로드할 준비가 완료되었습니다!');
        console.log('\n📋 다음 단계:');
        console.log('   1. Google Play Console에 로그인');
        console.log('   2. 새 앱 생성 또는 기존 앱 선택');
        console.log('   3. "프로덕션" 트랙에서 "새 버전 만들기"');
        console.log('   4. 위의 AAB 파일을 업로드');
        console.log('   5. 앱 정보, 스크린샷, 설명 등 입력');
        console.log('   6. "검토 후 출시" 클릭');

    } else {
        console.log('❌ AAB 파일을 찾을 수 없습니다.');
        process.exit(1);
    }

} catch (error) {
    console.error('❌ AAB 빌드 실패:', error.message);
    process.exit(1);
}
