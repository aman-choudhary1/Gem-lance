import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class SavedAuctionService {
  public async saveAuction(userId: string, auctionId: string, notes?: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
    }

    const existing = await prisma.savedAuction.findUnique({
      where: {
        userId_auctionId: { userId, auctionId }
      }
    });

    if (existing) {
      return existing;
    }

    return prisma.savedAuction.create({
      data: {
        userId,
        auctionId,
        notes
      },
      include: {
        auction: {
          include: {
            source: { select: { code: true, name: true } },
            category: { select: { name: true } },
            location: { select: { state: true, city: true } }
          }
        }
      }
    });
  }

  public async removeSavedAuction(userId: string, auctionId: string) {
    const existing = await prisma.savedAuction.findUnique({
      where: {
        userId_auctionId: { userId, auctionId }
      }
    });

    if (!existing) {
      throw new AppError('Saved auction bookmark not found', 404, 'NOT_FOUND');
    }

    await prisma.savedAuction.delete({
      where: { id: existing.id }
    });

    return { success: true, message: 'Auction bookmark removed' };
  }

  public async getUserSavedAuctions(userId: string) {
    return prisma.savedAuction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        auction: {
          include: {
            source: { select: { code: true, name: true } },
            category: { select: { name: true, slug: true } },
            organization: { select: { name: true } },
            location: { select: { state: true, city: true } }
          }
        }
      }
    });
  }

  public async isAuctionSaved(userId: string, auctionId: string): Promise<boolean> {
    const found = await prisma.savedAuction.findUnique({
      where: {
        userId_auctionId: { userId, auctionId }
      }
    });
    return !!found;
  }
}

export const savedAuctionService = new SavedAuctionService();
