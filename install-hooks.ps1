# Install Git Hooks for Auto-Versioning
Write-Host "Installing Git hooks for auto-versioning..." -ForegroundColor Cyan
Write-Host ""

$hooksDir = ".git/hooks"
$preCommitPath = Join-Path $hooksDir "pre-commit"

if (-not (Test-Path $hooksDir)) {
    Write-Error "Git hooks directory not found. Are you in a git repository?"
    exit 1
}

$hookContent = @'
#!/bin/sh
# Auto-increment version on commit
if [ "$AUTO_INCREMENT" = "false" ]; then
    echo "Auto-versioning is disabled"
    exit 0
fi

if ! command -v node &> /dev/null; then
    echo "Node.js not found. Skipping auto-versioning."
    exit 0
fi

node scripts/auto-version.js
'@

Set-Content -Path $preCommitPath -Value $hookContent

Write-Host ""
Write-Host "Pre-commit hook installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host '  git commit -m "fix: bug fix"  (patch: 2.5.0 -> 2.5.1)' -ForegroundColor Gray
Write-Host '  $env:VERSION_TYPE="minor"; git commit -m "feat: new feature"  (2.5.0 -> 2.6.0)' -ForegroundColor Gray
Write-Host '  git commit --no-verify -m "docs: update"  (skip versioning)' -ForegroundColor Gray
Write-Host ""
Write-Host "Or use manual script:" -ForegroundColor Yellow
Write-Host "  .\scripts\version.ps1 -Type patch|minor|major [-AutoCommit]" -ForegroundColor White
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green