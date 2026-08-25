export type ItemStatus = 'active' | 'archived' | 'lost' | 'consumed' | 'disposed' | 'lent';

export interface Item {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  quantity: number;
  unit: string | null;
  condition: string | null;
  status: ItemStatus;
  photoUri: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the UI actually needs to render an item row — current location
 * path is joined in, not a separate query per row. */
export interface ItemWithLocation extends Item {
  currentLocationPath: string | null;
  categoryName: string | null;
}

export interface CreateItemInput {
  name: string;
  locationId: string;
  description?: string;
  categoryId?: string;
  quantity?: number;
  unit?: string;
  condition?: string;
  photoUri?: string;
  notes?: string;
  tagIds?: string[];
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  quantity?: number;
  unit?: string;
  condition?: string;
  photoUri?: string | null;
  notes?: string;
  tagIds?: string[];
}

export interface FindAllItemsOptions {
  offset?: number;
  limit?: number;
  categoryId?: string;
  tagId?: string;
  status?: ItemStatus;
}
