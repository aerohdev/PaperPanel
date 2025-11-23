param(
    [ValidateSet('patch', 'minor', 'major')]
    [string]$Type = 'patch',
    [switch]$AutoCommit = $false
)

function Get-CurrentVersion {
    $pom = Get-Content "pom.xml" -Raw
    if ($pom -match '<version>([\d.]+)</version>') {
        return $matches[1]
    }
    throw "Version not found"
}

function Update-Version {
    param([string]$Version, [string]$Type)
    $parts = $Version.Split('.') | ForEach-Object { [int]$_ }
    
    switch ($Type) {
        'major' { $parts[0]++; $parts[1] = 0; $parts[2] = 0 }
        'minor' { $parts[1]++; $parts[2] = 0 }
        'patch' { $parts[2]++ }
    }
    
    return $parts -join '.'
}

$current = Get-CurrentVersion
$new = Update-Version -Version $current -Type $Type

Write-Host "`n📦 $current → $new ($Type)`n" -ForegroundColor Green

$files = @(
    @{ Path = "pom.xml"; Pattern = '<version>[\d.]+</version>'; Replace = "<version>$new</version>" },
    @{ Path = "src/main/resources/plugin.yml"; Pattern = "version: '[\d.]+'"; Replace = "version: '$new'" },
    @{ Path = "webapp/package.json"; Pattern = '"version": "[\d.]+"'; Replace = "`"version`": `"$new`"" },
    @{ Path = "src/main/resources/config.yml"; Pattern = '# Version: [\d.]+'; Replace = "# Version: $new" },
    @{ Path = "webapp/index.html"; Pattern = '<title>PaperPanel v[\d.]+</title>'; Replace = "<title>PaperPanel v$new</title>" },
    @{ Path = "webapp/src/components/Sidebar.tsx"; Pattern = 'PaperPanel v[\d.]+'; Replace = "PaperPanel v$new" }
)

$updated = @()
foreach ($file in $files) {
    $content = Get-Content $file.Path -Raw
    $newContent = $content -replace $file.Pattern, $file.Replace
    
    if ($content -ne $newContent) {
        Set-Content $file.Path $newContent -NoNewline
        Write-Host "✅ $($file.Path)" -ForegroundColor Green
        $updated += $file.Path
    }
}

# Create version.ts
$versionTs = "export const VERSION = '$new';`nexport const APP_NAME = 'PaperPanel';`nexport const FULL_TITLE = ```${APP_NAME} v```${VERSION}``;"
New-Item "webapp/src/constants" -ItemType Directory -Force | Out-Null
Set-Content "webapp/src/constants/version.ts" $versionTs
Write-Host "✅ webapp/src/constants/version.ts" -ForegroundColor Green

Write-Host "`n✨ Version bumped to $new`n" -ForegroundColor Green

if ($AutoCommit) {
    git add .
    git commit -m "chore: bump version to $new"
    git tag "v$new"
    Write-Host "✅ Committed and tagged!" -ForegroundColor Green
}