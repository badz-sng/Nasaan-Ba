import { File, Directory, Paths } from 'expo-file-system';
import { Platform, Share } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { getDb } from '@/database/client';
import { categories, locations, items, itemLocations, tags, itemTags, reminders } from '@/database/schema';
import { photoDirectory, removePhoto } from '@/services/imageService';
import { reconcileNotifications } from '@/services/notificationService';
import { validateBackup, type Backup } from './backup.validation';

// ponytail: JSON backups are capped at 100 MiB; use a streaming archive if inventories outgrow this.
export const MAX_BACKUP_BYTES = 100 * 1024 * 1024;

export const backupService = {
  async export(): Promise<File> {
    const db = getDb();
    const data = db.transaction((tx) => ({ categories: tx.select().from(categories).all(), locations: tx.select().from(locations).all(),
      items: tx.select().from(items).all(), itemLocations: tx.select().from(itemLocations).all(), tags: tx.select().from(tags).all(),
      itemTags: tx.select().from(itemTags).all(), reminders: tx.select().from(reminders).all().map((r) => ({ ...r, notificationId: null })) }));
    const photos: Backup['photos'] = [];
    for (const item of data.items) {
      if (!item.photoUri) continue;
      const source = new File(item.photoUri);
      if (!source.exists) throw new Error(`The photo for ${item.name} is missing. Remove or replace it before exporting.`);
      photos.push({ itemId: item.id, base64: await source.base64() });
      item.photoUri = `photos/${item.id}.jpg`;
    }
    const backup = validateBackup({ schema_version: 1, exported_at: new Date().toISOString(), data, photos });
    const json = JSON.stringify(backup);
    const file = new File(Paths.cache, `nasaan-ba-${Date.now()}.json`);
    file.write(json);
    if (file.size > MAX_BACKUP_BYTES) { file.delete(); throw new Error('This backup exceeds the 100 MiB limit.'); }
    if (Platform.OS === 'android') {
      const directory = await Directory.pickDirectoryAsync();
      const destination = new File(directory, file.name);
      await file.copy(destination);
      return destination;
    }
    await Share.share({ url: file.uri, title: 'Nasaan ba? backup' });
    return file;
  },
  async pick(): Promise<Backup | null> {
    const selected = await File.pickFileAsync({ mimeTypes: ['application/json'] });
    if (selected.canceled) return null;
    if (selected.result.size > MAX_BACKUP_BYTES) throw new Error('This backup exceeds the 100 MiB limit.');
    let input: unknown;
    try { input = JSON.parse(await selected.result.text()); }
    catch { throw new Error('This file is not valid JSON.'); }
    return validateBackup(input);
  },
  async restore(input: Backup): Promise<{ notificationWarning: boolean }> {
    const backup = validateBackup(input);
    const directory = new Directory(photoDirectory, `restore-${randomUUID()}`);
    directory.create({ intermediates: true });
    try {
      const uris = new Map<string, string>();
      for (const photo of backup.photos) {
        const file = new File(directory, `${photo.itemId}.jpg`);
        file.write(photo.base64, { encoding: 'base64' });
        uris.set(photo.itemId, file.uri);
      }
      const db = getDb();
      const replacedPhotos = db.transaction((tx) => {
        const previous = tx.select({ photoUri: items.photoUri }).from(items).all();
        tx.delete(reminders).run(); tx.delete(itemTags).run(); tx.delete(itemLocations).run(); tx.delete(items).run();
        tx.delete(locations).run(); tx.delete(categories).run(); tx.delete(tags).run();
        for (const row of backup.data.categories) tx.insert(categories).values(row).run();
        for (const row of [...backup.data.locations].sort((a, b) => a.depth - b.depth)) tx.insert(locations).values(row).run();
        for (const row of backup.data.tags) tx.insert(tags).values(row).run();
        for (const row of backup.data.items) tx.insert(items).values({ ...row, photoUri: uris.get(row.id) ?? null }).run();
        for (const row of backup.data.itemLocations) tx.insert(itemLocations).values(row).run();
        for (const row of backup.data.itemTags) tx.insert(itemTags).values(row).run();
        for (const row of backup.data.reminders) tx.insert(reminders).values({ ...row, notificationId: null }).run();
        return previous;
      });
      for (const row of replacedPhotos) removePhoto(row.photoUri);
    } catch (err) {
      if (directory.exists) directory.delete();
      throw err;
    }
    try { await reconcileNotifications(); return { notificationWarning: false }; }
    catch { return { notificationWarning: true }; }
  },
};
