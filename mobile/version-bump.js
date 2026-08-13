const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const gradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const versionMatch = String(packageJson.version).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!versionMatch) {
    throw new Error(`Unsupported package.json version: ${packageJson.version}`);
  }

  const newVersion = `${versionMatch[1]}.${versionMatch[2]}.${parseInt(versionMatch[3], 10) + 1}`;
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

  let gradle = fs.readFileSync(gradlePath, 'utf8');
  const versionCodeMatch = gradle.match(/versionCode\s+(\d+)/);
  if (!versionCodeMatch) {
    throw new Error('versionCode not found in android/app/build.gradle');
  }
  const newCode = parseInt(versionCodeMatch[1], 10) + 1;
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
  gradle = gradle.replace(/versionName\s+"[\d.]+"/, `versionName "${newVersion}"`);
  fs.writeFileSync(gradlePath, gradle, 'utf8');

  console.log(`Version bumped successfully! Nuova versione: ${newVersion} (Build: ${newCode})`);
} catch (error) {
  console.error('Errore durante il version bump:', error);
  process.exit(1);
}
