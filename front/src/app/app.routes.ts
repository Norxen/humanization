import { Routes } from '@angular/router';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/project-lobby/project-lobby').then((module) => module.ProjectLobby),
    title: 'Manuscript | Projects'
  },
  {
    path: 'projects/:projectId/:slug',
    loadComponent: () =>
      import('./features/project-workspace/project-workspace')
        .then((module) => module.ProjectWorkspace),
    canDeactivate: [pendingChangesGuard],
    title: 'Manuscript | Project'
  },
  { path: '**', redirectTo: '' }
];
