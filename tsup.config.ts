import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/maybe/index.ts', 'src/outcome/index.ts'],
    format: ['esm', 'cjs'],
    outDir: 'dist',
    outExtension: ({ format }) => (format === 'cjs' ? { js: '.cjs' } : { js: '.mjs' }),
    target: 'node24',
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    treeshake: true,
    splitting: false,
    platform: 'node',
    skipNodeModulesBundle: true,
    external: [],
});
