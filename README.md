# Nasaan ba?

Local-first personal inventory app for Android and iOS, built with Expo Router, SQLite, and Drizzle. Inventory data and photos stay on the device.

## Current status

Updated: **2026-10-02** (Asia/Manila).

Core native MVP functionality is implemented. The mock-up rollout now covers Home, Items, Item Details, and Locations. Add Item, the dedicated Search screen, and More/settings still need the full visual pass. Device QA, signed native builds, and store publication remain pending.

See [Project Progress](projectprogess.md) for screen-level status, verification evidence, and release checks. The existing filename is retained so links stay valid.

## Implemented

- Home dashboard with live active-item/location/category/pending-reminder totals, shortcuts, recent-item thumbnails, relative dates, and photo fallback.
- Items screen with a two-column photo grid, list toggle, name search, category/tag filters, name/recent sorting, tag chips, pagination, and item action menus. Filters and sorting run before pagination.
- Item Details with photo, category/tag chips, location card, quantity/condition/date/reminder cards, notes, fixed Move/Edit actions, and history/archive/delete in the overflow menu.
- Locations screen with search that retains ancestor context, expandable folder hierarchy, and active-item count badges including descendants.
- Shared teal actions/navigation, accessible button labels, loading/error/retry states, and safe-area handling on the redesigned screens.
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

If Expo Go keeps loading and the terminal reports `UnexpectedServerError`, use `npm run start:offline -- --clear` to bypass Expo API/development-certificate requests while serving Metro over LAN. Keep the phone and computer on the same Wi-Fi and scan the new QR code. Offline mode does not support tunnels or online Expo services. The local Android bundle and Expo Go manifest request passed on 2026-10-02; online API checks timed out in the diagnostic environment. Confirm startup on the phone before treating this workaround as resolved.
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

Verification rerun on **2026-10-02**: TypeScript passed; **16 Jest suites / 50 tests** and **8 SQLite integration checks** passed. UI tests cover interaction and layout props, including the real Expo Slot style merge; they do not establish visual fidelity on a device. Production export was last recorded as passed on **2026-09-29** and has not been rerun for the latest UI changes.

## Before release

- Run the native smoke checks in `projectprogess.md`, including permissions, background app lock, notifications, and file export/import.
- Verify layouts, accessibility, large inventories, and OS notification limits on Android and iOS.
- Configure lint, then complete native build/signing and store release setup.

Production JavaScript/Hermes bundle export is a build check, not a signed APK/IPA or store publication.

## Possible future improvements

These are proposed improvements, not implemented features or committed release dates.

| Priority | Improvement | Purpose |
|---|---|---|
| Next | Complete Add Item, Search & Filter, and More/settings styling | Finish the supplied mock-up across the remaining screens; use accessible inputs, photo controls, and keyboard-safe forms. |
| Next | Device QA and visual regression coverage | Compare real Android/iOS screens against the mock-up, including safe areas, large text, small screens, photo failures, and navigation. Existing renderer tests verify behavior, not pixel accuracy. |
| Next | Native release preparation | Configure ESLint, run checks in CI, repeat production exports after the UI changes, and build/sign APK/AAB and IPA binaries. |
| Next | Archive browser and restore action | Let users find and unarchive items through the UI instead of leaving archived records hidden. |
| Later | Richer search and filters | Add location, condition, and reminder filters; share query behavior between Items and Search. Items currently searches names; Search uses FTS across item details. |
| Later | Better reminder entry | Replace manual date/time entry with native pickers and explain repeating/overdue reminders more clearly. |
| Later | Accessibility and visual consistency | Refine icons and brand artwork, selected navigation states, screen-reader flow, contrast, dark mode, and large-text layouts. |
| Later | Large-inventory performance | Measure query/tree/photo performance, debounce Items search, and improve rendering or indexes only where measurements show a problem. |
| Later | Bulk inventory actions | Add multi-select for move, archive, and tag assignment with clear confirmation and atomic writes. |
| When needed | Backup portability and scale | Consider CSV export and a streaming photo archive when the current 100 MiB in-memory JSON backup ceiling becomes restrictive. |
| When needed | Optional encrypted sync | Add opt-in multi-device sync only with conflict handling, privacy controls, and a local/offline fallback. |
| When needed | Barcode/QR-assisted entry | Reduce repeated manual entry when users have inventories that benefit from scanning. |
