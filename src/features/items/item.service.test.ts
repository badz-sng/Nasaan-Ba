jest.mock('./item.repository', () => ({
  itemRepository: {
    create: jest.fn(),
    moveToLocation: jest.fn(),
    findById: jest.fn(),
    findRecent: jest.fn(),
    getLocationHistory: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    delete: jest.fn(),
  },
}));

import { itemService, ItemServiceError } from './item.service';
import { itemRepository } from './item.repository';
import type { Item, ItemWithLocation } from './item.types';

const mockedItemRepository = itemRepository as jest.Mocked<typeof itemRepository>;

const existingItem: ItemWithLocation = {
  id: 'item-1',
  name: 'Box',
  description: null,
  categoryId: null,
  quantity: 1,
  unit: null,
  condition: null,
  status: 'active',
  photoUri: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  currentLocationPath: null,
  categoryName: null,
};

describe('itemService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedItemRepository.findById.mockResolvedValue(existingItem);
  });

  it('creates a valid item through the repository', async () => {
    mockedItemRepository.create.mockResolvedValue(existingItem);

    await expect(
      itemService.createItem({
        name: 'Box',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).resolves.toEqual(existingItem);

    expect(mockedItemRepository.create).toHaveBeenCalledWith({
      name: 'Box',
      locationId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 1,
    });
  });

  it('returns fieldErrors for invalid create input', async () => {
    await expect(itemService.createItem({ name: 'Box' })).rejects.toBeInstanceOf(
      ItemServiceError
    );

    try {
      await itemService.createItem({ name: 'Box' });
    } catch (err) {
      expect(err).toBeInstanceOf(ItemServiceError);
      if (err instanceof ItemServiceError) {
        expect(err.fieldErrors?.locationId).toBeDefined();
      }
    }

    expect(mockedItemRepository.create).not.toHaveBeenCalled();
  });

  it('translates repository create errors into a user-facing message', async () => {
    mockedItemRepository.create.mockRejectedValue(new Error('FK constraint'));

    await expect(
      itemService.createItem({
        name: 'Box',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow(
      'Could not save the item. The selected location may have been deleted'
    );
  });

  it('throws immediately when moveItem is missing ids', async () => {
    await expect(itemService.moveItem('', '550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
      'An item and a new location are required.'
    );

    await expect(itemService.moveItem('550e8400-e29b-41d4-a716-446655440000', '')).rejects.toThrow(
      'An item and a new location are required.'
    );

    expect(mockedItemRepository.moveToLocation).not.toHaveBeenCalled();
  });

  describe('updateItem', () => {
    it('returns fieldErrors for invalid input and does not touch the repository', async () => {
      await expect(itemService.updateItem('item-1', { name: '' })).rejects.toBeInstanceOf(
        ItemServiceError
      );

      try {
        await itemService.updateItem('item-1', { name: '' });
      } catch (err) {
        expect(err).toBeInstanceOf(ItemServiceError);
        if (err instanceof ItemServiceError) {
          expect(err.fieldErrors?.name).toBeDefined();
        }
      }

      expect(mockedItemRepository.findById).not.toHaveBeenCalled();
      expect(mockedItemRepository.update).not.toHaveBeenCalled();
    });

    it('throws Item not found when the item does not exist', async () => {
      mockedItemRepository.findById.mockResolvedValueOnce(null);

      await expect(itemService.updateItem('item-404', { name: 'Updated' })).rejects.toThrow(
        'Item not found.'
      );

      expect(mockedItemRepository.update).not.toHaveBeenCalled();
    });

    it('updates a found item with parsed data', async () => {
      const updatedItem: Item = {
        ...existingItem,
        name: 'Updated name',
      };

      mockedItemRepository.update.mockResolvedValue(updatedItem);

      await expect(
        itemService.updateItem('item-1', { name: 'Updated name' })
      ).resolves.toEqual(updatedItem);

      expect(mockedItemRepository.update).toHaveBeenCalledWith('item-1', { name: 'Updated name' });
    });

    it('translates repository update errors', async () => {
      mockedItemRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(itemService.updateItem('item-1', { name: 'Updated name' })).rejects.toThrow(
        'Could not update the item. Please try again.'
      );
    });
  });

  describe('archiveItem', () => {
    it('throws Item not found when the item does not exist', async () => {
      mockedItemRepository.findById.mockResolvedValueOnce(null);

      await expect(itemService.archiveItem('item-404')).rejects.toThrow('Item not found.');
      expect(mockedItemRepository.archive).not.toHaveBeenCalled();
    });

    it('archives a found item', async () => {
      mockedItemRepository.archive.mockResolvedValue(undefined);

      await expect(itemService.archiveItem('item-1')).resolves.toBeUndefined();
      expect(mockedItemRepository.archive).toHaveBeenCalledWith('item-1');
    });

    it('translates repository archive errors', async () => {
      mockedItemRepository.archive.mockRejectedValue(new Error('Archive failed'));

      await expect(itemService.archiveItem('item-1')).rejects.toThrow(
        'Could not archive the item. Please try again.'
      );
    });
  });

  describe('deleteItem', () => {
    it('throws Item not found when the item does not exist', async () => {
      mockedItemRepository.findById.mockResolvedValueOnce(null);

      await expect(itemService.deleteItem('item-404')).rejects.toThrow('Item not found.');
      expect(mockedItemRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes a found item', async () => {
      mockedItemRepository.delete.mockResolvedValue(undefined);

      await expect(itemService.deleteItem('item-1')).resolves.toBeUndefined();
      expect(mockedItemRepository.delete).toHaveBeenCalledWith('item-1');
    });

    it('translates repository delete errors', async () => {
      mockedItemRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(itemService.deleteItem('item-1')).rejects.toThrow(
        'Could not delete the item. Please try again.'
      );
    });
  });
});
