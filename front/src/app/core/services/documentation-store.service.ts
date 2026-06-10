import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DocumentDescriptor,
  DocumentationManifest,
  LoadedDocument,
  StoredDocument
} from '../models/document-page.model';
import { FileTreeNode } from '../models/file-tree-node.model';
import { MarkdownRendererService } from './markdown-renderer.service';
import { DOCUMENT_REPOSITORY } from '../repositories/document.repository';
import { AppUrlService } from './app-url.service';

@Injectable({ providedIn: 'root' })
export class DocumentationStore {
  private readonly renderer = inject(MarkdownRendererService);
  private readonly appUrl = inject(AppUrlService);
  private readonly repository = inject(DOCUMENT_REPOSITORY);
  private loadSequence = 0;

  readonly manifest = signal<DocumentationManifest | null>(null);
  readonly activePageIndex = signal(0);
  readonly activeDocument = signal<LoadedDocument | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly pages = computed(() => this.manifest()?.pages ?? []);
  readonly fileTree = computed(() => this.manifest()?.nodes ?? []);
  readonly previousPage = computed(() => this.pages()[this.activePageIndex() - 1]);
  readonly nextPage = computed(() => this.pages()[this.activePageIndex() + 1]);

  async initialize(): Promise<void> {
    try {
      const response = await fetch(this.appUrl.resolve('docs/manifest.json'));
      if (!response.ok) {
        throw new Error(`Manifest request failed with ${response.status}.`);
      }

      const staticManifest = (await response.json()) as DocumentationManifest;
      const documents = await this.repository.list();
      const manifest = this.buildRuntimeManifest(staticManifest, documents);
      this.manifest.set(manifest);
      const entryIndex = manifest.pages.findIndex(
        (page) => page.path.toLowerCase() === 'index.md'
      );
      await this.selectPage(entryIndex === -1 ? 0 : entryIndex);
    } catch (error) {
      this.loading.set(false);
      this.error.set(error instanceof Error ? error.message : 'Unable to load documentation.');
    }
  }

  async selectPage(index: number): Promise<void> {
    const descriptor = this.pages()[index];
    if (!descriptor) {
      return;
    }

    const sequence = ++this.loadSequence;
    this.activePageIndex.set(index);
    this.loading.set(true);
    this.error.set(null);

    try {
      const stored = await this.repository.load(descriptor.path);
      const runtimeDescriptor = {
        ...descriptor,
        lastReviewed: stored.lastReviewed
      };
      const html = await this.renderer.render(stored.body, runtimeDescriptor);
      if (sequence !== this.loadSequence) {
        return;
      }

      this.activeDocument.set({
        descriptor: runtimeDescriptor,
        title: this.extractTitle(stored.body, descriptor.name),
        readingTime: this.calculateReadingTime(stored.body),
        markdown: stored.body,
        html,
        version: stored.version,
        updatedAt: stored.updatedAt
      });
    } catch (error) {
      if (sequence === this.loadSequence) {
        this.error.set(error instanceof Error ? error.message : 'Unable to load document.');
      }
    } finally {
      if (sequence === this.loadSequence) {
        this.loading.set(false);
      }
    }
  }

  selectPath(path: string): Promise<void> {
    const index = this.pages().findIndex((page) => page.path === path);
    return index === -1 ? Promise.resolve() : this.selectPage(index);
  }

  previous(): Promise<void> {
    return this.selectPage(this.activePageIndex() - 1);
  }

  next(): Promise<void> {
    return this.selectPage(this.activePageIndex() + 1);
  }

  async saveCurrent(body: string, expectedVersion: number): Promise<LoadedDocument> {
    const current = this.activeDocument();
    if (!current) {
      throw new Error('No active document is available to save.');
    }

    const saved = await this.repository.save(
      current.descriptor.path,
      body,
      expectedVersion
    );
    const descriptor = {
      ...current.descriptor,
      lastReviewed: saved.lastReviewed
    };
    const html = await this.renderer.render(saved.body, descriptor);
    const loaded: LoadedDocument = {
      descriptor,
      title: this.extractTitle(saved.body, descriptor.name),
      readingTime: this.calculateReadingTime(saved.body),
      markdown: saved.body,
      html,
      version: saved.version,
      updatedAt: saved.updatedAt
    };
    this.activeDocument.set(loaded);
    return loaded;
  }

  async createDocument(parentPath: string | null, requestedName: string): Promise<void> {
    const name = this.normalizeDocumentName(requestedName);
    const parentDirectory = parentPath?.replace(/\.md$/i, '') ?? '';
    const path = parentDirectory ? `${parentDirectory}/${name}.md` : `${name}.md`;
    if (this.pages().some((page) => page.path.toLowerCase() === path.toLowerCase())) {
      throw new Error(`"${path}" already exists.`);
    }

    const stored = await this.repository.create(path, `# ${name}\n\n`);
    const current = this.manifest();
    if (!current) {
      throw new Error('Documentation navigation is not initialized.');
    }

    const manifest = this.buildRuntimeManifest(current, [
      ...this.pages().map((page) => this.descriptorAsStored(page)),
      stored
    ]);
    this.manifest.set(manifest);
    await this.selectPath(path);
  }

