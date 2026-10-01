// Run with Node 24+: npm run test:database. No native device or extra test dependency.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const { drizzle } = require(path.join(root, 'node_modules/drizzle-orm/expo-sqlite/driver.cjs'));

function loadTs(file, overrides = {}) {
  const filename = path.join(root, file);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)((name) => name in overrides ? overrides[name] : localRequire(name), module, module.exports);
  return module.exports;
}
const schema = loadTs('src/database/schema.ts');

function fixture(upgrade = false) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON;');
  for (const name of ['0000_initial', '0001_fts_sync', '0002_fts_rebuild']) {
    const sql = readFileSync(path.join(root, `src/database/migrations/${name}.sql`), 'utf8');
    assert.ok(loadTs(`src/database/migrations/${name}.ts`).sql.replace(/\r\n/g, '\n').trim() === sql.replace(/\r\n/g, '\n').trim(), `${name} SQL/TS copies differ`);
    if (upgrade === 'uninitialized') continue;
    if (name === '0001_fts_sync' && upgrade !== true) continue;
    if (upgrade && name === '0002_fts_rebuild') {
      sqlite.exec("INSERT INTO locations(id,name,path) VALUES('legacy-loc','Legacy','Legacy'); INSERT INTO items(id,name) VALUES('legacy-item','Legacy item'); DROP TRIGGER IF EXISTS item_locations_ai_fts; INSERT INTO item_locations(id,item_id,location_id) VALUES('legacy-history','legacy-item','legacy-loc');");
    }
    sqlite.exec(sql);
  }
  // The installed Drizzle driver uses this synchronous Expo statement contract.
  const client = { prepareSync(sql) {
    const statement = sqlite.prepare(sql);
    return {
      executeSync(params) {
        statement.setReturnArrays(false);
        const rows = statement.all(...params);
        const result = sqlite.prepare('SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowId').get();
        return { ...result, getAllSync: () => rows, getFirstSync: () => rows[0] };
      },
      executeForRawResultSync(params) {
        statement.setReturnArrays(true);
        const rows = statement.all(...params);
        return { getAllSync: () => rows };
      },
    };
  } };
  const db = drizzle(client, { schema });
  const overrides = { '@/database/client': { getDb: () => db }, '@/database/schema': schema, 'expo-crypto': { randomUUID } };
  return { sqlite, db, overrides, client };
}

test('boot shares initialization, applies migrations atomically, and seeds defaults once', async () => {
  const { sqlite, client } = fixture('uninitialized');
  let opens = 0;
  const native = {
    ...client,
    execAsync: async (sql) => sqlite.exec(sql),
    getAllAsync: async (sql) => sqlite.prepare(sql).all(),
    runAsync: async (sql, ...params) => sqlite.prepare(sql).run(...params),
    closeAsync: async () => sqlite.close(),
    async withExclusiveTransactionAsync(work) {
      sqlite.exec('BEGIN IMMEDIATE');
      try { await work(native); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const boot = loadTs('src/database/client.ts', {
    'expo-sqlite': { openDatabaseAsync: async () => { opens++; return native; } },
    'drizzle-orm/expo-sqlite': { drizzle }, './schema': schema,
    './migrations/0000_initial': loadTs('src/database/migrations/0000_initial.ts'),
    './migrations/0002_fts_rebuild': loadTs('src/database/migrations/0002_fts_rebuild.ts'),
  });
  const [first, second] = await Promise.all([boot.initDatabase(), boot.initDatabase()]);
  assert.equal(first, second); assert.equal(opens, 1);
  assert.deepEqual(sqlite.prepare('SELECT name FROM __migrations ORDER BY name').all().map((r) => r.name), ['0000_initial', '0002_fts_rebuild']);
  const { seedDefaults } = loadTs('src/database/seeders/defaultData.ts', { '../client': boot, '../schema': schema, 'expo-crypto': { randomUUID } });
  await Promise.all([seedDefaults(), seedDefaults()]);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM categories').get().n, 8);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM locations').get().n, 1);
  sqlite.close();
});

test('fresh and existing databases migrate to a readable FTS index', () => {
  for (const upgrade of [false, true, 'initial-only']) {
    const { sqlite } = fixture(upgrade);
    if (upgrade) assert.deepEqual({ ...sqlite.prepare('SELECT item_id, name, location_path FROM items_fts').get() }, { item_id: 'legacy-item', name: 'Legacy item', location_path: 'Legacy' });
    assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
    sqlite.close();
  }
});

test('actual repositories keep item/history/tag writes atomic and FTS searchable', async () => {
  const { sqlite, overrides } = fixture();
  const { itemRepository } = loadTs('src/features/items/item.repository.ts', overrides);
  const { locationRepository } = loadTs('src/features/locations/location.repository.ts', overrides);
  const { tagRepository } = loadTs('src/features/tags/tag.repository.ts', overrides);
  const { categoryRepository } = loadTs('src/features/categories/category.repository.ts', overrides);
  const { searchRepository } = loadTs('src/features/search/search.repository.ts', overrides);
  const home = await locationRepository.create({ name: 'Home' });
  const office = await locationRepository.create({ name: 'Office' });
  const category = await categoryRepository.create({ name: 'Documents' });
  const tag = await tagRepository.create({ name: 'Travel' });
  const item = await itemRepository.create({ name: 'Passport', locationId: home.id, categoryId: category.id, tagIds: [tag.id] });
  assert.equal((await searchRepository.search('Travel'))[0].itemId, item.id);
  await assert.rejects(itemRepository.create({ name: 'Bad item', locationId: home.id, tagIds: ['missing-tag'] }));
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM items').get().n, 1);
  await assert.rejects(itemRepository.moveToLocation(item.id, 'missing-location'));
  assert.equal((await itemRepository.getLocationHistory(item.id)).length, 1);
  await itemRepository.moveToLocation(item.id, office.id);
  const history = await itemRepository.getLocationHistory(item.id);
  assert.equal(history.length, 2);
  assert.equal(history.filter((r) => r.isCurrent).length, 1);
  assert.ok(history.find((r) => !r.isCurrent).endedAt);
  assert.equal((await searchRepository.search('Office'))[0].itemId, item.id);
  assert.equal((await searchRepository.search('Home')).length, 0);
  await itemRepository.moveToLocation(item.id, office.id);
  assert.equal((await itemRepository.getLocationHistory(item.id)).length, 2, 'same-location moves must be no-ops');
  await itemRepository.update(item.id, { notes: 'Renew soon' });
  assert.equal((await searchRepository.search('Travel'))[0].itemId, item.id, 'item edits must retain indexed tags');
  await tagRepository.rename(tag.id, 'Trips');
  assert.equal((await searchRepository.search('Travel')).length, 0);
  assert.equal((await searchRepository.search('Trips'))[0].itemId, item.id);
  await categoryRepository.update(category.id, { name: 'Papers' });
  assert.equal((await searchRepository.search('Papers'))[0].itemId, item.id);
  await assert.rejects(itemRepository.update(item.id, { name: 'Wrong', tagIds: ['missing-tag'] }));
  assert.equal((await itemRepository.findById(item.id)).name, 'Passport');
  await itemRepository.archive(item.id);
  assert.equal((await searchRepository.search('Passport')).length, 0);
  await itemRepository.delete(item.id);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM item_locations').get().n, 0);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM items_fts').get().n, 0);
  sqlite.close();
});

