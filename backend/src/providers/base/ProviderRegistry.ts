import { AuctionDataProvider, ProviderHealth } from '../../types/provider';
import { logger } from '../../utils/logger';

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, AuctionDataProvider> = new Map();

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

  public async checkAllHealth(): Promise<ProviderHealth[]> {
    const promises = Array.from(this.providers.entries()).map(async ([code, provider]) => {
      try {
        return await provider.healthCheck();
      } catch (error) {
        return {
          source: code,
          healthy: false,
          message: error instanceof Error ? error.message : 'Health check failed'
        };
      }
    });
    return Promise.all(promises);
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
