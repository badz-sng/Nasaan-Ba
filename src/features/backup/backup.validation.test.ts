import { validateBackup } from './backup.validation';

const id = '550e8400-e29b-41d4-a716-446655440000';
const childId = '550e8400-e29b-41d4-a716-446655440001';
const dated = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
const empty = { schema_version: 1, exported_at: dated.createdAt, photos: [], data: {
  categories: [], locations: [], items: [], itemLocations: [], tags: [], itemTags: [], reminders: [],
} };
const location = { id, parentId: null, name: 'Home', type: null, description: null, path: 'Home', depth: 0, ...dated };

it('rejects unsupported backups, duplicate identities, broken references, and cycles', () => {
  expect(validateBackup(empty).data.items).toEqual([]);
  expect(() => validateBackup({ ...empty, schema_version: 99 })).toThrow('unsupported');
  expect(() => validateBackup({ ...empty, data: { ...empty.data, locations: [location, location] } })).toThrow('Duplicate');
  expect(() => validateBackup({ ...empty, data: { ...empty.data, locations: [{ ...location, parentId: childId }] } })).toThrow('missing parent');
  expect(() => validateBackup({ ...empty, data: { ...empty.data, locations: [
    { ...location, parentId: childId }, { ...location, id: childId, parentId: id },
  ] } })).toThrow('Circular');
});
