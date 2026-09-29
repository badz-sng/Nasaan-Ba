import { z } from 'zod';

const id = z.string().uuid();
const timestamp = z.string().refine((v) => Number.isFinite(Date.parse(v)), 'Invalid timestamp');
const text = z.string().max(2000).nullable();
const dated = { createdAt: timestamp, updatedAt: timestamp };
export const backupSchema = z.strictObject({
  schema_version: z.literal(1),
  exported_at: timestamp,
  data: z.strictObject({
    categories: z.array(z.strictObject({ id, name: z.string().min(1).max(200), icon: text, ...dated })),
    locations: z.array(z.strictObject({ id, parentId: id.nullable(), name: z.string().min(1).max(200), type: text,
      description: text, path: z.string().min(1), depth: z.number().int().nonnegative(), ...dated })),
    items: z.array(z.strictObject({ id, name: z.string().min(1).max(200), description: text, categoryId: id.nullable(),
      quantity: z.number().int().positive(), unit: text, condition: text,
      status: z.enum(['active', 'archived', 'lost', 'consumed', 'disposed', 'lent']), photoUri: text, notes: text, ...dated })),
    itemLocations: z.array(z.strictObject({ id, itemId: id, locationId: id, startedAt: timestamp, endedAt: timestamp.nullable(), isCurrent: z.boolean() })),
    tags: z.array(z.strictObject({ id, name: z.string().min(1).max(100), createdAt: timestamp })),
    itemTags: z.array(z.strictObject({ itemId: id, tagId: id })),
    reminders: z.array(z.strictObject({ id, itemId: id.nullable(), locationId: id.nullable(), title: z.string().min(1).max(200),
      description: text, remindAt: timestamp, repeatType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']),
      status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']), notificationId: z.null(), ...dated })),
  }),
  photos: z.array(z.strictObject({ itemId: id, base64: z.string().max(14000000).regex(/^\/9j\/[A-Za-z0-9+/]*={0,2}$/, 'Invalid JPEG photo') })),
});
export type Backup = z.infer<typeof backupSchema>;

export function validateBackup(input: unknown): Backup {
  const result = backupSchema.safeParse(input);
  if (!result.success) throw new Error('This backup has an unsupported version or invalid data.');
  const backup = result.data;
  const { data } = backup;
  const sets = Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'itemTags').map(([key, rows]) => {
    const ids = rows.map((row) => (row as { id: string }).id);
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate IDs in ${key}.`);
    return [key, new Set(ids)];
  })) as Record<string, Set<string>>;
  const exists = (table: string, value: string | null) => value === null || sets[table].has(value);
  const locations = new Map(data.locations.map((l) => [l.id, l]));
  for (const row of data.locations) {
    if (!exists('locations', row.parentId)) throw new Error('A location has a missing parent.');
    const visited = new Set([row.id]);
    let parentId = row.parentId;
    while (parentId) {
      if (visited.has(parentId)) throw new Error('Circular location hierarchy.');
      const ancestor = locations.get(parentId);
      if (!ancestor) throw new Error('A location has a missing parent.');
      visited.add(parentId); parentId = ancestor.parentId;
    }
    const parent = row.parentId ? locations.get(row.parentId)! : null;
    if (row.depth !== (parent ? parent.depth + 1 : 0) || row.path !== (parent ? `${parent.path}/${row.name}` : row.name)) throw new Error('Invalid location paths.');
  }
  const current = new Set<string>();
  for (const row of data.itemLocations) {
    if (!exists('items', row.itemId) || !exists('locations', row.locationId)) throw new Error('Invalid item location reference.');
    if (row.isCurrent) {
      if (current.has(row.itemId) || row.endedAt !== null) throw new Error('Invalid current location history.');
      current.add(row.itemId);
    } else if (!row.endedAt || Date.parse(row.endedAt) < Date.parse(row.startedAt)) throw new Error('Invalid location history dates.');
  }
  const photos = new Map(backup.photos.map((p) => [p.itemId, p.base64]));
  if (photos.size !== backup.photos.length || backup.photos.some((p) => !exists('items', p.itemId) || p.base64.length % 4 !== 0)) throw new Error('Invalid photo references.');
  for (const row of data.items) {
    if (!exists('categories', row.categoryId)) throw new Error('Invalid category reference.');
    if (row.status === 'active' && !current.has(row.id)) throw new Error('An active item is missing its current location.');
    if (!!row.photoUri !== photos.has(row.id)) throw new Error('A backup photo is missing.');
  }
  const links = new Set<string>();
  for (const row of data.itemTags) {
    const key = `${row.itemId}/${row.tagId}`;
    if (!exists('items', row.itemId) || !exists('tags', row.tagId) || links.has(key)) throw new Error('Invalid item tag reference.');
    links.add(key);
  }
  if (new Set(data.tags.map((t) => t.name)).size !== data.tags.length) throw new Error('Duplicate tag names.');
  for (const row of data.reminders) {
    if (!exists('items', row.itemId) || !exists('locations', row.locationId)) throw new Error('Invalid reminder reference.');
  }
  return backup;
}
