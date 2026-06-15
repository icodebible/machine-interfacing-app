#!/usr/bin/env node
/**
 * Verifies the final embedded Material Icons fix.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failed = false;

function ok(message) {
  console.log(`✅ ${message}`);
}

function fail(message) {
  failed = true;
  console.error(`❌ ${message}`);
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

if (!exists('src/styles.scss')) {
  fail('src/styles.scss not found');
} else {
  const styles = read('src/styles.scss');
  const checks = [
    'Machine Interfacing Embedded Material Icons block',
    'data:font/woff2;charset=utf-8;base64,',
    'font-family: "Material Icons" !important',
    'font-feature-settings: "liga" !important',
    'mat-icon.mat-ligature-font',
  ];

  for (const check of checks) {
    styles.includes(check) ? ok(`styles.scss includes ${check}`) : fail(`styles.scss missing ${check}`);
  }

  const match = styles.match(/data:font\/woff2;charset=utf-8;base64,([A-Za-z0-9+/=]+)/);
  if (!match) {
    fail('Embedded Material Icons font data URI not found');
  } else {
    const bytes = Buffer.from(match[1], 'base64');
    if (bytes.subarray(0, 4).toString('ascii') !== 'wOF2') {
      fail('Embedded Material Icons data URI is not valid WOFF2');
    } else if (bytes.length < 10000) {
      fail(`Embedded Material Icons font is too small: ${bytes.length} bytes`);
    } else {
      ok(`Embedded Material Icons WOFF2 is valid (${bytes.length} bytes)`);
    }
  }
}

if (!exists('src/app/core/icons/material-icons.provider.ts')) {
  fail('Material Icons provider file missing');
} else {
  const provider = read('src/app/core/icons/material-icons.provider.ts');
  provider.includes('setDefaultFontSetClass')
    ? ok('provider sets default font set class')
    : fail('provider does not set default font set class');
}

const sourceFiles = [];
function walk(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const item = path.join(full, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        walk(path.relative(root, item));
      }
    } else if (entry.name.endsWith('.ts')) {
      sourceFiles.push(path.relative(root, item).replaceAll(path.sep, '/'));
    }
  }
}
walk('src');

const registered = sourceFiles.some((file) => {
  if (file === 'src/app/core/icons/material-icons.provider.ts') return false;
  return read(file).includes('provideMaterialIconRuntime()');
});

registered
  ? ok('provideMaterialIconRuntime() is registered')
  : fail('provideMaterialIconRuntime() is not registered');

if (exists('src/index.html')) {
  const index = read('src/index.html').toLowerCase();
  if (index.includes('fonts.googleapis.com') || index.includes('fonts.gstatic.com')) {
    fail('src/index.html still references Google Fonts CDN');
  } else {
    ok('src/index.html has no Google Fonts CDN references');
  }
}

if (failed) {
  console.error('');
  console.error('Embedded Material Icons verification failed.');
  process.exit(1);
}

console.log('');
console.log('All embedded Material Icons checks passed.');
