# Focused Firebase Server API

## Summary

Add a Node.js 22 Firebase Functions backend for privileged, multi-record operations. Public reads and ordinary document saves remain direct Firestore operations.

Project administration, membership, document creation/deletion, and structural counters move exclusively to callable functions. Firebase Authentication remains responsible for passwords and OAuth.

## Backend API

Create TypeScript callable functions in `europe-west1`:

- `createProject({ name, slug, description })`
- `updateProject({ projectId, name, slug, description })`
- `archiveProject({ projectId })`
- `restoreProject({ projectId })`
- `listProjectMembers({ projectId })`
- `addProjectEditor({ projectId, email })`
- `removeProjectEditor({ projectId, userId })`
- `transferProjectOwnership({ projectId, email })`
- `createProjectDocument({ projectId, parentPath, name })`
- `deleteProjectDocument({ projectId, path })`

Each callable:

- requires Firebase Authentication;
- validates normalized input and project state;
- checks platform-admin, owner, or editor permissions server-side;
- uses Admin SDK transactions or bulk deletion;
- returns stable `HttpsError` codes;
- writes an immutable audit event.

Project creation remains platform-admin only. Restore remains platform-admin only. Owners and platform admins manage settings and members. Owners, editors, and admins create/delete documents.

## Data and Client Changes

- Add an Angular `PlatformApi` abstraction backed by Firebase callable functions and connected to the Functions emulator locally.
- Keep project/document repository read methods in Firestore, but route migrated mutation methods through `PlatformApi`.
- Resolve editor and ownership targets through Firebase Authentication email lookup.
- Return member summaries as `{ userId, email, role, addedAt }`; membership documents continue storing only role and timestamps.
- Store audit events under `projects/{projectId}/audit/{eventId}` with actor, action, target, timestamp, and safe operation metadata. No audit UI is included yet.
- Create project templates entirely on the server so clients cannot choose or alter template records.
- Document creation validates names, paths, collisions, ordering, H1, and document-count changes server-side.
- Document deletion rejects pages with children, recursively removes revisions, and updates the count consistently.
- Slug replacement, ownership transfer, and membership changes remain atomic.

## Security and Deployment

- Deny direct client writes to project creation/settings/lifecycle, slug reservations, memberships, document creation/deletion, and structural counts.
- Continue allowing authorized direct document-body updates with immutable revisions and version conflict checks.
- Add emulator tests for Functions, Auth, and Firestore together.
- Add a protected manual GitHub Actions backend workflow using Google Workload Identity Federation. It runs tests, builds Functions, and deploys Functions, rules, and indexes without service-account JSON secrets.
- Roll out in three controlled steps:
  1. Upgrade Firebase to Blaze and deploy functions without restricting existing writes.
  2. Deploy and verify the Angular client using the callable API.
  3. Deploy lockdown rules in the same release window.
- Keep App Check enforcement disabled initially for Functions, inspect valid production traffic, then enable it after the existing App Check configuration is confirmed.

## Tests

- Authorization tests for anonymous users, readers, editors, owners, and platform admins.
- Project tests for creation, unique slugs, rename, archive, restore, and template completeness.
- Membership tests for existing-email resolution, unknown emails, duplicate editors, removal, and ownership transfer.
- Document tests for valid creation, duplicate paths, invalid names, parent promotion, child-protected deletion, revision cleanup, and count integrity.
- Audit tests for event creation, immutable records, safe metadata, and denied public access.
- Angular tests for callable loading/error states, refreshed project/member state, and unchanged document-save conflict behavior.
- CI must run Angular tests, Functions tests, Firestore rule tests, and production builds before backend deployment.

## Assumptions

- Only existing Firebase Authentication users can be assigned by email; pending invitations are deferred.
- Audit events are stored but not displayed.
- Project exports and revision restoration remain later API additions.
- No custom password handling or general-purpose REST API is introduced.
- The Firebase project must use Blaze before production Functions deployment.
