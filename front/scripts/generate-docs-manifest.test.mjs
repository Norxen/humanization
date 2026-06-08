import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildManifest, parseFrontMatter } from './generate-docs-manifest.mjs';

function markdown(title, overrides = '') {
  return `---
status: draft
lastReviewed: 2026-06-07
summary: Test summary.
related: []
${overrides}---
# ${title}

Test body.
`;
}

async function fixture(files, navigation) {
  const root = await mkdtemp(path.join(tmpdir(), 'manuscript-docs-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  const navigationPath = path.join(root, 'docs.navigation.json');
  await writeFile(navigationPath, JSON.stringify(navigation), 'utf8');
  return { sourceDirectory: root, navigationPath };
}

test('uses configured order and pairs pages with folders', async () => {
  const options = await fixture(
    {
      'Index.md': markdown('Index'),
      'Systems.md': markdown('Systems'),
      'Systems/Core Loop.md': markdown('Core Loop')
    },
    [
      { page: 'Index.md' },
      {
        page: 'Systems.md',
        folder: 'Systems',
        children: [{ page: 'Core Loop.md' }]
      }
    ]
  );

  const manifest = await buildManifest(options);
  assert.deepEqual(manifest.pages.map((page) => page.path), [
    'Index.md',
    'Systems.md',
    'Systems/Core Loop.md'
  ]);
  assert.equal(manifest.nodes[1].displayName, 'Systems');
  assert.equal(manifest.nodes[2].type, 'folder');
});

test('supports reserved paired folders with no document children', async () => {
  const options = await fixture(
    {
      'Production.md': markdown('Production'),
      'Production/MVP Scope.md': markdown('MVP Scope'),
      'Production/MVP Scope/.gitkeep': ''
    },
    [
      {
        page: 'Production.md',
        folder: 'Production',
        children: [
          {
            page: 'MVP Scope.md',
            folder: 'MVP Scope',
            children: []
          }
        ]
      }
    ]
  );

  const manifest = await buildManifest(options);
  const productionFolder = manifest.nodes[1];
  assert.equal(productionFolder.children[1].type, 'folder');
  assert.deepEqual(productionFolder.children[1].children, []);
});

test('parses front matter metadata', () => {
  const parsed = parseFrontMatter(
    `---
status: review
lastReviewed: 2026-06-07
summary: "A summary."
related:
  - Systems.md
---
# Index
`,
    'Index.md'
  );
  assert.equal(parsed.metadata.status, 'review');
  assert.deepEqual(parsed.metadata.related, ['Systems.md']);
  assert.match(parsed.body, /^# Index/);
});

test('rejects stale pages not listed in navigation', async () => {
  const options = await fixture(
    { 'Index.md': markdown('Index'), 'Stale.md': markdown('Stale') },
    [{ page: 'Index.md' }]
  );
  await assert.rejects(() => buildManifest(options), /missing from navigation: Stale.md/);
});

test('rejects duplicate navigation pages', async () => {
  const options = await fixture(
    { 'Index.md': markdown('Index') },
    [{ page: 'Index.md' }, { page: 'Index.md' }]
  );
  await assert.rejects(() => buildManifest(options), /Duplicate navigation page/);
});

test('rejects invalid page and folder pairs', async () => {
  const options = await fixture(
    {
      'Systems.md': markdown('Systems'),
      'Design/Core Loop.md': markdown('Core Loop')
    },
    [
      {
        page: 'Systems.md',
        folder: 'Design',
        children: [{ page: 'Core Loop.md' }]
      }
    ]
  );
  await assert.rejects(() => buildManifest(options), /must match the page name/);
});

test('rejects broken internal links', async () => {
  const options = await fixture(
    {
      'Index.md': markdown('Index').replace('Test body.', '[Missing](Missing.md)')
    },
    [{ page: 'Index.md' }]
  );
  await assert.rejects(() => buildManifest(options), /broken Markdown link/);
});
