/**
 * 안드로이드 아이콘 자동 생성 스크립트
 * 
 * 사용법:
 * 1. public/app_logo/logo3.png 또는 원하는 로고 이미지 준비
 * 2. node scripts/generate-android-icons.js 실행
 * 
 * 주의: sharp 패키지가 필요합니다. 없으면 npm install sharp 설치
 */

const fs = require('fs');
const path = require('path');

const SHARP_MESSAGE = `
⚠️  sharp 패키지가 필요합니다.

다음 명령어로 설치하세요:
npm install --save-dev sharp

또는 온라인 도구를 사용하세요:
https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
`;

try {
  const sharp = require('sharp');
  generateIcons(sharp);
} catch (error) {
  console.log(SHARP_MESSAGE);
  console.log('\n💡 대안: 온라인 도구 사용을 권장합니다.');
  console.log('   https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html');
}

async function generateIcons(sharp) {
  const sourceImage = path.join(__dirname, '../public/app_logo/logo3.png');
  const resDir = path.join(__dirname, '../android/app/src/main/res');

  // 소스 이미지 확인
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ 소스 이미지를 찾을 수 없습니다: ${sourceImage}`);
    console.log('💡 public/app_logo/logo3.png 파일이 있는지 확인하세요.');
    return;
  }

  // 밀도별 크기 정의
  const densities = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
  ];

  console.log('🔄 안드로이드 아이콘 생성 중...\n');

  try {
    for (const density of densities) {
      const folderPath = path.join(resDir, density.name);
      
      // 폴더가 없으면 생성
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // 정사각형 아이콘 생성
      const squarePath = path.join(folderPath, 'ic_launcher.png');
      await sharp(sourceImage)
        .resize(density.size, density.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(squarePath);

      // 원형 아이콘 생성 (동일한 이미지 사용)
      const roundPath = path.join(folderPath, 'ic_launcher_round.png');
      await sharp(sourceImage)
        .resize(density.size, density.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(roundPath);

      // Foreground 아이콘 생성 (Adaptive Icon용 - 더 큰 크기)
      const foregroundSize = Math.floor(density.size * 4.5); // Adaptive Icon 안전 영역 고려
      const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.png');
      await sharp(sourceImage)
        .resize(foregroundSize, foregroundSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // 투명 배경
        })
        .toFile(foregroundPath);

      console.log(`✅ ${density.name} 아이콘 생성 완료 (${density.size}x${density.size}px)`);
    }

    console.log('\n🎉 모든 아이콘 생성이 완료되었습니다!');
    console.log('\n📦 다음 단계:');
    console.log('   1. npm run build:android:aab 실행');
    console.log('   2. 생성된 AAB 파일을 플레이스토어에 업로드');
    console.log('\n⚠️  주의: Adaptive Icon의 배경색을 원하는 색으로 변경하려면');
    console.log('   android/app/src/main/res/values/ic_launcher_background.xml 파일을 수정하세요.');

  } catch (error) {
    console.error('❌ 아이콘 생성 실패:', error.message);
  }
}






