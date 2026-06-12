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

npm run clean
npm install
npm run build:release
npx electron-builder --linux AppImage deb --x64 --publish never
sudo apt remove machine-interfacing-app
sudo apt install "./release/Machine Interfacing App-1.0.0-linux-amd64.deb"
machine-interfacing-app

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

