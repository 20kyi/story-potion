const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

try {
  // build.gradle 파일 읽기
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // versionCode 찾기 및 증가
  const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
  if (versionCodeMatch) {
    const currentVersionCode = parseInt(versionCodeMatch[1]);
    const newVersionCode = currentVersionCode + 1;
    content = content.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
    console.log(`✅ versionCode: ${currentVersionCode} → ${newVersionCode}`);
  } else {
    console.warn('⚠️  versionCode를 찾을 수 없습니다.');
  }
  
  // versionName을 항상 1.0.0으로 유지
  const versionNameMatch = content.match(/versionName\s+"([^"]+)"/);
  if (versionNameMatch) {
    const currentVersionName = versionNameMatch[1];
    const fixedVersionName = "1.0.0";
    
    // versionName이 1.0.0이 아닌 경우에만 변경
    if (currentVersionName !== fixedVersionName) {
      content = content.replace(/versionName\s+"[^"]+"/, `versionName "${fixedVersionName}"`);
      console.log(`✅ versionName: ${currentVersionName} → ${fixedVersionName} (고정)`);
    } else {
      console.log(`✅ versionName: ${fixedVersionName} (유지)`);
    }
  } else {
    console.warn('⚠️  versionName을 찾을 수 없습니다.');
  }
  
  // 파일 저장
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('✅ 버전이 자동으로 증가되었습니다.');
  
} catch (error) {
  console.error('❌ 버전 증가 중 오류 발생:', error.message);
  process.exit(1);
}

