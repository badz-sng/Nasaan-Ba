import { z } from 'zod';

// Per spec 3.6: only Name and Location are essential. Everything else
// is optional — don't add required fields here without a product reason,
// every required field is friction against the "few seconds" MVP principle.
export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Kailangan ng pangalan ng item').max(200),
  locationId: z.string().uuid('Pumili ng lokasyon'),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
  unit: z.string().trim().max(50).optional(),
  condition: z.string().trim().max(100).optional(),
  photoUri: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export type CreateItemFormValues = z.infer<typeof createItemSchema>;
