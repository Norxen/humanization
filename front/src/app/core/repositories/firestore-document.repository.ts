import { Injectable, inject } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { StoredDocument } from '../models/document-page.model';
import {
  DocumentConflictError,
  DocumentRepository
} from './document.repository';

interface FirestoreDocumentData {
  path: string;
  body: string;
  version: number;
  lastReviewed: string;
  createdAt?: { toDate(): Date };
  updatedAt?: { toDate(): Date };
}

@Injectable({ providedIn: 'root' })
export class FirestoreDocumentRepository extends DocumentRepository {
  private readonly firebase = inject(FirebaseService);

  async list(): Promise<StoredDocument[]> {
    const firestore = await this.firebase.firestore();
    const { collection, getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(firestore, 'documents'));
    return snapshot.docs
      .map((document) => this.mapDocument(document.data() as FirestoreDocumentData))
      .sort((left, right) => left.path.localeCompare(right.path));
  }

  async load(path: string): Promise<StoredDocument> {
    const firestore = await this.firebase.firestore();
    const { doc, getDoc } = await import('firebase/firestore');
    const snapshot = await getDoc(doc(firestore, 'documents', this.documentId(path)));
    if (!snapshot.exists()) {
      throw new Error(`Firestore document "${path}" does not exist.`);
    }
    return this.mapDocument(snapshot.data() as FirestoreDocumentData);
  }

  async create(path: string, body: string): Promise<StoredDocument> {
    const firestore = await this.firebase.firestore();
    const { doc, runTransaction, serverTimestamp } = await import(
      'firebase/firestore'
    );
    const reference = doc(firestore, 'documents', this.documentId(path));

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (snapshot.exists()) {
        throw new Error(`A document already exists at "${path}".`);
      }

      transaction.set(reference, {
        path,
        body,
        version: 1,
        lastReviewed: this.today(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    return this.load(path);
  }

  async delete(path: string): Promise<void> {
    const firestore = await this.firebase.firestore();
    const { collection, doc, getDocs, writeBatch } = await import(
      'firebase/firestore'
    );
    const reference = doc(firestore, 'documents', this.documentId(path));
    const revisions = await getDocs(collection(reference, 'revisions'));
    if (revisions.size > 499) {
      throw new Error('This document has too many revisions to delete safely.');
    }

    const batch = writeBatch(firestore);
    for (const revision of revisions.docs) {
      batch.delete(revision.ref);
    }
    batch.delete(reference);
    await batch.commit();
  }

  async save(
    path: string,
    body: string,
    expectedVersion: number
  ): Promise<StoredDocument> {
    const firestore = await this.firebase.firestore();
    const { doc, runTransaction, serverTimestamp } = await import(
      'firebase/firestore'
    );
    const reference = doc(firestore, 'documents', this.documentId(path));

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) {
        throw new Error(`Firestore document "${path}" does not exist.`);
      }

      const current = this.mapDocument(snapshot.data() as FirestoreDocumentData);
      if (current.version !== expectedVersion) {
        throw new DocumentConflictError(current);
      }

      const revision = doc(reference, 'revisions', String(current.version));
      transaction.set(revision, {
        path: current.path,
        body: current.body,
        version: current.version,
        lastReviewed: current.lastReviewed,
        createdAt: serverTimestamp()
      });
      transaction.update(reference, {
        body,
        version: current.version + 1,
        lastReviewed: this.today(),
        updatedAt: serverTimestamp()
      });
    });

    return this.load(path);
  }

  private documentId(path: string): string {
    return encodeURIComponent(path);
  }

  private mapDocument(data: FirestoreDocumentData): StoredDocument {
    return {
      path: data.path,
      body: data.body,
      version: data.version,
      lastReviewed: data.lastReviewed,
      createdAt: data.createdAt?.toDate() ?? null,
      updatedAt: data.updatedAt?.toDate() ?? null
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
