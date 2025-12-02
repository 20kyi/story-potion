/**
 * 안드로이드 아이콘 자동 생성 스크립트
 * 
 * 사용법:
 * 1. public/app_logo/logo_image.png 또는 원하는 로고 이미지 준비
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
  const sourceImage = path.join(__dirname, '../public/app_logo/logo_image.png');
  const resDir = path.join(__dirname, '../android/app/src/main/res');

  // 소스 이미지 확인
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ 소스 이미지를 찾을 수 없습니다: ${sourceImage}`);
    console.log('💡 public/app_logo/logo_image.png 파일이 있는지 확인하세요.');
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

      // Foreground 아이콘 생성 (Adaptive Icon용)
      // Android Adaptive Icon safe zone: 전체 크기의 66% (중앙 영역만 보장됨)
      // 108dp 전체 크기에서 safe zone은 약 72dp이므로, foreground는 108dp 크기로 만들되
      // 로고는 중앙 66% 영역 안에 들어가도록 패딩을 추가해야 함
      const foregroundSize = density.size * 2; // 108dp 기준으로 2배 크기
      const safeZoneRatio = 0.66; // Safe zone은 전체의 66%
      const logoSize = Math.floor(foregroundSize * safeZoneRatio); // Safe zone 안에 들어갈 로고 크기
      
      const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.png');
      
      // 로고를 safe zone 크기로 리사이즈하고, 투명 배경에 중앙 배치
      await sharp(sourceImage)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: Math.floor((foregroundSize - logoSize) / 2),
          bottom: Math.floor((foregroundSize - logoSize) / 2),
          left: Math.floor((foregroundSize - logoSize) / 2),
          right: Math.floor((foregroundSize - logoSize) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 }
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






