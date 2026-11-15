import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/auctionlens?schema=public'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  
  JWT_SECRET: z.string().default('auctionlens-super-secret-jwt-key-change-in-production-2026'),
  JWT_REFRESH_SECRET: z.string().default('auctionlens-super-refresh-secret-jwt-key-2026'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  DATA_PROVIDER: z.enum(['mock', 'gem', 'all']).default('mock'),
  SCRAPER_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  SCRAPE_INTERVAL_MINUTES: z.string().transform(Number).default('30'),
  
  GEM_BASE_URL: z.string().default('https://forwardauction.gem.gov.in'),
  MSTC_BASE_URL: z.string().default('https://www.mstcecommerce.com'),
  
  REDIS_URL: z.string().optional(),
  
  ADMIN_EMAIL: z.string().email().default('admin@auctionlens.io'),
  ADMIN_PASSWORD: z.string().default('AdminPassword@2026'),
  ADMIN_NAME: z.string().default('System Administrator')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
