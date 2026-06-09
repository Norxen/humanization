---
status: approved
lastReviewed: 2026-06-07
summary: Authoring, naming, metadata, linking, navigation, diagram, and review rules for Manuscript documents.
related:
  - ../Reference.md
  - Decision Log.md
---
# Documentation Conventions

## Files and Headings

- Use descriptive title-case filenames with spaces.
- Every Markdown file must contain exactly one H1.
- The H1 must match the filename without `.md`.
- Every content-bearing folder must have a same-named overview page.

## Front Matter

Every document requires `status`, `lastReviewed`, `summary`, and `related`.

Valid statuses are `planned`, `draft`, `review`, and `approved`. Dates use `YYYY-MM-DD`. Related paths are relative to the current document.

## Navigation and Links

Add every page to `docs.navigation.json`. Navigation order controls the tree and previous/next controls.

- `{ page }` creates a leaf document.
- `{ page, folder, children }` creates one selectable folder. Its content comes from the same-named overview page; the tree must not show a duplicate document row.

Use relative Markdown links and include `.md`.

## Diagrams

PlantUML source lives inside fenced `plantuml` blocks. Do not commit rendered diagram exports when the source is available.

## Review Workflow

1. Mark undefined pages `planned`.
2. Change to `draft` when a coherent proposal exists.
3. Change to `review` when dependencies and open questions are explicit.
4. Change to `approved` only after the decision is accepted and related pages agree.
