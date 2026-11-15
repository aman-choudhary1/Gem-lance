export interface RawAuctionItem {
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  condition?: string;
  estimatedValue?: number;
  metadata?: Record<string, unknown>;
}

export interface RawAuctionDocument {
  name: string;
  documentType?: string;
  url: string;
}

export interface RawAuctionLocation {
  state: string;
  district?: string;
  city?: string;
  address?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface RawAuctionOrganization {
  name: string;
  department?: string;
  externalId?: string;
}

export interface RawAuction {
  externalId: string;
  title: string;
  description?: string;
  sourceStatus?: string;
  categoryName?: string;
  organization?: RawAuctionOrganization;
  location?: RawAuctionLocation;
  startPrice: number;
  emdAmount?: number;
  bidIncrement?: number;
  startTime: Date | string;
  endTime: Date | string;
  officialUrl?: string;
  items?: RawAuctionItem[];
  documents?: RawAuctionDocument[];
  rawData?: Record<string, unknown>;
}

export interface RawAuctionDetail extends RawAuction {
  termsConditions?: string;
  inspectionDates?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface FetchAuctionParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  state?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface ProviderHealth {
  source: string;
  healthy: boolean;
  lastSuccessfulSync?: string | null;
  responseTimeMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface AuctionDataProvider {
  readonly sourceCode: string;
  readonly sourceName: string;
  readonly baseUrl: string;

  fetchAuctions(params?: FetchAuctionParams): Promise<RawAuction[]>;
  fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null>;
  healthCheck(): Promise<ProviderHealth>;
}
