/**
 * One-off repair for data ingested by builds before the data-integrity fixes.
 *
 * Older builds:
 *  - inserted a hard-coded "verified catalog" of invented GeM auctions / bids when scraping failed,
 *  - estimated reserve price, EMD and bid increment from title keywords (GeM) or category (GeM Bids),
 *  - stamped every GeM Bid with a made-up New Delhi location,
 *  - stored "not disclosed" prices as 0.
 *
 * Usage (from backend/):
 *   npx ts-node scripts/repair-legacy-data.ts           # dry run: prints what would change
 *   npx ts-node scripts/repair-legacy-data.ts --apply   # performs the changes in one transaction
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const FABRICATED_IDS: Record<string, string[]> = {
  GEM: ['89341', '89342', '89343', '89344', '89345', '89346'].map((n) => `GEM/FA/2026/${n}`),
  GEM_BIDS: ['GEM/2026/B/8001737', 'GEM/2026/B/7914579', 'GEM/2026/B/7981981']
};

async function sourceId(code: string): Promise<string | null> {
  const s = await prisma.auctionSource.findUnique({ where: { code }, select: { id: true } });
  return s?.id ?? null;
}

async function main() {
  console.log(APPLY ? '🔧 Applying repairs...' : '🔍 Dry run (pass --apply to make changes)');

  const gemId = await sourceId('GEM');
  const bidsId = await sourceId('GEM_BIDS');

  // 1. Invented catalog rows
  const fabricatedWhere: Prisma.AuctionWhereInput = {
    OR: [
      ...(gemId ? [{ sourceId: gemId, externalId: { in: FABRICATED_IDS.GEM } }] : []),
      ...(bidsId ? [{ sourceId: bidsId, externalId: { in: FABRICATED_IDS.GEM_BIDS } }] : [])
    ]
  };
  const fabricated = fabricatedWhere.OR!.length ? await prisma.auction.count({ where: fabricatedWhere }) : 0;

  // 2. Estimated prices: GeM live-scraped rows and every GeM Bid
  const estimatedWhere: Prisma.AuctionWhereInput = {
    OR: [
      ...(gemId ? [{ sourceId: gemId, rawData: { path: ['source'], equals: 'GEM_LIVE_PUPPETEER' } }] : []),
      ...(bidsId ? [{ sourceId: bidsId }] : [])
    ],
    // Only rows that still carry an estimated value, so a re-run reports 0.
    AND: [{ OR: [{ startPrice: { not: null } }, { emdAmount: { not: null } }, { bidIncrement: { not: null } }] }]
  };
  const estimated = estimatedWhere.OR!.length ? await prisma.auction.count({ where: estimatedWhere }) : 0;

  // 3. Zero prices that really mean "not disclosed"
  const zeroPrice = await prisma.auction.count({ where: { startPrice: 0 } });

  // 4. Invented "New Delhi" location on GeM Bids
  const fakeBidLocation = bidsId
    ? await prisma.auction.count({
        where: { sourceId: bidsId, location: { state: 'Delhi', city: 'New Delhi' } }
      })
    : 0;

  // 5. Item condition "Used" that the old pipeline stamped on every item when a portal gave none
  const usedWhere = { condition: 'Used', auction: { source: { code: { not: 'MOCK' } } } };
  const defaultedCondition = await prisma.auctionItem.count({ where: usedWhere });

  console.table({
    'Items with defaulted "Used" condition to clear': defaultedCondition,
    'Invented catalog auctions to delete': fabricated,
    'Rows with estimated price/EMD/increment to clear': estimated,
    'Rows with price 0 to set as "not disclosed"': zeroPrice,
    'GeM Bids with invented New Delhi location to clear': fakeBidLocation
  });

  if (!APPLY) return;

  let unspecifiedLocationId: string | null = null;
  if (fakeBidLocation > 0) {
    const existing = await prisma.location.findFirst({
      where: { state: 'Not Specified', district: null, city: null }
    });
    unspecifiedLocationId =
      existing?.id ?? (await prisma.location.create({ data: { country: 'India', state: 'Not Specified' } })).id;
  }

  await prisma.$transaction(async (tx) => {
    if (fabricated > 0) await tx.auction.deleteMany({ where: fabricatedWhere });
    if (estimated > 0) {
      await tx.auction.updateMany({
        where: estimatedWhere,
        data: { startPrice: null, emdAmount: null, bidIncrement: null }
      });
      // Item-level estimated values were copied from the same guess.
      await tx.auctionItem.updateMany({
        where: { auction: estimatedWhere },
        data: { estimatedValue: null }
      });
    }
    await tx.auction.updateMany({ where: { startPrice: 0 }, data: { startPrice: null } });
    if (defaultedCondition > 0) await tx.auctionItem.updateMany({ where: usedWhere, data: { condition: null } });
    if (bidsId && unspecifiedLocationId) {
      await tx.auction.updateMany({
        where: { sourceId: bidsId, location: { state: 'Delhi', city: 'New Delhi' } },
        data: { locationId: unspecifiedLocationId }
      });
    }
  });

  console.log('✅ Repair complete.');
}

main()
  .catch((e) => {
    console.error('❌ Repair failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
