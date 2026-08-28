import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(30),
});

export type CreateTagFormValues = z.infer<typeof createTagSchema>;
