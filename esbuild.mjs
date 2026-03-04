import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const isProd = process.env.NODE_ENV === 'production';
const isWatch = process.env.NODE_ENV === 'watch';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

const baseOptions = {
  bundle: true,
  define: {
    'process.env.VERSION': `"${packageJson.version}"`
  },
  entryPoints: ['./src/index.ts'],
  format: 'esm',
  packages: 'external',
  platform: 'node',
  target: 'node20',
  treeShaking: true
};

const buildProd = async () => {
  await esbuild.build({
    ...baseOptions,
    minify: true,
    outfile: './dist/index.js'
  });
};

const watch = async () => {
  const context = await esbuild.context({
    ...baseOptions,
    outfile: './build/index.js'
  });
  await context.watch();
  console.log('Watching...');
};

const buildDev = async () => {
  await esbuild.build({
    ...baseOptions,
    outfile: './build/index.js'
  });
};

if (isProd) {
  await buildProd();
  // return;
} else if (isWatch) {
  await watch();
} else {
  await buildDev();
}
