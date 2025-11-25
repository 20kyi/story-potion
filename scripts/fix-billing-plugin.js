const fs = require('fs');
const path = require('path');

const pluginsJsonPath = path.join(__dirname, '../android/app/src/main/assets/capacitor.plugins.json');

// capacitor.plugins.json 파일 읽기
let pluginsJson;
try {
  const content = fs.readFileSync(pluginsJsonPath, 'utf8');
  pluginsJson = JSON.parse(content);
} catch (error) {
  console.error('capacitor.plugins.json 파일을 읽을 수 없습니다:', error);
  process.exit(1);
}

// BillingPlugin이 이미 있는지 확인
const hasBillingPlugin = pluginsJson.some(
  plugin => plugin.pkg === 'Billing' && plugin.classpath === 'com.storypotion.app.BillingPlugin'
);

if (!hasBillingPlugin) {
  // BillingPlugin 추가
  pluginsJson.push({
    pkg: 'Billing',
    classpath: 'com.storypotion.app.BillingPlugin'
  });

  // 파일에 쓰기
  fs.writeFileSync(pluginsJsonPath, JSON.stringify(pluginsJson, null, '\t') + '\n', 'utf8');
  console.log('✅ BillingPlugin이 capacitor.plugins.json에 추가되었습니다.');
} else {
  console.log('ℹ️  BillingPlugin이 이미 capacitor.plugins.json에 있습니다.');
}