test('location renames update descendants by identity, including duplicate names and SQL wildcard characters', async () => {
  const { sqlite, overrides } = fixture();
  const { locationRepository: repo } = loadTs('src/features/locations/location.repository.ts', overrides);
  const first = await repo.create({ name: 'Storage_%' });
  const second = await repo.create({ name: 'Storage_%' });
  const child = await repo.create({ name: 'Box', parentId: first.id });
  const other = await repo.create({ name: 'Box', parentId: second.id });
  const rootLocation = await repo.create({ name: 'House' });
  await repo.update(first.id, { name: 'Renamed', parentId: rootLocation.id });
  assert.equal((await repo.findById(child.id)).path, 'House/Renamed/Box');
  assert.equal((await repo.findById(child.id)).depth, 2);
  assert.equal((await repo.findById(other.id)).path, 'Storage_%/Box');
  sqlite.close();
});

test('backup round-trip includes photos and failed restores leave the database intact', async () => {
  const { sqlite, overrides } = fixture();
  const files = new Map();
  class Directory {
    constructor(...parts) { this.uri = parts.map((p) => p.uri ?? p).join('/'); }
    create() { this.exists = true; }
    delete() { for (const key of files.keys()) if (key.startsWith(this.uri + '/')) files.delete(key); this.exists = false; }
  }
  class File {
    constructor(...parts) { this.uri = parts.map((p) => p.uri ?? p).join('/'); this.name = this.uri.split('/').at(-1); }
    get exists() { return files.has(this.uri); }
    get size() { return files.get(this.uri)?.length ?? 0; }
    write(content, options = {}) { files.set(this.uri, Buffer.from(content, options.encoding === 'base64' ? 'base64' : 'utf8')); }
    async base64() { return files.get(this.uri).toString('base64'); }
    async text() { return files.get(this.uri).toString('utf8'); }
  }
  const validation = loadTs('src/features/backup/backup.validation.ts');
  const { backupService } = loadTs('src/features/backup/backup.service.ts', { ...overrides,
    'expo-file-system': { File, Directory, Paths: { document: 'document', cache: 'cache' } },
    'react-native': { Platform: { OS: 'ios' }, Share: { share: async () => undefined } },
    '@/services/imageService': { photoDirectory: new Directory('document', 'photos'), removePhoto: (uri) => files.delete(uri) },
    '@/services/notificationService': { reconcileNotifications: async () => undefined },
    './backup.validation': validation,
  });
  const { itemRepository } = loadTs('src/features/items/item.repository.ts', overrides);
  const { locationRepository } = loadTs('src/features/locations/location.repository.ts', overrides);
  const location = await locationRepository.create({ name: 'Home' });
  const photo = new File('document/photos/original.jpg'); photo.write('/9j/2Q==', { encoding: 'base64' });
  const item = await itemRepository.create({ name: 'Passport', locationId: location.id, photoUri: photo.uri });
  const exported = await backupService.export();
  const backup = validation.validateBackup(JSON.parse(await exported.text()));
  assert.equal(backup.photos[0].base64, '/9j/2Q==');
  await itemRepository.update(item.id, { name: 'Current data' });
  const invalid = structuredClone(backup); invalid.data.itemLocations = [];
  await assert.rejects(backupService.restore(invalid), /current location/);
  assert.equal((await itemRepository.findById(item.id)).name, 'Current data');
  sqlite.exec("CREATE TRIGGER fail_restore BEFORE INSERT ON items WHEN new.name = 'Passport' BEGIN SELECT RAISE(ABORT, 'test restore failure'); END;");
  await assert.rejects(backupService.restore(backup), /restore failure/);
  assert.equal((await itemRepository.findById(item.id)).name, 'Current data');
  assert.equal((await itemRepository.getLocationHistory(item.id)).length, 1);
  assert.equal(sqlite.prepare('SELECT name FROM items_fts').get().name, 'Current data');
  sqlite.exec('DROP TRIGGER fail_restore;');
  await backupService.restore(backup);
  const restored = await itemRepository.findById(item.id);
  assert.equal(restored.name, 'Passport');
  assert.notEqual(restored.photoUri, photo.uri);
  assert.equal(await new File(restored.photoUri).base64(), '/9j/2Q==');
  assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  sqlite.close();
});

