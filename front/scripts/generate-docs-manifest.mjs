import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const docsDirectory = path.resolve(projectDirectory, 'public', 'docs');
const sourceDirectory = path.join(docsDirectory, 'game-design');
const pageNodes = [];

function displayName(fileName) {
  const withoutExtension = fileName.replace(/\.md$/i, '');
  const withoutPrefix = withoutExtension.replace(/^\d+(?:\.[a-z])?[_\s.-]*/i, '');

  return withoutPrefix
    .replaceAll(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

function displayPath(relativePath) {
  return relativePath.split('/').map(displayName);
}

async function scanDirectory(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => {
    if (left.name.toLowerCase() === 'index.md') return -1;
    if (right.name.toLowerCase() === 'index.md') return 1;
    return left.name.localeCompare(right.name, undefined, { numeric: true });
  });

  const nodes = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const children = await scanDirectory(absolutePath, relativePath);
      if (children.length === 0) {
        continue;
      }

      nodes.push({
        id: relativePath,
        name: entry.name,
        displayName: displayName(entry.name),
        type: 'folder',
        children
      });
      continue;
    }

    if (path.extname(entry.name).toLowerCase() !== '.md') {
      continue;
    }

    const markdown = await readFile(absolutePath, 'utf8');
    const title =
      markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
      entry.name.replace(/\.md$/i, '').replaceAll(/[-_]/g, ' ');
    const descriptor = {
      id: relativePath,
      name: entry.name,
      displayName: displayName(entry.name),
      displayPath: displayPath(relativePath),
      title,
      path: relativePath,
      assetUrl: `docs/game-design/${relativePath}`
    };

    pageNodes.push(descriptor);
    nodes.push({ ...descriptor, type: 'markdown' });
  }

  return nodes;
}

const nodes = await scanDirectory(sourceDirectory);
const pages = pageNodes
  .sort((left, right) => {
    if (left.path.toLowerCase() === 'index.md') return -1;
    if (right.path.toLowerCase() === 'index.md') return 1;
    return left.path.localeCompare(right.path, undefined, { numeric: true });
  })
  .map((page, pageIndex) => ({ ...page, pageIndex }));

const pageIndexes = new Map(pages.map((page) => [page.path, page.pageIndex]));

function assignPageIndexes(items) {
  for (const item of items) {
    if (item.type === 'markdown') {
      item.pageIndex = pageIndexes.get(item.path);
    } else if (item.children) {
      assignPageIndexes(item.children);
    }
  }
}

assignPageIndexes(nodes);
const manifest = {
  name: 'game-design',
  generatedAt: new Date().toISOString(),
  nodes,
  pages
};

await writeFile(
  path.join(docsDirectory, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8'
);

console.log(`Generated documentation manifest with ${pages.length} markdown files.`);
