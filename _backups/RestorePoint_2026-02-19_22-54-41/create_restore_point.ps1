$ErrorActionPreference = "Stop"

# Configuration
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$rootDir = Get-Location
$backupRootDir = Join-Path $rootDir "_backups"
$restorePointName = "RestorePoint_$timestamp"
$restorePointPath = Join-Path $backupRootDir $restorePointName
$dbDumpPath = Join-Path $restorePointPath "db_dump"

# Create directories
New-Item -ItemType Directory -Force -Path $restorePointPath | Out-Null
New-Item -ItemType Directory -Force -Path $dbDumpPath | Out-Null

Write-Host "Creating Restore Point: $restorePointName" -ForegroundColor Cyan

# 1. Database Backup
Write-Host "Starting Database Backup..." -ForegroundColor Yellow
try {
    # Quote the path arguments to handle spaces
    $scriptPath = "backend/scripts/backup_db.js"
    $quotedScriptPath = "`"$scriptPath`""
    $quotedDbDumpPath = "`"$dbDumpPath`""
    
    # Run node script
    $nodeProcess = Start-Process -FilePath "node" -ArgumentList "$quotedScriptPath $quotedDbDumpPath" -Wait -PassThru -NoNewWindow
    
    if ($nodeProcess.ExitCode -ne 0) {
        throw "Database backup script failed with exit code $($nodeProcess.ExitCode)"
    }
    Write-Host "Database backup completed." -ForegroundColor Green
}
catch {
    Write-Error "Database backup failed: $_"
    # Decide: Continue with code backup or stop?
    # We stop because a partial restore point might be misleading.
    exit 1
}

# 2. Code Backup using Robocopy
Write-Host "Starting Code Backup..." -ForegroundColor Yellow

# Define exclusions
$dirsToExclude = @("node_modules", ".git", ".expo", "dist", "build", "_backups", ".vscode", "android", "ios", "web-build", "app_old")
$filesToExclude = @("*.log", "*.tmp")

# Build Robocopy arguments
# robocopy <Source> <Dest> [files] [options]
# Important: Robocopy arguments for paths must be quoted if they contain spaces.
# Also, robocopy doesn't like trailing backslashes in quoted paths unless escaped, 
# but usually standard paths from Join-Path are fine if not root drive like C:\
# Get-Location might return path without trailing slash.

$quotedSource = "`"$($rootDir.Path)`""
$quotedDest = "`"$restorePointPath`""

# Function to wrap array items in quotes if needed? No, usually static options are fine.
# But source and dest need robust handling.

# The simplest way to invoke robocopy safely with spaces is using invoke-expression or careful argument construction
# Start-Process with ArgumentList as a single string is often safest for complex quoting.

$cmdArgs = "$quotedSource $quotedDest /E /XD " + ($dirsToExclude -join " ") + " /XF " + ($filesToExclude -join " ") + " /R:3 /W:1 /NJH /NJS"

# Execute Robocopy
$p = Start-Process -FilePath "robocopy" -ArgumentList $cmdArgs -Wait -PassThru -NoNewWindow

if ($p.ExitCode -ge 8) {
    Write-Error "Robocopy failed with major errors (Exit Code: $($p.ExitCode))"
    exit 1
}

Write-Host "Code backup completed." -ForegroundColor Green

# 3. Create Restore Info File
$restoreInfo = @"
Restore Point: $restorePointName
Date: $(Get-Date)
Database Backup: Success ($dbDumpPath)
Code Backup: Success
"@
Set-Content -Path (Join-Path $restorePointPath "restore_info.txt") -Value $restoreInfo

Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Restore Point Created Successfully!" -ForegroundColor Green
Write-Host "Location: $restorePointPath" -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Cyan