test('dashboard counts include all active records, not just the recent page', () => {
  const { sqlite, overrides } = fixture();
  try {
    const { getDashboardSummary } = loadTs('src/services/dashboardService.ts', overrides);
    assert.deepEqual({ ...getDashboardSummary() }, { items: 0, locations: 0, categories: 0, reminders: 0 });
    sqlite.exec("INSERT INTO locations(id,name,path) VALUES('home','Home','Home'),('room','Room','Home/Room'); INSERT INTO categories(id,name) VALUES('electronics','Electronics');");
    for (let i = 0; i < 24; i++) sqlite.prepare('INSERT INTO items(id,name,status,quantity) VALUES(?,?,?,?)').run('item-' + i, 'Item ' + i, 'active', 5);
    sqlite.exec("INSERT INTO items(id,name,status) VALUES('archived','Old item','archived'); INSERT INTO reminders(id,title,remind_at,status) VALUES('pending','Pending','2026-12-01T00:00:00Z','PENDING'),('done','Done','2026-12-01T00:00:00Z','COMPLETED'),('cancelled','Cancelled','2026-12-01T00:00:00Z','CANCELLED');");
    assert.deepEqual({ ...getDashboardSummary() }, { items: 24, locations: 2, categories: 1, reminders: 1 });
    sqlite.exec("UPDATE items SET status='archived' WHERE id='item-0'; UPDATE reminders SET status='COMPLETED' WHERE id='pending';");
    assert.deepEqual({ ...getDashboardSummary() }, { items: 23, locations: 2, categories: 1, reminders: 0 });
  } finally { sqlite.close(); }
});

test('item browsing searches and sorts before pagination and returns real tag chips', async () => {
  const { sqlite, overrides } = fixture();
  try {
    const { itemRepository: repo } = loadTs('src/features/items/item.repository.ts', overrides);
    sqlite.exec("INSERT INTO locations(id,name,path) VALUES('home','Home','Home'); INSERT INTO categories(id,name) VALUES('electronics','Electronics'),('other','Other'); INSERT INTO tags(id,name) VALUES('charger','Charger');");
    const insert = sqlite.prepare('INSERT INTO items(id,name,category_id,status) VALUES(?,?,?,?)');
    insert.run('a','Alpha','other','active'); insert.run('b','beta charger','electronics','active'); insert.run('c','Zeta Charger','electronics','active'); insert.run('d','Archived Charger','electronics','archived'); insert.run('e','100% cable','other','active');
    sqlite.exec("INSERT INTO item_tags(item_id,tag_id) VALUES('b','charger'),('c','charger');");
    const page = await repo.findAll({ query: ' CHARGER ', categoryId: 'electronics', tagId: 'charger', sort: 'nameAsc', limit: 1 });
    assert.equal(page[0].id, 'b'); assert.deepEqual(page[0].tags, [{ id: 'charger', name: 'Charger' }]);
    assert.equal((await repo.findAll({ query: 'charger', sort: 'nameAsc', limit: 1, offset: 1 }))[0].id, 'c');
    assert.equal((await repo.findAll({ query: 'charger', sort: 'nameDesc', limit: 1 }))[0].id, 'c');
    assert.equal((await repo.findAll({ query: '%' }))[0].id, 'e');
    assert.equal((await repo.findAll({ tagId: 'missing' })).length, 0);
  } finally { sqlite.close(); }
});
