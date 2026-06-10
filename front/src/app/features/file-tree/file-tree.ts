import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FileTreeNode } from '../../core/models/file-tree-node.model';

@Component({
  selector: 'app-file-tree',
  imports: [NgTemplateOutlet],
  templateUrl: './file-tree.html',
  styleUrl: './file-tree.css'
})
export class FileTree {
  readonly nodes = input.required<FileTreeNode[]>();
  readonly activePageIndex = input.required<number>();
  readonly fileCount = input.required<number>();
  readonly canManage = input(false);
  readonly pageSelected = output<number>();
  readonly documentCreateRequested = output<string | null>();
  readonly documentDeleteRequested = output<FileTreeNode>();
  readonly expandedFolders = signal(new Set<string>());

  toggleFolder(id: string): void {
    this.expandedFolders.update((folders) => {
      const next = new Set(folders);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedFolders().has(id);
  }

  selectNode(node: FileTreeNode): void {
    if (node.type === 'folder') {
      this.toggleFolder(node.id);
    }

    if (node.pageIndex !== undefined) {
      this.pageSelected.emit(node.pageIndex);
    }
  }

  requestDocumentCreation(node: FileTreeNode | null): void {
    if (node) {
      this.expandedFolders.update((folders) => new Set(folders).add(node.id));
    }
    this.documentCreateRequested.emit(node?.path ?? null);
  }

  requestDocumentDeletion(node: FileTreeNode): void {
    this.documentDeleteRequested.emit(node);
  }
}
