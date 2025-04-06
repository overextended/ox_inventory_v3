//@ts-check

import { exists, exec, getFiles } from './utils.js';
import { createBuilder, createFxmanifest } from '@overextended/fx-utils';

const watch = process.argv.includes('--watch');
const web = await exists('./web');

createBuilder(
  watch,
  {
  },
  [
    {
      name: 'server',
      options: {
        platform: 'node',
        target: ['node22'],
        format: 'cjs',
        dropLabels: ['$BROWSER', '$CLIENT'],
      },
    },
    {
      name: 'client',
      options: {
        platform: 'browser',
        target: ['es2023'],
        format: 'iife',
        dropLabels: ['$BROWSER', '$SERVER'],
      },
    },
  ],
  async (outfiles) => {
    const files = await getFiles('dist/web', 'static', 'locales');
    await createFxmanifest({
      client_scripts: [outfiles.client],
      server_scripts: [outfiles.server],
      files: ['locales/*.json', ...files],
      dependencies: ['/server:13019', '/onesync', 'oxmysql', 'ox_lib', 'ox_target'],
      metadata: {
        ui_page: 'dist/web/index.html',
        lua54: 'yes',
        node_version: '22',
      },
    });
  }
);

if (web) await exec(`cd ./web && vite build ${watch ? '--watch' : ''}`);
