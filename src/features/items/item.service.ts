import { createItemSchema, updateItemSchema } from './item.validation';
import { itemRepository } from './item.repository';
import type { FindAllItemsOptions, Item, ItemWithLocation } from './item.types';
import { persistPhoto, removePhoto } from '@/services/imageService';
import { reconcileNotifications } from '@/services/notificationService';

export class ItemServiceError extends Error {
  constructor(message: string, public readonly fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ItemServiceError';
  }
}

class ItemService {
  async createItem(rawInput: unknown): Promise<Item> {
    const parsed = createItemSchema.safeParse(rawInput);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new ItemServiceError('The item details are invalid.', fieldErrors);
    }

    let savedPhoto: string | undefined;
    const originalPhoto = parsed.data.photoUri;
    try {
      if (parsed.data.photoUri) {
        savedPhoto = await persistPhoto(parsed.data.photoUri);
        parsed.data.photoUri = savedPhoto;
      }
      return await itemRepository.create(parsed.data);
    } catch (err) {
      if (savedPhoto && savedPhoto !== originalPhoto) removePhoto(savedPhoto);
      // Repository errors (e.g. FK violation because the location was
      // deleted between screen load and submit) become a user-facing
      // message here instead of leaking a raw SQLite error to the UI.
      throw new ItemServiceError(
        'Could not save the item. The selected location may have been deleted — please try again.'
      );
    }
  }

  async moveItem(itemId: string, newLocationId: string): Promise<void> {
    if (!itemId || !newLocationId) {
      throw new ItemServiceError('An item and a new location are required.');
    }
    try {
      await itemRepository.moveToLocation(itemId, newLocationId);
    } catch (err) {
      throw new ItemServiceError('Could not move the item. Please try again.');
    }
  }

  async getItem(id: string): Promise<ItemWithLocation | null> {
    return itemRepository.findById(id);
  }

  async getRecentItems(limit?: number): Promise<ItemWithLocation[]> {
    return itemRepository.findRecent(limit);
  }

  async getLocationHistory(itemId: string) {
    return itemRepository.getLocationHistory(itemId);
  }

  async getItems(options?: FindAllItemsOptions): Promise<ItemWithLocation[]> {
    return itemRepository.findAll(options);
  }

  async updateItem(id: string, rawInput: unknown): Promise<Item> {
    const parsed = updateItemSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new ItemServiceError('The item details are invalid.', fieldErrors);
    }

    const existing = await itemRepository.findById(id);
    if (!existing) {
      throw new ItemServiceError('Item not found.');
    }

    let savedPhoto: string | undefined;
    const originalPhoto = parsed.data.photoUri;
    try {
      if (parsed.data.photoUri && parsed.data.photoUri !== existing.photoUri) {
        savedPhoto = await persistPhoto(parsed.data.photoUri);
        parsed.data.photoUri = savedPhoto;
      }
      const updated = await itemRepository.update(id, parsed.data);
      if (parsed.data.photoUri !== undefined && updated.photoUri !== existing.photoUri) removePhoto(existing.photoUri);
      return updated;
    } catch {
      if (savedPhoto && savedPhoto !== originalPhoto) removePhoto(savedPhoto);
      throw new ItemServiceError('Could not update the item. Please try again.');
    }
  }

  async archiveItem(id: string): Promise<void> {
    const existing = await itemRepository.findById(id);
    if (!existing) {
      throw new ItemServiceError('Item not found.');
    }
    try {
      await itemRepository.archive(id);
    } catch {
      throw new ItemServiceError('Could not archive the item. Please try again.');
    }
  }

  async deleteItem(id: string): Promise<void> {
    const existing = await itemRepository.findById(id);
    if (!existing) {
      throw new ItemServiceError('Item not found.');
    }
    try {
      await itemRepository.delete(id);
      removePhoto(existing.photoUri);
      void reconcileNotifications().catch(() => undefined);
    } catch {
      throw new ItemServiceError('Could not delete the item. Please try again.');
    }
  }
}

export const itemService = new ItemService();
