import { z } from 'zod';

const locationTypeSchema = z.enum([
  'HOUSE',
  'FLOOR',
  'ROOM',
  'AREA',
  'FURNITURE',
  'DRAWER',
  'CABINET',
  'CONTAINER',
  'OTHER',
]);

export const createLocationSchema = z.object({
  name: z.string().trim().min(1, 'Enter a location name').max(200),
  parentId: z.string().uuid().nullable().optional(),
  type: locationTypeSchema.optional(),
  description: z.string().trim().max(1000).optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().trim().min(1, 'Enter a location name').max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  type: locationTypeSchema.optional(),
  description: z.string().trim().max(1000).optional(),
});

export type CreateLocationFormValues = z.infer<typeof createLocationSchema>;
export type UpdateLocationFormValues = z.infer<typeof updateLocationSchema>;
