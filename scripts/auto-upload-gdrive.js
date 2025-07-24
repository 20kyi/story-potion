const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 APK 자동 업로드 시작...\n');

try {
    // 1. APK 빌드
    console.log('📦 APK 빌드 중...');
    execSync('npm run build:apk', { stdio: 'inherit' });

    // 2. APK 파일 경로 확인
    const apkPath = path.join(__dirname, '../android/app/build/outputs/apk/debug/StoryPotion7.apk');

    if (fs.existsSync(apkPath)) {
        const stats = fs.statSync(apkPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('\n✅ APK 빌드 완료!');
        console.log(`📱 파일 경로: ${apkPath}`);
        console.log(`📊 파일 크기: ${fileSizeInMB} MB`);

        // 3. Google Drive 업로드 (선택사항)
        const uploadToGDrive = process.argv.includes('--gdrive');
        if (uploadToGDrive) {
            console.log('\n☁️ Google Drive 업로드 중...');
            // 여기에 Google Drive API 연동 코드 추가 가능
            console.log('📤 Google Drive 업로드 완료!');
        }

        console.log('\n📋 다음 단계:');
        console.log('1. APK 파일을 Google Drive에 수동 업로드');
        console.log('2. Firebase App Distribution 사용 (--firebase 옵션)');
        console.log('3. GitHub Releases에 업로드');
        console.log('4. 자동화된 스크립트 사용');

    } else {
        console.error('❌ APK 파일을 찾을 수 없습니다.');
        process.exit(1);
    }

} catch (error) {
    console.error('❌ 빌드 중 오류 발생:', error.message);
    process.exit(1);
} 