#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

trap 'echo ""; echo "❌ macOS packaging failed at line ${LINENO}: ${BASH_COMMAND}"; exit 1' ERR

export PUBLISH_MODE="${PUBLISH_MODE:-never}"
export CSC_IDENTITY_AUTO_DISCOVERY="${CSC_IDENTITY_AUTO_DISCOVERY:-false}"

echo "==> Installing dependencies"
npm install

echo "==> Verifying offline SVG icons and building release"
npm run package:preflight

echo "==> Packaging macOS dmg and zip for x64 + arm64"
npx electron-builder --mac dmg zip --x64 --arm64 --publish "${PUBLISH_MODE}"

echo "==> Creating checksums"
npm run release:checksum

echo ""
echo "✅ macOS packaging completed."
ls -lah release
