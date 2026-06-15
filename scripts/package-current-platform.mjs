#!/usr/bin/env node
/**
 * Packages the current platform only.
 *
 * For true Linux + Windows + macOS builds in one release run, use the GitHub
 * Actions workflow added in .github/workflows/release.yml.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const platform = process.platform;

const commands = {
  linux: ['npm', ['run', 'package:linux']],
  win32: ['npm', ['run', 'package:windows']],
  darwin: ['npm', ['run', 'package:macos']],
};

const command = commands[platform];

if (!command) {
  console.error(`Unsupported platform: ${platform}`);
  process.exit(1);
}

console.log(`Packaging current platform: ${platform}`);
const result = spawnSync(command[0], command[1], {
  stdio: 'inherit',
  shell: platform === 'win32',
});

process.exit(result.status ?? 1);
