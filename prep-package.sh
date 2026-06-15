# # npm run clean &&  npm install && npm ci

# # For LINUX

# # sudo apt remove machine-interfacing-app
# # npm run clean
# # npm install
# # npm ci
# # npm run build:web
# # npm run build:electron
# # npx electron-builder --linux AppImage deb --x64 --publish never
# # chmod +x release/*.AppImage
# # ./release/*.AppImage
# # sudo apt install ./release/*.deb
# # shasum -a 256 release/* > release/SHA256SUMS.txt


# # npm run clean
# # node scripts/apply-local-font-assets-fix.mjs
# # npm install
# # npm run build:release
# # npx electron-builder --linux AppImage deb --x64 --publish never
# # sudo apt remove machine-interfacing-app
# # sudo apt install "./release/Machine Interfacing App-1.0.0-linux-amd64.deb"
# # machine-interfacing-app



# # #!/usr/bin/env bash
# # set -Eeuo pipefail
# # IFS=$'\n\t'

# # trap 'echo ""; echo "❌ Packaging failed at line ${LINENO}: ${BASH_COMMAND}"; echo "Packaging stopped. Fix the error above before continuing."; exit 1' ERR

# # APP_NAME="machine-interfacing-app"
# # PUBLISH_MODE="${PUBLISH_MODE:-never}"

# # if [ -f scripts/apply-fonts-and-packaging-guard-fix.mjs ]; then
# #   echo "==> Applying local Roboto font packaging guard"
# #   node scripts/apply-fonts-and-packaging-guard-fix.mjs
# # fi

# # echo "==> Applying embedded Material Icons configuration"
# # node scripts/apply-material-icons-embedded-font-fix.mjs || true

# # if [ -f scripts/apply-production-icon-packaging-fix.mjs ]; then
# #   echo "==> Applying production application icon packaging fix"
# #   node scripts/apply-production-icon-packaging-fix.mjs
# # fi

# # echo "==> Installing dependencies and rebuilding native modules"
# # npm install

# # if [ -f scripts/vendor-packaged-font-assets.mjs ]; then
# #   echo "==> Vendoring local Roboto font files"
# #   node scripts/vendor-packaged-font-assets.mjs
# # fi

# # echo "==> Embedding Material Icons font into global CSS"
# # node scripts/apply-material-icons-embedded-font-fix.mjs --require-font

# # echo "==> Verifying embedded Material Icons source"
# # node scripts/verify-material-icons-embedded-font-fix.mjs

# # if [ -f scripts/verify-production-icons.mjs ]; then
# #   echo "==> Verifying production app launcher icon files"
# #   node scripts/verify-production-icons.mjs
# # fi

# # echo "==> Cleaning previous build outputs"
# # npm run clean

# # echo "==> Building web and Electron outputs"
# # npm run build:release

# # echo "==> Verifying build outputs before packaging"
# # test -f dist-electron/main.js
# # test -f dist-electron/preload/preload.js
# # test -f dist/machine-interfacing-app/browser/index.html

# # echo "==> Verifying built CSS contains embedded Material Icons runtime font"
# # BUILT_CSS="$(find dist/machine-interfacing-app/browser -maxdepth 1 -type f -name 'styles-*.css' | head -n 1)"
# # test -n "${BUILT_CSS}"

# # # Angular production builds minify CSS and remove normal comments.
# # # Therefore we must not verify using the source comment marker. Verify
# # # production-surviving tokens instead.
# # grep -q 'data:font/woff2' "${BUILT_CSS}"
# # grep -q 'base64,' "${BUILT_CSS}"
# # grep -q 'Material Icons' "${BUILT_CSS}"
# # grep -q 'font-feature-settings' "${BUILT_CSS}"

# # echo "==> Packaging Linux AppImage and deb"
# # npx electron-builder --linux AppImage deb --x64 --publish "${PUBLISH_MODE}"

# # echo "==> Verifying package outputs"
# # DEB_PATH="$(find ./release -maxdepth 1 -type f -name '*linux-amd64.deb' | head -n 1)"
# # APPIMAGE_PATH="$(find ./release -maxdepth 1 -type f -name '*linux-x86_64.AppImage' | head -n 1)"

# # test -n "${DEB_PATH}"
# # test -f "${DEB_PATH}"
# # test -n "${APPIMAGE_PATH}"
# # test -f "${APPIMAGE_PATH}"

# # echo "==> Creating release checksums"
# # CHECKSUM_TMP="release/.SHA256SUMS.tmp"

# # find release -maxdepth 1 -type f \
# #   ! -name 'SHA256SUMS.txt' \
# #   ! -name '.SHA256SUMS.tmp' \
# #   -print0 \
# #   | sort -z \
# #   | xargs -0 shasum -a 256 > "${CHECKSUM_TMP}"

# # mv "${CHECKSUM_TMP}" release/SHA256SUMS.txt
# # test -s release/SHA256SUMS.txt

