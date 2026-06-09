# Contributing

## Documentation Workflow

Game-design documents live in `front/public/docs/game-design`.

1. Create or edit the Markdown seed page when changing structure or preparing an import.
2. Add it to `docs.navigation.json` in the intended reading order.
3. Add or update related-document paths.
4. Run `npm run docs:generate` from `front`.
5. Seed Firestore when the repository snapshot should replace runtime content.
6. Run `npm test` and `npm run test:rules` before pushing.

## Filenames and Structure

- Use descriptive filenames with spaces, such as `Player Progression.md`.
- Do not use numeric ordering prefixes or underscores.
- Every file has exactly one H1 matching its filename without `.md`.
- Every content-bearing folder requires a same-named overview page represented by one selectable folder entry in `docs.navigation.json`.
- Every Markdown page must appear exactly once in navigation.

## Front Matter

Every document begins with:

```yaml
---
status: planned
lastReviewed: 2026-06-07
summary: One sentence explaining the document.
related:
  - ../Systems/Core Loop.md
---
```

Valid statuses:

- `planned`: the page defines missing decisions and completion criteria.
- `draft`: a coherent design proposal exists.
- `review`: the proposal is ready for a design decision.
- `approved`: the decision is accepted and related pages agree.

Use `YYYY-MM-DD` dates. Related paths are relative to the current document.

## Links and Diagrams

- Use relative Markdown links ending in `.md`.
- Encode spaces in authored links as `%20`.
- Use fenced `plantuml` blocks for diagrams.
- Keep PlantUML source in Markdown and do not commit rendered PNG or SVG copies.

## Decisions and Questions

Cross-system unresolved questions belong in `Reference/Open Questions.md`. Accepted cross-document decisions belong in `Reference/Decision Log.md`. Update affected pages when a question is resolved.

## Application Changes

The Angular app is in `front/src`. Preserve static GitHub Pages hosting, Firestore runtime loading, local draft recovery, version-conflict protection, and App Check support. Test user-visible behavior in `front/src/app/app.spec.ts`.

Document creation, deletion, rename, move, and metadata editing are not supported by the runtime editor. Those changes still require repository updates, navigation validation, and a Firestore seed or future migration tool.
