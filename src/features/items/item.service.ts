import { createItemSchema, type CreateItemFormValues } from './item.validation';
import { itemRepository } from './item.repository';
import type { Item, ItemWithLocation } from './item.types';

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
      throw new ItemServiceError('Hindi valid ang item details.', fieldErrors);
    }

    try {
      return await itemRepository.create(parsed.data);
    } catch (err) {
      // Repository errors (e.g. FK violation because the location was
      // deleted between screen load and submit) become a user-facing
      // message here instead of leaking a raw SQLite error to the UI.
      throw new ItemServiceError(
        'Hindi na-save ang item. Baka na-delete na yung napiling lokasyon — subukan ulit.'
      );
    }
  }

  async moveItem(itemId: string, newLocationId: string): Promise<void> {
    if (!itemId || !newLocationId) {
      throw new ItemServiceError('Kailangan ng item at bagong lokasyon.');
    }
    try {
      await itemRepository.moveToLocation(itemId, newLocationId);
    } catch (err) {
      throw new ItemServiceError('Hindi na-move ang item. Subukan ulit.');
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
}

export const itemService = new ItemService();
