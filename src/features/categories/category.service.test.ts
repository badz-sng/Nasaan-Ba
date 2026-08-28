jest.mock('./category.repository', () => ({
  categoryRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countItemsUsingCategory: jest.fn(),
  },
}));

import { categoryService, CategoryServiceError } from './category.service';
import { categoryRepository } from './category.repository';
import type { Category } from './category.types';

const mockedCategoryRepository = categoryRepository as jest.Mocked<typeof categoryRepository>;

describe('categoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks deleting a category that still has items', async () => {
    mockedCategoryRepository.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Fragile',
      icon: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    mockedCategoryRepository.countItemsUsingCategory.mockResolvedValue(3);

    await expect(categoryService.deleteCategory('cat-1')).rejects.toThrow(
      'This category has 3 item(s). Move or update them first.'
    );

    expect(mockedCategoryRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes a category when no items use it', async () => {
    mockedCategoryRepository.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Fragile',
      icon: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    mockedCategoryRepository.countItemsUsingCategory.mockResolvedValue(0);
    mockedCategoryRepository.delete.mockResolvedValue(undefined);

    await expect(categoryService.deleteCategory('cat-1')).resolves.toBeUndefined();
    expect(mockedCategoryRepository.delete).toHaveBeenCalledWith('cat-1');
  });

  it('returns fieldErrors for invalid create input', async () => {
    await expect(categoryService.createCategory({ name: '' })).rejects.toBeInstanceOf(
      CategoryServiceError
    );

    try {
      await categoryService.createCategory({ name: '' });
    } catch (err) {
      expect(err).toBeInstanceOf(CategoryServiceError);
      if (err instanceof CategoryServiceError) {
        expect(err.fieldErrors?.name).toBe('Enter a category name');
      }
    }

    expect(mockedCategoryRepository.create).not.toHaveBeenCalled();
  });

  it('updates a category with the expected id and data', async () => {
    const existing: Category = {
      id: 'cat-1',
      name: 'Old name',
      icon: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const updated: Category = {
      ...existing,
      name: 'New name',
      icon: 'box',
    };

    mockedCategoryRepository.findById.mockResolvedValue(existing);
    mockedCategoryRepository.update.mockResolvedValue(updated);

    await expect(
      categoryService.updateCategory('cat-1', { name: 'New name', icon: 'box' })
    ).resolves.toEqual(updated);

    expect(mockedCategoryRepository.update).toHaveBeenCalledWith('cat-1', {
      name: 'New name',
      icon: 'box',
    });
  });
});
