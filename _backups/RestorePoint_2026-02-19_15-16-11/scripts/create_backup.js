const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'e:\\PROFIX APP\\ProFix';
const backupRootDir = path.join(rootDir, '_backups');

if (!fs.existsSync(backupRootDir)) {
    fs.mkdirSync(backupRootDir);
}

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T');
const dateStr = timestamp[0];
const timeStr = timestamp[1].substring(0, 5);
const backupName = `Backup_${dateStr}_${timeStr}`;
const backupPath = path.join(backupRootDir, backupName);

console.log(`Creating backup at: ${backupPath}`);

// List of directories to exclude in robocopy format
const excludeDirs = [
    'node_modules',
    '.git',
    '.expo',
    '.vscode',
    'dist',
    'app_old',
    '_backups',
    'android' // Usually redundant if we have the assets and code
];

// List of files to exclude
const excludeFiles = [
    '*.apk',
    'expo_output.txt',
    'build_log.txt',
    'package-lock.json' // Optional, but saves space
];

const excludeDirsStr = excludeDirs.join(' ');
const excludeFilesStr = excludeFiles.join(' ');

try {
    // Robocopy command
    // /S : Subdirectories
    // /E : Subdirectories including Empty
    // /XD: Exclude Directories
    // /XF: Exclude Files
    // /MT: Multi-threaded
    // /R:0 /W:0: Retry 0 times
    const cmd = `robocopy "${rootDir}" "${backupPath}" /E /XD ${excludeDirsStr} /XF ${excludeFilesStr} /R:0 /W:0`;

    console.log(`Executing: ${cmd}`);
    // Robocopy returns non-zero exit codes for success (1, 2, 3...)
    try {
        execSync(cmd);
    } catch (e) {
        if (e.status > 8) {
            throw e;
        }
    }

    console.log(`\n✅ Backup successfully created in: ${backupPath}`);
} catch (err) {
    console.error(`\n❌ Backup failed: ${err.message}`);
}
