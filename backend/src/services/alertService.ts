import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AlertService {
  public async createAlert(userId: string, data: {
    name: string;
    keywords?: string;
    sourceIds?: string[];
    categoryId?: string | null;
    state?: string | null;
    district?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    enabled?: boolean;
  }) {
    return prisma.auctionAlert.create({
      data: {
        userId,
        name: data.name,
        keywords: data.keywords || null,
        sourceIds: data.sourceIds || [],
        categoryId: data.categoryId || null,
        state: data.state || null,
        district: data.district || null,
        minPrice: data.minPrice !== null && data.minPrice !== undefined ? new Prisma.Decimal(data.minPrice) : null,
        maxPrice: data.maxPrice !== null && data.maxPrice !== undefined ? new Prisma.Decimal(data.maxPrice) : null,
        enabled: data.enabled ?? true
      }
    });
  }

  public async getUserAlerts(userId: string) {
    return prisma.auctionAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async updateAlert(userId: string, alertId: string, data: {
    name?: string;
    keywords?: string;
    sourceIds?: string[];
    categoryId?: string | null;
    state?: string | null;
    district?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    enabled?: boolean;
  }) {
    const existing = await prisma.auctionAlert.findFirst({
      where: { id: alertId, userId }
    });

    if (!existing) {
      throw new AppError('Alert rule not found', 404, 'ALERT_NOT_FOUND');
    }

    const updateData: Prisma.AuctionAlertUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;
    if (data.sourceIds !== undefined) updateData.sourceIds = data.sourceIds;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.district !== undefined) updateData.district = data.district;
    if (data.minPrice !== undefined) {
      updateData.minPrice = data.minPrice !== null ? new Prisma.Decimal(data.minPrice) : null;
    }
    if (data.maxPrice !== undefined) {
      updateData.maxPrice = data.maxPrice !== null ? new Prisma.Decimal(data.maxPrice) : null;
    }
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    return prisma.auctionAlert.update({
      where: { id: alertId },
      data: updateData
    });
  }

  public async deleteAlert(userId: string, alertId: string) {
    const existing = await prisma.auctionAlert.findFirst({
      where: { id: alertId, userId }
    });

    if (!existing) {
      throw new AppError('Alert rule not found', 404, 'ALERT_NOT_FOUND');
    }

    await prisma.auctionAlert.delete({
      where: { id: alertId }
    });

    return { success: true, message: 'Alert rule deleted' };
  }
}

/**
 * Alert Matching Engine
 * Compares an ingested auction against all active alerts and creates notifications
 */
export async function matchAuctionWithAlerts(auctionId: string): Promise<number> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        source: true,
        category: true,
        location: true,
        organization: true,
        items: true
      }
    });

    if (!auction) return 0;

    const activeAlerts = await prisma.auctionAlert.findMany({
      where: { enabled: true }
    });

    let matchedCount = 0;

    for (const alert of activeAlerts) {
      let isMatch = true;

      // 1. Source check
      if (alert.sourceIds && alert.sourceIds.length > 0) {
        const sourceCodes = alert.sourceIds.map((s) => s.toUpperCase());
        if (!sourceCodes.includes(auction.source.code.toUpperCase())) {
          isMatch = false;
        }
      }

      // 2. Category check
      if (isMatch && alert.categoryId) {
        if (auction.categoryId !== alert.categoryId && auction.category?.slug !== alert.categoryId) {
          isMatch = false;
        }
      }

      // 3. State check
      if (isMatch && alert.state) {
        if (!auction.location?.state || auction.location.state.toLowerCase() !== alert.state.toLowerCase()) {
          isMatch = false;
        }
      }

      // 4. District check
      if (isMatch && alert.district) {
        if (!auction.location?.district || auction.location.district.toLowerCase() !== alert.district.toLowerCase()) {
          isMatch = false;
        }
      }

      // 5. Price range check
      const startPriceNum = Number(auction.startPrice);
      if (isMatch && alert.minPrice) {
        if (startPriceNum < Number(alert.minPrice)) {
          isMatch = false;
        }
      }
      if (isMatch && alert.maxPrice) {
        if (startPriceNum > Number(alert.maxPrice)) {
          isMatch = false;
        }
      }

      // 6. Keywords check
      if (isMatch && alert.keywords && alert.keywords.trim() !== '') {
        const searchCorpus = `${auction.title} ${auction.description || ''} ${auction.items.map((i) => i.name).join(' ')}`.toLowerCase();
        const keywords = alert.keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
        const hasKeywordMatch = keywords.some((k) => searchCorpus.includes(k));
        if (!hasKeywordMatch) {
          isMatch = false;
        }
      }

      // Create notification if matched
      if (isMatch) {
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            auctionId: auction.id,
            type: 'NEW_MATCH',
            title: `Matching Auction: ${auction.title.substring(0, 60)}...`,
            message: `Auction [${auction.source.code}] ${auction.externalId} matches your alert "${alert.name}". Starting price: ₹${Number(auction.startPrice).toLocaleString('en-IN')}`
          }
        });
        matchedCount++;
      }
    }

    return matchedCount;
  } catch (error) {
    logger.error(`Error in alert matching engine: ${(error as Error).message}`);
    return 0;
  }
}

export const alertService = new AlertService();
