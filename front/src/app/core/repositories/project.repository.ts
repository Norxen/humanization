import { InjectionToken } from '@angular/core';
import {
  CreateProjectInput,
  Project,
  ProjectMembership,
  ProjectTemplateDocument
} from '../models/project.model';

export abstract class ProjectRepository {
  abstract listActive(): Promise<Project[]>;
  abstract listArchived(): Promise<Project[]>;
  abstract load(projectId: string): Promise<Project>;
  abstract isPlatformAdmin(userId: string): Promise<boolean>;
  abstract role(projectId: string, userId: string): Promise<'owner' | 'editor' | null>;
  abstract create(
    input: CreateProjectInput,
    ownerId: string,
    documents: ProjectTemplateDocument[]
  ): Promise<Project>;
  abstract update(
    project: Project,
    changes: Pick<Project, 'name' | 'slug' | 'description'>
  ): Promise<Project>;
  abstract archive(project: Project): Promise<void>;
  abstract restore(project: Project): Promise<void>;
  abstract listMembers(projectId: string): Promise<ProjectMembership[]>;
  abstract addEditor(projectId: string, userId: string): Promise<void>;
  abstract removeEditor(projectId: string, userId: string): Promise<void>;
  abstract transferOwnership(
    project: Project,
    nextOwnerId: string
  ): Promise<void>;
}

export const PROJECT_REPOSITORY = new InjectionToken<ProjectRepository>(
  'PROJECT_REPOSITORY'
);
