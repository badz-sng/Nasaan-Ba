jest.mock('./location.repository', () => ({
  locationRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    isAncestor: jest.fn(),
    countItemsAtLocation: jest.fn(),
  },
}));

import { locationService, LocationServiceError } from './location.service';
import { locationRepository } from './location.repository';
import type { Location } from './location.types';

const mockedLocationRepository = locationRepository as jest.Mocked<typeof locationRepository>;

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects moving a location onto itself before touching the repository', async () => {
    await expect(
      locationService.updateLocation('550e8400-e29b-41d4-a716-446655440001', {
        parentId: '550e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow('A location cannot be its own parent.');

    expect(mockedLocationRepository.findById).not.toHaveBeenCalled();
    expect(mockedLocationRepository.isAncestor).not.toHaveBeenCalled();
    expect(mockedLocationRepository.update).not.toHaveBeenCalled();
  });

  it('rejects moving a location into its own descendant', async () => {
    const existingLocation: Location = {
      id: 'loc-1',
      parentId: null,
      name: 'Storage',
      type: null,
      description: null,
      path: 'Storage',
      depth: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    mockedLocationRepository.findById.mockResolvedValue(existingLocation);
    mockedLocationRepository.isAncestor.mockResolvedValue(true);

    await expect(
      locationService.updateLocation('550e8400-e29b-41d4-a716-446655440001', {
        parentId: '550e8400-e29b-41d4-a716-446655440002',
      })
    ).rejects.toThrow('A location cannot be placed inside its own descendant.');

    expect(mockedLocationRepository.isAncestor).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002'
    );
    expect(mockedLocationRepository.update).not.toHaveBeenCalled();
  });

  it('updates a location when the new parent is valid', async () => {
    const existingLocation: Location = {
      id: 'loc-1',
      parentId: null,
      name: 'Storage',
      type: null,
      description: null,
      path: 'Storage',
      depth: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const updatedLocation: Location = {
      ...existingLocation,
      parentId: 'loc-2',
    };

    mockedLocationRepository.findById.mockResolvedValue(existingLocation);
    mockedLocationRepository.isAncestor.mockResolvedValue(false);
    mockedLocationRepository.update.mockResolvedValue(updatedLocation);

    await expect(
      locationService.updateLocation('550e8400-e29b-41d4-a716-446655440001', {
        parentId: '550e8400-e29b-41d4-a716-446655440002',
      })
    ).resolves.toEqual(updatedLocation);

    expect(mockedLocationRepository.update).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
      { parentId: '550e8400-e29b-41d4-a716-446655440002' }
    );
  });

  it('blocks deletion when the location still has items', async () => {
    mockedLocationRepository.findById.mockResolvedValue({
      id: 'loc-1',
      parentId: null,
      name: 'Storage',
      type: null,
      description: null,
      path: 'Storage',
      depth: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    mockedLocationRepository.findAll.mockResolvedValue([]);
    mockedLocationRepository.countItemsAtLocation.mockResolvedValue(2);

    await expect(locationService.deleteLocation('loc-1')).rejects.toThrow(
      'This location contains 2 item(s). Move the items before deleting the location.'
    );

    expect(mockedLocationRepository.delete).not.toHaveBeenCalled();
  });

  it('returns subtree confirmation fieldErrors when descendants exist', async () => {
    const rootLocation: Location = {
      id: 'loc-1',
      parentId: null,
      name: 'Storage',
      type: null,
      description: null,
      path: 'Storage',
      depth: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const descendantLocation: Location = {
      id: 'loc-2',
      parentId: 'loc-1',
      name: 'Box',
      type: null,
      description: null,
      path: 'Storage/Box',
      depth: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    mockedLocationRepository.findById.mockResolvedValue(rootLocation);
    mockedLocationRepository.findAll.mockResolvedValue([rootLocation, descendantLocation]);
    mockedLocationRepository.countItemsAtLocation.mockResolvedValue(0);

    try {
      await locationService.deleteLocation('loc-1');
      throw new Error('Expected deleteLocation to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(LocationServiceError);
      if (err instanceof LocationServiceError) {
        expect(err.fieldErrors?.requiresSubtreeConfirmation).toBe('true');
        expect(err.fieldErrors?.descendantCount).toBe('1');
      }
    }

    expect(mockedLocationRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes a location with subtree when there are no items', async () => {
    mockedLocationRepository.countItemsAtLocation.mockResolvedValue(0);
    mockedLocationRepository.delete.mockResolvedValue(undefined);

    await expect(locationService.deleteLocationWithSubtree('loc-1')).resolves.toBeUndefined();
    expect(mockedLocationRepository.delete).toHaveBeenCalledWith('loc-1');
  });
});
