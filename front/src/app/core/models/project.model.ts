export type ProjectStatus = 'active' | 'archived';
export type ProjectRole = 'owner' | 'editor';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
  template: string;
  documentCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  archivedAt: Date | null;
}

export interface ProjectMembership {
  userId: string;
  role: ProjectRole;
  addedAt: Date | null;
}

export interface ProjectAccess {
  role: ProjectRole | 'admin' | null;
  canManage: boolean;
}

export interface CreateProjectInput {
  name: string;
  slug: string;
  description: string;
}

export interface ProjectTemplateDocument {
  path: string;
  body: string;
  status: 'planned' | 'draft' | 'review' | 'approved';
  summary: string;
  related: string[];
  order: number;
}
