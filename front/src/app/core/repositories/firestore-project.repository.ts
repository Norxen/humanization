import { Injectable, inject } from '@angular/core';
import {
  CreateProjectInput,
  Project,
  ProjectMembership,
  ProjectTemplateDocument
} from '../models/project.model';
import { FirebaseService } from '../services/firebase.service';
import { ProjectRepository } from './project.repository';

interface FirestoreProjectData {
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  status: 'active' | 'archived';
  template: string;
  documentCount: number;
  createdAt?: { toDate(): Date };
  updatedAt?: { toDate(): Date };
  archivedAt?: { toDate(): Date } | null;
}

@Injectable({ providedIn: 'root' })
export class FirestoreProjectRepository extends ProjectRepository {
  private readonly firebase = inject(FirebaseService);

  async listActive(): Promise<Project[]> {
    return this.listByStatus('active');
  }

  async listArchived(): Promise<Project[]> {
    return this.listByStatus('archived');
  }

  async load(projectId: string): Promise<Project> {
    const firestore = await this.firebase.firestore();
    const { doc, getDoc } = await import('firebase/firestore');
    const snapshot = await getDoc(doc(firestore, 'projects', projectId));
    if (!snapshot.exists()) {
      throw new Error('Project not found.');
    }
    return this.mapProject(snapshot.id, snapshot.data() as FirestoreProjectData);
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    const firestore = await this.firebase.firestore();
    const { doc, getDoc } = await import('firebase/firestore');
    return (await getDoc(doc(firestore, 'platformAdmins', userId))).exists();
  }

  async role(projectId: string, userId: string): Promise<'owner' | 'editor' | null> {
    const firestore = await this.firebase.firestore();
    const { doc, getDoc } = await import('firebase/firestore');
    const snapshot = await getDoc(
      doc(firestore, 'projects', projectId, 'members', userId)
    );
    return snapshot.exists()
      ? (snapshot.data()['role'] as 'owner' | 'editor')
      : null;
  }

  async create(
    input: CreateProjectInput,
    ownerId: string,
    documents: ProjectTemplateDocument[]
  ): Promise<Project> {
    const firestore = await this.firebase.firestore();
    const { collection, doc, serverTimestamp, writeBatch } = await import(
      'firebase/firestore'
    );
    const reference = doc(collection(firestore, 'projects'));
    const slugReference = doc(firestore, 'projectSlugs', input.slug);
    const batch = writeBatch(firestore);
    batch.set(reference, {
      ...input,
      ownerId,
      status: 'active',
      template: 'game-design-v1',
      documentCount: documents.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      archivedAt: null
    });
    batch.set(slugReference, { projectId: reference.id });
    batch.set(doc(reference, 'members', ownerId), {
      role: 'owner',
      addedAt: serverTimestamp()
    });
    for (const document of documents) {
      batch.set(doc(reference, 'documents', encodeURIComponent(document.path)), {
        ...document,
        version: 1,
        lastReviewed: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: ownerId
      });
    }
    await batch.commit();
    return this.load(reference.id);
  }

  async update(
    project: Project,
    changes: Pick<Project, 'name' | 'slug' | 'description'>
  ): Promise<Project> {
    const firestore = await this.firebase.firestore();
    const { doc, serverTimestamp, writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'projects', project.id), {
      ...changes,
      updatedAt: serverTimestamp()
    });
    if (changes.slug !== project.slug) {
      batch.delete(doc(firestore, 'projectSlugs', project.slug));
      batch.set(doc(firestore, 'projectSlugs', changes.slug), {
        projectId: project.id
      });
    }
    await batch.commit();
    return this.load(project.id);
  }

  async archive(project: Project): Promise<void> {
    const firestore = await this.firebase.firestore();
    const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(firestore, 'projects', project.id), {
      status: 'archived',
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  async restore(project: Project): Promise<void> {
    const firestore = await this.firebase.firestore();
    const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(firestore, 'projects', project.id), {
      status: 'active',
      archivedAt: null,
      updatedAt: serverTimestamp()
    });
  }

  async listMembers(projectId: string): Promise<ProjectMembership[]> {
    const firestore = await this.firebase.firestore();
    const { collection, getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(
      collection(firestore, 'projects', projectId, 'members')
    );
    return snapshot.docs.map((item) => ({
      userId: item.id,
      role: item.data()['role'],
      addedAt: item.data()['addedAt']?.toDate?.() ?? null
    }));
  }

  async addEditor(projectId: string, userId: string): Promise<void> {
    const firestore = await this.firebase.firestore();
    const { doc, serverTimestamp, setDoc } = await import('firebase/firestore');
    await setDoc(doc(firestore, 'projects', projectId, 'members', userId), {
      role: 'editor',
      addedAt: serverTimestamp()
    });
  }

  async removeEditor(projectId: string, userId: string): Promise<void> {
    const firestore = await this.firebase.firestore();
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(firestore, 'projects', projectId, 'members', userId));
  }

  async transferOwnership(project: Project, nextOwnerId: string): Promise<void> {
    const firestore = await this.firebase.firestore();
    const { doc, serverTimestamp, writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'projects', project.id), {
      ownerId: nextOwnerId,
      updatedAt: serverTimestamp()
    });
    batch.set(doc(firestore, 'projects', project.id, 'members', nextOwnerId), {
      role: 'owner',
      addedAt: serverTimestamp()
    });
    batch.set(doc(firestore, 'projects', project.id, 'members', project.ownerId), {
      role: 'editor',
      addedAt: serverTimestamp()
    });
    await batch.commit();
  }

  private async listByStatus(status: 'active' | 'archived'): Promise<Project[]> {
    const firestore = await this.firebase.firestore();
    const { collection, getDocs, orderBy, query, where } = await import(
      'firebase/firestore'
    );
    const snapshot = await getDocs(
      query(
        collection(firestore, 'projects'),
        where('status', '==', status),
        orderBy('updatedAt', 'desc')
      )
    );
    return snapshot.docs.map((item) =>
      this.mapProject(item.id, item.data() as FirestoreProjectData)
    );
  }

  private mapProject(id: string, data: FirestoreProjectData): Project {
    return {
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      ownerId: data.ownerId,
      status: data.status,
      template: data.template,
      documentCount: data.documentCount,
      createdAt: data.createdAt?.toDate() ?? null,
      updatedAt: data.updatedAt?.toDate() ?? null,
      archivedAt: data.archivedAt?.toDate() ?? null
    };
  }
}