  async deleteDocument(path: string): Promise<void> {
    const current = this.manifest();
    if (!current) {
      throw new Error('Documentation navigation is not initialized.');
    }
    const descriptor = this.pages().find((page) => page.path === path);
    if (!descriptor) {
      throw new Error(`"${path}" does not exist.`);
    }

    const directory = path.replace(/\.md$/i, '');
    const hasChildren = this.pages().some((page) =>
      page.path.startsWith(`${directory}/`)
    );
    if (hasChildren) {
      throw new Error('Delete this page\'s children before deleting the parent page.');
    }

    await this.repository.delete(path);
    const remainingDocuments = (await this.repository.list()).filter(
      (document) => document.path !== path
    );
    const nextManifest = this.buildRuntimeManifest(current, remainingDocuments);
    const deletedIndex = descriptor.pageIndex;
    this.manifest.set(nextManifest);

    if (!nextManifest.pages.length) {
      this.activeDocument.set(null);
      this.activePageIndex.set(0);
      return;
    }

    const nextIndex = Math.min(deletedIndex, nextManifest.pages.length - 1);
    await this.selectPage(nextIndex);
  }

  private buildRuntimeManifest(
    staticManifest: DocumentationManifest,
    documents: StoredDocument[]
  ): DocumentationManifest {
    const staticByPath = new Map(
      staticManifest.pages.map((page) => [page.path.toLowerCase(), page])
    );
    const staticOrder = new Map(
      staticManifest.pages.map((page, index) => [page.path.toLowerCase(), index])
    );
    const descriptors = documents.map((document) => {
      const existing = staticByPath.get(document.path.toLowerCase());
      const displayName = this.fileName(document.path);
      return {
        ...(existing ?? {
          id: document.path,
          name: `${displayName}.md`,
          displayName,
          displayPath: document.path.replace(/\.md$/i, '').split('/'),
          title: displayName,
          path: document.path,
          assetUrl: '',
          status: 'draft' as const,
          summary: 'New documentation page.',
          related: []
        }),
        lastReviewed: document.lastReviewed,
        pageIndex: 0
      };
    });

    descriptors.sort((left, right) => {
      const leftOrder = staticOrder.get(left.path.toLowerCase());
      const rightOrder = staticOrder.get(right.path.toLowerCase());
      if (leftOrder !== undefined && rightOrder !== undefined) {
        return leftOrder - rightOrder;
      }
      if (leftOrder !== undefined) {
        return -1;
      }
      if (rightOrder !== undefined) {
        return 1;
      }
      return left.path.localeCompare(right.path);
    });
    descriptors.forEach((descriptor, index) => {
      descriptor.pageIndex = index;
    });

    return {
      ...staticManifest,
      generatedAt: new Date().toISOString(),
      pages: descriptors,
      nodes: this.buildTree(descriptors)
    };
  }

  private buildTree(pages: DocumentDescriptor[]): FileTreeNode[] {
    const nodes = new Map<string, FileTreeNode>();
    const roots: FileTreeNode[] = [];

    for (const page of pages) {
      nodes.set(page.path.replace(/\.md$/i, ''), {
        ...page,
        type: 'markdown'
      });
    }

    for (const page of pages) {
      const key = page.path.replace(/\.md$/i, '');
      const node = nodes.get(key)!;
      const slash = key.lastIndexOf('/');
      const parentKey = slash === -1 ? null : key.slice(0, slash);
      const parent = parentKey ? nodes.get(parentKey) : undefined;
      if (parent) {
        parent.children ??= [];
        parent.children.push(node);
        parent.type = 'folder';
      } else {
        roots.push(node);
      }
    }

    const sortChildren = (items: FileTreeNode[]): void => {
      items.sort((left, right) => {
        const leftIndex = left.pageIndex ?? Number.MAX_SAFE_INTEGER;
        const rightIndex = right.pageIndex ?? Number.MAX_SAFE_INTEGER;
        return leftIndex - rightIndex || left.displayName.localeCompare(right.displayName);
      });
      for (const item of items) {
        if (item.children) {
          sortChildren(item.children);
        }
      }
    };
    sortChildren(roots);
    return roots;
  }

  private normalizeDocumentName(requestedName: string): string {
    const name = requestedName
      .trim()
      .replace(/\.md$/i, '')
      .replace(/[\\/]/g, ' ')
      .replace(/\s+/g, ' ');
    if (!name || name === '.' || name === '..') {
      throw new Error('Enter a valid document name.');
    }
    return name;
  }

  private fileName(path: string): string {
    return path.split('/').at(-1)!.replace(/\.md$/i, '').replaceAll(/[-_]/g, ' ');
  }

  private descriptorAsStored(page: DocumentDescriptor): StoredDocument {
    const active = this.activeDocument();
    return {
      path: page.path,
      body: active?.descriptor.path === page.path ? active.markdown : `# ${page.title}\n`,
      version: active?.descriptor.path === page.path ? active.version : 1,
      lastReviewed: page.lastReviewed,
      createdAt: null,
      updatedAt: null
    };
  }

  private extractTitle(markdown: string, fallbackName: string): string {
    const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return heading ?? fallbackName.replace(/\.md$/i, '').replaceAll(/[-_]/g, ' ');
  }

  private calculateReadingTime(markdown: string): string {
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 220))} min read`;
  }

}
