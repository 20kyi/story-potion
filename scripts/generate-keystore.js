const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔑 키스토어 생성 시작...\n');

const keystorePath = path.join(__dirname, '../android/app/story-potion-release-key.keystore');

// 키스토어가 이미 존재하는지 확인
if (fs.existsSync(keystorePath)) {
    console.log('⚠️  키스토어가 이미 존재합니다.');
    console.log(`📁 경로: ${keystorePath}`);
    console.log('💡 기존 키스토어를 사용하거나 삭제 후 다시 생성하세요.');
    process.exit(0);
}

try {
    // keytool 명령어로 키스토어 생성
    const keytoolCommand = `keytool -genkey -v -keystore "${keystorePath}" -alias story-potion-key -keyalg RSA -keysize 2048 -validity 10000 -storepass storypotion123 -keypass storypotion123 -dname "CN=Story Potion, OU=Development, O=Story Potion, L=Seoul, S=Seoul, C=KR"`;
    
    console.log('🔧 키스토어 생성 중...');
    execSync(keytoolCommand, { stdio: 'inherit' });
    
    console.log('\n✅ 키스토어 생성 완료!');
    console.log(`📁 경로: ${keystorePath}`);
    console.log('🔑 키스토어 정보:');
    console.log('   - 파일명: story-potion-release-key.keystore');
    console.log('   - 키 별칭: story-potion-key');
    console.log('   - 유효기간: 10000일');
    console.log('   - 알고리즘: RSA 2048비트');
    console.log('\n⚠️  중요: 키스토어 파일과 비밀번호를 안전한 곳에 백업하세요!');
    
} catch (error) {
    console.error('❌ 키스토어 생성 실패:', error.message);
    console.log('\n💡 해결 방법:');
    console.log('   1. Java JDK가 설치되어 있는지 확인하세요');
    console.log('   2. JAVA_HOME 환경 변수가 설정되어 있는지 확인하세요');
    console.log('   3. keytool 명령어가 PATH에 있는지 확인하세요');
    process.exit(1);
}
