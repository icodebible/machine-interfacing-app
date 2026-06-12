# npm run clean &&  npm install && npm ci

# For LINUX

# sudo apt remove machine-interfacing-app
# npm run clean
# npm install
# npm ci
# npm run build:web
# npm run build:electron
# npx electron-builder --linux AppImage deb --x64 --publish never
# chmod +x release/*.AppImage
# ./release/*.AppImage
# sudo apt install ./release/*.deb
# shasum -a 256 release/* > release/SHA256SUMS.txt


# npm run clean
# node scripts/apply-local-font-assets-fix.mjs
# npm install
# npm run build:release
# npx electron-builder --linux AppImage deb --x64 --publish never
# sudo apt remove machine-interfacing-app
# sudo apt install "./release/Machine Interfacing App-1.0.0-linux-amd64.deb"
# machine-interfacing-app

#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

trap 'echo ""; echo "❌ Packaging failed at line ${LINENO}: ${BASH_COMMAND}"; echo "Packaging stopped. Fix the error above before continuing."; exit 1' ERR

APP_NAME="machine-interfacing-app"
PUBLISH_MODE="${PUBLISH_MODE:-never}"

echo "==> Applying local font packaging guard"
node scripts/apply-fonts-and-packaging-guard-fix.mjs

echo "==> Installing dependencies and rebuilding native modules"
npm install

echo "==> Vendoring local font files"
node scripts/vendor-packaged-font-assets.mjs

echo "==> Cleaning previous build outputs"
npm run clean

echo "==> Building web and Electron outputs"
npm run build:release

echo "==> Verifying build outputs before packaging"
test -f dist-electron/main.js
test -f dist-electron/preload/preload.js
test -f dist/machine-interfacing-app/browser/index.html

echo "==> Packaging Linux AppImage and deb"
npx electron-builder --linux AppImage deb --x64 --publish "${PUBLISH_MODE}"

echo "==> Verifying package outputs"
DEB_PATH="$(find ./release -maxdepth 1 -type f -name '*linux-amd64.deb' | head -n 1)"
APPIMAGE_PATH="$(find ./release -maxdepth 1 -type f -name '*linux-x86_64.AppImage' | head -n 1)"

test -n "${DEB_PATH}"
test -f "${DEB_PATH}"
test -n "${APPIMAGE_PATH}"
test -f "${APPIMAGE_PATH}"

echo "==> Installing deb package locally"
sudo apt remove -y "${APP_NAME}" || true
sudo apt install -y "${DEB_PATH}"

echo ""
echo "✅ Packaging and local installation completed."
echo "Run local test with:"
echo "  MI_DISABLE_AUTO_UPDATE=1 machine-interfacing-app"
echo ""
echo "Artifacts:"
echo "  ${DEB_PATH}"
echo "  ${APPIMAGE_PATH}"


# For Windows
# npm run clean
# npm install
# npm run build:web
# npm run build:electron
# npx electron-builder --win nsis --x64 --publish never
# release/*.exe
# Get-FileHash release\* -Algorithm SHA256 | Format-Table > release\SHA256SUMS.txt

# For MACOS 
# npm run clean
# npm install
# npm run build:web
# npm run build:electron
# CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac dmg --x64 --arm64 --publish never
# release/*.dmg

