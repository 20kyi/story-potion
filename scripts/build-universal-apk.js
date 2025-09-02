const { spawnSync } = require('child_process');
const { existsSync, mkdirSync, copyFileSync } = require('fs');
const { join } = require('path');

// Paths
const ANDROID_DIR = join(process.cwd(), 'android');
const APP_DIR = join(ANDROID_DIR, 'app');
const OUTPUT_DIR = join(APP_DIR, 'build', 'outputs');
const BUNDLE_PATH = join(OUTPUT_DIR, 'bundle', 'release', 'app-release.aab');
const TOOLS_DIR = join(process.cwd(), 'tools');
const BUNDLETOOL_JAR = join(TOOLS_DIR, 'bundletool-all-1.15.6.jar');
const APKS_PATH = join(OUTPUT_DIR, 'apk', 'release', 'universal.apks');
const APK_OUT_DIR = join(OUTPUT_DIR, 'apk', 'release');
const UNIVERSAL_APK = join(APK_OUT_DIR, 'app-universal-release.apk');

// Signing (must match android/app/build.gradle release keystore)
const KEYSTORE = join(APP_DIR, 'story-potion-release-key.keystore');
const KS_ALIAS = 'story-potion-key';
const KS_PASS = 'storypotion123';
const KEY_PASS = 'storypotion123';

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

function ensureBundletool() {
    if (existsSync(BUNDLETOOL_JAR)) return;
    if (!existsSync(TOOLS_DIR)) mkdirSync(TOOLS_DIR, { recursive: true });
    const url = 'https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar';
    console.log(`Downloading bundletool from ${url}`);
    run('curl', ['-L', url, '-o', BUNDLETOOL_JAR]);
}

function main() {
    if (!existsSync(BUNDLE_PATH)) {
        console.error(`AAB not found at ${BUNDLE_PATH}. Build the bundle first.`);
        process.exit(1);
    }
    ensureBundletool();
    if (!existsSync(APK_OUT_DIR)) mkdirSync(APK_OUT_DIR, { recursive: true });

    // Build .apks with universal mode
    run('java', [
        '-jar', BUNDLETOOL_JAR,
        'build-apks',
        '--bundle', BUNDLE_PATH,
        '--output', APKS_PATH,
        '--ks', KEYSTORE,
        '--ks-key-alias', KS_ALIAS,
        '--ks-pass', `pass:${KS_PASS}`,
        '--key-pass', `pass:${KEY_PASS}`,
        '--mode', 'universal'
    ]);

    // Extract the single universal APK
    // bundletool extract-apks --apks universal.apks --output-dir <dir>
    const EXTRACT_DIR = join(APK_OUT_DIR, 'universal_extracted');
    if (!existsSync(EXTRACT_DIR)) mkdirSync(EXTRACT_DIR, { recursive: true });
    run('java', [
        '-jar', BUNDLETOOL_JAR,
        'extract-apks',
        '--apks', APKS_PATH,
        '--output-dir', EXTRACT_DIR
    ]);

    // The extracted dir typically contains a single universal.apk
    const extractedApk = join(EXTRACT_DIR, 'universal.apk');
    if (!existsSync(extractedApk)) {
        console.error('universal.apk not found after extraction.');
        process.exit(1);
    }
    copyFileSync(extractedApk, UNIVERSAL_APK);
    console.log(`Universal APK created: ${UNIVERSAL_APK}`);
}

main();


