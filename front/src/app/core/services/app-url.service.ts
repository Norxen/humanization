import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppUrlService {
  resolve(path: string): string {
    return new URL(path.replace(/^\/+/, ''), document.baseURI).toString();
  }

  relativePath(url: string, directory: string): string | null {
    const resolvedUrl = new URL(url, document.baseURI);
    const resolvedDirectory = new URL(
      directory.replace(/^\/+/, '').replace(/\/?$/, '/'),
      document.baseURI
    );

    if (
      resolvedUrl.origin !== resolvedDirectory.origin ||
      !resolvedUrl.pathname.startsWith(resolvedDirectory.pathname)
    ) {
      return null;
    }

    return decodeURI(
      resolvedUrl.pathname.slice(resolvedDirectory.pathname.length)
    );
  }
}
