const fs = require('fs');
const path = require('path');

const appConfigPath = path.join(__dirname, 'app.config.ts');

try {
  let content = fs.readFileSync(appConfigPath, 'utf8');

  const versionMatch = content.match(/version:\s*'(\d+)\.(\d+)\.(\d+)'/);
  if (versionMatch) {
    const patch = parseInt(versionMatch[3], 10) + 1;
    const newVersion = `${versionMatch[1]}.${versionMatch[2]}.${patch}`;
    content = content.replace(/version:\s*'[\d.]+'/, `version: '${newVersion}'`);
  }

  const versionCodeMatch = content.match(/versionCode:\s*(\d+)/);
  if (versionCodeMatch) {
    const newCode = parseInt(versionCodeMatch[1], 10) + 1;
    content = content.replace(/versionCode:\s*\d+/, `versionCode: ${newCode}`);
  }

  const buildNumberMatch = content.match(/buildNumber:\s*'(\d+)'/);
  if (buildNumberMatch) {
    const newBuild = parseInt(buildNumberMatch[1], 10) + 1;
    content = content.replace(/buildNumber:\s*'\d+'/, `buildNumber: '${newBuild}'`);
  }

  fs.writeFileSync(appConfigPath, content, 'utf8');

  const finalVersion = content.match(/version:\s*'([\d.]+)'/)?.[1];
  const finalCode = content.match(/versionCode:\s*(\d+)/)?.[1];
  console.log(`Version bumped successfully! Nuova versione: ${finalVersion} (Build: ${finalCode})`);
} catch (error) {
  console.error('Errore durante il version bump:', error);
  process.exit(1);
}
