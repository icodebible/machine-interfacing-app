#!/usr/bin/env node
/**
 * Scans Angular templates and TS configuration objects for Material icon names.
 *
 * Detects:
 * - <mat-icon>dashboard</mat-icon>
 * - <mat-icon>{{ condition ? 'expand_less' : 'expand_more' }}</mat-icon>
 * - svgIcon="dashboard"
 * - [svgIcon]="condition ? 'a' : 'b'"
 * - icon: 'dashboard' in TS arrays/config
 *
 * Writes:
 * - src/assets/icons/offline-icon-scan.json
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');

const RESERVED = new Set([
  'bad',
  'warn',
  'info',
  'true',
  'false',
  'null',
  'undefined',
  'all',
  'enabled',
  'disabled',
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'dist-electron', 'release', '.git'].includes(entry.name)) {
        walk(full, out);
      }
    } else if (/\.(html|ts)$/.test(entry.name)) {
      out.push(full);
    }
  }

  return out;
}

function addIcon(map, icon, file) {
  if (!icon || RESERVED.has(icon)) return;
  if (!/^[a-z][a-z0-9_]+$/.test(icon)) return;

  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  if (!map.has(icon)) map.set(icon, new Set());
  map.get(icon).add(rel);
}

const found = new Map();
const files = walk(srcRoot);

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');

  for (const match of text.matchAll(/<mat-icon\b[^>]*>([\s\S]*?)<\/mat-icon>/gi)) {
    const content = match[1].replace(/<[^>]+>/g, ' ').trim();

    if (/^[a-z][a-z0-9_]+$/.test(content)) {
      addIcon(found, content, file);
    }

    for (const stringMatch of content.matchAll(/['"]([a-z][a-z0-9_]+)['"]/g)) {
      addIcon(found, stringMatch[1], file);
    }
  }

  for (const match of text.matchAll(/\bsvgIcon\s*=\s*["']([a-z][a-z0-9_]+)["']/g)) {
    addIcon(found, match[1], file);
  }

  for (const match of text.matchAll(/\b\[svgIcon\]\s*=\s*["']([^"']+)["']/g)) {
    for (const stringMatch of match[1].matchAll(/['"]([a-z][a-z0-9_]+)['"]/g)) {
      addIcon(found, stringMatch[1], file);
    }
  }

  for (const match of text.matchAll(/\b(?:icon|svgIcon|matIcon|iconName)\s*:\s*["']([a-z][a-z0-9_]+)["']/g)) {
    addIcon(found, match[1], file);
  }
}

// Allow manually registered future icons.
const extraPath = path.join(root, 'src/assets/icons/offline-icon-extra.json');
if (fs.existsSync(extraPath)) {
  const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));
  const names = Array.isArray(extra) ? extra : extra.icons || [];
  for (const icon of names) {
    addIcon(found, icon, extraPath);
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  count: found.size,
  icons: [...found.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, files]) => ({ name, files: [...files].sort() })),
};

const outPath = path.join(root, 'src/assets/icons/offline-icon-scan.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

console.log(`Scanned ${files.length} source files.`);
console.log(`Found ${result.count} offline icon name(s).`);
console.log(`Wrote ${path.relative(root, outPath)}`);
