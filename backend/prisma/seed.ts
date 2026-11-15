import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../src/config/constants';
import { providerRegistry } from '../src/providers/base/ProviderRegistry';
import { MockAuctionProvider } from '../src/providers/mock/MockAuctionProvider';
import { GemAuctionProvider } from '../src/providers/gem/GemAuctionProvider';
import { GemBidsProvider } from '../src/providers/gem/GemBidsProvider';
import { MstcAuctionProvider } from '../src/providers/mstc/MstcAuctionProvider';
import { runScraperPipeline } from '../src/scraper/pipeline';
import { env, mockDataEnabled, liveDataEnabled } from '../src/config/env';

const DEV_ADMIN_PASSWORD = 'AdminPassword@2026';
const DEMO_BUYER_PASSWORD = 'BuyerPassword@2026';
const isProduction = env.NODE_ENV === 'production';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for AuctionLens...');

  // 1. Seed Default Auction Sources
  console.log('📦 Seeding Auction Sources...');
  const sources = [
    {
      code: 'GEM',
      name: 'Government e-Marketplace (GeM Forward Auction)',
      baseUrl: 'https://forwardauction.gem.gov.in',
      description: 'Official National Public Procurement & Forward Auction Portal of India'
    },
    {
      code: 'GEM_BIDS',
      name: 'Government e-Marketplace (GeM Procurement Bids & RAs)',
      baseUrl: 'https://bidplus.gem.gov.in',
      description: 'Official GeM National Procurement Bids, Reverse Auctions (RAs) & BOQ tenders'
    },
    {
      code: 'MSTC',
      name: 'MSTC Limited E-Auction',
      baseUrl: 'https://www.mstcecommerce.com',
      description: 'Government of India Enterprise e-commerce & disposal auction platform'
    },
    {
      code: 'MOCK',
      name: 'Simulated Multi-Portal Feed',
      baseUrl: 'https://mock.auctionlens.internal',
      description: 'High-fidelity simulation provider for offline development & testing'
    },
    {
      code: 'BANK',
      name: 'Public Sector Banks E-Auction',
      baseUrl: 'https://ibapi.in',
      description: 'Indian Banks Auctions Mortgaged Properties Information (IBAPI)'
    },
    {
      code: 'PSU',
      name: 'Central & State PSU Portals',
      baseUrl: 'https://eauction.gov.in',
      description: 'Public Sector Undertakings & Urban Development Authorities'
    }
  ];

  for (const src of sources) {
    await prisma.auctionSource.upsert({
      where: { code: src.code },
      update: { name: src.name, baseUrl: src.baseUrl, description: src.description, enabled: true },
      create: { ...src, enabled: true }
    });
  }

  // 2. Seed Default Categories
  console.log('🏷️  Seeding Categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug }
    });
  }

  // 3. Seed Admin & Test Users
  console.log('👥 Seeding Users...');
  if (isProduction && env.ADMIN_PASSWORD === DEV_ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_PASSWORD to a strong, non-default value before seeding a production database.');
  }
  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: env.ADMIN_NAME,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN
    }
  });

  // The demo buyer account and its sample alerts are development-only.
  if (isProduction) {
    console.log('✅ Production seed completed (no demo accounts or sample data created).');
    console.log(`   Admin Login: ${adminEmail}`);
    return;
  }

  const buyerPasswordHash = await bcrypt.hash(DEMO_BUYER_PASSWORD, 10);
  const demoBuyer = await prisma.user.upsert({
    where: { email: 'buyer@auctionlens.io' },
    update: {},
    create: {
      name: 'Rajesh Sharma (Industrial Buyer)',
      email: 'buyer@auctionlens.io',
      passwordHash: buyerPasswordHash,
      role: Role.USER
    }
  });

  // 4. Ingest data according to DATA_PROVIDER (mock = sample data, live = real portals, all = both)
  console.log(`📥 Ingesting auctions via pipeline (DATA_PROVIDER=${env.DATA_PROVIDER})...`);
  if (mockDataEnabled) {
    providerRegistry.register(new MockAuctionProvider());
    await runScraperPipeline('MOCK');
  }
  if (liveDataEnabled) {
    providerRegistry.register(new GemAuctionProvider());
    providerRegistry.register(new GemBidsProvider());
    providerRegistry.register(new MstcAuctionProvider());
    for (const code of ['GEM', 'GEM_BIDS']) {
      const summary = await runScraperPipeline(code);
      console.log(`   ${code}: ${summary.status} (${summary.recordsCreated} created)${summary.errorMessage ? ` – ${summary.errorMessage}` : ''}`);
    }
  }

  // 5. Seed User Alerts & Bookmarks for Demo Buyer
  console.log('🔔 Seeding Sample Alerts and Bookmarks...');
  // Re-running the seed must not duplicate the demo buyer's alerts.
  await prisma.auctionAlert.deleteMany({ where: { userId: demoBuyer.id } });
  const alert1 = await prisma.auctionAlert.create({
    data: {
      userId: demoBuyer.id,
      name: 'Chhattisgarh Heavy Machinery & Vehicles',
      keywords: 'vehicle, excavator, truck, gypsy',
      state: 'Chhattisgarh',
      minPrice: 100000,
      maxPrice: 20000000,
      enabled: true
    }
  });

  await prisma.auctionAlert.create({
    data: {
      userId: demoBuyer.id,
      name: 'Ferrous Scrap & Metal Lots',
      keywords: 'scrap, copper, hms',
      minPrice: 500000,
      maxPrice: 50000000,
      enabled: true
    }
  });

  // Bookmark a couple of auctions for demo buyer
  await prisma.notification.deleteMany({ where: { userId: demoBuyer.id } });
  const sampleAuctions = await prisma.auction.findMany({ take: 3 });
  for (const a of sampleAuctions) {
    await prisma.savedAuction.upsert({
      where: {
        userId_auctionId: { userId: demoBuyer.id, auctionId: a.id }
      },
      update: {},
      create: {
        userId: demoBuyer.id,
        auctionId: a.id,
        notes: 'Priority inspection scheduled for next Tuesday.'
      }
    });

    await prisma.notification.create({
      data: {
        userId: demoBuyer.id,
        auctionId: a.id,
        type: 'NEW_MATCH',
        title: `Alert Match: ${a.title.substring(0, 50)}...`,
        message: `New auction published matching your active alert rule "${alert1.name}".`
      }
    });
  }

  console.log('✅ Database seed completed successfully!');
  console.log(`   Admin Login: ${adminEmail}${env.ADMIN_PASSWORD === DEV_ADMIN_PASSWORD ? ` / ${DEV_ADMIN_PASSWORD}` : ''}`);
  console.log(`   Buyer Login: buyer@auctionlens.io / ${DEMO_BUYER_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
