import type { DocumentStatus } from './document-page.model';

export interface FileTreeNode {
  id: string;
  name: string;
  displayName: string;
  displayPath?: string[];
  title?: string;
  type: 'folder' | 'markdown';
  path?: string;
  assetUrl?: string;
  pageIndex?: number;
  status?: DocumentStatus;
  lastReviewed?: string;
  summary?: string;
  related?: string[];
  children?: FileTreeNode[];
}
