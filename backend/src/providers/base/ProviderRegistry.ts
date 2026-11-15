import { AuctionDataProvider, ProviderHealth } from '../../types/provider';
import { logger } from '../../utils/logger';
import { mapWithConcurrency } from '../../utils/concurrency';

const HEALTH_CACHE_TTL_MS = 5 * 60 * 1000;
const HEALTH_CHECK_TIMEOUT_MS = 10_000;
const HEALTH_CHECK_CONCURRENCY = 6;

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, AuctionDataProvider> = new Map();
  private healthCache: { at: number; data: ProviderHealth[] } | null = null;
  private healthInFlight: Promise<ProviderHealth[]> | null = null;

  private constructor() {}

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public register(provider: AuctionDataProvider): void {
    const code = provider.sourceCode.toUpperCase();
    if (this.providers.has(code)) {
      logger.warn(`Provider with code ${code} is already registered. Overwriting.`);
    }
    this.providers.set(code, provider);
    logger.info(`Registered AuctionDataProvider: ${provider.sourceName} [${code}]`);
  }

  public get(sourceCode: string): AuctionDataProvider | undefined {
    return this.providers.get(sourceCode.toUpperCase());
  }

  public getAll(): AuctionDataProvider[] {
    return Array.from(this.providers.values());
  }

  public getRegisteredCodes(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Health of all providers. Results are cached for a few minutes and concurrent callers share one
   * in-flight check, so public dashboards cannot fan out dozens of outbound requests per page view.
   */
  public async checkAllHealth(options: { force?: boolean } = {}): Promise<ProviderHealth[]> {
    if (!options.force && this.healthCache && Date.now() - this.healthCache.at < HEALTH_CACHE_TTL_MS) {
      return this.healthCache.data;
    }
    if (this.healthInFlight) return this.healthInFlight;

    const entries = Array.from(this.providers.entries());
    this.healthInFlight = mapWithConcurrency(entries, HEALTH_CHECK_CONCURRENCY, async ([code, provider]) => {
      try {
        return await withTimeout(provider.healthCheck(), HEALTH_CHECK_TIMEOUT_MS);
      } catch (error) {
        return {
          source: code,
          healthy: false,
          message: error instanceof Error ? error.message : 'Health check failed'
        };
      }
    })
      .then((data) => {
        this.healthCache = { at: Date.now(), data };
        return data;
      })
      .finally(() => {
        this.healthInFlight = null;
      });

    return this.healthInFlight;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Health check timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export const providerRegistry = ProviderRegistry.getInstance();
