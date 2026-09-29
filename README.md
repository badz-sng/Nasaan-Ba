# Nasaan ba?

Local-first personal inventory app for Android and iOS, built with Expo Router, SQLite, and Drizzle. Inventory data and photos stay on the device.

## Implemented

- Paginated inventory, pull-to-refresh, recent items, and item detail.
- Item create/edit/archive/delete, including description, quantity, unit, condition, notes, category, and tags.
- Hierarchical locations with create, rename, reparent, delete confirmation, circular-move validation, and descendant path updates.
- Item moves with atomic location history, current-location selection, loading/error/retry states, and duplicate-move protection.
- FTS5 search over item details, category, location path, and tags; synchronized after edits, moves, and renames.
- Category management and tag create/rename/delete.
- Camera/library photos, resize/compression, persistent local storage, preview, replacement, and removal.
- Reminders with create/edit/complete/cancel/delete, optional item/location links, and local notifications.
- One-time, daily, weekly, and monthly notification triggers, permission handling, foreground reconciliation, and notification navigation.
- JSON backup export and validated, atomic restore, including photos, history, categories, tags, and reminders.
- App lock using enrolled device biometrics with device-passcode fallback; content hides when the app leaves the foreground.
- Settings for notification permission/retry, app lock, and backup.

## Run

```bash
npm ci
npx expo start
```

Native APIs need an Android/iOS device or development build. Camera permissions and notification/app-lock behavior must be checked on a device. Face ID requires an iOS development build.

Local reminders import through `src/services/localNotifications.ts`: the installed SDK 57 package's root export initializes remote push registration, which throws on Android Expo Go. The adapter imports local APIs directly and has a regression check against loading push registration. Recheck these package entry points when upgrading Expo. [Expo notification support](https://docs.expo.dev/versions/latest/sdk/notifications/).

## Architecture

Features reuse validation, services, repositories, and hooks. IDs are UUIDs. Locations store a materialized path/depth; renames and moves update descendants by identity.

The installed Drizzle Expo SQLite adapter uses **synchronous transaction callbacks**. Execute statements with `.run()`, `.all()`, or `.get()` inside those callbacks; never use an async callback. Native migration transactions use Expo SQLite's exclusive async transaction API.

Migrations run before screens access the database:

1. `0000_initial`: schema and integrity constraints.
2. `0001_fts_sync`: historical synchronization migration, superseded by `0002` and skipped on new/upgrading databases.
3. `0002_fts_rebuild`: replaces the contentless FTS table with readable rows, rebuilds existing data, and synchronizes all relevant item/location/category/tag changes.

SQL and TypeScript migration copies are checked by the database integration tests.

## Backup and reminder behavior

Backups use a versioned JSON envelope and include JPEG photos as base64. Imports are limited to 100 MiB and validate identities, references, hierarchy, history, and photo associations before replacing data. Database writes roll back together; staged photos are removed if restore fails. Existing photos are removed only after a successful replacement.

On Android, export saves to a folder selected with the system picker. On iOS, export uses the native share sheet. Restored notifications receive new device-specific identifiers. App-lock preferences stay on the device and are excluded from inventory backups.

Reminder time entry uses local `YYYY-MM-DD HH:mm`. Repeating reminders begin at the next matching time; monthly reminders on the 29th–31st skip months without that day. One-time overdue reminders remain visible but are not rescheduled automatically. Notification delivery is subject to device settings and OS limits.

## Verification

```bash
npm run typecheck
npm test -- --runInBand
npm run test:database
npx expo export --platform android --platform ios --output-dir dist --max-workers 2
git diff --check
```

Database integration tests require Node 24+ and exercise real SQLite plus the installed Drizzle driver through the Expo synchronous statement contract.

The lint script currently requires ESLint and configuration; these are not installed.

## Before release

- Run the native smoke checks in `projectprogess.md`, including permissions, background app lock, notifications, and file export/import.
- Verify layouts, accessibility, large inventories, and OS notification limits on Android and iOS.
- Configure lint, then complete native build/signing and store release setup.

Production JavaScript/Hermes bundle export is a build check, not a signed APK/IPA or store publication.
