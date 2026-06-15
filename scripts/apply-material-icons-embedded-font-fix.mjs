#!/usr/bin/env node
/**
 * Final production fix for Angular Material ligature icons in packaged Electron.
 *
 * This embeds the Material Icons WOFF2 font into src/styles.scss as a data URI.
 * It removes all runtime uncertainty: no CDN, no file:// path, no AppImage/deb
 * asset path, and no CSS resource resolution dependency for the icon font.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requireFont = process.argv.includes('--require-font');

function full(file) {
  return path.join(root, file);
}

function exists(file) {
  return fs.existsSync(full(file));
}

function read(file) {
  return fs.readFileSync(full(file), 'utf8');
}

function write(file, content) {
  const target = full(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function writeJson(file, value) {
  write(file, JSON.stringify(value, null, 2));
}

function walk(dir, matcher, limit = 12000) {
  if (!fs.existsSync(dir)) return null;

  const stack = [dir];
  let visited = 0;

  while (stack.length) {
    const current = stack.pop();
    visited += 1;
    if (visited > limit) return null;

    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const item = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '.cache') stack.push(item);
      } else if (matcher(item, entry.name)) {
        return item;
      }
    }
  }

  return null;
}

function findMaterialIconsFont() {
  const nm = full('node_modules');

  const candidates = [
    path.join(nm, 'material-icons', 'iconfont', 'material-icons.woff2'),
    path.join(nm, 'material-icons', 'iconfont', 'MaterialIcons-Regular.woff2'),
    path.join(nm, 'material-icons', 'font', 'material-icons.woff2'),
    path.join(nm, 'material-icons', 'MaterialIcons-Regular.woff2'),
    path.join(nm, '@material-design-icons', 'font', 'MaterialIcons-Regular.woff2'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return walk(nm, (_full, name) => {
    const lower = name.toLowerCase();
    return lower.endsWith('.woff2')
      && (
        lower === 'material-icons.woff2'
        || lower === 'materialicons-regular.woff2'
        || lower.includes('materialicons')
      );
  });
}

function ensurePackage() {
  if (!exists('package.json')) {
    throw new Error('package.json not found. Run from project root.');
  }

  const pkg = readJson('package.json');
  pkg.dependencies = pkg.dependencies || {};
  pkg.scripts = pkg.scripts || {};

  pkg.dependencies['material-icons'] = pkg.dependencies['material-icons'] || '^1.13.14';

  pkg.scripts['apply:material-icons'] = 'node scripts/apply-material-icons-embedded-font-fix.mjs';
  pkg.scripts['verify:material-icons'] = 'node scripts/verify-material-icons-embedded-font-fix.mjs';

  const parts = [];
  if (exists('scripts/vendor-packaged-font-assets.mjs')) {
    parts.push('node scripts/vendor-packaged-font-assets.mjs');
  }
  parts.push('electron-builder install-app-deps');
  pkg.scripts.postinstall = parts.join(' && ');

  writeJson('package.json', pkg);
}

function cleanIndexHtml() {
  if (!exists('src/index.html')) return;

  const next = read('src/index.html')
    .split(/\r?\n/)
    .filter((line) => {
      const value = line.toLowerCase();
      return !value.includes('fonts.googleapis.com')
        && !value.includes('fonts.gstatic.com')
        && !value.includes('material+icons')
        && !value.includes('material+symbols')
        && !value.includes('material icons')
        && !value.includes('material symbols');
    })
    .join('\n');

  write('src/index.html', next);
}

function cleanAngularStyles() {
  if (!exists('angular.json')) return;

  const angular = readJson('angular.json');

  function clean(styles) {
    if (!Array.isArray(styles)) return styles;
    return [...new Set(styles.filter((entry) => {
      const value = typeof entry === 'string' ? entry : String(entry?.input || '');
      return !value.includes('material-icons')
        && !value.includes('material-symbols')
        && !value.includes('@fontsource/material')
        && !value.includes('@fontsource-variable/material');
    }))];
  }

  for (const project of Object.values(angular.projects || {})) {
    const build = project?.architect?.build || project?.targets?.build;
    if (build?.options?.styles) build.options.styles = clean(build.options.styles);
    for (const config of Object.values(build?.configurations || {})) {
      if (config?.styles) config.styles = clean(config.styles);
    }
  }

  writeJson('angular.json', angular);
}

function ensureProvider() {
  const provider = `import { ENVIRONMENT_INITIALIZER, Provider, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';

/**
 * Sets Angular Material's default <mat-icon> mode to local Material Icons
 * ligature font rendering.
 */
