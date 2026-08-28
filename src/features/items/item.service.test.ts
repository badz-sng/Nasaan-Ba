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
import type { Item } from './item.types';

const mockedItemRepository = itemRepository as jest.Mocked<typeof itemRepository>;

describe('itemService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a valid item through the repository', async () => {
    const item: Item = {
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
    };

    mockedItemRepository.create.mockResolvedValue(item);

    await expect(
      itemService.createItem({
        name: 'Box',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).resolves.toEqual(item);

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
});
