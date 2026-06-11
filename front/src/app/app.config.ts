import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DOCUMENT_REPOSITORY } from './core/repositories/document.repository';
import { FirestoreDocumentRepository } from './core/repositories/firestore-document.repository';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { PROJECT_REPOSITORY } from './core/repositories/project.repository';
import { FirestoreProjectRepository } from './core/repositories/firestore-project.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: FirestoreDocumentRepository
    },
    {
      provide: PROJECT_REPOSITORY,
      useExisting: FirestoreProjectRepository
    }
  ]
};
