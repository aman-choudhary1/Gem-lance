import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import {
  AuctionDataProvider,
  RawAuction,
  RawAuctionDetail,
  FetchAuctionParams,
  ProviderHealth
} from '../../types/provider';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { istToDate } from '../../utils/istDate';

/**
 * GemAuctionProvider
 *
 * Implements public data ingestion for Government e-Marketplace (GeM) Forward Auction Portal.
 * Portal: https://forwardauction.gem.gov.in/eprocure/home
 *
 * Uses a standard headless browser to render the public listing page (the listing is populated
 * client-side). It does NOT attempt to evade bot protection: if the portal blocks or challenges
 * the request, the provider returns no records rather than substituting placeholder data.
 *
 * Fields the public listing does not expose (reserve price, EMD, bid increment) are left empty
 * instead of being estimated.
 */
export class GemAuctionProvider implements AuctionDataProvider {
  public readonly sourceCode = 'GEM';
  public readonly sourceName = 'Government e-Marketplace (GeM Forward Auction)';
  public readonly baseUrl: string;

  private client: AxiosInstance;
  private lastSyncTime: Date | null = null;
  private lastError: string | null = null;
  private liveAuctionsCache: Map<string, RawAuctionDetail> = new Map();

  constructor() {
    this.baseUrl = env.GEM_BASE_URL || 'https://forwardauction.gem.gov.in';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://forwardauction.gem.gov.in',
        'Referer': 'https://forwardauction.gem.gov.in/eprocure/home'
      }
    });
  }

  public async fetchAuctions(params?: FetchAuctionParams): Promise<RawAuction[]> {
    logger.info(`[GemAuctionProvider] Initiating live GeM Forward Auction collection cycle...`, { params });

    try {
      // Step 1: Attempt live browser-based multi-page scraping
      const maxPages = params?.limit && params.limit <= 10 ? 1 : 5; // Scrape up to 50 lots by default
      const liveAuctions = await this.scrapeLiveAuctionsViaBrowser(maxPages, params?.search);

      if (liveAuctions.length > 0) {
        this.lastSyncTime = new Date();
        this.lastError = null;
        logger.info(`[GemAuctionProvider] Successfully fetched ${liveAuctions.length} live auctions directly from GeM portal.`);
        return liveAuctions;
      }

      logger.warn(`[GemAuctionProvider] Live scrape returned 0 items. No records ingested this cycle.`);
      return [];
    } catch (error) {
      const msg = (error as Error).message;
      this.lastError = msg;
      // Re-throw so the pipeline records a FAILED job instead of a silent empty success.
      throw new Error(`GeM live scrape failed: ${msg}`);
    }
  }

  public async fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null> {
    return this.liveAuctionsCache.get(externalId) ?? null;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const res = await this.client.get('/eprocure/home', { validateStatus: (status) => status < 500 });
      return {
        source: this.sourceCode,
        healthy: res.status >= 200 && res.status < 400,
        lastSuccessfulSync: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
        responseTimeMs: Date.now() - startTime,
        message: `GeM Forward Auction portal responded with HTTP ${res.status}.`,
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

  /**
   * Renders the public GeM Forward Auction listing with a headless browser and parses each page.
   */
  private async scrapeLiveAuctionsViaBrowser(maxPages: number, searchTerm?: string): Promise<RawAuction[]> {
    logger.info(`[GemAuctionProvider] Launching stealth browser to scrape up to ${maxPages} pages from GeM portal...`);
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const results: RawAuction[] = [];

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      await page.goto(`${this.baseUrl}/eprocure/home`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // If search term provided, fill search box
      if (searchTerm) {
        await page.type('#keywrdSearch', searchTerm);
      }

      // Click Search button
      await page.click('#searchAuc');
      await new Promise((r) => setTimeout(r, 4000));

      for (let p = 1; p <= maxPages; p++) {
        const html = await page.content();
        const pageAuctions = this.parseGeMListingHtml(html);
        
        for (const auc of pageAuctions) {
          if (!results.some(r => r.externalId === auc.externalId)) {
            results.push(auc);
            this.liveAuctionsCache.set(auc.externalId, auc as RawAuctionDetail);
          }
        }

        if (p < maxPages) {
          await page.evaluate((nextPage) => {
            const input = document.getElementById('gotoPage') as HTMLInputElement;
            if (input) input.value = String(nextPage);
            if (typeof (window as any).goToPage === 'function') {
              (window as any).goToPage(nextPage);
            } else {
              const btn = document.getElementById('btnNext');
              if (btn) btn.click();
            }
          }, p + 1);

          await new Promise((r) => setTimeout(r, 3500));
        }
      }
    } finally {
      await browser.close();
    }

    return results;
  }

  /**
   * Parses GeM portal HTML listings into RawAuction objects
   */
  private parseGeMListingHtml(html: string): RawAuction[] {
    const $ = cheerio.load(html);
    const auctions: RawAuction[] = [];

    $('.eproc-listing-main').each((_, el) => {
      const item = $(el);

      // Extract Auction ID (e.g. "1) Auction ID : 41602")
      const indexText = item.find('.index label, .index').text().trim();
      const idMatch = indexText.match(/Auction ID\s*:\s*([A-Za-z0-9]+)/i);
      const rawId = idMatch ? idMatch[1] : '';
      if (!rawId) return;

      const externalId = rawId.startsWith('GEM') ? rawId : `GEM/FA/2026/${rawId}`;

      // Title & Notice URL
      const titleLink = item.find('.brief a');
      const title = titleLink.text().trim();
      const noticeHref = titleLink.attr('href') || '';
      const officialUrl = noticeHref.startsWith('http')
        ? noticeHref
        : `https://forwardauction.gem.gov.in${noticeHref}`;

      if (!title) return;

      // Organization & Department
      const depts: string[] = [];
      item.find('.department .x-dept-name').each((_, d) => {
        const dt = $(d).text().replace(/\s+/g, ' ').trim();
        if (dt && dt !== 'N/A' && !depts.includes(dt)) {
          depts.push(dt);
        }
      });
      const orgName = depts[0] || 'Government of India';
      const deptName = depts[1] || 'Disposal Cell';

      // Location parsing from map-marker container
      const locWrapper = item.find('.fa-map-marker').closest('.inner-date-wrapper');
      const locParts: string[] = [];
      locWrapper.find('span').each((_, s) => {
        const txt = $(s).text().replace(/[-–\.]/g, '').replace(/\s+/g, ' ').trim();
        if (txt && txt !== 'View More' && !locParts.includes(txt)) {
          locParts.push(txt);
        }
      });

      let city = 'New Delhi';
      let district = 'New Delhi';
      let state = 'Delhi';
      let pincode = '';

      if (locParts.length >= 4) {
        city = locParts[0];
        district = locParts[1];
        state = locParts[2];
        pincode = locParts[3];
      } else if (locParts.length === 3) {
        city = locParts[0];
        district = locParts[0];
        state = locParts[1];
        pincode = locParts[2];
      } else if (locParts.length === 2) {
        city = locParts[0];
        district = locParts[0];
        state = locParts[1];
      } else if (locParts.length === 1) {
        state = locParts[0];
        city = locParts[0];
        district = locParts[0];
      }

      // Dates
      const startText = item.find('.start-date').text().replace(/Start Date\s*:/i, '').trim();
      const endText = item.find('.end-date').text().replace(/End Date\s*:/i, '').trim();
      const startTime = this.parseGeMDate(startText);
      const endTime = this.parseGeMDate(endText);

      // Documents
      const documents: any[] = [];
      item.find('.cta-links a').each((_, a) => {
        const href = $(a).attr('href');
        const linkText = $(a).text().trim();
        if (href && href !== 'javascript:') {
          documents.push({
            name: `${rawId}_${linkText.replace(/\s+/g, '_')}.pdf`,
            documentType: linkText.toUpperCase().includes('EVENT') ? 'TENDER_NOTICE' : 'DOCUMENT',
            url: href.startsWith('http') ? href : `https://forwardauction.gem.gov.in${href}`
          });
        }
      });

      // Category detection
      const categoryName = this.inferCategory(title);

      // The public listing does not publish reserve price / EMD; leave them unknown (0 = not disclosed).
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return;

      auctions.push({
        externalId,
        title,
        description: `Official GeM Forward Auction Lot (${rawId}) published by ${orgName}. Conducted under GeM Forward Auction Guidelines.`,
        categoryName,
        organization: {
          name: orgName,
          department: deptName,
          externalId: `ORG-GEM-${rawId}`
        },
        location: {
          country: 'India',
          state,
          district,
          city,
          address: locParts.join(', ') || `${city}, ${state} ${pincode}`
        },
        startPrice: 0,
        startTime,
        endTime,
        officialUrl,
        documents,
        rawData: {
          source: 'GEM_LIVE_PUPPETEER',
          gemAuctionId: rawId,
          scrapedAt: new Date().toISOString()
        }
      });
    });

    return auctions;
  }

  private parseGeMDate(str: string): Date {
    if (!str) return new Date(NaN);
    // Expected format: DD/MM/YYYY HH:mm:ss
    const [datePart, timePart] = str.trim().split(/\s+/);
    if (!datePart) return new Date(NaN);
    const parts = datePart.split('/');
    if (parts.length < 3) return new Date(NaN);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    let hours = 10;
    let minutes = 0;
    let seconds = 0;

    if (timePart) {
      const tParts = timePart.split(':');
      hours = parseInt(tParts[0], 10) || 0;
      minutes = parseInt(tParts[1], 10) || 0;
      seconds = parseInt(tParts[2], 10) || 0;
    }

    return istToDate(year, month, day, hours, minutes, seconds);
  }

  private inferCategory(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('vehicle') || t.includes('bolero') || t.includes('sumo') || t.includes('gypsy') || t.includes('car') || t.includes('truck') || t.includes('bus') || t.includes('ambulance')) {
      return 'Vehicles & Automotive';
    }
    if (t.includes('copper') || t.includes('scrap') || t.includes('steel') || t.includes('aluminium') || t.includes('iron') || t.includes('metal') || t.includes('brass')) {
      return 'Ferrous & Non-Ferrous Scrap';
    }
    if (t.includes('machine') || t.includes('lathe') || t.includes('milling') || t.includes('drill') || t.includes('cnc') || t.includes('tool') || t.includes('pump')) {
      return 'Industrial Machinery';
    }
    if (t.includes('server') || t.includes('it item') || t.includes('computer') || t.includes('switch') || t.includes('laptop') || t.includes('e-waste') || t.includes('electronic') || t.includes('ups')) {
      return 'IT & Electronics Equipment';
    }
    if (t.includes('generator') || t.includes('dg set') || t.includes('diesel') || t.includes('transformer') || t.includes('motor') || t.includes('turbine')) {
      return 'Plant & Equipment';
    }
    if (t.includes('shop') || t.includes('office') || t.includes('building') || t.includes('plot') || t.includes('land') || t.includes('lease') || t.includes('flat') || t.includes('space') || t.includes('commercial')) {
      return 'Commercial & Residential Property';
    }
    if (t.includes('forest') || t.includes('timber') || t.includes('wood') || t.includes('tree') || t.includes('log')) {
      return 'Forestry & Agricultural Produce';
    }
    return 'General Surplus & Misc';
  }
}
