# Manuscript Frontend

Manuscript is the Angular 21 application that renders and edits the Roguelike Civilization Rebuilder design knowledge base using Firestore.

## Commands

```bash
npm ci
npm run firebase:emulators
npm run firebase:seed:emulator
npm start
npm test
npm run test:rules
npm run build
```

`npm start`, `npm test`, and `npm run build` regenerate the documentation manifest first.

## Documentation Pipeline

Repository snapshots live in `public/docs/game-design`. `docs.navigation.json` remains the authoritative tree and reading order. Firestore is authoritative for runtime Markdown bodies.

`scripts/generate-docs-manifest.mjs`:

- parses and validates front matter;
- checks one filename-matching H1 per page;
- enforces overview-page and folder pairing;
- rejects missing, duplicate, or unlisted pages;
- rejects broken internal Markdown and related-document links;
- writes `public/docs/manifest.json`.

The Angular store fetches the generated manifest, then loads the selected body from Firestore. Metadata remains in the manifest except for the runtime review date. PlantUML blocks are rendered as theme-aware SVG diagrams with source and diagram views.

## Firestore

- `documents/{encodeURIComponent(path)}` stores the current Markdown body and version.
- `documents/{id}/revisions/{version}` stores immutable previous bodies.
- Saves use transactions and reject stale versions.
- Existing documents can be updated; client creation and deletion are denied.
- The editor persists unsaved drafts in `localStorage`.

Run the emulator in one terminal and seed it from another before starting Angular. Production seeding uses Application Default Credentials and refuses to overwrite existing records unless `--force` is supplied.

## Application Structure

- `src/app/core/` contains models and document, URL, Markdown, and theme services.
- `src/app/features/file-tree/` renders configured navigation.
- `src/app/features/markdown-viewer/` renders metadata, Markdown, PlantUML, and diagram controls.
- `src/app/features/document-editor/` provides validated Markdown editing, preview, draft recovery, and conflict comparison.
- `src/app/shared/page-navigation/` renders configured previous/next pages.
- `src/app/layout/` contains the application shell.

## GitHub Pages

The production workflow writes `public/firebase-config.json` from GitHub variables, passes the repository-specific base path to Angular, and deploys `dist/front/browser`. Keep all static asset URLs base-path aware through `AppUrlService`.
