# Humanization

Humanization contains **Manuscript**, an Angular and Firestore editor for the game-design knowledge base of **Roguelike Civilization Rebuilder** (working title).

Live site: <https://norxen.github.io/humanization/>

## Repository Layout

- `front/` contains the Angular application.
- `front/public/docs/game-design/` contains Markdown seed and export snapshots.
- `front/public/docs/game-design/docs.navigation.json` defines the file tree and reading order.
- `front/scripts/generate-docs-manifest.mjs` validates documents and generates the runtime manifest.
- Firestore stores authoritative runtime document bodies and immutable revisions.
- `.github/workflows/deploy-pages.yml` builds and deploys the site to GitHub Pages.

## Local Development

Requirements: Node.js 24, npm, and Java 21 for the Firestore emulator.

```bash
cd front
npm ci
npm run firebase:emulators
```

In a second terminal:

```bash
cd front
npm run firebase:seed:emulator
npm start
```

Open <http://localhost:4200/>. The emulator must remain running while reading or saving documents.

## Validation

```bash
cd front
npm test
npm run test:rules
npm run build
```

`npm test` validates the documentation architecture and Angular behavior. `npm run test:rules` validates Firestore security against an emulator.

## Firebase Production Setup

1. Create a Firebase project and Firestore database.
2. Deploy `front/firestore.rules` and `front/firestore.indexes.json`.
3. Authenticate Application Default Credentials and seed the current repository documents:

```bash
cd front
gcloud auth application-default login
npm run firebase:seed -- --project=<firebase-project-id>
```

4. Configure these GitHub repository variables:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_APP_CHECK_SITE_KEY`

5. Register the Pages domain in Firebase App Check, verify traffic, and then enforce App Check for Firestore.

The current rules intentionally permit public updates to existing documents. They deny create/delete operations and retain immutable revisions, but authentication must replace public writes before broader use.

## Publishing

Pushes to `main` trigger the GitHub Pages workflow. It writes Firebase runtime configuration from repository variables, generates the manifest, builds Angular, and deploys the browser output.

See [CONTRIBUTING.md](CONTRIBUTING.md) before adding or reorganizing documentation.
