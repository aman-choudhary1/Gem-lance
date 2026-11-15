import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../src/config/constants';
import { providerRegistry } from '../src/providers/base/ProviderRegistry';
import { MockAuctionProvider } from '../src/providers/mock/MockAuctionProvider';
import { GemAuctionProvider } from '../src/providers/gem/GemAuctionProvider';
import { GemBidsProvider } from '../src/providers/gem/GemBidsProvider';
import { MstcAuctionProvider } from '../src/providers/mstc/MstcAuctionProvider';
import { runScraperPipeline } from '../src/scraper/pipeline';

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
  const adminPasswordHash = await bcrypt.hash('AdminPassword@2026', 10);
  const buyerPasswordHash = await bcrypt.hash('BuyerPassword@2026', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@auctionlens.io' },
    update: {},
    create: {
      name: 'AuctionLens Administrator',
      email: 'admin@auctionlens.io',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN
    }
  });

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

  // 4. Ingest Mock Provider Dataset (50+ auctions)
  console.log('📥 Ingesting 50+ Multi-Portal Auctions via Pipeline...');
  providerRegistry.register(new MockAuctionProvider());
  providerRegistry.register(new GemAuctionProvider());
  providerRegistry.register(new GemBidsProvider());
  providerRegistry.register(new MstcAuctionProvider());

  await runScraperPipeline('MOCK');
  await runScraperPipeline('GEM');
  await runScraperPipeline('GEM_BIDS');

  // 5. Seed User Alerts & Bookmarks for Demo Buyer
  console.log('🔔 Seeding Sample Alerts and Bookmarks...');
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

  const alert2 = await prisma.auctionAlert.create({
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
  console.log(`   Admin Login: admin@auctionlens.io / AdminPassword@2026`);
  console.log(`   Buyer Login: buyer@auctionlens.io / BuyerPassword@2026`);
}

main()
  .catch((e) => {
    console.error('❌ Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
