import {
  AuctionDataProvider,
  RawAuction,
  RawAuctionDetail,
  FetchAuctionParams,
  ProviderHealth
} from '../../types/provider';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/**
 * MstcAuctionProvider
 *
 * Architecture-ready placeholder for MSTC Limited E-Auction Portal.
 * Portal: https://www.mstcecommerce.com/auctionhome/index.new.jsp
 *
 * Note: Scheduled for full connector implementation once formal access evaluation is finalized.
 */
export class MstcAuctionProvider implements AuctionDataProvider {
  public readonly sourceCode = 'MSTC';
  public readonly sourceName = 'MSTC Limited E-Auction Portal';
  public readonly baseUrl: string;

  constructor() {
    this.baseUrl = env.MSTC_BASE_URL || 'https://www.mstcecommerce.com';
  }

  public async fetchAuctions(params?: FetchAuctionParams): Promise<RawAuction[]> {
    logger.info(`[MstcAuctionProvider] MSTC provider registered (adapter ready).`, { params });
    // Architecture ready: returns empty or delegated feed until active connector is verified
    return [];
  }

  public async fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null> {
    logger.info(`[MstcAuctionProvider] Detail lookup for: ${externalId}`);
    return null;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return {
      source: this.sourceCode,
      healthy: true,
      lastSuccessfulSync: null,
      responseTimeMs: 0,
      message: 'MSTC provider adapter is registered and ready for activation.',
      details: {
        baseUrl: this.baseUrl,
        status: 'STANDBY'
      }
    };
  }
}
