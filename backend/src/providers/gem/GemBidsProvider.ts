import axios, { AxiosInstance } from 'axios';
import {
  AuctionDataProvider,
  RawAuction,
  RawAuctionDetail,
  FetchAuctionParams,
  ProviderHealth
} from '../../types/provider';
import { logger } from '../../utils/logger';

/**
 * GemBidsProvider
 *
 * Implements data ingestion for Government e-Marketplace (GeM) Procurement Bids & RAs Portal.
 * Portal: https://bidplus.gem.gov.in/all-bids
 * Data Endpoint: https://bidplus.gem.gov.in/all-bids-data
 */
export class GemBidsProvider implements AuctionDataProvider {
  public readonly sourceCode = 'GEM_BIDS';
  public readonly sourceName = 'Government e-Marketplace (GeM Procurement Bids & RAs)';
  public readonly baseUrl: string = 'https://bidplus.gem.gov.in';

  private client: AxiosInstance;
  private lastSyncTime: Date | null = null;
  private lastError: string | null = null;
  private bidsCache: Map<string, RawAuctionDetail> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://bidplus.gem.gov.in',
        'Referer': 'https://bidplus.gem.gov.in/all-bids'
      }
    });
  }

  public async fetchAuctions(params?: FetchAuctionParams): Promise<RawAuction[]> {
    logger.info(`[GemBidsProvider] Initiating live GeM Bids collection cycle...`, { params });

    try {
      // 1. Synchronize session and extract CSRF token from /all-bids landing page
      const landingRes = await this.client.get('/all-bids', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const cookies = (landingRes.headers['set-cookie'] || []).map((c: string) => c.split(';')[0]).join('; ');
      const csrfMatch = landingRes.data.match(/csrf_bd_gem_nk['"]?\s*:\s*['"]([a-f0-9]+)['"]/i) ||
                        landingRes.data.match(/name=['"]csrf_bd_gem_nk['"]\s+value=['"]([a-f0-9]+)['"]/i);
      const csrf = csrfMatch ? csrfMatch[1] : '';

      if (!csrf) {
        throw new Error('Unable to extract CSRF token (csrf_bd_gem_nk) from GeM BidPlus portal');
      }

      const results: RawAuction[] = [];
      const maxPages = params?.limit && params.limit <= 10 ? 1 : 5; // Default 5 pages = 50 live bids

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const postdata = {
          page: pageNum,
          param: {
            searchBid: params?.search || '',
            searchType: 'fullText'
          },
          filter: {
            bidStatusType: 'ongoing_bids',
            byType: 'all',
            highBidValue: '',
            byEndDate: { from: '', to: '' },
            sort: 'Bid-End-Date-Oldest'
          }
        };

        const formData = new URLSearchParams();
        formData.append('payload', JSON.stringify(postdata));
        formData.append('csrf_bd_gem_nk', csrf);

        const apiRes = await this.client.post('/all-bids-data', formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': cookies
          },
          validateStatus: (status) => status < 500
        });

        if (apiRes.status === 200 && apiRes.data?.code === 200) {
          const docs = apiRes.data?.response?.response?.docs || [];
          if (docs.length === 0) break;

          for (const doc of docs) {
            const parsed = this.mapDocToRawAuction(doc);
            if (parsed && !results.some((r) => r.externalId === parsed.externalId)) {
              results.push(parsed);
              this.bidsCache.set(parsed.externalId, parsed as RawAuctionDetail);
            }
          }
        } else {
          logger.warn(`[GemBidsProvider] Non-200 status on page ${pageNum}: ${apiRes.status}`);
          break;
        }

        // Polite delay between batch requests
        if (pageNum < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      if (results.length > 0) {
        this.lastSyncTime = new Date();
        this.lastError = null;
        logger.info(`[GemBidsProvider] Successfully fetched ${results.length} live bids directly from GeM BidPlus endpoint.`);
        return results;
      }

      logger.warn(`[GemBidsProvider] Live API returned 0 records. No records ingested this cycle.`);
      return [];
    } catch (error) {
      const msg = (error as Error).message;
      this.lastError = msg;
      throw new Error(`GeM BidPlus fetch failed: ${msg}`);
    }
  }

  public async fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null> {
    return this.bidsCache.get(externalId) ?? null;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const res = await this.client.get('/all-bids', {
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        validateStatus: (status) => status < 500
      });

      return {
        source: this.sourceCode,
        healthy: res.status >= 200 && res.status < 400,
        lastSuccessfulSync: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
        responseTimeMs: Date.now() - startTime,
        message: `GeM BidPlus portal responded with HTTP ${res.status}.`,
        details: {
          baseUrl: this.baseUrl,
          statusCode: res.status,
          lastError: this.lastError
        }
      };
    } catch (error) {
      return {
        source: this.sourceCode,
        healthy: false,
        lastSuccessfulSync: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
        responseTimeMs: Date.now() - startTime,
        message: (error as Error).message
      };
    }
  }

  private mapDocToRawAuction(doc: any): RawAuction | null {
    try {
      const bId = doc.b_id?.[0] || doc.id;
      const rawBidNumber = doc.b_bid_number?.[0] || `GEM/BID/${bId}`;
      const rawCategory = doc.b_category_name?.[0] || doc.bd_category_name?.[0] || 'General Procurement';
      const quantity = Math.max(1, Number(doc.b_total_quantity?.[0]) || 1);
      const bidType = Number(doc.b_bid_type?.[0]) || 0;
      const isRA = bidType === 2 || bidType === 5;
      const typeLabel = isRA ? 'Reverse Auction (RA)' : 'Procurement Bid';

      const minName = doc.ba_official_details_minName?.[0] || 'Government of India';
      const deptName = doc.ba_official_details_deptName?.[0] && doc.ba_official_details_deptName[0] !== 'NA'
        ? doc.ba_official_details_deptName[0]
        : 'Procurement Division';

      // Document link construction
      let docLbl = 'showbidDocument';
      if (bidType === 5) {
        docLbl = 'showdirectradocumentPdf';
      } else if (bidType === 2) {
        docLbl = 'showradocumentPdf';
      }
      const officialUrl = `https://bidplus.gem.gov.in/${docLbl}/${bId}`;

      // Dates parsing
      // Skip bids without a published closing date rather than inventing one.
      if (!doc.final_end_date_sort?.[0]) return null;
      let startTime = doc.final_start_date_sort?.[0] ? new Date(doc.final_start_date_sort[0]) : new Date();
      const endTime = new Date(doc.final_end_date_sort[0]);

      if (isNaN(endTime.getTime())) return null;
      if (isNaN(startTime.getTime())) startTime = new Date();

      // BidPlus listing data does not publish an estimated bid value, so price fields stay unknown.
      const isHighValue = Boolean(doc.is_high_value?.[0]);

      const title = `${typeLabel}: ${rawCategory} (Qty: ${quantity.toLocaleString('en-IN')})`;
      const categoryName = this.inferCategory(rawCategory);

      return {
        externalId: rawBidNumber,
        title,
        description: `Official GeM ${typeLabel} (${rawBidNumber}) published by ${minName} - ${deptName} for supply/delivery of ${rawCategory}. Total quantity: ${quantity.toLocaleString('en-IN')}.`,
        categoryName,
        organization: {
          name: minName,
          department: deptName,
          externalId: `ORG-GEM-BID-${bId}`
        },
        // The listing does not include a delivery location; leave it unspecified.
        startPrice: 0,
        startTime,
        endTime,
        officialUrl,
        items: [
          {
            name: rawCategory,
            quantity,
            unit: 'Nos',
            condition: 'New / Procured'
          }
        ],
        documents: [
          {
            name: `${rawBidNumber.replace(/\//g, '_')}_Notice.pdf`,
            documentType: 'TENDER_NOTICE',
            url: officialUrl
          }
        ],
        rawData: {
          source: 'GEM_BIDS',
          gemBidId: bId,
          bidType,
          isHighValue,
          bunchCount: doc.b_is_bunch?.[0] || 0
        }
      };
    } catch (err) {
      logger.warn(`[GemBidsProvider] Error mapping doc to RawAuction: ${(err as Error).message}`);
      return null;
    }
  }

  private inferCategory(category: string): string {
    const c = category.toLowerCase();
    if (c.includes('needle') || c.includes('catheter') || c.includes('medical') || c.includes('health') || c.includes('hospital')) {
      return 'Medical & Healthcare Equipment';
    }
    if (c.includes('server') || c.includes('laptop') || c.includes('desktop') || c.includes('switch') || c.includes('computer') || /\bit\b/.test(c)) {
      return 'IT & Electronics Equipment';
    }
    if (c.includes('vehicle') || c.includes('car') || c.includes('truck') || c.includes('ambulance')) {
      return 'Vehicles & Automotive';
    }
    if (c.includes('transformer') || c.includes('generator') || c.includes('dg set') || c.includes('machine') || c.includes('tools')) {
      return 'Plant & Equipment';
    }
    if (c.includes('toilet') || c.includes('construction') || c.includes('civil') || c.includes('building') || c.includes('pond')) {
      return 'Commercial & Residential Property';
    }
    if (c.includes('scrap') || c.includes('copper') || c.includes('steel') || c.includes('metal')) {
      return 'Ferrous & Non-Ferrous Scrap';
    }
    return 'General Surplus & Misc';
  }
}
