import { FileTreeNode } from './file-tree-node.model';

export interface DocumentDescriptor {
  id: string;
  name: string;
  displayName: string;
  displayPath: string[];
  title: string;
  path: string;
  assetUrl: string;
  pageIndex: number;
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
  html: string;
}
