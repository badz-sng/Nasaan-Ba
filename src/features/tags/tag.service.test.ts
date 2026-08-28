jest.mock('./tag.repository', () => ({
  tagRepository: {
    findAll: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    countItemsUsingTag: jest.fn(),
  },
}));

import { TagServiceError, tagService } from './tag.service';
import { tagRepository } from './tag.repository';

const mockedTagRepository = tagRepository as jest.Mocked<typeof tagRepository>;

describe('tagService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows deleting a tag even when it is used by items', async () => {
    mockedTagRepository.countItemsUsingTag.mockResolvedValue(5);
    mockedTagRepository.delete.mockResolvedValue(undefined);

    await expect(tagService.deleteTag('tag-123')).resolves.toEqual({ itemCount: 5 });
    expect(mockedTagRepository.countItemsUsingTag).toHaveBeenCalledWith('tag-123');
    expect(mockedTagRepository.delete).toHaveBeenCalledWith('tag-123');
  });

  it('rejects duplicate tag names before creating', async () => {
    mockedTagRepository.findByName.mockResolvedValue({
      id: 'tag-1',
      name: 'Fragile',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const promise = tagService.createTag({ name: 'Fragile' });

    await expect(promise).rejects.toBeInstanceOf(TagServiceError);
    await expect(promise).rejects.toThrow(
      'A tag with this name already exists.'
    );
    expect(mockedTagRepository.create).not.toHaveBeenCalled();
  });

  it('creates a tag when the name is unique', async () => {
    mockedTagRepository.findByName.mockResolvedValue(null);
    mockedTagRepository.create.mockResolvedValue({
      id: 'tag-2',
      name: 'Fragile',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(tagService.createTag({ name: 'Fragile' })).resolves.toEqual({
      id: 'tag-2',
      name: 'Fragile',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(mockedTagRepository.findByName).toHaveBeenCalledWith('Fragile');
    expect(mockedTagRepository.create).toHaveBeenCalledWith({ name: 'Fragile' });
  });
});
