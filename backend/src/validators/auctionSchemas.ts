import { z } from 'zod';

export const auctionFilterSchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().optional(),
  source: z.string().optional(), // Can be single "GEM" or comma-separated "GEM,MSTC"
  category: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  organization: z.string().optional(),
  status: z.string().optional(),
  minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'endingSoon', 'highestPrice', 'lowestPrice', 'recentlyUpdated']).optional().default('newest')
});

export const endingSoonQuerySchema = z.object({
  hours: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 24)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  source: z.string().optional(),
  category: z.string().optional()
});
