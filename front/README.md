# Manuscript Frontend

Manuscript is the Angular 21 application that renders and edits multiple public game-design knowledge bases using Firestore.

## Commands

```bash
npm ci
npm run firebase:emulators
npm run firebase:migrate:projects:emulator
npm start
npm test
npm run test:rules
npm run build
```

`npm start`, `npm test`, and `npm run build` regenerate the documentation manifest first.

## Documentation Pipeline

Repository snapshots live in `public/docs/game-design` and remain seed/export material for the original project. Firestore is authoritative for runtime projects, navigation metadata, Markdown bodies, membership, and revisions.

`scripts/generate-docs-manifest.mjs`:

- parses and validates front matter;
- checks one filename-matching H1 per page;
- enforces overview-page and folder pairing;
- rejects missing, duplicate, or unlisted pages;
- rejects broken internal Markdown and related-document links;
- writes `public/docs/manifest.json`.

The Angular store fetches the generated manifest, then loads the selected body from Firestore. Metadata remains in the manifest except for the runtime review date. PlantUML blocks are rendered as theme-aware SVG diagrams with source and diagram views.

## Firestore

- `projects/{projectId}` stores lobby metadata, ownership, lifecycle state, and counts.
- `projects/{projectId}/members/{uid}` stores owner/editor roles.
- `projects/{projectId}/documents/{encodeURIComponent(path)}` stores body, metadata, order, and version.
- `projects/{projectId}/documents/{id}/revisions/{version}` stores immutable previous bodies.
- `platformAdmins/{uid}` authorizes project creation and archive recovery.
- Saves use transactions and reject stale versions.
- Documents can be created, updated, and deleted. Parent pages must be emptied before deletion.
- The runtime tree is inferred from Firestore paths. A page becomes a folder-style entry whenever it has child pages.
- The editor persists unsaved drafts in `localStorage`.
- Reading active projects is public. Firebase authentication plus project membership is required for document writes.

Run the emulator in one terminal and seed it from another before starting Angular. Production seeding uses Application Default Credentials and refuses to overwrite existing records unless `--force` is supplied.

Local Angular startup generates an ignored `public/firebase-config.json` that points to the Firestore emulator and contains only dummy Firebase identifiers:

```bash
npm run firebase:emulators
```

In another terminal:

```bash
npm run firebase:migrate:projects:emulator
npm start
```

Open the Emulator UI at `http://127.0.0.1:4000` and create an Authentication user with UID `editor-user` to use the seeded local owner/admin membership.

Do not place production Firebase values in `public/firebase-config.json`. Production configuration is generated only by the deployment workflow.

For production:

1. Open Firebase Console > Authentication > Sign-in method and enable **Email/Password** and **Google**.
2. Open Authentication > Users and create each editor account.
3. Copy the administrator UID and create `platformAdmins/{uid}` in Firestore.
4. Open Authentication > Settings > Authorized domains and add `norxen.github.io`.
5. Deploy the authenticated Firestore rules before exposing create/edit/delete controls.

Passwords are handled by Firebase Authentication over HTTPS and are never stored in Firestore, application code, or browser storage by Manuscript. The application stores only Firebase's managed authentication session.

Email/password users can change their password from the top navigation. The flow reauthenticates with the current password before asking Firebase to update it. Google-only users do not see this action because their password is managed by Google.

## Application Structure

- `src/app/core/` contains models and document, URL, Markdown, and theme services.
- `src/app/features/project-lobby/` renders the project card grid and archive view.
- `src/app/features/project-workspace/` hosts the routed document workspace.
- `src/app/features/file-tree/` renders project-scoped navigation.
- `src/app/features/markdown-viewer/` renders metadata, Markdown, PlantUML, and diagram controls.
- `src/app/features/document-editor/` provides validated Markdown editing, preview, draft recovery, and conflict comparison.
- `src/app/shared/page-navigation/` renders configured previous/next pages.
- `src/app/layout/` contains the application shell.

## GitHub Pages

The production workflow writes the ignored `public/firebase-config.json` from `secrets.SECRET_API_KEY_FIREBASE` and the remaining GitHub variables, passes the repository-specific base path to Angular, and deploys `dist/front/browser`. `firebase-config.example.json` documents the expected shape without containing credentials. Keep all static asset URLs base-path aware through `AppUrlService`.
