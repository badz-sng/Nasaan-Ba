import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name').max(200),
  icon: z.string().trim().max(50).nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name').max(200).optional(),
  icon: z.string().trim().max(50).nullable().optional(),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;
