import axios, { AxiosInstance } from 'axios';
import https from 'https';
import {
  AuctionDataProvider,
  RawAuction,
  RawAuctionDetail,
  FetchAuctionParams,
  ProviderHealth
} from '../../types/provider';
import { GepnicPortalConfig } from './gepnicConfig';
import { logger } from '../../utils/logger';

export class GepnicProvider implements AuctionDataProvider {
  public readonly sourceCode: string;
  public readonly sourceName: string;
  public readonly baseUrl: string;
  public readonly appPath: string;
  public readonly stateName: string;

  private client: AxiosInstance;
  private lastSyncTime: Date | null = null;
  private lastError: string | null = null;
  private cache: Map<string, RawAuctionDetail> = new Map();

  constructor(config: GepnicPortalConfig) {
    this.sourceCode = config.sourceCode.toUpperCase();
    this.sourceName = config.sourceName;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.appPath = config.appPath || '/nicgep/app';
    this.stateName = config.stateName;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
  }

  public async fetchAuctions(params?: FetchAuctionParams): Promise<RawAuction[]> {
    logger.info(`[GepnicProvider:${this.sourceCode}] Starting active tender collection...`, {
      portal: this.sourceName,
      baseUrl: this.baseUrl
    });

    try {
      // 1. Fetch Home / Landing page to establish session & retrieve active tender table
      const landingRes = await this.client.get(this.appPath);
      const cookies = (landingRes.headers['set-cookie'] || [])
        .map((c: string) => c.split(';')[0])
        .join('; ');

      const html = typeof landingRes.data === 'string' ? landingRes.data : '';
      if (!html) {
        throw new Error(`Empty landing response from ${this.baseUrl}${this.appPath}`);
      }

      // 2. Parse home page table (the primary list_table containing active tenders)
      const listTables = html.match(/<table[^>]*class=["']list_table["'][^>]*>([\s\S]*?)<\/table>/gi) || [];
      if (listTables.length === 0) {
        logger.warn(`[GepnicProvider:${this.sourceCode}] No list_table found on landing page`);
        return [];
      }

      // The first list_table on the home page is the "Latest Tenders" table
      const tenderTable = listTables[0];
      if (!tenderTable) return [];
      const rows = tenderTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

      const parsedTenders: RawAuction[] = [];

      for (const row of rows) {
        // Skip header rows
        if (/class=["']list_header["']/i.test(row) || /Tender Title/i.test(row)) {
          continue;
        }

        // Extract cells: [S.No + Title with link, Ref No, Closing Date, Bid Opening Date]
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        if (cells.length < 3 || !cells[0]) continue;

        const cellTexts = cells.map((c) =>
          c
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        );

        // Extract title link and text
        const firstCell = cells[0];
        const linkMatch = firstCell ? firstCell.match(/href=["']([^"']+)["']/i) : null;
        const detailRelPath = linkMatch ? linkMatch[1].replace(/&amp;/g, '&') : null;
        const rawTitle = (cellTexts[0] || '').replace(/^\d+[\.\s]+/, '').trim(); // Remove leading index like "1. "
        const refNo = cellTexts[1] || '';
        const closingDateStr = cellTexts[2] || '';
        const openingDateStr = cellTexts[3] || '';

        if (!rawTitle || rawTitle.length < 3) continue;

        // Try to fetch full details if detail link is available
        let detailedData: Record<string, string> = {};
        if (detailRelPath) {
          try {
            detailedData = await this.fetchDetailHtml(detailRelPath, cookies);
          } catch (detErr) {
            logger.debug(`[GepnicProvider:${this.sourceCode}] Detail fetch skipped for "${refNo}": ${(detErr as Error).message}`);
          }
        }

        // Map extracted fields to RawAuction
        const tenderId = detailedData['Tender ID'] || refNo || `${this.sourceCode}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const title = detailedData['Title'] || rawTitle;
        const workDescription = detailedData['Work Description'] || title;
        const orgChain = detailedData['Organisation Chain'] || 'Government of India';
        const [orgName, deptName] = orgChain.split('||').map((s) => s.trim());
        const tenderCategory = detailedData['Tender Category'] || 'Procurement';
        
        // Parse financial values
        const tenderValueStr = detailedData['Tender Value in ₹'] || detailedData['Tender Value in &#8377;'] || '0';
        const tenderValue = parseFloat(tenderValueStr.replace(/[^\d\.]/g, '')) || 0;

        const emdStr = detailedData['EMD Amount in ₹'] || detailedData['EMD Amount in &#8377;'] || '0';
        const emdAmount = parseFloat(emdStr.replace(/[^\d\.]/g, '')) || 0;

        // Parse critical dates
        const publishedDateStr = detailedData['Published Date'] || detailedData['Bid Submission Start Date'];
        const publishedDate = this.parseGepnicDate(publishedDateStr) || new Date();
        
        const closingDate = this.parseGepnicDate(detailedData['Bid Submission End Date']) ||
                            this.parseGepnicDate(closingDateStr) ||
                            new Date(publishedDate.getTime() + 14 * 24 * 3600000);

        // Ensure startTime is strictly before endTime
        const startTime = publishedDate.getTime() >= closingDate.getTime()
          ? new Date(closingDate.getTime() - 24 * 3600000)
          : publishedDate;

        const locationStr = detailedData['Location'] || this.stateName;
        const pincode = detailedData['Pincode'] || '';

        const rawAuction: RawAuction = {
          externalId: tenderId,
          title,
          description: workDescription,
          sourceStatus: 'ACTIVE',
          categoryName: tenderCategory,
          organization: {
            name: orgName || this.sourceName,
            department: deptName || undefined,
            externalId: refNo || undefined
          },
          location: {
            state: this.stateName,
            city: locationStr,
            address: pincode ? `${locationStr} - ${pincode}` : locationStr,
            country: 'India'
          },
          startPrice: tenderValue,
          emdAmount: emdAmount > 0 ? emdAmount : undefined,
          startTime,
          endTime: closingDate,
          officialUrl: detailRelPath ? `${this.baseUrl}${detailRelPath}` : `${this.baseUrl}${this.appPath}`,
          items: [
            {
              name: title,
              description: workDescription,
              quantity: 1,
              unit: 'Lot',
              estimatedValue: tenderValue > 0 ? tenderValue : undefined
            }
          ],
          documents: [],
          rawData: {
            sourcePortal: this.sourceName,
            refNo,
            openingDateStr,
            ...detailedData
          }
        };

        parsedTenders.push(rawAuction);

        // Cache for detail lookups
        this.cache.set(tenderId, {
          ...rawAuction,
          contactPerson: detailedData['Contract Person'] || undefined,
          contactEmail: detailedData['Email'] || undefined
        });
      }

      this.lastSyncTime = new Date();
      this.lastError = null;
      logger.info(`[GepnicProvider:${this.sourceCode}] Successfully extracted ${parsedTenders.length} active tenders.`);
      return parsedTenders;
    } catch (error) {
      this.lastError = (error as Error).message;
      logger.error(`[GepnicProvider:${this.sourceCode}] Scrape error: ${this.lastError}`);
      return [];
    }
  }

  public async fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null> {
    const cached = this.cache.get(externalId);
    if (cached) return cached;

    // Run active fetch cycle to populate cache
    await this.fetchAuctions();
    return this.cache.get(externalId) || null;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const res = await this.client.get(this.appPath, { timeout: 8000 });
      return {
        source: this.sourceCode,
        healthy: res.status === 200,
        responseTimeMs: Date.now() - startTime,
        lastSuccessfulSync: this.lastSyncTime?.toISOString() || null,
        message: res.status === 200 ? 'Portal reachable and operational' : `HTTP status ${res.status}`
      };
    } catch (err) {
      return {
        source: this.sourceCode,
        healthy: false,
        responseTimeMs: Date.now() - startTime,
        message: (err as Error).message
      };
    }
  }

  /**
   * Helper to fetch and parse the key-value pairs from a GePNIC detail page
   */
  private async fetchDetailHtml(relPath: string, cookies: string): Promise<Record<string, string>> {
    const fullPath = relPath.startsWith('/') ? relPath : `/${relPath}`;
    const res = await this.client.get(fullPath, {
      headers: {
        Cookie: cookies,
        Referer: `${this.baseUrl}${this.appPath}`
      },
      timeout: 10000
    });

    const html = typeof res.data === 'string' ? res.data : '';
    const map: Record<string, string> = {};

    // Standard GePNIC key-value table pairs
    const tdRegex = /<td[^>]*class=["'](?:td_caption|caption_left)["'][^>]*>([\s\S]*?)<\/td>\s*<td[^>]*class=["'](?:td_element|td_field|table_element|field_left)["'][^>]*>([\s\S]*?)<\/td>/gi;
    let match;
    while ((match = tdRegex.exec(html)) !== null) {
      const label = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const val = match[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      if (label && val) {
        map[label] = val;
      }
    }

    return map;
  }

  /**
   * Parses standard GePNIC date formats like "20-Nov-2026 03:00 PM"
   */
  private parseGepnicDate(str?: string): Date | null {
    if (!str) return null;
    const clean = str.replace(/&nbsp;/g, ' ').trim();
    const m = clean.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
    if (!m) return null;

    const day = parseInt(m[1], 10);
    const monthStr = m[2].toLowerCase();
    const year = parseInt(m[3], 10);

    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const month = months[monthStr];
    if (month === undefined) return null;

    let hour = m[4] ? parseInt(m[4], 10) : 0;
    const minute = m[5] ? parseInt(m[5], 10) : 0;
    const ampm = m[6] ? m[6].toUpperCase() : null;

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    return new Date(Date.UTC(year, month, day, hour, minute));
  }
}
