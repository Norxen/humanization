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
  children?: FileTreeNode[];
}
