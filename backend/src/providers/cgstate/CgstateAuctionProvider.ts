import axios, { AxiosInstance } from 'axios';
import https from 'https';
import querystring from 'querystring';
import {
  AuctionDataProvider,
  RawAuction,
  RawAuctionDetail,
  FetchAuctionParams,
  ProviderHealth
} from '../../types/provider';
import { decodeHtmlEntities } from '../../utils/textUtils';
import { logger } from '../../utils/logger';

export class CgstateAuctionProvider implements AuctionDataProvider {
  public readonly sourceCode = 'CGSTATE';
  public readonly sourceName = 'Government of Chhattisgarh (CHiPS e-Procurement)';
  public readonly baseUrl: string = 'https://eproc.cgstate.gov.in';

  private client: AxiosInstance;
  private lastSyncTime: Date | null = null;
  private lastError: string | null = null;
  private cache: Map<string, RawAuctionDetail> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 35000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
  }

  public async fetchAuctions(params?: FetchAuctionParams): Promise<RawAuction[]> {
    logger.info(`[CgstateProvider] Initiating Chhattisgarh live tender collection...`, { params });

    try {
      // 1. Handshake with getSignInAction.do to retrieve session cookie and OWASP CSRF token
      const landingRes = await this.client.get('/CHEPS/security/getSignInAction.do');
      const cookies = (landingRes.headers['set-cookie'] || [])
        .map((c: string) => c.split(';')[0])
        .join('; ');

      const landingHtml = typeof landingRes.data === 'string' ? landingRes.data : '';
      const csrfMatch =
        landingHtml.match(/name=["']?OWASP_CSRFTOKEN["']?\s+value=["']?([A-Za-z0-9\-]+)["']?/i) ||
        landingHtml.match(/OWASP_CSRFTOKEN=([A-Za-z0-9\-]+)/i);

      const csrfToken = csrfMatch ? csrfMatch[1] : '';

      logger.info(`[CgstateProvider] Handshake successful. Session established with CSRF token.`);

      // 2. Submit official loadAlldata=Y payload to getSignInAction.do (loads all live active tenders)
      const postPayload = querystring.stringify({
        loadAlldata: 'Y',
        OWASP_CSRFTOKEN: csrfToken,
        pkiEnabledOrg: 'false'
      });

      const liveDataRes = await this.client.post('/CHEPS/security/getSignInAction.do', postPayload, {
        headers: {
          Cookie: cookies,
          Referer: `${this.baseUrl}/CHEPS/security/getSignInAction.do`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const liveHtml = typeof liveDataRes.data === 'string' ? liveDataRes.data : '';
      const parsedTenders = this.parseLiveHtml(liveHtml);

      this.lastSyncTime = new Date();
      this.lastError = null;

      logger.info(`[CgstateProvider] Successfully retrieved ${parsedTenders.length} active Chhattisgarh tenders.`);
      return parsedTenders;
    } catch (error) {
      this.lastError = (error as Error).message;
      logger.error(`[CgstateProvider] Scrape error: ${this.lastError}`);
      return [];
    }
  }

  public async fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null> {
    const cached = this.cache.get(externalId);
    if (cached) return cached;

    // Refresh auctions list to populate cache
    await this.fetchAuctions();
    return this.cache.get(externalId) || null;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const res = await this.client.get('/CHEPS/security/getSignInAction.do', { timeout: 15000 });
      return {
        source: this.sourceCode,
        healthy: res.status === 200,
        responseTimeMs: Date.now() - startTime,
        lastSuccessfulSync: this.lastSyncTime?.toISOString() || null,
        message: res.status === 200 ? 'Chhattisgarh CHiPS portal online & responsive' : `HTTP status ${res.status}`
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
   * Parses the HTML table returned by submitting loadAlldata=Y to getSignInAction.do
   */
  private parseLiveHtml(html: string): RawAuction[] {
    const tenders: RawAuction[] = [];
    if (!html) return tenders;

    const rowSegments = html.split(/<tr/i);
    let currentDept = 'Government of Chhattisgarh';

    for (const segment of rowSegments) {
      // Check if department header row
      const deptMatch = segment.match(/class=["'][^"']*col-md-12[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (deptMatch && deptMatch[1]) {
        const dName = deptMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (dName.length > 3) {
          currentDept = dName;
        }
      }

      // Check if tender row with viewRfq action
      if (segment.includes('viewRfq(')) {
        const rfqMatch = segment.match(/viewRfq\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        const rfqId = rfqMatch ? rfqMatch[1] : '';

        // Extract cells content
        const rawCells = segment.split(/<td/i).slice(1);
        const cellTexts: string[] = rawCells.map((c) => {
          const match = c.match(/>([\s\S]*?)<\/td>/i);
          return match
            ? match[1]
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
            : '';
        });

        const tenderNo = cellTexts[1] || rfqId || '';
        const startStr = cellTexts[2] || '';
        const dueStr = cellTexts[3] || '';

        // Extract full description from tooltiptext or cell fallback
        let title = '';
        const tooltipMatch = segment.match(/<span[^>]*class=["']tooltiptext["'][^>]*>([\s\S]*?)<\/span>/i);
        if (tooltipMatch && tooltipMatch[1]) {
          title = tooltipMatch[1]
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
        } else if (cellTexts[4]) {
          title = cellTexts[4].replace(/&amp;/g, '&').trim();
        }

        // Probable Amount of Contract (PAC)
        let pac = 0;
        if (cellTexts[5]) {
          const num = parseFloat(cellTexts[5].replace(/[^\d\.]/g, ''));
          if (!isNaN(num) && num > 0) pac = num;
        }

        if (!title || (!rfqId && !tenderNo)) continue;

        const externalId = rfqId || tenderNo;
        const closingDate = this.parseCgDate(dueStr) || new Date(Date.now() + 14 * 24 * 3600000);
        const startingDate = this.parseCgDate(startStr) || new Date(closingDate.getTime() - 14 * 24 * 3600000);

        const decodedTitle = decodeHtmlEntities(title);
        const decodedDept = decodeHtmlEntities(currentDept);

        const rawAuction: RawAuction = {
          externalId,
          title: decodedTitle,
          description: `${decodedTitle} - Department: ${decodedDept}`,
          sourceStatus: 'ACTIVE',
          categoryName: 'State Government Works & Procurement',
          organization: {
            name: decodedDept,
            department: decodedDept
          },
          location: {
            state: 'Chhattisgarh',
            city: 'Raipur',
            address: 'Chhattisgarh, India',
            country: 'India'
          },
          startPrice: pac,
          startTime: startingDate,
          endTime: closingDate,
          officialUrl: `${this.baseUrl}/CHEPS/security/getSignInAction.do`,
          items: [
            {
              name: title,
              quantity: 1,
              unit: 'Contract',
              estimatedValue: pac > 0 ? pac : undefined
            }
          ],
          documents: [],
          rawData: {
            source: 'CHiPS / mjunction e-Procurement',
            rfqId: externalId,
            tenderNo,
            department: currentDept,
            pac,
            startStr,
            dueStr
          }
        };

        tenders.push(rawAuction);
        this.cache.set(externalId, {
          ...rawAuction
        });
      }
    }

    return tenders;
  }

  /**
   * Helper to parse date formats like "2026-10-26 7:30:00 PM" or "DD/MM/YYYY"
   */
  private parseCgDate(str: string): Date | null {
    if (!str) return null;

    // Pattern 1: "2026-10-26 7:30:00 PM"
    const m1 = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i);
    if (m1) {
      const year = parseInt(m1[1]!, 10);
      const month = parseInt(m1[2]!, 10) - 1;
      const day = parseInt(m1[3]!, 10);
      let hour = m1[4] ? parseInt(m1[4], 10) : 17;
      const minute = m1[5] ? parseInt(m1[5], 10) : 0;
      const ampm = m1[7] ? m1[7].toUpperCase() : '';

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      return new Date(Date.UTC(year, month, day, hour, minute));
    }

    // Pattern 2: "DD/MM/YYYY"
    const m2 = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m2) {
      const day = parseInt(m2[1]!, 10);
      const month = parseInt(m2[2]!, 10) - 1;
      const year = parseInt(m2[3]!, 10);
      return new Date(Date.UTC(year, month, day, 17, 0));
    }

    return null;
  }
}
