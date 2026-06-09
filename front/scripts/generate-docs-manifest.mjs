import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const allowedStatuses = new Set(['planned', 'draft', 'review', 'approved']);

export function displayName(fileName) {
  return fileName.replace(/\.md$/i, '').trim();
}

export function parseFrontMatter(source, relativePath) {
  if (!source.startsWith('---\n')) {
    throw new Error(`${relativePath}: missing YAML front matter.`);
  }

  const end = source.indexOf('\n---\n', 4);
  if (end === -1) {
    throw new Error(`${relativePath}: front matter is not closed.`);
  }

  const metadata = {};
  let activeList = null;
  for (const rawLine of source.slice(4, end).split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      continue;
    }

    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && activeList) {
      metadata[activeList].push(unquote(listItem[1].trim()));
      continue;
    }

    const property = line.match(/^([A-Za-z][A-Za-z0-9]*):(?:\s*(.*))?$/);
    if (!property) {
      throw new Error(`${relativePath}: invalid front matter line "${line}".`);
    }

    const [, key, rawValue = ''] = property;
    if (key === 'related') {
      metadata.related = rawValue ? parseInlineList(rawValue, relativePath) : [];
      activeList = rawValue ? null : key;
    } else {
      metadata[key] = unquote(rawValue.trim());
      activeList = null;
    }
  }

  const required = ['status', 'lastReviewed', 'summary'];
  for (const field of required) {
    if (!metadata[field]) {
      throw new Error(`${relativePath}: missing required front matter field "${field}".`);
    }
  }
  if (!allowedStatuses.has(metadata.status)) {
    throw new Error(`${relativePath}: invalid status "${metadata.status}".`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.lastReviewed)) {
    throw new Error(`${relativePath}: lastReviewed must use YYYY-MM-DD.`);
  }
  if (!Array.isArray(metadata.related)) {
    metadata.related = [];
  }

  return {
    metadata,
    body: source.slice(end + 5)
  };
}

function parseInlineList(value, relativePath) {
  if (!value.startsWith('[') || !value.endsWith(']')) {
    throw new Error(`${relativePath}: related must be a YAML list.`);
  }
  const content = value.slice(1, -1).trim();
  return content ? content.split(',').map((item) => unquote(item.trim())) : [];
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function normalizePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.?\//, '');
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function markdownFiles(directory, relativeDirectory = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = normalizePath(path.posix.join(relativeDirectory, entry.name));
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(absolutePath, relativePath)));
    } else if (path.extname(entry.name).toLowerCase() === '.md') {
      files.push(relativePath);
    }
  }
  return files;
}

function resolveDocumentPath(fromPath, linkPath) {
  const decoded = decodeURIComponent(linkPath);
  return normalizePath(path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), decoded)));
}

