import { calculateAuctionStatus } from '../utils/statusCalculator';
import { normalizeAuction, validateAuction, UNSPECIFIED_STATE } from '../scraper/normalizer';
import { stableId } from '../utils/hash';
import { istToDate } from '../utils/istDate';
import { mapWithConcurrency } from '../utils/concurrency';
import { auctionFilterSchema } from '../validators/auctionSchemas';
import { ProviderRegistry } from '../providers/base/ProviderRegistry';
import { MockAuctionProvider } from '../providers/mock/MockAuctionProvider';
import { GemAuctionProvider } from '../providers/gem/GemAuctionProvider';
import { MstcAuctionProvider } from '../providers/mstc/MstcAuctionProvider';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, errorDetails?: unknown) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, errorDetails || '');
    failed++;
  }
}

async function runTestSuite() {
  console.log('🧪 Starting AuctionLens Backend Test Suite...\n');

  // Test 1: Status Calculator
  console.log('--- 1. Auction Status Calculation Tests ---');
  const now = new Date('2026-10-07T12:00:00Z');

  const futureStart = new Date('2026-10-08T12:00:00Z');
  const futureEnd = new Date('2026-10-10T12:00:00Z');
  assert(
    calculateAuctionStatus(futureStart, futureEnd, now) === 'UPCOMING',
    'Future auction should have status UPCOMING'
  );

  const pastStart = new Date('2026-10-05T12:00:00Z');
  const activeEnd = new Date('2026-10-09T12:00:00Z'); // 48 hours left
  assert(
    calculateAuctionStatus(pastStart, activeEnd, now) === 'LIVE',
    'Active auction with >24h remaining should have status LIVE'
  );

  const endingSoonEnd = new Date('2026-10-07T16:00:00Z'); // 4 hours left
  assert(
    calculateAuctionStatus(pastStart, endingSoonEnd, now, 24) === 'ENDING_SOON',
    'Active auction with <24h remaining should have status ENDING_SOON'
  );

  const pastEnd = new Date('2026-10-06T12:00:00Z');
  assert(
    calculateAuctionStatus(pastStart, pastEnd, now) === 'CLOSED',
    'Past auction should have status CLOSED'
  );

  // Test 2: Provider Normalizer & Validator
  console.log('\n--- 2. Normalizer & Validator Tests ---');
  const rawSample = {
    externalId: 'GEM/FA/2026/TEST1',
    title: '  Test Vehicle Lot with High Mileage  ',
    description: 'Surplus Bolero SUVs',
    categoryName: 'Vehicles & Automotive',
    startPrice: 250000,
    startTime: new Date('2026-10-07T10:00:00Z'),
    endTime: new Date('2026-10-09T10:00:00Z'),
    items: [{ name: 'Bolero', quantity: 2, condition: 'Used' }]
  };

  const normalized = normalizeAuction(rawSample, 'GEM');
  assert(normalized.sourceCode === 'GEM', 'Normalizer retains uppercase sourceCode');
  assert(normalized.title === 'Test Vehicle Lot with High Mileage', 'Normalizer trims title');
  assert(normalized.items.length === 1, 'Normalizer preserves item array');
  assert(validateAuction(normalized) === true, 'Valid auction passes validation');

  const invalidAuction = { ...normalized, startTime: new Date('2026-10-10'), endTime: new Date('2026-10-09') };
  assert(validateAuction(invalidAuction) === false, 'Auction with start >= end fails validation');

  // Test 3: Provider Registry
  console.log('\n--- 3. Provider Registry Tests ---');
  const registry = ProviderRegistry.getInstance();
  registry.register(new MockAuctionProvider());
  registry.register(new GemAuctionProvider());
  registry.register(new MstcAuctionProvider());

  const mockP = registry.get('MOCK');
  const gemP = registry.get('GEM');
  const mstcP = registry.get('MSTC');

  assert(!!mockP && mockP.sourceCode === 'MOCK', 'Registry returns MockAuctionProvider');
  assert(!!gemP && gemP.sourceCode === 'GEM', 'Registry returns GemAuctionProvider');
  assert(!!mstcP && mstcP.sourceCode === 'MSTC', 'Registry returns MstcAuctionProvider');
  assert(registry.get('NON_EXISTENT') === undefined, 'Registry returns undefined for unknown provider');

  // Test 4: Mock Provider Dataset
  console.log('\n--- 4. Mock Provider Feed Tests ---');
  const mockAuctions = await mockP!.fetchAuctions();
  assert(mockAuctions.length >= 40, `Mock provider generates rich dataset (${mockAuctions.length} auctions)`);

  const sampleVehicle = mockAuctions.find((a) => a.categoryName?.includes('Vehicle'));
  assert(Boolean(sampleVehicle && sampleVehicle.items && sampleVehicle.items.length > 0), 'Mock vehicle auction includes valid items');

  const health = await mockP!.healthCheck();
  assert(health.healthy === true, 'Mock provider reports healthy');

  // Test 5: Search/Filter within Provider
  console.log('\n--- 5. Provider Filtering Tests ---');
  const filtered = await mockP!.fetchAuctions({ search: 'Vehicle' });
  assert(filtered.length > 0 && filtered.every((a) => a.title.toLowerCase().includes('vehicle') || a.categoryName?.toLowerCase().includes('vehicle')), 'Mock search filter works');

  // Test 6: Data integrity — nothing is invented when a source omits a field
  console.log('\n--- 6. Data Integrity Tests ---');
  const noPrice = normalizeAuction({ ...rawSample, startPrice: 0, items: [] }, 'GEM');
  assert(noPrice.startPrice === null, 'Undisclosed price (0) normalizes to null, not a guess');
  assert(noPrice.items[0].estimatedValue === undefined, 'Default item has no invented estimated value');

  const noLocation = normalizeAuction(rawSample, 'GEM');
  assert(noLocation.state === UNSPECIFIED_STATE && noLocation.city === undefined, 'Missing location stays unspecified (no Delhi default)');

  const noEnd = normalizeAuction({ ...rawSample, endTime: 'not-a-date' }, 'GEM');
  assert(validateAuction(noEnd) === false, 'Record without a valid closing date is rejected, not given a fake one');

  const badDocs = normalizeAuction({ ...rawSample, documents: [{ name: 'x', url: 'javascript:alert(1)' }] }, 'GEM');
  assert(badDocs.documents.length === 0, 'Non-http(s) document URLs are dropped');

  assert(
    stableId('CPPP', 'Road Work', '20-Nov-2026') === stableId('cppp', ' Road Work ', '20-Nov-2026'),
    'stableId is deterministic and normalizes case/whitespace'
  );
  assert(stableId('CPPP', 'Road Work', 'a') !== stableId('CPPP', 'Road Work', 'b'), 'stableId differs for different inputs');

  // Test 7: IST date handling
  console.log('\n--- 7. Timezone Tests ---');
  assert(
    istToDate(2026, 10, 20, 15, 0).toISOString() === '2026-11-20T09:30:00.000Z',
    '15:00 IST converts to 09:30 UTC regardless of server timezone'
  );

  // Test 8: Concurrency helper
  console.log('\n--- 8. Concurrency Helper Tests ---');
  let inFlight = 0;
  let peak = 0;
  const out = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return n * 2;
  });
  assert(out.join(',') === '2,4,6,8,10,12,14', 'mapWithConcurrency preserves order');
  assert(peak <= 3, `mapWithConcurrency respects the limit (peak ${peak})`);

  // Test 9: Query validation
  console.log('\n--- 9. Query Validation Tests ---');
  assert(auctionFilterSchema.safeParse({ status: 'LIVE,ending_soon' }).success, 'Valid status list is accepted');
  assert(!auctionFilterSchema.safeParse({ status: 'BOGUS' }).success, 'Unknown status is rejected (422, not 500)');
  assert(!auctionFilterSchema.safeParse({ startDate: 'yesterday-ish' }).success, 'Invalid date is rejected');
  assert(!auctionFilterSchema.safeParse({ minPrice: 'abc' }).success, 'Non-numeric price is rejected');
  const parsedLimit = auctionFilterSchema.parse({ limit: '5000', page: 'x' });
  assert(parsedLimit.limit === 100 && parsedLimit.page === 1, 'limit is clamped and bad page falls back to 1');

  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
