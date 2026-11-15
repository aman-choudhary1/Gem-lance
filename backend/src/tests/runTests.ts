import { calculateAuctionStatus } from '../utils/statusCalculator';
import { normalizeAuction, validateAuction } from '../scraper/normalizer';
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
