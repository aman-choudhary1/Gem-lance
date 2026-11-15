export const APP_NAME = 'AuctionLens';
export const APP_TAGLINE = 'One Platform. Multiple Auction Sources.';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const ENDING_SOON_THRESHOLD_HOURS = 24;

export const SOURCE_CODES = {
  GEM: 'GEM',
  MSTC: 'MSTC',
  MOCK: 'MOCK',
  BANK: 'BANK',
  PSU: 'PSU'
} as const;

export const DEFAULT_CATEGORIES = [
  { name: 'Vehicles & Automotive', slug: 'vehicles' },
  { name: 'Industrial Machinery', slug: 'machinery' },
  { name: 'Ferrous & Non-Ferrous Scrap', slug: 'scrap' },
  { name: 'Commercial & Residential Property', slug: 'property' },
  { name: 'IT & Electronics Equipment', slug: 'electronics' },
  { name: 'Office Furniture & Fixtures', slug: 'furniture' },
  { name: 'Plant & Equipment', slug: 'equipment' },
  { name: 'Mining & Heavy Earthmoving', slug: 'mining' },
  { name: 'General Surplus & Misc', slug: 'surplus' }
];

export const POPULAR_STATES = [
  'Chhattisgarh',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Gujarat',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Madhya Pradesh',
  'Telangana',
  'Odisha',
  'Punjab',
  'Haryana',
  'Kerala'
];
