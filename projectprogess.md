# Project Progress

Updated: 2026-10-02 (Asia/Manila)
Repository: `nasaan-ba`

**Status: core native MVP implemented; UI rollout and release validation in progress.**

This snapshot includes the mock-up work through Locations. Functional completion, visual verification, and release readiness are tracked separately; no completion percentage is assigned.

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
| UI | Home, Items, Item Details, and Locations redesigned; shared actions/navigation; remaining screens need a full visual pass |
| Release preparation | Production bundle export passed in the 2026-09-29 snapshot; rerun after latest UI work and signed native release remain pending |

## Mock-up rollout

| Screen/area | Implemented in code | Remaining validation/work |
|---|---|---|
| Actions/navigation | Shared teal primary/secondary/danger buttons, pressed/disabled feedback, Home → Items → Search → Locations → More tab order | Full icon/brand fidelity and selected tab appearance on device |
| Home | Greeting/settings shortcut, search entry, live totals, Add action, recent photos/location/date, responsive width | User screenshots reviewed and side spacing corrected; final visual QA across devices pending |
| Items | Photo grid/list toggle, name search, category/tag selectors, sorting, real tag chips, action menu, pagination | Device layout/interaction QA; mock-up visual comparison pending |
| Item Details | Photo/fallback, chips, location picker, metadata/reminder/notes cards, Move/Edit footer; history/archive/delete menu | Device QA for footer, keyboard, modal selection, and returning from reminders |
| Locations | Header Add/search, nested folders/connectors, expand/collapse, search with ancestor context, subtree item counts | Device visual QA and large/deep hierarchy testing |
| Add Item | Existing functional form, shared buttons, photo and location selection | Full mock-up layout and form controls pending |
| Search & Filter | Existing debounced FTS search and result navigation | Mock-up filters, sort controls, reminder switch, and photo result layout pending |
| More/settings | Shared navigation actions and existing management screens | Consistent visual pass for categories, tags, reminders, backup, app lock, settings, and About |

## Recent implementation changes

- Fixed lost Home layouts caused by Expo Link/Slot merging callback styles; LinkPressable keeps pressed-state styling inside the component. Regression coverage uses the real Slot implementation.
- Removed Home's fixed width limit and kept 16-pixel side padding after reviewing user screenshots.
- Added database-backed dashboard counts, excluding archived items and completed/cancelled reminders from their respective totals.
- Items search/filter/sort executes before pagination; request generations discard stale search results and prevent duplicate page loads.
- Detail queries now return actual tag names and item-scoped pending reminders. Reminder refresh follows screen focus.
- Move and location-card actions share a controlled location picker; original Add Item picker behavior remains supported.
- Location counts include current active items only, then aggregate descendants in the tree. History rows and archived items do not inflate badges.

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
- `npm test -- --runInBand`: 16 suites / 50 tests passed, including the local-only notification import regression.
- `npm run test:database`: 8 checks passed, covering boot/seeding, fresh/existing migrations, FTS updates, repository rollback, duplicate-name location moves, backup/photo round-trip, and failed-restore rollback.
- Android/iOS Metro/Hermes production export to ignored `dist/`: passed on 2026-09-29; not rerun after the latest UI changes.
- `git diff --check`: passed for this documentation update.

Fresh TypeScript/Jest/database checks were run on 2026-10-02. The added checks cover Home navigation/fallbacks, item detail Move/Edit/Save, pagination races, location search/expansion, real tag chips, scoped reminders, and subtree counts.

Home visual issues were reviewed through user screenshots. A complete Android/iOS native smoke run and visual sign-off are not recorded; the emulator was offline during the latest implementation checks. ESLint/configuration remains absent.

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

## Next steps

1. Finish Add Item and Search & Filter against the supplied mock-up, then align More/settings.
2. Run the native smoke checks below plus screenshot comparisons on the redesigned screens.
3. Configure lint/CI, repeat production exports, and prepare signed native builds.

## Native validation additions

- Check Home counts after item archive, location changes, category edits, and reminder completion.
- Search/filter/sort beyond the first Items page; switch grid/list and verify tag chips and item menus.
- In Item Details, test photo failure, Move, Edit/Save/Cancel, reminder return navigation, and the overflow actions.
- In Locations, verify badges after moves/archives, search a collapsed descendant, retain parent context, and confirm expanding does not also select/edit a location.

## Deliberate limits

- No new runtime dependency was added.
- Backups are in-memory JSON, capped at 100 MiB; a streaming archive can replace this when larger inventories require it.
- Location descendant counting favors small personal inventories.
- Reminders use a local text date/time field and native recurring triggers.
- Archive viewing/unarchive and additional item-status controls are not exposed in the UI.
- Web, multi-device sync, signed release builds, and store publication are outside the completed native MVP.

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
