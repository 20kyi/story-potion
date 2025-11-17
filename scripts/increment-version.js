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
  
  // versionName 찾기 및 증가 (예: 1.0.0 -> 1.0.1)
  const versionNameMatch = content.match(/versionName\s+"([^"]+)"/);
  if (versionNameMatch) {
    const currentVersionName = versionNameMatch[1];
    const versionParts = currentVersionName.split('.');
    
    // 마지막 버전 번호 증가
    if (versionParts.length >= 3) {
      const patchVersion = parseInt(versionParts[2]) + 1;
      versionParts[2] = patchVersion.toString();
    } else if (versionParts.length === 2) {
      versionParts.push('1');
    } else {
      versionParts.push('0', '1');
    }
    
    const newVersionName = versionParts.join('.');
    content = content.replace(/versionName\s+"[^"]+"/, `versionName "${newVersionName}"`);
    console.log(`✅ versionName: ${currentVersionName} → ${newVersionName}`);
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

