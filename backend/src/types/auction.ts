import { AuctionStatus } from '@prisma/client';

export interface NormalizedAuction {
  sourceCode: string;
  externalId: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  sourceStatus?: string;
  categoryName?: string;
  organizationName?: string;
  departmentName?: string;
  state: string;
  district?: string;
  city?: string;
  address?: string;
  /** null when the source does not publish a reserve / tender value */
  startPrice: number | null;
  emdAmount?: number;
  bidIncrement?: number;
  startTime: Date;
  endTime: Date;
  officialUrl?: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit?: string;
    condition?: string;
    estimatedValue?: number;
    metadata?: Record<string, unknown>;
  }>;
  documents: Array<{
    name: string;
    documentType?: string;
    url: string;
  }>;
  rawData?: Record<string, unknown>;
}

export interface AuctionFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: string | string[];
  category?: string;
  state?: string;
  district?: string;
  city?: string;
  organization?: string;
  status?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'newest' | 'oldest' | 'endingSoon' | 'highestPrice' | 'lowestPrice' | 'recentlyUpdated';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}
