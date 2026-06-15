#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

trap 'echo ""; echo "❌ Linux packaging failed at line ${LINENO}: ${BASH_COMMAND}"; exit 1' ERR

export PUBLISH_MODE="${PUBLISH_MODE:-never}"

echo "==> Installing dependencies"
npm install

echo "==> Verifying offline SVG icons and building release"
npm run package:preflight

echo "==> Packaging Linux AppImage and deb"
npx electron-builder --linux AppImage deb --x64 --publish "${PUBLISH_MODE}"

echo "==> Creating checksums"
npm run release:checksum

echo ""
echo "✅ Linux packaging completed."
ls -lah release