# # echo "==> Installing deb package locally"
# # sudo apt remove -y "${APP_NAME}" || true
# # sudo apt install -y "${DEB_PATH}"

# # echo ""
# # echo "✅ Packaging and local installation completed."
# # echo "Run local test with:"
# # echo "  MI_DISABLE_AUTO_UPDATE=1 machine-interfacing-app"
# # echo ""
# # echo "Artifacts:"
# # echo "  ${DEB_PATH}"
# # echo "  ${APPIMAGE_PATH}"
# # echo "  release/SHA256SUMS.txt"


# #!/usr/bin/env bash
# set -Eeuo pipefail
# IFS=$'\n\t'

# trap 'echo ""; echo "❌ Packaging failed at line ${LINENO}: ${BASH_COMMAND}"; echo "Packaging stopped. Fix the error above before continuing."; exit 1' ERR

# APP_NAME="machine-interfacing-app"
# PUBLISH_MODE="${PUBLISH_MODE:-never}"

# echo "==> Applying offline SVG icon implementation"
# node scripts/apply-offline-svg-icons-final.mjs

# echo "==> Installing dependencies and rebuilding native modules"
# npm install

# echo "==> Synchronizing offline SVG icons after npm install"
# npm run icons:sync

# if [ -f scripts/apply-fonts-and-packaging-guard-fix.mjs ]; then
#   echo "==> Applying local Roboto font packaging guard"
#   node scripts/apply-fonts-and-packaging-guard-fix.mjs
# fi

# if [ -f scripts/vendor-packaged-font-assets.mjs ]; then
#   echo "==> Vendoring local Roboto font files"
#   node scripts/vendor-packaged-font-assets.mjs
# fi

# if [ -f scripts/verify-production-icons.mjs ]; then
#   echo "==> Verifying production app launcher icon files"
#   node scripts/verify-production-icons.mjs
# fi

# echo "==> Cleaning previous build outputs"
# npm run clean

# echo "==> Building web and Electron outputs"
# npm run build:release

# echo "==> Verifying build outputs before packaging"
# test -f dist-electron/main.js
# test -f dist-electron/preload/preload.js
# test -f dist/machine-interfacing-app/browser/index.html

# echo "==> Verifying built app has no Google icon/font CDN dependency"
# grep -R "fonts.googleapis.com\|fonts.gstatic.com" dist/machine-interfacing-app/browser && {
#   echo "Google Fonts CDN reference found in built app."
#   exit 1
# } || true

# echo "==> Packaging Linux AppImage and deb"
# npx electron-builder --linux AppImage deb --x64 --publish "${PUBLISH_MODE}"

# echo "==> Verifying package outputs"
# DEB_PATH="$(find ./release -maxdepth 1 -type f -name '*linux-amd64.deb' | head -n 1)"
# APPIMAGE_PATH="$(find ./release -maxdepth 1 -type f -name '*linux-x86_64.AppImage' | head -n 1)"

# test -n "${DEB_PATH}"
# test -f "${DEB_PATH}"
# test -n "${APPIMAGE_PATH}"
# test -f "${APPIMAGE_PATH}"

# echo "==> Creating release checksums"
# CHECKSUM_TMP="release/.SHA256SUMS.tmp"

# find release -maxdepth 1 -type f \
#   ! -name 'SHA256SUMS.txt' \
#   ! -name '.SHA256SUMS.tmp' \
#   -print0 \
#   | sort -z \
#   | xargs -0 shasum -a 256 > "${CHECKSUM_TMP}"

# mv "${CHECKSUM_TMP}" release/SHA256SUMS.txt
# test -s release/SHA256SUMS.txt

# echo "==> Installing deb package locally"
# sudo apt remove -y "${APP_NAME}" || true
# sudo apt install -y "${DEB_PATH}"

# echo ""
# echo "✅ Packaging and local installation completed."
# echo "Run local test with:"
# echo "  MI_DISABLE_AUTO_UPDATE=1 machine-interfacing-app"
# echo ""
# echo "Artifacts:"
# echo "  ${DEB_PATH}"
# echo "  ${APPIMAGE_PATH}"
# echo "  release/SHA256SUMS.txt"





# # For Windows
# # npm run clean
# # npm install
# # npm run build:web
# # npm run build:electron
# # npx electron-builder --win nsis --x64 --publish never
# # release/*.exe
# # Get-FileHash release\* -Algorithm SHA256 | Format-Table > release\SHA256SUMS.txt

# # For MACOS 
# # npm run clean
# # npm install
# # npm run build:web
# # npm run build:electron
# # CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac dmg --x64 --arm64 --publish never
# # release/*.dmg


#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

trap 'echo ""; echo "❌ Packaging failed at line ${LINENO}: ${BASH_COMMAND}"; echo "Packaging stopped. Fix the error above before continuing."; exit 1' ERR

echo "==> Packaging current operating system"
node scripts/package-current-platform.mjs

echo ""
echo "✅ Current platform packaging completed."
echo "Artifacts are in release/."
