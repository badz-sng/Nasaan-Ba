# Nasaan Ba? — Scaffold

Local-first personal inventory app. This is the initial scaffold —
architecture wiring is real and working end-to-end for the **Items**
feature; other features are stubbed with clear TODOs.

## What's actually wired (not just stubbed)

- Expo Router file-based navigation (tabs + item detail/add routes)
- SQLite via `expo-sqlite` + Drizzle ORM, full schema from the ERD
- FTS5 virtual table + sync triggers for search (live from commit #1,
  not deferred — see architecture discussion)
- Migration runner with a typed `DatabaseInitError` and an in-app
  recovery screen (`app/_layout.tsx`) for a corrupted/unopenable DB
- Data integrity rules enforced at the DB layer: no self-parent
  location trigger, one-current-location partial unique index
- Full layered slice for **Items**: validation (zod) → service (business
  rules + error translation) → repository (SQL, transactions) → hook →
  screen. Use this as the template for Locations, Reminders, Search, Tags.
- Seed data: default categories + the "Unknown / Not Stored" system
  location required by Rule 1

## Deviations from the original spec, and why

| Spec said | This scaffold does | Why |
|---|---|---|
| INTEGER AUTOINCREMENT ids | TEXT UUIDs (`expo-crypto` `randomUUID`) | Your own roadmap has multi-device sync in v3.0 — autoincrement IDs collide across devices, UUIDs don't. Cheap now, expensive to retrofit. |
| FTS5 "for larger datasets" (future) | FTS5 from the first migration | Search is the core value prop — shouldn't be a later optimization |
| Manual React Navigation (RootNavigator/MainNavigator/MoreNavigator) | Expo Router (file-based) | Current Expo default in 2026, less boilerplate, same tab structure |
| No recursive path strategy specified | Denormalized `path`/`depth` columns on `locations` | Avoids N+1 queries per row when rendering breadcrumbs; trade-off is you must update descendants' paths when a location is moved (not yet implemented — see TODO in location.service.ts, which doesn't exist yet) |
| No backup format specified | TODO'd as JSON envelope with `schema_version` | Cross-version safe; validate before touching DB, never partial-restore |

## Not yet built (in spec's recommended order)

1. ~~Project Setup~~ ✅
2. ~~SQLite + Migrations~~ ✅
3. ~~Database Schema~~ ✅
4. **Location Hierarchy** — needs `location.repository.ts`, `location.service.ts`,
   `LocationPicker` / `LocationTree` components, and the "no circular
   locations" ancestor-walk check (Rule 2) in the service layer
5. ~~Item CRUD~~ (partial — create + read done, update/delete/archive TODO)
6. ~~Item ↔ Location~~ ✅ (`moveToLocation` in item.repository.ts)
7. ~~Location History~~ ✅ (`getLocationHistory`)
8. **Search** — FTS5 table exists and is kept in sync by triggers;
   `search.service.ts` / `search.repository.ts` querying it: TODO
9. Categories + Tags — categories are seeded, no CRUD UI yet; tags: TODO
10. Photos — `imageService.ts` (capture/resize via `expo-image-manipulator`,
    save to `expo-file-system`): TODO
11. Reminders — full module: TODO
12. Notifications — `notificationService.ts` via `expo-notifications`: TODO
13. Backup/Restore — stub screen only, see TODO comment in
    `app/more/backup.tsx`
14. App Lock — `expo-secure-store` + `expo-local-authentication`: TODO
15. Testing — `jest.config.js` set up, zero tests written yet
16. UI Polish
17. Release

## Getting started

```bash
npm install
npx expo start
```

First run will create `nasaanba.db` on-device and run the initial
migration + seed automatically (see `app/_layout.tsx`).