export function provideMaterialIconRuntime(): Provider {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useValue: () => {
      const iconRegistry = inject(MatIconRegistry);

      iconRegistry.setDefaultFontSetClass(
        'material-icons',
        'mat-ligature-font'
      );

      iconRegistry.registerFontClassAlias(
        'material-icons',
        'material-icons mat-ligature-font'
      );
    },
  };
}
`;

  write('src/app/core/icons/material-icons.provider.ts', provider);

  const appConfig = full('src/app/app.config.ts');
  if (fs.existsSync(appConfig)) {
    let content = fs.readFileSync(appConfig, 'utf8');
    let changed = false;

    if (!content.includes('provideMaterialIconRuntime')) {
      content = `import { provideMaterialIconRuntime } from './core/icons/material-icons.provider';\n${content}`;
      changed = true;
    }

    if (!content.includes('provideMaterialIconRuntime()')) {
      if (/providers\s*:\s*\[/.test(content)) {
        content = content.replace(/providers\s*:\s*\[/, 'providers: [\n    provideMaterialIconRuntime(),');
        changed = true;
      }
    }

    if (changed) fs.writeFileSync(appConfig, content, 'utf8');
    return;
  }

  if (exists('src/main.ts')) {
    let content = read('src/main.ts');
    let changed = false;

    if (!content.includes('provideMaterialIconRuntime')) {
      content = `import { provideMaterialIconRuntime } from './app/core/icons/material-icons.provider';\n${content}`;
      changed = true;
    }

    if (!content.includes('provideMaterialIconRuntime()')) {
      if (/bootstrapApplication\s*\(\s*([^,\)]+)\s*\)/m.test(content)) {
        content = content.replace(
          /bootstrapApplication\s*\(\s*([^,\)]+)\s*\)/m,
          'bootstrapApplication($1, { providers: [provideMaterialIconRuntime()] })'
        );
        changed = true;
      } else if (/bootstrapApplication\s*\(\s*[^,]+,\s*\{\s*providers\s*:\s*\[/m.test(content)) {
        content = content.replace(
          /(bootstrapApplication\s*\(\s*[^,]+,\s*\{\s*providers\s*:\s*\[)/m,
          '$1\n    provideMaterialIconRuntime(),'
        );
        changed = true;
      }
    }

    if (changed) write('src/main.ts', content);
  }
}

function injectEmbeddedFont() {
  if (!exists('src/styles.scss')) {
    throw new Error('src/styles.scss not found');
  }

  const fontPath = findMaterialIconsFont();

  if (!fontPath) {
    const msg = [
      'Material Icons WOFF2 font was not found in node_modules.',
      '',
      'Run:',
      '  npm install',
      '  node scripts/apply-material-icons-embedded-font-fix.mjs',
    ].join('\n');

    if (requireFont) {
      throw new Error(msg);
    }

    console.warn(msg);
    return false;
  }

  const buf = fs.readFileSync(fontPath);
  if (buf.subarray(0, 4).toString('ascii') !== 'wOF2') {
    throw new Error(`Material Icons font is not a valid WOFF2 file: ${fontPath}`);
  }

  const base64 = buf.toString('base64');
  let styles = read('src/styles.scss');

  const blockPatterns = [
    /\/\*\s*Machine Interfacing Material Icons production block\s*\*\/[\s\S]*?\/\*\s*End Machine Interfacing Material Icons production block\s*\*\//g,
    /\/\*\s*Machine Interfacing Material Icons runtime registry block\s*\*\/[\s\S]*?\/\*\s*End Machine Interfacing Material Icons runtime registry block\s*\*\//g,
    /\/\*\s*Machine Interfacing Embedded Material Icons block\s*\*\/[\s\S]*?\/\*\s*End Machine Interfacing Embedded Material Icons block\s*\*\//g,
  ];

  for (const pattern of blockPatterns) {
    styles = styles.replace(pattern, '');
  }

  styles = styles.replace(
    /@font-face\s*\{[^{}]*(?:Material Icons|Material Symbols|material-icons|material-symbols)[^{}]*\}\s*/gi,
    ''
  );

  const block = `
/* Machine Interfacing Embedded Material Icons block */
/*
 * Final packaged-Electron Material Icons fix.
 *
 * This embeds the WOFF2 font directly in the production CSS bundle to avoid
 * CDN, file://, AppImage, deb, asset hashing, and CSP loading issues.
 */
@font-face {
  font-family: "Material Icons";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("data:font/woff2;charset=utf-8;base64,${base64}") format("woff2");
}

.material-icons,
mat-icon.material-icons,
mat-icon.mat-ligature-font,
.mat-icon.material-icons,
.mat-icon.mat-ligature-font,
.mat-icon:not([svgicon]):not([svgIcon]),
mat-icon:not([svgicon]):not([svgIcon]) {
  font-family: "Material Icons" !important;
  font-weight: normal !important;
  font-style: normal !important;
  font-size: 24px;
  line-height: 1;
  width: 24px;
  height: 24px;
  min-width: 24px;
  max-width: 24px;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  letter-spacing: normal !important;
  text-transform: none !important;
  white-space: nowrap !important;
  overflow: hidden;
  direction: ltr;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga" !important;
  -webkit-font-feature-settings: "liga" !important;
  font-variant-ligatures: normal !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.mat-icon {
  vertical-align: middle;
  flex-shrink: 0;
}
/* End Machine Interfacing Embedded Material Icons block */
`;

  write('src/styles.scss', `${styles.trimEnd()}\n\n${block}\n`);
  console.log(`Embedded Material Icons font from: ${path.relative(root, fontPath)}`);
  console.log(`Embedded font size: ${buf.length} bytes`);
  return true;
}

ensurePackage();
cleanIndexHtml();
cleanAngularStyles();
ensureProvider();
const embedded = injectEmbeddedFont();

console.log('');
if (embedded) {
  console.log('Final embedded Material Icons fix applied.');
} else {
  console.log('Material Icons configuration applied. Run npm install, then run this script again to embed the font.');
}
