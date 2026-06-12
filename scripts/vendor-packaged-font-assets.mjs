#!/usr/bin/env node
/**
 * Vendors font files from node_modules into src/assets/fonts.
 *
 * Why src/assets?
 * Angular resolves url("./assets/...") from src/styles.scss at build time and
 * copies the files into the production bundle correctly. This avoids CDN fonts,
 * file:// path issues, and unresolved CSS resource errors.
 *
 * Run from project root:
 *   node scripts/vendor-packaged-font-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nodeModules = path.join(root, 'node_modules');

const outRoboto = path.join(root, 'src', 'assets', 'fonts', 'roboto');
const outIcons = path.join(root, 'src', 'assets', 'fonts', 'material-icons');

fs.mkdirSync(outRoboto, { recursive: true });
fs.mkdirSync(outIcons, { recursive: true });

function exists(file) {
  return fs.existsSync(file);
}

function walk(dir, predicate, limit = 2000) {
  if (!exists(dir)) return null;
  const stack = [dir];
  let seen = 0;

  while (stack.length) {
    const current = stack.pop();
    seen += 1;
    if (seen > limit) return null;

    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (predicate(full, entry.name)) {
        return full;
      }
    }
  }

  return null;
}

function copyRequired(source, destination, label) {
  if (!source || !exists(source)) {
    console.error(`missing: ${label}`);
    return false;
  }

  fs.copyFileSync(source, destination);
  console.log(`copied: ${label} -> ${path.relative(root, destination)}`);
  return true;
}

function findRoboto(weight) {
  const exact = path.join(
    nodeModules,
    '@fontsource',
    'roboto',
    'files',
    `roboto-latin-${weight}-normal.woff2`
  );

  if (exists(exact)) return exact;

  return walk(path.join(nodeModules, '@fontsource', 'roboto'), (_full, name) => {
    return name === `roboto-latin-${weight}-normal.woff2`
      || name === `roboto-latin-${weight}.woff2`
      || name.toLowerCase() === `roboto-${weight}.woff2`;
  });
}

function findMaterialIcons() {
  const candidates = [
    path.join(nodeModules, 'material-icons', 'iconfont', 'material-icons.woff2'),
    path.join(nodeModules, 'material-icons', 'iconfont', 'MaterialIcons-Regular.woff2'),
    path.join(nodeModules, 'material-icons', 'font', 'material-icons.woff2'),
    path.join(nodeModules, 'material-icons', 'MaterialIcons-Regular.woff2'),
  ];

  for (const candidate of candidates) {
    if (exists(candidate)) return candidate;
  }

  return walk(path.join(nodeModules, 'material-icons'), (_full, name) => {
    const lower = name.toLowerCase();
    return lower === 'material-icons.woff2'
      || lower === 'materialicons-regular.woff2'
      || lower.includes('materialicons') && lower.endsWith('.woff2');
  });
}

const required = [
  {
    source: findRoboto(300),
    destination: path.join(outRoboto, 'roboto-latin-300-normal.woff2'),
    label: 'Roboto 300',
  },
  {
    source: findRoboto(400),
    destination: path.join(outRoboto, 'roboto-latin-400-normal.woff2'),
    label: 'Roboto 400',
  },
  {
    source: findRoboto(500),
    destination: path.join(outRoboto, 'roboto-latin-500-normal.woff2'),
    label: 'Roboto 500',
  },
  {
    source: findRoboto(700),
    destination: path.join(outRoboto, 'roboto-latin-700-normal.woff2'),
    label: 'Roboto 700',
  },
  {
    source: findMaterialIcons(),
    destination: path.join(outIcons, 'material-icons.woff2'),
    label: 'Material Icons',
  },
];

let ok = true;
for (const item of required) {
  ok = copyRequired(item.source, item.destination, item.label) && ok;
}

if (!ok) {
  console.error('');
  console.error('Font vendoring failed. Run npm install first, then rerun:');
  console.error('  node scripts/vendor-packaged-font-assets.mjs');
  process.exit(1);
}

console.log('');
console.log('Font assets vendored successfully.');
console.log('Expected files:');
console.log('  src/assets/fonts/roboto/*.woff2');
console.log('  src/assets/fonts/material-icons/material-icons.woff2');
