#!/usr/bin/env node
/**
 * Converts legacy Material icon ligature usage to SVG icon usage.
 *
 * Examples:
 *   <mat-icon>dashboard</mat-icon>
 * becomes:
 *   <mat-icon svgIcon="dashboard"></mat-icon>
 *
 *   <mat-icon>{{ item.icon }}</mat-icon>
 * becomes:
 *   <mat-icon [svgIcon]="item.icon"></mat-icon>
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const knownIconPath = path.join(root, 'src/assets/icons/offline-icon-scan.json');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'dist-electron', 'release', '.git'].includes(entry.name)) {
        walk(full, out);
      }
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }

  return out;
}

const known = new Set();
if (fs.existsSync(knownIconPath)) {
  const scan = JSON.parse(fs.readFileSync(knownIconPath, 'utf8'));
  for (const item of scan.icons || []) known.add(item.name);
}

function convert(content) {
  let next = content;

  next = next.replace(
    /<mat-icon\b([^>]*)>\s*\{\{\s*([\s\S]*?)\s*\}\}\s*<\/mat-icon>/gi,
    (full, attrs, expr) => {
      if (/\b(?:svgIcon|\[svgIcon\])\b/.test(attrs)) return full;
      return `<mat-icon${attrs.trimEnd()} [svgIcon]="${expr.trim().replace(/"/g, '&quot;')}"></mat-icon>`;
    }
  );

  next = next.replace(
    /<mat-icon\b([^>]*)>\s*([a-z][a-z0-9_]+)\s*<\/mat-icon>/gi,
    (full, attrs, icon) => {
      if (/\b(?:svgIcon|\[svgIcon\])\b/.test(attrs)) return full;
      if (known.size && !known.has(icon)) return full;
      return `<mat-icon${attrs.trimEnd()} svgIcon="${icon}"></mat-icon>`;
    }
  );

  return next;
}

let changed = 0;
for (const file of walk(srcRoot)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = convert(before);

  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log(`converted: ${path.relative(root, file)}`);
  }
}

console.log(`Converted ${changed} template file(s).`);
