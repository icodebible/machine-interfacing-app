#!/usr/bin/env node
/**
 * Verifies offline SVG icon implementation.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failed = false;

function fail(message) {
  failed = true;
  console.error(`❌ ${message}`);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function walk(dir, out = []) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return out;

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const full = path.join(fullDir, entry.name);
    const rel = path.relative(root, full).replaceAll(path.sep, '/');

    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'dist-electron', 'release', '.git'].includes(entry.name)) {
        walk(rel, out);
      }
    } else if (/\.(html|ts)$/.test(entry.name)) {
      out.push(rel);
    }
  }

  return out;
}

if (!exists('src/app/core/icons/offline-icons.provider.ts')) {
  fail('Missing src/app/core/icons/offline-icons.provider.ts');
} else {
  const provider = read('src/app/core/icons/offline-icons.provider.ts');
  ['addSvgIconLiteral', 'OFFLINE_MATERIAL_ICONS', 'bypassSecurityTrustHtml'].forEach((token) => {
    provider.includes(token) ? ok(`provider includes ${token}`) : fail(`provider missing ${token}`);
  });
}

if (!exists('src/app/core/icons/offline-icons.generated.ts')) {
  fail('Missing src/app/core/icons/offline-icons.generated.ts');
}

if (!exists('src/assets/icons/offline-icon-scan.json')) {
  fail('Missing src/assets/icons/offline-icon-scan.json. Run npm run icons:scan.');
}

const generated = exists('src/app/core/icons/offline-icons.generated.ts')
  ? read('src/app/core/icons/offline-icons.generated.ts')
  : '';

const scan = exists('src/assets/icons/offline-icon-scan.json')
  ? JSON.parse(read('src/assets/icons/offline-icon-scan.json'))
  : { icons: [] };

for (const item of scan.icons || []) {
  const svgFile = `src/assets/icons/material/${item.name}.svg`;

  if (!exists(svgFile)) {
    fail(`Missing SVG file for icon "${item.name}": ${svgFile}`);
  } else {
    const svg = read(svgFile);
    if (!svg.includes('<svg') || !svg.includes('</svg>')) {
      fail(`Invalid SVG file for icon "${item.name}": ${svgFile}`);
    }
  }

  if (!generated.includes(`"name": "${item.name}"`)) {
    fail(`Generated registry missing icon "${item.name}"`);
  }
}

const sourceFiles = walk('src');

const providerRegistered = sourceFiles.some((file) => {
  if (file.endsWith('offline-icons.provider.ts')) return false;
  return read(file).includes('provideOfflineMaterialIcons()');
});

providerRegistered
  ? ok('provideOfflineMaterialIcons() is registered')
  : fail('provideOfflineMaterialIcons() is not registered in Angular providers');

for (const file of sourceFiles.filter((file) => file.endsWith('.html'))) {
  const content = read(file);

  const legacyMatches = [...content.matchAll(/<mat-icon\b(?![^>]*(?:svgIcon|\[svgIcon\]))[^>]*>\s*([a-z][a-z0-9_]+)\s*<\/mat-icon>/gi)];
  for (const match of legacyMatches) {
    fail(`Legacy mat-icon ligature remains in ${file}: ${match[1]}`);
  }

  const interpolationMatches = [...content.matchAll(/<mat-icon\b(?![^>]*(?:svgIcon|\[svgIcon\]))[^>]*>\s*\{\{[\s\S]*?\}\}\s*<\/mat-icon>/gi)];
  for (const match of interpolationMatches) {
    fail(`Legacy interpolated mat-icon remains in ${file}: ${match[0].slice(0, 120)}`);
  }

  if (content.includes('fonts.googleapis.com') || content.includes('fonts.gstatic.com')) {
    fail(`Google Fonts CDN reference remains in ${file}`);
  }
}

if (exists('src/index.html')) {
  const index = read('src/index.html').toLowerCase();
  if (index.includes('fonts.googleapis.com') || index.includes('fonts.gstatic.com')) {
    fail('Google Fonts CDN reference remains in src/index.html');
  } else {
    ok('src/index.html has no Google Fonts CDN reference');
  }
}

if (failed) {
  console.error('');
  console.error('Offline SVG icon verification failed.');
  process.exit(1);
}

console.log('');
console.log(`All offline SVG icon checks passed for ${(scan.icons || []).length} icon(s).`);
