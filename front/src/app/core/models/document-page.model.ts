import type { FileTreeNode } from './file-tree-node.model';
import { SafeHtml } from '@angular/platform-browser';

export type DocumentStatus = 'planned' | 'draft' | 'review' | 'approved';

export interface DocumentDescriptor {
  id: string;
  name: string;
  displayName: string;
  displayPath: string[];
  title: string;
  path: string;
  assetUrl: string;
  pageIndex: number;
  status: DocumentStatus;
  lastReviewed: string;
  summary: string;
  related: string[];
}

export interface DocumentationManifest {
  name: string;
  generatedAt: string;
  nodes: FileTreeNode[];
  pages: DocumentDescriptor[];
}

export interface LoadedDocument {
  descriptor: DocumentDescriptor;
  title: string;
  readingTime: string;
  markdown: string;
  html: SafeHtml;
}
