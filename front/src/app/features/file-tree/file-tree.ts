import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FileTreeNode } from '../../core/models/file-tree-node.model';
import { ContextMenu } from '../../shared/context-menu/context-menu';

@Component({
  selector: 'app-file-tree',
  imports: [NgTemplateOutlet, ContextMenu],
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
  readonly activeMenu = signal<string | null>(null);

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
    if (node.pageIndex !== undefined) {
      this.pageSelected.emit(node.pageIndex);
    }
  }

  requestDocumentCreation(node: FileTreeNode | null): void {
    this.activeMenu.set(null);
    if (node) {
      this.expandedFolders.update((folders) => new Set(folders).add(node.id));
    }
    this.documentCreateRequested.emit(node?.path ?? null);
  }

  requestDocumentDeletion(node: FileTreeNode): void {
    this.activeMenu.set(null);
    this.documentDeleteRequested.emit(node);
  }

  toggleMenu(nodeId: string): void {
    this.activeMenu.update((active) => active === nodeId ? null : nodeId);
  }
}
