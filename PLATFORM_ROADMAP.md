# Manuscript Platform Roadmap

## Purpose

This document records the next functional and engineering improvements for Manuscript. It covers the documentation platform itself, not the design of any game stored inside it.

## Product Direction

Manuscript should remain a lightweight public knowledge base with focused collaboration features:

- anyone can read active projects;
- authenticated project members can manage documentation;
- Markdown remains the portable source format;
- Firebase remains the identity and persistence platform;
- server infrastructure is added only where it provides meaningful authorization, integrity, or operational value.

## 1. Improve Markdown Editing

**Status:** Implemented locally. See [PLAN_FEATURE_1.md](PLAN_FEATURE_1.md).

### Decision

Replace the plain `<textarea>` with Milkdown visual editing, CodeMirror 6 source editing, and an optional preview mode without a permanent split view.

### Required Capabilities

- Markdown syntax highlighting.
- Line numbers and active-line visibility.
- Undo and redo history.
- Search and replace.
- Keyboard shortcuts, including `Ctrl+S` and `Cmd+S`.
- A small formatting toolbar for headings, emphasis, lists, links, and code.
- Optional preview mode using the existing Markdown and PlantUML renderer.
- Internal-document link completion from the active project's document paths.
- Light and dark themes aligned with Manuscript.

### Existing Behavior to Preserve

- Local draft recovery.
- Filename-matching H1 validation.
- Internal-link validation.
- Maximum document size validation.
- Debounced preview rendering.
- Optimistic version checks and conflict handling.
- Navigation and refresh warnings for unsaved changes.

### Completion Criteria

- The textarea is fully replaced without losing existing save or conflict behavior.
- Editing remains usable on desktop and mobile.
- Keyboard navigation and screen-reader labeling are tested.
- Large documents remain responsive.

## 2. Add a Focused Server API

### Decision

Do not proxy every Firestore read and write through Node. Firestore Security Rules remain responsible for ordinary project reads and document saves.

Add Firebase callable functions for privileged workflows that are difficult or unsafe to implement entirely in the browser.

### Initial Server Responsibilities

- Invite or assign editors by email instead of Firebase UID.
- Verify that an invited Firebase account exists.
- Create projects and apply the generic documentation template.
- Transfer project ownership.
- Archive and restore projects.
- Perform recursive document deletion, including revision cleanup.
- Restore a selected document revision.
- Export project documentation later.

### Authentication and Security

- Firebase Authentication continues handling passwords and OAuth.
- The frontend sends Firebase ID tokens through callable functions.
- Functions verify the authenticated user and project role before using the Admin SDK.
- App Check protects callable endpoints after production traffic is verified.
- Passwords are never sent to or stored by the custom API.
- Privileged operations produce audit records.

### Deployment Constraint

Deploying Cloud Functions requires Firebase's Blaze billing plan. Budget alerts and usage monitoring must be configured before production deployment.

## 3. Improve Membership Onboarding

Replace raw UID entry with an email-based flow:

1. An owner enters an email address.
2. A callable function finds the corresponding Firebase user.
3. The function validates the caller's project-management permission.
4. The function creates or updates the project membership.
5. The UI reports whether the user must sign in once before assignment is possible.

Email invitations with pending membership may be added later if assigning only existing Firebase accounts is too restrictive.

## 4. Tighten Destructive Operations

Move operations that affect multiple records into server-controlled functions:

- deleting a document and all revisions;
- validating that a parent document has no children before deletion;
- updating project document counts;
- changing ownership and both affected memberships;
- archiving and restoring project state.

Firestore Rules must still deny unauthorized direct writes. UI restrictions are not a security boundary.

## 5. Load Documents Efficiently

Project entry currently retrieves complete document records to build the tree. Split lightweight navigation metadata from large Markdown bodies so the client loads:

- project metadata and ordered document descriptors when opening a workspace;
- only the selected document body;
- additional bodies on demand for search or navigation.

This reduces Firestore reads, transfer size, startup latency, and memory usage as projects grow.

## 6. Expose Revision History

The persistence model already stores immutable revisions. Add:

- a version-history panel;
- timestamps and version numbers;
- side-by-side or inline comparison;
- revision restoration through the server API;
- the responsible editor when audit metadata is introduced.

Restoration creates a new current version. It must never modify or delete historical revisions.

## 7. Add Project Search

Start with client-side search over:

- document names and paths;
- summaries;
- headings;
- cached or explicitly loaded document bodies.

Do not introduce an external search service until project size or search quality proves it necessary.

## 8. Strengthen Continuous Integration

GitHub Pages deployment must be blocked unless these checks pass:

```bash
npm test -- --watch=false
npm run test:rules
npm run build
```

Add focused tests for callable-function authorization and emulator-backed privileged operations when the server API is introduced.

## 9. Maintenance Cleanup

- Resolve repository documentation that still describes the generated manifest as a runtime metadata source.
- Fix visible text-encoding defects such as the malformed separator in the editor toolbar.
- Keep dependency updates deliberate and automated.
- Add structured production error reporting before the user base grows.
- Add accessibility checks for dialogs, the file tree, editor controls, and keyboard-only workflows.

## Delivery Order

1. Integrate the CodeMirror single-pane editor.
2. Make tests and Firestore-rule checks mandatory in deployment.
3. Add the callable-function foundation and local emulator workflow.
4. Implement editor assignment by email.
5. Move destructive and ownership operations to callable functions.
6. Add revision history and restoration.
7. Separate navigation metadata from document bodies.
8. Add project search.
9. Add audit history, error reporting, and further operational tooling.

## Non-Goals

- Replacing Firebase Authentication with custom password handling.
- Building a general-purpose REST API around every Firestore operation.
- Adding real-time collaborative editing in the first editor upgrade.
- Introducing an external search provider before local search is insufficient.
- Moving away from portable Markdown documents.
