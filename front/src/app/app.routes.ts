import { Routes } from '@angular/router';

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
    title: 'Manuscript | Project'
  },
  { path: '**', redirectTo: '' }
];
