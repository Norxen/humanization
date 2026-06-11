import { Routes } from '@angular/router';
import { ProjectLobby } from './features/project-lobby/project-lobby';
import { ProjectWorkspace } from './features/project-workspace/project-workspace';

export const routes: Routes = [
  { path: '', component: ProjectLobby, title: 'Manuscript | Projects' },
  {
    path: 'projects/:projectId/:slug',
    component: ProjectWorkspace,
    title: 'Manuscript | Project'
  },
  { path: '**', redirectTo: '' }
];
