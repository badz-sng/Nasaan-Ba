# Project Progress

Updated: 2026-09-29  
Repository: `nasaan-ba`

This report replaces the 2026-08-26 snapshot. The old README/report understated implemented categories, tags, search, and tests.

## Current implementation

| Area | Status |
|---|---|
| Setup, schema, migrations, default seed | Implemented |
| Location hierarchy | Create, rename/reparent, delete confirmation, ancestor checks, descendant path maintenance |
| Item CRUD | Create/read/edit/archive/delete; description, quantity, unit, condition, notes, category and tags |
| Item location/history | Move picker, current-selection highlight, history, error/retry UI, duplicate-move protection |
| Search | Mutable FTS5 index, existing-data rebuild, item/location/category/tag synchronization |
| Categories/tags | Management UI, tag rename, item add/edit assignment |
| Photos | Camera/library, resize/JPEG compression, durable storage, preview, replace/remove |
| Reminders/notifications | CRUD/status actions, item links, one-time/daily/weekly/monthly triggers, permissions, reconciliation, notification navigation |
| Backup/restore | Native JSON export/import, photos, strict validation, atomic replacement and rollback |
| App lock | SecureStore setting, enrolled biometrics/device fallback, background-content hiding, authenticated settings changes |
| Settings | Notification permission/retry and links to lock/backup |
| UI | Scrollable item forms, busy states, retry paths, Back navigation |
| Release preparation | Android/iOS production bundle export; native release remains pending |

## Integrity fixes

- Converted item/location Drizzle transaction callbacks to synchronous execution so writes cannot commit early.
- Same-location moves are no-ops; failed moves and updates preserve the previous item/history/tags.
- Migration `0002_fts_rebuild` replaces the incompatible contentless FTS table. Search retains tags and paths after item edits, and follows category/tag/location renames.
- Descendant path updates use hierarchy IDs rather than path-prefix matching, which was ambiguous for duplicate names and SQL wildcard characters.
- Migration failures close/reset the cached connection; boot Retry runs initialization again.
- Concurrent boot requests share initialization, and default seeding executes atomically to avoid duplicate categories/system locations.
- Fresh installs and upgrades from either `0000` or `0001` go directly to `0002`; the incompatible historical sync migration is not rerun.
- Backup validation rejects unsupported versions, duplicate IDs, broken references, circular hierarchy, invalid current history, and missing photos before touching inventory.
- Restore stages photos, rolls back all database tables on failure, and removes previous photos only after commit.
- Notification mutations/reconciliation are serialized; orphaned notifications are cancelled after related data is removed.
- Fixed Android Expo Go startup: local notification imports bypass the SDK 57 root export's remote push auto-registration. This exception caused misleading missing-default-export warnings across routes. The Android bundle was checked to contain no push registration modules.
- Photo replacement preserves the old file until the item update commits.

## Verification

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: 11 suites / 45 tests passed, including the local-only notification import regression.
- `npm run test:database`: 5 checks passed, covering boot/seeding, fresh/existing migrations, FTS updates, repository rollback, duplicate-name location moves, backup/photo round-trip, and failed-restore rollback.
- Android/iOS Metro/Hermes production export to ignored `dist/`: passed.
- `git diff --check`: passed.

Native/device testing has not been performed. ESLint/configuration remains absent.

## Native smoke checks before release

1. Create nested locations; rename and reparent a parent; confirm descendant paths and search results. Attempt a self/descendant move.
2. Create/edit an item with category, tags, all optional fields, and a photo. Clear notes and remove tags/category/photo. Confirm saved values.
3. Move the item, retry a failed load, and inspect history. Select its current location again and verify no extra history entry.
4. Capture/select photos; deny/cancel permissions; replace a photo. Ensure Save waits for photo processing.
5. Create/edit one-time and repeating reminders. Verify delivery while the app is foregrounded/backgrounded, notification navigation, completion/cancellation, and deletion cleanup.
6. Export to an Android-selected folder or iOS share target. Restore on a fresh install; verify photos/search/history and device-specific notifications.
7. Try malformed/future-version backups and confirm inventory is unchanged. Check permission-denied notification restore/retry.
8. Enable app lock, restart, background the app, and open the Android notification tray. Cancel/fail authentication; confirm content remains hidden. Authenticate before disabling the lock.
9. Verify safe areas, keyboard behavior, screen-reader labels, large forms/inventories, and bottom navigation on both platforms.
10. Configure lint, build/sign native binaries, and complete store release setup.

## Deliberate limits

- No new runtime dependency was added.
- Backups are in-memory JSON, capped at 100 MiB; a streaming archive can replace this when larger inventories require it.
- Location descendant counting favors small personal inventories.
- Reminders use a local text date/time field and native recurring triggers.
- Archive viewing/unarchive and additional item-status controls are not exposed in the UI.
- Web, multi-device sync, signed release builds, and store publication are outside the completed native MVP.
