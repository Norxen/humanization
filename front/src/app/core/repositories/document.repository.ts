import { InjectionToken } from '@angular/core';
import { StoredDocument } from '../models/document-page.model';

export abstract class DocumentRepository {
  abstract list(projectId: string): Promise<StoredDocument[]>;
  abstract load(projectId: string, path: string): Promise<StoredDocument>;
  abstract create(
    projectId: string,
    path: string,
    body: string,
    order: number
  ): Promise<StoredDocument>;
  abstract delete(projectId: string, path: string): Promise<void>;
  abstract save(
    projectId: string,
    path: string,
    body: string,
    expectedVersion: number
  ): Promise<StoredDocument>;
}

export const DOCUMENT_REPOSITORY = new InjectionToken<DocumentRepository>(
  'DOCUMENT_REPOSITORY'
);

export class DocumentConflictError extends Error {
  constructor(readonly latest: StoredDocument) {
    super('This document changed after editing began.');
    this.name = 'DocumentConflictError';
  }
}
