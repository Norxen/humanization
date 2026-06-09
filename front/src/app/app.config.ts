import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DOCUMENT_REPOSITORY } from './core/repositories/document.repository';
import { FirestoreDocumentRepository } from './core/repositories/firestore-document.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: FirestoreDocumentRepository
    }
  ]
};
