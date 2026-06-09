const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, 'app.json');

try {
  const data = fs.readFileSync(appJsonPath, 'utf8');
  const appConfig = JSON.parse(data);

  // Incrementa versionCode (Android)
  if (appConfig.expo.android && appConfig.expo.android.versionCode) {
    appConfig.expo.android.versionCode += 1;
  } else {
    if (!appConfig.expo.android) appConfig.expo.android = {};
    appConfig.expo.android.versionCode = 2;
  }

  // Incrementa buildNumber (iOS)
  if (appConfig.expo.ios && appConfig.expo.ios.buildNumber) {
    const currentBuildNum = parseInt(appConfig.expo.ios.buildNumber, 10);
    appConfig.expo.ios.buildNumber = (currentBuildNum + 1).toString();
  } else {
    if (!appConfig.expo.ios) appConfig.expo.ios = {};
    appConfig.expo.ios.buildNumber = '2';
  }

  // Opzionale: incrementa la patch version in "version": "1.0.x"
  if (appConfig.expo.version) {
    const parts = appConfig.expo.version.split('.');
    if (parts.length === 3) {
      parts[2] = (parseInt(parts[2], 10) + 1).toString();
      appConfig.expo.version = parts.join('.');
    }
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2), 'utf8');
  console.log(
    `Version bumped successfully! Nuova versione: ${appConfig.expo.version} (Build: ${appConfig.expo.android.versionCode})`,
  );
} catch (error) {
  console.error('Errore durante il version bump:', error);
  process.exit(1);
}
