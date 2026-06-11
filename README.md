# Humanization

Humanization contains **Manuscript**, an Angular and Firestore platform for public game-design knowledge bases.

Live site: <https://norxen.github.io/humanization/>

## Repository Layout

- `front/` contains the Angular application.
- `front/public/docs/game-design/` contains the seed/export snapshot for the original project.
- Firestore projects own their runtime document metadata, tree order, members, and revisions.
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
npm run firebase:migrate:projects:emulator
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
2. Enable Firebase Authentication's Email/Password and Google providers, then create or sign in editor accounts.
3. Create `platformAdmins/{uid}` for accounts allowed to create and administer projects.
4. Add `norxen.github.io` to Authentication authorized domains.
5. Deploy `front/firestore.rules` and `front/firestore.indexes.json`.
6. Authenticate Application Default Credentials and migrate the existing global documents into the first project:

```bash
cd front
gcloud auth application-default login
npm run firebase:migrate:projects -- --project=<firebase-project-id> --owner=<firebase-user-uid> --dry-run
npm run firebase:migrate:projects -- --project=<firebase-project-id> --owner=<firebase-user-uid>
```

7. Configure `SECRET_API_KEY_FIREBASE` as a GitHub Actions repository secret. The workflow maps it to the build-time `FIREBASE_API_KEY` environment variable.

8. Configure these GitHub Actions repository variables:

- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_APP_CHECK_SITE_KEY`

9. Register the Pages domain in Firebase App Check, verify traffic, and then enforce App Check for Firestore.

Active projects are public. Platform admins create projects. Owners and project editors manage documents, while archived projects are visible only to platform admins.

## Publishing

Pushes to `main` trigger the GitHub Pages workflow. It writes the ignored Firebase runtime configuration from the API-key secret and repository variables, generates the manifest, builds Angular, and deploys the browser output.

See [CONTRIBUTING.md](CONTRIBUTING.md) before adding or reorganizing documentation.
