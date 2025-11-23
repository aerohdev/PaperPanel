#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getCurrentVersion() {
  const pomPath = path.join(__dirname, '..', 'pom.xml');
  const pom = fs.readFileSync(pomPath, 'utf8');
  const match = pom.match(/<version>([\d.]+)<\/version>/);
  if (!match) {
    throw new Error('Version not found in pom.xml');
  }
  return match[1];
}

function incrementVersion(version) {
  const parts = version.split('.').map(num => parseInt(num, 10));
  parts[2]++; // Increment patch version
  return parts.join('.');
}

function updateFile(filePath, pattern, replacement) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const newContent = content.replace(pattern, replacement);
  
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ ${filePath}`);
    return true;
  }
  return false;
}

try {
  const current = getCurrentVersion();
  const newVersion = incrementVersion(current);
  
  console.log(`\n📦 Auto-incrementing version: ${current} → ${newVersion}\n`);
  
  const files = [
    {
      path: 'pom.xml',
      pattern: /<version>[\d.]+<\/version>/,
      replace: `<version>${newVersion}</version>`
    },
    {
      path: 'src/main/resources/plugin.yml',
      pattern: /version: '[\d.]+'/,
      replace: `version: '${newVersion}'`
    },
    {
      path: 'webapp/package.json',
      pattern: /"version": "[\d.]+"/,
      replace: `"version": "${newVersion}"`
    },
    {
      path: 'src/main/resources/config.yml',
      pattern: /# Version: [\d.]+/,
      replace: `# Version: ${newVersion}`
    },
    {
      path: 'webapp/index.html',
      pattern: /<title>PaperPanel v[\d.]+<\/title>/,
      replace: `<title>PaperPanel v${newVersion}</title>`
    },
    {
      path: 'webapp/src/components/Sidebar.tsx',
      pattern: /PaperPanel v[\d.]+/,
      replace: `PaperPanel v${newVersion}`
    }
  ];
  
  const updated = [];
  files.forEach(file => {
    if (updateFile(file.path, file.pattern, file.replace)) {
      updated.push(file.path);
    }
  });
  
  // Create version.ts
  const versionTsDir = path.join(__dirname, '..', 'webapp', 'src', 'constants');
  const versionTsPath = path.join(versionTsDir, 'version.ts');
  
  if (!fs.existsSync(versionTsDir)) {
    fs.mkdirSync(versionTsDir, { recursive: true });
  }
  
  const versionTs = `export const VERSION = '${newVersion}';\nexport const APP_NAME = 'PaperPanel';\nexport const FULL_TITLE = \`\${APP_NAME} v\${VERSION}\`;\n`;
  fs.writeFileSync(versionTsPath, versionTs, 'utf8');
  console.log('✅ webapp/src/constants/version.ts');
  updated.push('webapp/src/constants/version.ts');
  
  // Stage the updated files
  if (updated.length > 0) {
    try {
      execSync(`git add ${updated.join(' ')}`, { stdio: 'inherit' });
    } catch (err) {
      console.error('⚠️  Failed to stage files:', err.message);
    }
  }
  
  console.log(`\n✨ Version auto-incremented to ${newVersion}\n`);
  
} catch (err) {
  console.error('❌ Auto-versioning failed:', err.message);
  process.exit(1);
}
