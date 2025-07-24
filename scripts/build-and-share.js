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