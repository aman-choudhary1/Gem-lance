import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/auctionlens?schema=public'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  // Extra comma-separated origins allowed by CORS (FRONTEND_URL is always allowed).
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((o) => o.trim()).filter(Boolean) : [])),
  
  JWT_SECRET: z.string().default('auctionlens-super-secret-jwt-key-change-in-production-2026'),
  JWT_REFRESH_SECRET: z.string().default('auctionlens-super-refresh-secret-jwt-key-2026'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // mock = sample data only, live = real portals only, all = both. "gem" is a legacy alias for "live".
  DATA_PROVIDER: z.preprocess(
    (val) => (val === 'gem' ? 'live' : val),
    z.enum(['mock', 'live', 'all']).default('mock')
  ),
  GEPNIC_ALLOW_INSECURE_TLS: z.string().optional().transform((val) => val === 'true'),
  TRUST_PROXY: z.string().optional().transform((val) => val === 'true'),
  SCRAPER_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  SCRAPE_INTERVAL_MINUTES: z.string().transform(Number).default('30'),
  
  GEM_BASE_URL: z.string().default('https://forwardauction.gem.gov.in'),
  MSTC_BASE_URL: z.string().default('https://www.mstcecommerce.com'),
  
  REDIS_URL: z.string().optional(),

  // Outgoing email (password reset, later alerts). Without SMTP_HOST, emails are only logged.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().optional().transform((val) => val === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('AuctionLens <no-reply@auctionlens.io>'),
  RESET_TOKEN_TTL_MINUTES: z.string().transform(Number).default('30'),
  
  ADMIN_EMAIL: z.string().email().default('admin@auctionlens.io'),
  ADMIN_PASSWORD: z.string().default('AdminPassword@2026'),
  ADMIN_NAME: z.string().default('System Administrator')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

const DEV_SECRET_PREFIX = 'auctionlens-';

if (parsedEnv.data.NODE_ENV === 'production') {
  const weak = (['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const).filter((key) => {
    const value = parsedEnv.data[key];
    return value.length < 32 || value.startsWith(DEV_SECRET_PREFIX);
  });
  if (weak.length > 0) {
    console.error(
      `❌ Refusing to start in production: ${weak.join(', ')} must be set to a random value of at least 32 characters ` +
        `(e.g. \`openssl rand -hex 32\`).`
    );
    process.exit(1);
  }
  if (parsedEnv.data.JWT_SECRET === parsedEnv.data.JWT_REFRESH_SECRET) {
    console.error('❌ Refusing to start in production: JWT_SECRET and JWT_REFRESH_SECRET must differ.');
    process.exit(1);
  }
}

export const env = parsedEnv.data;

export const mockDataEnabled = env.DATA_PROVIDER === 'mock' || env.DATA_PROVIDER === 'all';
export const liveDataEnabled = env.DATA_PROVIDER === 'live' || env.DATA_PROVIDER === 'all';
