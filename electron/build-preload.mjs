import { build } from 'esbuild';
import path from 'path';

const entry = path.resolve('electron/src/preload/preload.ts');
const out = path.resolve('dist-electron/preload/preload.js');

await build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: ['node20'],
    sourcemap: true,
    external: ['electron'], // electron is provided at runtime
});

console.log('✅ Preload bundled to:', out);
