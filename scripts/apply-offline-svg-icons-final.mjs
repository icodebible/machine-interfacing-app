#!/usr/bin/env node
/**
 * Applies the offline SVG icon implementation.
 *
 * This script:
 * - Adds package scripts and optional @material-design-icons/svg dev dependency.
 * - Removes Google Fonts icon CDN links from src/index.html.
 * - Registers provideOfflineMaterialIcons() in app.config.ts or src/main.ts.
 * - Scans current icons.
 * - Converts legacy <mat-icon> ligatures to svgIcon.
 * - Synchronizes the generated inline SVG registry.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function file(filePath) {
  return path.join(root, filePath);
}

function exists(filePath) {
  return fs.existsSync(file(filePath));
}

function read(filePath) {
  return fs.readFileSync(file(filePath), 'utf8');
}

function write(filePath, content) {
  const full = file(filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function writeJson(filePath, value) {
  write(filePath, JSON.stringify(value, null, 2));
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!exists('package.json')) {
  throw new Error('package.json not found. Run from project root.');
}

const pkg = readJson('package.json');
pkg.scripts = pkg.scripts || {};
pkg.devDependencies = pkg.devDependencies || {};

pkg.scripts['icons:scan'] = 'node scripts/scan-offline-svg-icons.mjs';
pkg.scripts['icons:convert'] = 'node scripts/convert-mat-icons-to-svg.mjs';
pkg.scripts['icons:sync'] = 'npm run icons:scan && npm run icons:convert && npm run icons:scan && node scripts/sync-offline-svg-icons.mjs && npm run icons:verify';
pkg.scripts['icons:verify'] = 'node scripts/verify-offline-svg-icons.mjs';

// Optional but recommended. If installed, sync will use real Material SVGs.
// If unavailable/offline, the bundled SVGs remain valid fallback.
pkg.devDependencies['@material-design-icons/svg'] = pkg.devDependencies['@material-design-icons/svg'] || '^0.14.13';

writeJson('package.json', pkg);

// Remove Google icon/font CDN links.
if (exists('src/index.html')) {
  const next = read('src/index.html')
    .split(/\r?\n/)
    .filter((line) => {
      const lower = line.toLowerCase();
      return !lower.includes('fonts.googleapis.com')
        && !lower.includes('fonts.gstatic.com')
        && !lower.includes('material+icons')
        && !lower.includes('material+symbols')
        && !lower.includes('material icons')
        && !lower.includes('material symbols');
    })
    .join('\n');

  write('src/index.html', next);
}

// Register provider.
function registerInAppConfig() {
  const appConfigPath = 'src/app/app.config.ts';
  if (!exists(appConfigPath)) return false;

  let content = read(appConfigPath);
  let changed = false;

  if (!content.includes('provideOfflineMaterialIcons')) {
    content = `import { provideOfflineMaterialIcons } from './core/icons/offline-icons.provider';\n${content}`;
    changed = true;
  }

  if (!content.includes('provideOfflineMaterialIcons()')) {
    if (/providers\s*:\s*\[/.test(content)) {
      content = content.replace(/providers\s*:\s*\[/, 'providers: [\n    provideOfflineMaterialIcons(),');
      changed = true;
    }
  }

  if (changed) write(appConfigPath, content);
  return content.includes('provideOfflineMaterialIcons()');
}

function registerInMain() {
  const mainPath = 'src/main.ts';
  if (!exists(mainPath)) return false;

  let content = read(mainPath);
  let changed = false;

  if (!content.includes('provideOfflineMaterialIcons')) {
    content = `import { provideOfflineMaterialIcons } from './app/core/icons/offline-icons.provider';\n${content}`;
    changed = true;
  }

  if (!content.includes('provideOfflineMaterialIcons()')) {
    if (/bootstrapApplication\s*\(\s*([^,\)]+)\s*\)/m.test(content)) {
      content = content.replace(
        /bootstrapApplication\s*\(\s*([^,\)]+)\s*\)/m,
        'bootstrapApplication($1, { providers: [provideOfflineMaterialIcons()] })'
      );
      changed = true;
    } else if (/bootstrapApplication\s*\(\s*[^,]+,\s*\{\s*providers\s*:\s*\[/m.test(content)) {
      content = content.replace(
        /(bootstrapApplication\s*\(\s*[^,]+,\s*\{\s*providers\s*:\s*\[)/m,
        '$1\n    provideOfflineMaterialIcons(),'
      );
      changed = true;
    }
  }

  if (changed) write(mainPath, content);
  return content.includes('provideOfflineMaterialIcons()');
}

const registered = registerInAppConfig() || registerInMain();

if (!registered) {
  console.warn('');
  console.warn('WARNING: Could not automatically register provideOfflineMaterialIcons().');
  console.warn('Add it manually to your Angular ApplicationConfig providers.');
}

// Run scan/convert/sync/verify.
run('node', ['scripts/scan-offline-svg-icons.mjs']);
run('node', ['scripts/convert-mat-icons-to-svg.mjs']);
run('node', ['scripts/scan-offline-svg-icons.mjs']);
run('node', ['scripts/sync-offline-svg-icons.mjs']);
run('node', ['scripts/verify-offline-svg-icons.mjs']);

console.log('');
console.log('Offline SVG icon implementation applied successfully.');
