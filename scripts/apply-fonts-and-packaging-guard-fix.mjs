#!/usr/bin/env node
/**
 * Applies the production-safe local font packaging fix.
 *
 * What this script does:
 * 1. Adds local font dependencies if missing.
 * 2. Removes Google Fonts CDN links from src/index.html.
 * 3. Removes earlier broken node_modules/global font stylesheet references from angular.json.
 * 4. Replaces broken @font-face url("fonts/...") blocks in src/styles.scss.
 * 5. Ensures postinstall vendors fonts and rebuilds Electron native dependencies.
 *
 * Run from project root:
 *   node scripts/apply-fonts-and-packaging-guard-fix.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function fileExists(file) {
  return fs.existsSync(path.join(root, file));
}

function assertFile(file) {
  if (!fileExists(file)) {
    throw new Error(`Required file not found: ${file}`);
  }
}

function uniqueArray(values) {
  return [...new Set(values)];
}

assertFile('package.json');
assertFile('angular.json');
assertFile('src/index.html');
assertFile('src/styles.scss');

const packagePath = path.join(root, 'package.json');
const pkg = readJson(packagePath);

pkg.dependencies = pkg.dependencies || {};
pkg.devDependencies = pkg.devDependencies || {};
pkg.scripts = pkg.scripts || {};

if (!pkg.dependencies['@fontsource/roboto']) {
  pkg.dependencies['@fontsource/roboto'] = '^5.2.6';
}
if (!pkg.dependencies['material-icons']) {
  pkg.dependencies['material-icons'] = '^1.13.14';
}

pkg.scripts.postinstall = 'node scripts/vendor-packaged-font-assets.mjs && electron-builder install-app-deps';

// Keep the native rebuild script if already present; otherwise add a useful one.
if (!pkg.scripts['rebuild:native']) {
  pkg.scripts['rebuild:native'] = 'electron-builder install-app-deps';
}

writeJson(packagePath, pkg);

// Remove previously injected node_modules font CSS entries from angular.json.
// We want one source of truth: src/styles.scss + src/assets/fonts.
const angularPath = path.join(root, 'angular.json');
const angularJson = readJson(angularPath);

function cleanStyles(styles) {
  if (!Array.isArray(styles)) return styles;
  return uniqueArray(styles.filter((entry) => {
    const value = typeof entry === 'string' ? entry : String(entry?.input || '');
    return !value.includes('@fontsource/roboto')
      && !value.includes('material-icons/iconfont')
      && !value.includes('material-icons.css')
      && !value.includes('material-icons/iconfont/material-icons.css');
  }));
}

for (const project of Object.values(angularJson.projects || {})) {
  const build = project?.architect?.build || project?.targets?.build;
  const options = build?.options;
  if (options?.styles) {
    options.styles = cleanStyles(options.styles);
  }
  for (const config of Object.values(build?.configurations || {})) {
    if (config?.styles) {
      config.styles = cleanStyles(config.styles);
    }
  }
}
writeJson(angularPath, angularJson);

// Remove Google Fonts CDN links from index.html.
const indexPath = path.join(root, 'src/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

indexHtml = indexHtml
  .split(/\r?\n/)
  .filter((line) => {
    const lower = line.toLowerCase();
    return !lower.includes('fonts.googleapis.com')
      && !lower.includes('fonts.gstatic.com')
      && !lower.includes('material+icons')
      && !lower.includes('material icons')
      && !lower.includes('material-symbols');
  })
  .join('\n');

fs.writeFileSync(indexPath, indexHtml.endsWith('\n') ? indexHtml : `${indexHtml}\n`, 'utf8');

// Replace font declarations in styles.scss.
const stylesPath = path.join(root, 'src/styles.scss');
let styles = fs.readFileSync(stylesPath, 'utf8');

styles = styles.replace(
  /\/\*\s*Machine Interfacing packaged font block\s*\*\/[\s\S]*?\/\*\s*End Machine Interfacing packaged font block\s*\*\//g,
  ''
);

// Remove broken @font-face blocks from earlier patches.
styles = styles.replace(
  /@font-face\s*\{[^{}]*(?:roboto-latin|Roboto|Material Icons|material-icons|fonts\/roboto|fonts\/material-icons|assets\/fonts\/roboto|assets\/fonts\/material-icons)[^{}]*\}\s*/gi,
  ''
);

// Remove accidental repeated blank lines caused by previous cleanup.
styles = styles.replace(/\n{4,}/g, '\n\n').trimEnd();

const fontBlock = `
/* Machine Interfacing packaged font block */
@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("./assets/fonts/roboto/roboto-latin-300-normal.woff2") format("woff2");
}

@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("./assets/fonts/roboto/roboto-latin-400-normal.woff2") format("woff2");
}

@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("./assets/fonts/roboto/roboto-latin-500-normal.woff2") format("woff2");
}

@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("./assets/fonts/roboto/roboto-latin-700-normal.woff2") format("woff2");
}

@font-face {
  font-family: "Material Icons";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("./assets/fonts/material-icons/material-icons.woff2") format("woff2");
}

html,
body,
button,
input,
textarea,
select,
.mat-mdc-button,
.mat-mdc-raised-button,
.mat-mdc-outlined-button,
.mat-mdc-unelevated-button,
.mat-mdc-form-field,
.mat-mdc-table,
.mat-mdc-card,
.mat-mdc-dialog-container {
  font-family: "Roboto", Arial, Helvetica, sans-serif;
}

.material-icons,
mat-icon.material-icons,
.mat-icon.material-icons,
.mat-icon {
  font-family: "Material Icons";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: "liga";
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "liga";
}
/* End Machine Interfacing packaged font block */
`;

fs.writeFileSync(stylesPath, `${styles}\n\n${fontBlock}\n`, 'utf8');

console.log('Applied production-safe local font packaging fix.');
console.log('Next: npm install && node scripts/vendor-packaged-font-assets.mjs && npm run build:release');
