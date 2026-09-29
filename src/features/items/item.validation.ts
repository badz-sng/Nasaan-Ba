import { z } from 'zod';

// Per spec 3.6: only Name and Location are essential. Everything else
// is optional — don't add required fields here without a product reason,
// every required field is friction against the "few seconds" MVP principle.
export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Enter an item name').max(200),
  locationId: z.string().uuid('Choose a location'),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
  unit: z.string().trim().max(50).optional(),
  condition: z.string().trim().max(100).optional(),
  photoUri: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  tagIds: z.array(z.string().uuid()).transform((ids) => [...new Set(ids)]).optional(),
});

export const updateItemSchema = z.object({
  name: z.string().trim().min(1, 'Enter an item name').max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).optional(),
  unit: z.string().trim().max(50).optional(),
  condition: z.string().trim().max(100).optional(),
  photoUri: z.string().nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
  tagIds: z.array(z.string().uuid()).transform((ids) => [...new Set(ids)]).optional(),
});

export type CreateItemFormValues = z.infer<typeof createItemSchema>;
export type UpdateItemFormValues = z.infer<typeof updateItemSchema>;
