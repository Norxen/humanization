# Manuscript Frontend

Manuscript is the Angular 21 application that renders the Roguelike Civilization Rebuilder design knowledge base as an ordered file tree and Markdown reader.

## Commands

```bash
npm ci
npm start
npm test
npm run build
```

`npm start`, `npm test`, and `npm run build` regenerate the documentation manifest first.

## Documentation Pipeline

Source documents live in `public/docs/game-design`. `docs.navigation.json` is the authoritative tree and reading order.

`scripts/generate-docs-manifest.mjs`:

- parses and validates front matter;
- checks one filename-matching H1 per page;
- enforces overview-page and folder pairing;
- rejects missing, duplicate, or unlisted pages;
- rejects broken internal Markdown and related-document links;
- writes `public/docs/manifest.json`.

The Angular store fetches the generated manifest and selected Markdown page at runtime. Front matter is removed before Markdown rendering. PlantUML blocks are rendered as theme-aware SVG diagrams with source and diagram views.

## Application Structure

- `src/app/core/` contains models and document, URL, Markdown, and theme services.
- `src/app/features/file-tree/` renders configured navigation.
- `src/app/features/markdown-viewer/` renders metadata, Markdown, PlantUML, and diagram controls.
- `src/app/shared/page-navigation/` renders configured previous/next pages.
- `src/app/layout/` contains the application shell.

## GitHub Pages

The production workflow passes the repository-specific base path to Angular and deploys `dist/front/browser`. Keep all static asset URLs base-path aware through `AppUrlService`.
