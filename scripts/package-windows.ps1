$ErrorActionPreference = "Stop"

if (-not $env:PUBLISH_MODE) {
  $env:PUBLISH_MODE = "never"
}

Write-Host "==> Installing dependencies"
npm install

Write-Host "==> Verifying offline SVG icons and building release"
npm run package:preflight

Write-Host "==> Packaging Windows NSIS x64"
npx electron-builder --win nsis --x64 --publish $env:PUBLISH_MODE

Write-Host "==> Creating checksums"
npm run release:checksum

Write-Host ""
Write-Host "✅ Windows packaging completed."
Get-ChildItem release | Format-Table Name, Length, LastWriteTime
