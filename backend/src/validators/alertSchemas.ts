import { z } from 'zod';

export const createAlertSchema = z.object({
  name: z.string().min(2, 'Alert name is required').max(100),
  keywords: z.string().optional(),
  sourceIds: z.array(z.string()).optional().default([]),
  categoryId: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  enabled: z.boolean().optional().default(true)
});

export const updateAlertSchema = createAlertSchema.partial();
