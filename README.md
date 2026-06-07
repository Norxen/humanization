# Humanization

Humanization contains **Manuscript**, a backend-less Angular visualizer for the game-design knowledge base of **Roguelike Civilization Rebuilder** (working title).

Live site: <https://norxen.github.io/humanization/>

## Repository Layout

- `front/` contains the Angular application.
- `front/public/docs/game-design/` contains the authored Markdown knowledge base.
- `front/public/docs/game-design/docs.navigation.json` defines the file tree and reading order.
- `front/scripts/generate-docs-manifest.mjs` validates documents and generates the runtime manifest.
- `.github/workflows/deploy-pages.yml` builds and deploys the site to GitHub Pages.

## Local Development

Requirements: Node.js 24 and npm.

```bash
cd front
npm ci
npm start
```

Open <http://localhost:4200/>. The documentation manifest is regenerated before the development server starts.

## Validation

```bash
cd front
npm test
npm run build
```

`npm test` validates the documentation architecture before running Angular tests. A production build also regenerates and validates the manifest.

## Publishing

Pushes to `main` trigger the GitHub Pages workflow. It installs locked dependencies, generates the documentation manifest, builds Angular with the repository base path, and deploys the browser output.

See [CONTRIBUTING.md](CONTRIBUTING.md) before adding or reorganizing documentation.
