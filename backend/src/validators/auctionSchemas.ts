import { z } from 'zod';
import { AuctionStatus } from '@prisma/client';

const STATUS_VALUES = Object.values(AuctionStatus) as string[];

const intParam = (fallback: number, min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((val) => {
      const n = val ? parseInt(val, 10) : NaN;
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    });

const priceParam = z
  .string()
  .optional()
  .refine((val) => val === undefined || val === '' || Number.isFinite(parseFloat(val)), 'Must be a number')
  .transform((val) => (val ? parseFloat(val) : undefined));

const dateParam = z
  .string()
  .optional()
  .refine((val) => !val || !isNaN(new Date(val).getTime()), 'Must be a valid date (e.g. 2026-11-15)');

// Comma-separated list of AuctionStatus values, e.g. "LIVE,ENDING_SOON"
const statusParam = z
  .string()
  .optional()
  .refine(
    (val) =>
      !val ||
      val
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .every((s) => STATUS_VALUES.includes(s)),
    `Status must be one or more of: ${STATUS_VALUES.join(', ')}`
  );

export const auctionFilterSchema = z.object({
  page: intParam(1, 1, 10_000),
  limit: intParam(20, 1, 100),
  search: z.string().max(200).optional(),
  source: z.string().max(500).optional(), // Single "GEM" or comma-separated "GEM,MSTC"
  category: z.string().max(200).optional(),
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  organization: z.string().max(200).optional(),
  status: statusParam,
  minPrice: priceParam,
  maxPrice: priceParam,
  startDate: dateParam,
  endDate: dateParam,
  sortBy: z
    .enum(['newest', 'oldest', 'endingSoon', 'highestPrice', 'lowestPrice', 'recentlyUpdated'])
    .optional()
    .default('newest')
});

export const endingSoonQuerySchema = z.object({
  hours: intParam(24, 1, 24 * 30),
  limit: intParam(20, 1, 100),
  source: z.string().max(500).optional(),
  category: z.string().max(200).optional()
});
