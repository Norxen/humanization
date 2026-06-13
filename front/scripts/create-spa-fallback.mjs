import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(directory, '..', 'dist', 'front', 'browser');

await copyFile(
  path.join(outputDirectory, 'index.html'),
  path.join(outputDirectory, '404.html')
);

console.log('Created GitHub Pages SPA fallback at dist/front/browser/404.html.');
