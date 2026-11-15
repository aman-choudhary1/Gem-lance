export type AuctionStatus = 'UPCOMING' | 'LIVE' | 'ENDING_SOON' | 'CLOSED' | 'CANCELLED' | 'UNKNOWN';

export interface AuctionSource {
  id: string;
  code: string;
  name: string;
  baseUrl?: string;
  enabled: boolean;
  description?: string;
  auctionCount?: number;
  jobCount?: number;
  _count?: { auctions: number; scrapeJobs?: number };
  health?: {
    source: string;
    healthy: boolean;
    lastSuccessfulSync?: string | null;
    responseTimeMs?: number;
    message?: string;
    details?: Record<string, unknown>;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
  _count?: { auctions: number };
}

export interface Organization {
  id: string;
  name: string;
  department?: string | null;
  source?: string | null;
}

export interface Location {
  id: string;
  country: string;
  state: string;
  district?: string | null;
  city?: string | null;
  address?: string | null;
}

export interface AuctionItem {
  id: string;
  name: string;
  description?: string | null;
  quantity: number | string;
  unit?: string | null;
  condition?: string | null;
  estimatedValue?: number | string | null;
}

export interface AuctionDocument {
  id: string;
  name: string;
  documentType?: string | null;
  url: string;
}

export interface Auction {
  id: string;
  externalId: string;
  title: string;
  description?: string | null;
  sourceId: string;
  source: AuctionSource;
  status: AuctionStatus;
  sourceStatus?: string | null;
  /** null when the source portal does not disclose a price */
  startPrice: number | string | null;
  emdAmount?: number | string | null;
  bidIncrement?: number | string | null;
  startTime: string;
  endTime: string;
  officialUrl?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  organizationId?: string | null;
  organization?: Organization | null;
  locationId?: string | null;
  location?: Location | null;
  items?: AuctionItem[];
  documents?: AuctionDocument[];
  rawData?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  lastScrapedAt: string;
  _count?: {
    items: number;
    documents: number;
    savedByUsers: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  _count?: {
    savedAuctions: number;
    alerts: number;
    notifications: number;
  };
}

export interface SavedAuction {
  id: string;
  userId: string;
  auctionId: string;
  notes?: string | null;
  createdAt: string;
  auction: Auction;
}

export interface AuctionAlert {
  id: string;
  userId: string;
  name: string;
  keywords?: string | null;
  sourceIds: string[];
  categoryId?: string | null;
  state?: string | null;
  district?: string | null;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  auctionId?: string | null;
  auction?: {
    id: string;
    externalId: string;
    title: string;
    status: AuctionStatus;
    source: { code: string };
  } | null;
  type: 'NEW_MATCH' | 'ENDING_SOON' | 'AUCTION_UPDATED' | 'AUCTION_CLOSED' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ScrapeJob {
  id: string;
  sourceId: string;
  source: { code: string; name: string };
  startedAt: string;
  completedAt?: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  recordsFound: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage?: string | null;
}

export interface DashboardStats {
  overview: {
    totalAuctions: number;
    liveAuctions: number;
    upcomingAuctions: number;
    endingTodayAuctions: number;
    ending24HoursAuctions: number;
    newTodayAuctions: number;
    totalSources: number;
    totalOrganizations: number;
    totalLocations: number;
  };
  bySource: Array<{ code: string; name: string; count: number }>;
  byCategory: Array<{ name: string; slug: string; count: number }>;
  byState: Array<{ state: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}