export async function buildManifest({ sourceDirectory, navigationPath }) {
  const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
  if (!Array.isArray(navigation)) {
    throw new Error('docs.navigation.json must contain an array.');
  }

  const listedPages = new Set();
  const pages = [];
  const documents = new Map();

  const loadDocument = async (relativePath) => {
    const normalized = normalizePath(relativePath);
    if (documents.has(normalized)) {
      return documents.get(normalized);
    }

    const absolutePath = path.join(sourceDirectory, ...normalized.split('/'));
    if (!(await exists(absolutePath))) {
      throw new Error(`Navigation references missing page "${normalized}".`);
    }

    const source = await readFile(absolutePath, 'utf8');
    const parsed = parseFrontMatter(source, normalized);
    const headings = [...parsed.body.matchAll(/^#\s+(.+)$/gm)];
    if (headings.length !== 1) {
      throw new Error(`${normalized}: expected exactly one H1 heading.`);
    }

    const expectedTitle = displayName(path.basename(normalized));
    const title = headings[0][1].trim();
    if (title !== expectedTitle) {
      throw new Error(`${normalized}: H1 must be "${expectedTitle}", received "${title}".`);
    }

    const document = { source, body: parsed.body, metadata: parsed.metadata, title };
    documents.set(normalized, document);
    return document;
  };

  const visitEntries = async (entries, parentDirectory = '', displayParents = []) => {
    const nodes = [];
    for (const entry of entries) {
      if (!entry || typeof entry.page !== 'string') {
        throw new Error('Every navigation entry must define a page.');
      }

      const pagePath = normalizePath(path.posix.join(parentDirectory, entry.page));
      if (listedPages.has(pagePath)) {
        throw new Error(`Duplicate navigation page "${pagePath}".`);
      }
      listedPages.add(pagePath);

      const document = await loadDocument(pagePath);
      const pageName = path.basename(pagePath);
      const descriptor = {
        id: pagePath,
        name: pageName,
        displayName: displayName(pageName),
        displayPath: [...displayParents, displayName(pageName)],
        title: document.title,
        path: pagePath,
        assetUrl: `docs/game-design/${pagePath}`,
        status: document.metadata.status,
        lastReviewed: document.metadata.lastReviewed,
        summary: document.metadata.summary,
        related: document.metadata.related.map((relatedPath) =>
          resolveDocumentPath(pagePath, relatedPath)
        )
      };
      descriptor.pageIndex = pages.length;
      pages.push(descriptor);

      if (entry.folder || entry.children) {
        const folderName = entry.folder;
        if (typeof folderName !== 'string' || !Array.isArray(entry.children)) {
          throw new Error(`${pagePath}: folder entries require "folder" and "children".`);
        }
        if (displayName(pageName) !== displayName(folderName)) {
          throw new Error(`${pagePath}: paired folder "${folderName}" must match the page name.`);
        }

        const folderPath = normalizePath(path.posix.join(parentDirectory, folderName));
        const absoluteFolder = path.join(sourceDirectory, ...folderPath.split('/'));
        if (!(await exists(absoluteFolder))) {
          throw new Error(`Navigation references missing folder "${folderPath}".`);
        }

        const children = await visitEntries(
          entry.children,
          folderPath,
          [...displayParents, displayName(folderName)]
        );
        nodes.push({
          ...descriptor,
          type: 'folder',
          children
        });
      } else {
        nodes.push({ ...descriptor, type: 'markdown' });
      }
    }
    return nodes;
  };

  const nodes = await visitEntries(navigation);
  const diskPages = await markdownFiles(sourceDirectory);
  const stalePages = diskPages.filter((page) => !listedPages.has(page));
  if (stalePages.length) {
    throw new Error(`Markdown pages missing from navigation: ${stalePages.join(', ')}.`);
  }

  for (const page of pages) {
    const document = documents.get(page.path);
    for (const relatedPath of page.related) {
      if (!listedPages.has(relatedPath)) {
        throw new Error(`${page.path}: related page "${relatedPath}" does not exist.`);
      }
    }

    for (const match of document.body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#', 1)[0];
      if (!target || /^(?:[a-z]+:|\/|#)/i.test(target) || !target.toLowerCase().endsWith('.md')) {
        continue;
      }
      const resolved = resolveDocumentPath(page.path, target);
      if (!listedPages.has(resolved)) {
        throw new Error(`${page.path}: broken Markdown link "${target}".`);
      }
    }
  }

  return {
    name: 'game-design',
    generatedAt: new Date().toISOString(),
    nodes,
    pages
  };
}

export async function generateManifest(projectDirectory) {
  const docsDirectory = path.join(projectDirectory, 'public', 'docs');
  const sourceDirectory = path.join(docsDirectory, 'game-design');
  const manifest = await buildManifest({
    sourceDirectory,
    navigationPath: path.join(sourceDirectory, 'docs.navigation.json')
  });
  await writeFile(
    path.join(docsDirectory, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  return manifest;
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isDirectRun) {
  try {
    const manifest = await generateManifest(path.resolve(scriptDirectory, '..'));
    console.log(`Generated documentation manifest with ${manifest.pages.length} markdown files.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
