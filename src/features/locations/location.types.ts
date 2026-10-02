export type LocationType =
  | 'HOUSE'
  | 'FLOOR'
  | 'ROOM'
  | 'AREA'
  | 'FURNITURE'
  | 'DRAWER'
  | 'CABINET'
  | 'CONTAINER'
  | 'OTHER';

export interface Location {
  id: string;
  parentId: string | null;
  name: string;
  type: string | null;
  description: string | null;
  path: string;
  depth: number;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationTreeNode extends Location {
  children: LocationTreeNode[];
}

export interface CreateLocationInput {
  name: string;
  parentId?: string | null;
  type?: string;
  description?: string;
}

export interface UpdateLocationInput {
  name?: string;
  parentId?: string | null;
  type?: string;
  description?: string;
}
