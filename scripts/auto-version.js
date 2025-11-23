#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the commit message from .git/COMMIT_EDITMSG
const commitMsgPath = path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
let commitMsg = '';

try {
  commitMsg = fs.readFileSync(commitMsgPath, 'utf8').toLowerCase();
} catch (err) {
  console.log('⚠️  Could not read commit message, defaulting to patch version');
}

// Determine version type from commit message
let versionType = 'patch'; // Default to patch

if (commitMsg.startsWith('breaking:') || commitMsg.includes('breaking change')) {
  versionType = 'major';
} else if (commitMsg.startsWith('feat:') || commitMsg.startsWith('feature:')) {
  versionType = 'minor';
} else if (commitMsg.startsWith('fix:') || commitMsg.startsWith('patch:') || commitMsg.startsWith('chore:')) {
  versionType = 'patch';
}

console.log(`\n🔍 Detected commit type: ${versionType}\n`);

try {
  // Run the PowerShell versioning script with the detected type
  const scriptPath = path.join(__dirname, 'version.ps1');
  execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -type ${versionType}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Stage the version files
  const filesToStage = [
    'pom.xml',
    'src/main/resources/plugin.yml',
    'webapp/package.json',
    'webapp/src/components/Sidebar.tsx',
    'webapp/src/constants/version.ts'
  ];

  filesToStage.forEach(file => {
    try {
      execSync(`git add "${file}"`, { stdio: 'pipe', cwd: path.join(__dirname, '..') });
    } catch (err) {
      // File might not exist, continue
    }
  });

} catch (error) {
  console.error('❌ Error during auto-versioning:', error.message);
  process.exit(1);
}
