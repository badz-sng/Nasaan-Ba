import {
  createLocationSchema,
  updateLocationSchema,
} from './location.validation';
import { locationRepository } from './location.repository';
import type { Location, LocationTreeNode } from './location.types';

export class LocationServiceError extends Error {
  constructor(message: string, public readonly fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

class LocationService {
  private async countDescendants(id: string): Promise<number> {
    const location = await locationRepository.findById(id);
    if (!location) {
      return 0;
    }

    const allLocations = await locationRepository.findAll();
    const descendantPrefix = `${location.path}/`;

    return allLocations.filter((candidate) => candidate.path.startsWith(descendantPrefix)).length;
  }

  buildTree(flat: Location[]): LocationTreeNode[] {
    const map = new Map<string, LocationTreeNode>();
    const roots: LocationTreeNode[] = [];

    for (const loc of flat) {
      map.set(loc.id, { ...loc, children: [] });
    }

    for (const loc of flat) {
      const node = map.get(loc.id)!;
      if (loc.parentId && map.has(loc.parentId)) {
        map.get(loc.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNodes = (nodes: LocationTreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      for (const n of nodes) sortNodes(n.children);
    };
    sortNodes(roots);

    return roots;
  }

  async getLocationTree(): Promise<LocationTreeNode[]> {
    const flat = await locationRepository.findAll();
    return this.buildTree(flat);
  }

  async getAllLocations(): Promise<Location[]> {
    return locationRepository.findAll();
  }

  async getLocation(id: string): Promise<Location | null> {
    return locationRepository.findById(id);
  }

  async createLocation(rawInput: unknown): Promise<Location> {
    const parsed = createLocationSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new LocationServiceError('The location details are invalid.', fieldErrors);
    }

    try {
      return await locationRepository.create(parsed.data);
    } catch {
      throw new LocationServiceError('Could not save the location. Please try again.');
    }
  }

  async updateLocation(id: string, rawInput: unknown): Promise<Location> {
    const parsed = updateLocationSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new LocationServiceError('The location details are invalid.', fieldErrors);
    }

    if (parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
      if (parsed.data.parentId === id) {
        throw new LocationServiceError('A location cannot be its own parent.');
      }
    }

    const existing = await locationRepository.findById(id);
    if (!existing) {
      throw new LocationServiceError('Location not found.');
    }

    if (parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
      const wouldCycle = await locationRepository.isAncestor(id, parsed.data.parentId);
      if (wouldCycle) {
        throw new LocationServiceError('A location cannot be placed inside its own descendant.');
      }
    }

    try {
      return await locationRepository.update(id, parsed.data);
    } catch {
      throw new LocationServiceError('Could not update the location. Please try again.');
    }
  }

  async deleteLocation(id: string): Promise<void> {
    const descendantCount = await this.countDescendants(id);
    if (descendantCount > 0) {
      throw new LocationServiceError(
        'This location has sub-locations. Confirm deletion to continue.',
        {
          requiresSubtreeConfirmation: 'true',
          descendantCount: String(descendantCount),
        }
      );
    }

    const itemCount = await locationRepository.countItemsAtLocation(id);
    if (itemCount > 0) {
      throw new LocationServiceError(
        `This location contains ${itemCount} item(s). Move the items before deleting the location.`
      );
    }

    try {
      await locationRepository.delete(id);
    } catch {
      throw new LocationServiceError('Could not delete the location. It may still contain sublocations.');
    }
  }

  async deleteLocationWithSubtree(id: string): Promise<void> {
    const itemCount = await locationRepository.countItemsAtLocation(id);
    if (itemCount > 0) {
      throw new LocationServiceError(
        `This location contains ${itemCount} item(s). Move the items before deleting the location.`
      );
    }

    try {
      await locationRepository.delete(id);
    } catch {
      throw new LocationServiceError('Could not delete the location. It may still contain sublocations.');
    }
  }
}

export const locationService = new LocationService();
