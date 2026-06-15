#!/usr/bin/env node
/**
 * Creates SHA256SUMS.txt for release artifacts only.
 * Excludes directories and checksum temp files.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const releaseDir = path.join(root, 'release');
const output = path.join(releaseDir, 'SHA256SUMS.txt');

if (!fs.existsSync(releaseDir)) {
  throw new Error('release directory does not exist');
}

const allowed = new Set([
  '.AppImage',
  '.deb',
  '.exe',
  '.dmg',
  '.zip',
  '.blockmap',
  '.yml',
  '.yaml',
  '.json',
]);

const files = fs
  .readdirSync(releaseDir)
  .map((name) => path.join(releaseDir, name))
  .filter((file) => fs.statSync(file).isFile())
  .filter((file) => path.basename(file) !== 'SHA256SUMS.txt')
  .filter((file) => allowed.has(path.extname(file)) || path.basename(file).includes('latest'));

files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

const lines = files.map((file) => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  return `${hash}  ${path.basename(file)}`;
});

fs.writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${path.relative(root, output)} with ${files.length} artifact(s).`);
