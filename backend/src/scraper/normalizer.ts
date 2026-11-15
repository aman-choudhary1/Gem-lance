import { RawAuction, RawAuctionDetail } from '../types/provider';
import { NormalizedAuction } from '../types/auction';
import { calculateAuctionStatus } from '../utils/statusCalculator';
import { decodeHtmlEntities } from '../utils/textUtils';
import { logger } from '../utils/logger';

export function normalizeAuction(raw: RawAuction | RawAuctionDetail, sourceCode: string): NormalizedAuction {
  const startTime = new Date(raw.startTime);
  const endTime = new Date(raw.endTime);

  // Fallback for invalid dates
  const validStartTime = isNaN(startTime.getTime()) ? new Date() : startTime;
  const validEndTime = isNaN(endTime.getTime()) ? new Date(validStartTime.getTime() + 48 * 3600000) : endTime;

  // Calculate standard normalized status
  const status = calculateAuctionStatus(validStartTime, validEndTime);

  // Clean, decode HTML entities (e.g. Hindi &#2360; -> Unicode) and sanitize string fields
  const rawTitle = decodeHtmlEntities(raw.title || 'Untitled Auction Notice');
  const title = rawTitle.substring(0, 300);
  const description = decodeHtmlEntities(raw.description || title);
  const startPrice = Math.max(0, Number(raw.startPrice) || 0);
  const emdAmount = raw.emdAmount !== undefined ? Math.max(0, Number(raw.emdAmount)) : undefined;
  const bidIncrement = raw.bidIncrement !== undefined ? Math.max(0, Number(raw.bidIncrement)) : undefined;

  // Items normalization
  const items = (raw.items || []).map((item, idx) => ({
    name: decodeHtmlEntities(item.name || `Item #${idx + 1}`).substring(0, 200),
    description: item.description ? decodeHtmlEntities(item.description) : undefined,
    quantity: Math.max(1, Number(item.quantity) || 1),
    unit: item.unit?.trim() || 'Nos',
    condition: item.condition?.trim() || 'Used',
    estimatedValue: item.estimatedValue !== undefined ? Number(item.estimatedValue) : undefined,
    metadata: item.metadata || {}
  }));

  // If no items provided, create 1 primary item from auction title
  if (items.length === 0) {
    items.push({
      name: title,
      description,
      quantity: 1,
      unit: 'Lot',
      condition: 'Used',
      estimatedValue: startPrice,
      metadata: {}
    });
  }

  // Documents normalization
  const documents = (raw.documents || []).map((doc, idx) => ({
    name: (doc.name || `Document #${idx + 1}`).trim(),
    documentType: doc.documentType?.trim() || 'TENDER_NOTICE',
    url: doc.url.trim()
  }));

  return {
    sourceCode: sourceCode.toUpperCase(),
    externalId: raw.externalId.trim(),
    title,
    description,
    status,
    sourceStatus: raw.sourceStatus || 'ACTIVE',
    categoryName: decodeHtmlEntities(raw.categoryName) || 'General Surplus & Misc',
    organizationName: decodeHtmlEntities(raw.organization?.name) || 'Government Department / PSU',
    departmentName: raw.organization?.department ? decodeHtmlEntities(raw.organization.department) : undefined,
    state: raw.location?.state?.trim() || 'Delhi',
    district: raw.location?.district?.trim(),
    city: raw.location?.city?.trim() || 'New Delhi',
    address: raw.location?.address?.trim(),
    startPrice,
    emdAmount,
    bidIncrement,
    startTime: validStartTime,
    endTime: validEndTime,
    officialUrl: raw.officialUrl?.trim(),
    items,
    documents,
    rawData: raw.rawData || {}
  };
}

export function validateAuction(auction: NormalizedAuction): boolean {
  if (!auction.externalId || auction.externalId.length < 2) {
    logger.warn(`Validation failed: missing externalId`, { auction });
    return false;
  }
  if (!auction.title || auction.title.length < 3) {
    logger.warn(`Validation failed: title too short`, { externalId: auction.externalId });
    return false;
  }
  if (auction.startTime.getTime() >= auction.endTime.getTime()) {
    logger.warn(`Validation failed: startTime >= endTime`, { externalId: auction.externalId });
    return false;
  }
  return true;
}
