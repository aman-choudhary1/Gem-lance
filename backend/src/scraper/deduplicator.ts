import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NormalizedAuction } from '../types/auction';
import { slugify } from '../utils/slugify';
import { logger } from '../utils/logger';

export interface UpsertResult {
  action: 'CREATED' | 'UPDATED' | 'FAILED';
  auctionId?: string;
  error?: string;
}

/**
 * Look up a row, creating it if missing. If a concurrent run creates it first (unique
 * violation P2002), re-read instead of failing the whole record.
 */
async function findOrCreate<T>(find: () => Promise<T | null>, create: () => Promise<T>): Promise<T> {
  const existing = await find();
  if (existing) return existing;
  try {
    return await create();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const raced = await find();
      if (raced) return raced;
    }
    throw error;
  }
}

export async function upsertAuction(auction: NormalizedAuction, sourceId: string): Promise<UpsertResult> {
  try {
    // 1. Resolve or create Category
    const categorySlug = slugify(auction.categoryName || 'general-surplus');
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: auction.categoryName || 'General Surplus & Misc' },
      create: {
        name: auction.categoryName || 'General Surplus & Misc',
        slug: categorySlug
      }
    });

    // 2. Resolve or create Organization
    const orgName = auction.organizationName || 'Government of India';
    const deptName = auction.departmentName || null;
    const organization = await findOrCreate(
      () => prisma.organization.findFirst({ where: { name: orgName, department: deptName } }),
      () => prisma.organization.create({ data: { name: orgName, department: deptName, source: auction.sourceCode } })
    );

    // 3. Resolve or create Location (district is part of the identity so cities in
    //    different districts / addresses are not collapsed into the first one seen)
    const locationKey = {
      state: auction.state,
      district: auction.district || null,
      city: auction.city || null
    };
    const location = await findOrCreate(
      () => prisma.location.findFirst({ where: locationKey }),
      () =>
        prisma.location.create({
          data: { country: 'India', ...locationKey, address: auction.address || null }
        })
    );

    // 4. Check if Auction exists by composite (sourceId, externalId)
    const existing = await prisma.auction.findUnique({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId: auction.externalId
        }
      }
    });

    const auctionData = {
      title: auction.title,
      description: auction.description || null,
      categoryId: category.id,
      organizationId: organization.id,
      locationId: location.id,
      status: auction.status,
      sourceStatus: auction.sourceStatus || 'ACTIVE',
      startPrice: auction.startPrice !== null ? new Prisma.Decimal(auction.startPrice) : null,
      emdAmount: auction.emdAmount !== undefined ? new Prisma.Decimal(auction.emdAmount) : null,
      bidIncrement: auction.bidIncrement !== undefined ? new Prisma.Decimal(auction.bidIncrement) : null,
      startTime: auction.startTime,
      endTime: auction.endTime,
      officialUrl: auction.officialUrl || null,
      rawData: (auction.rawData || {}) as Prisma.InputJsonValue,
      lastScrapedAt: new Date()
    };

    let resultAuctionId: string;
    let action: 'CREATED' | 'UPDATED';

    if (existing) {
      const updated = await prisma.auction.update({
        where: { id: existing.id },
        data: auctionData
      });
      resultAuctionId = updated.id;
      action = 'UPDATED';
    } else {
      const created = await prisma.auction.create({
        data: {
          sourceId,
          externalId: auction.externalId,
          ...auctionData
        }
      });
      resultAuctionId = created.id;
      action = 'CREATED';
    }

    // 5. Replace items and documents atomically so a failure never leaves a half-synced auction
    const writes: Prisma.PrismaPromise<unknown>[] = [];
    if (auction.items && auction.items.length > 0) {
      writes.push(
        prisma.auctionItem.deleteMany({ where: { auctionId: resultAuctionId } }),
        prisma.auctionItem.createMany({
          data: auction.items.map((it) => ({
            auctionId: resultAuctionId,
            name: it.name,
            description: it.description || null,
            quantity: new Prisma.Decimal(it.quantity),
            unit: it.unit || 'Nos',
            condition: it.condition || null,
            estimatedValue: it.estimatedValue ? new Prisma.Decimal(it.estimatedValue) : null,
            metadata: (it.metadata || {}) as Prisma.InputJsonValue
          }))
        })
      );
    }
    if (auction.documents && auction.documents.length > 0) {
      writes.push(
        prisma.auctionDocument.deleteMany({ where: { auctionId: resultAuctionId } }),
        prisma.auctionDocument.createMany({
          data: auction.documents.map((doc) => ({
            auctionId: resultAuctionId,
            name: doc.name,
            documentType: doc.documentType || 'TENDER_NOTICE',
            url: doc.url
          }))
        })
      );
    }
    if (writes.length > 0) {
      await prisma.$transaction(writes);
    }

    return { action, auctionId: resultAuctionId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown DB upsert error';
    logger.error(`Upsert failed for [${auction.sourceCode}] ${auction.externalId}: ${errorMsg}`);
    return { action: 'FAILED', error: errorMsg };
  }
}
