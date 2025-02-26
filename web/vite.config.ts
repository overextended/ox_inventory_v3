import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [svelte()],
    base: './',
    resolve: {
      alias: {
        $lib: path.resolve('./src/lib'),
        '~': path.resolve('../'),
        '@common': path.resolve('../src/common/'),
      },
    },
    ...(mode === 'development' && { publicDir: '../' }),
    build: {
      outDir: '../dist/web',
      emptyOutDir: true,
      target: 'es2023',
      rollupOptions: {
        output: {
          assetFileNames: `assets/[name][extname]`,
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
        },
      },
    },
  };
});
