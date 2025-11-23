param(
    [ValidateSet("patch", "minor", "major")]
    [string]$type = "patch"
)

$pom = Get-Content "pom.xml" -Raw
if ($pom -match "<version>([\d.]+)</version>") {
    $current = $matches[1]
} else {
    throw "Version not found"
}

$parts = $current.Split(".") | ForEach-Object { [int]$_ }

switch ($type) {
    "major" { $parts[0]++; $parts[1] = 0; $parts[2] = 0 }
    "minor" { $parts[1]++; $parts[2] = 0 }
    "patch" { $parts[2]++ }
}

$new = $parts -join "."

Write-Host "`nVersion: $current -> $new ($type)`n" -ForegroundColor Cyan

# Update pom.xml - Only replace the project version
$pom = $pom -replace "(<artifactId>PaperPanel</artifactId>\s*<version>)[\d.]+", "`$1$new"
Set-Content "pom.xml" $pom -NoNewline
Write-Host "Updated pom.xml" -ForegroundColor Green

# Update plugin.yml
$pluginYml = Get-Content "src/main/resources/plugin.yml" -Raw
$pluginYml = $pluginYml -replace "version: '[\d.]+'", "version: '$new'"
Set-Content "src/main/resources/plugin.yml" $pluginYml -NoNewline
Write-Host "Updated src/main/resources/plugin.yml" -ForegroundColor Green

# Update package.json
$packageJson = Get-Content "webapp/package.json" | ConvertFrom-Json
$packageJson.version = $new
$packageJson | ConvertTo-Json -Depth 100 | Set-Content "webapp/package.json"
Write-Host "Updated webapp/package.json" -ForegroundColor Green

# Update Sidebar.tsx
$sidebar = Get-Content "webapp/src/components/Sidebar.tsx" -Raw
$sidebar = $sidebar -replace "PaperPanel v[\d.]+", "PaperPanel v$new"
Set-Content "webapp/src/components/Sidebar.tsx" $sidebar -NoNewline
Write-Host "Updated webapp/src/components/Sidebar.tsx" -ForegroundColor Green

# Create version.ts
$versionTs = "export const VERSION = '$new';
export const APP_NAME = 'PaperPanel';
export const FULL_TITLE = `"`${APP_NAME} v`${VERSION}`";"
New-Item "webapp/src/constants" -ItemType Directory -Force | Out-Null
Set-Content "webapp/src/constants/version.ts" $versionTs
Write-Host "Updated webapp/src/constants/version.ts" -ForegroundColor Green

Write-Host "`nVersion bumped to $new`n" -ForegroundColor Green
