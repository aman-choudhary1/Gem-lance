import { Prisma, AuctionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuctionFilterParams, PaginatedResult } from '../types/auction';
import { AppError } from '../middleware/errorHandler';

export class AuctionService {
  /**
   * Search & filter auctions with server-side pagination and sorting
   */
  public async getAuctions(params: AuctionFilterParams): Promise<PaginatedResult<any>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuctionWhereInput = {};

    // 1. Search Query
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { externalId: { contains: q, mode: 'insensitive' } },
        { organization: { name: { contains: q, mode: 'insensitive' } } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { location: { state: { contains: q, mode: 'insensitive' } } },
        { location: { city: { contains: q, mode: 'insensitive' } } },
        { location: { district: { contains: q, mode: 'insensitive' } } }
      ];
    }

    // 2. Source Filter (supports comma-separated string or array)
    if (params.source) {
      const sourceList = Array.isArray(params.source)
        ? params.source
        : params.source.split(',').map((s) => s.trim().toUpperCase());

      where.source = {
        code: { in: sourceList }
      };
    }

    // 3. Category Filter
    if (params.category) {
      where.category = {
        OR: [
          { slug: params.category.toLowerCase() },
          { name: { contains: params.category, mode: 'insensitive' } }
        ]
      };
    }

    // 4. Location Filters
    if (params.state) {
      where.location = {
        ...(where.location as Prisma.LocationWhereInput || {}),
        state: { equals: params.state, mode: 'insensitive' }
      };
    }

    if (params.district) {
      where.location = {
        ...(where.location as Prisma.LocationWhereInput || {}),
        district: { equals: params.district, mode: 'insensitive' }
      };
    }

    if (params.city) {
      where.location = {
        ...(where.location as Prisma.LocationWhereInput || {}),
        city: { equals: params.city, mode: 'insensitive' }
      };
    }

    // 5. Organization Filter
    if (params.organization) {
      where.organization = {
        name: { contains: params.organization, mode: 'insensitive' }
      };
    }

    // 6. Status Filter
    if (params.status) {
      const statusList = Array.isArray(params.status)
        ? (params.status as AuctionStatus[])
        : (params.status.split(',').map((s) => s.trim().toUpperCase()) as AuctionStatus[]);

      where.status = { in: statusList };
    }

    // 7. Price Filter
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.startPrice = {};
      if (params.minPrice !== undefined) {
        where.startPrice.gte = new Prisma.Decimal(params.minPrice);
      }
      if (params.maxPrice !== undefined) {
        where.startPrice.lte = new Prisma.Decimal(params.maxPrice);
      }
    }

    // 8. Date Filters
    if (params.startDate) {
      where.startTime = { gte: new Date(params.startDate) };
    }
    if (params.endDate) {
      where.endTime = { lte: new Date(params.endDate) };
    }

    // 9. Sorting
    let orderBy: Prisma.AuctionOrderByWithRelationInput = { createdAt: 'desc' };

    switch (params.sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'endingSoon':
        orderBy = { endTime: 'asc' };
        break;
      case 'highestPrice':
        orderBy = { startPrice: 'desc' };
        break;
      case 'lowestPrice':
        orderBy = { startPrice: 'asc' };
        break;
      case 'recentlyUpdated':
        orderBy = { updatedAt: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [total, data] = await Promise.all([
      prisma.auction.count({ where }),
      prisma.auction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          source: { select: { id: true, code: true, name: true, baseUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
          organization: { select: { id: true, name: true, department: true } },
          location: { select: { id: true, state: true, district: true, city: true } },
          _count: { select: { items: true, documents: true, savedByUsers: true } }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get single auction details by internal ID or composite externalId
   */
  public async getAuctionById(idOrExternalId: string) {
    const auction = await prisma.auction.findFirst({
      where: {
        OR: [{ id: idOrExternalId }, { externalId: idOrExternalId }]
      },
      include: {
        source: { select: { id: true, code: true, name: true, baseUrl: true } },
        category: { select: { id: true, name: true, slug: true, parentId: true } },
        organization: true,
        location: true,
        items: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'asc' } },
        _count: { select: { savedByUsers: true } }
      }
    });

    if (!auction) {
      throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
    }

    return auction;
  }

  /**
   * Get auctions ending soon within N hours
   */
  public async getEndingSoon(hours = 24, limit = 20, source?: string, category?: string) {
    const now = new Date();
    const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const where: Prisma.AuctionWhereInput = {
      endTime: {
        gt: now,
        lte: threshold
      },
      status: {
        in: [AuctionStatus.LIVE, AuctionStatus.ENDING_SOON]
      }
    };

    if (source) {
      where.source = { code: source.toUpperCase() };
    }

    if (category) {
      where.category = { slug: category.toLowerCase() };
    }

    return prisma.auction.findMany({
      where,
      take: limit,
      orderBy: { endTime: 'asc' },
      include: {
        source: { select: { code: true, name: true } },
        category: { select: { name: true, slug: true } },
        organization: { select: { name: true } },
        location: { select: { state: true, city: true } }
      }
    });
  }

  /**
   * Global and platform-wide analytics stats
   */
  public async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalAuctions,
      liveAuctions,
      upcomingAuctions,
      endingSoonAuctions,
      endingTodayAuctions,
      ending24HoursAuctions,
      newTodayAuctions,
      totalSources,
      totalOrganizations,
      totalLocations,
      bySource,
      byCategory,
      byState,
      byStatus
    ] = await Promise.all([
      prisma.auction.count(),
      prisma.auction.count({ where: { status: AuctionStatus.LIVE } }),
      prisma.auction.count({ where: { status: AuctionStatus.UPCOMING } }),
      prisma.auction.count({ where: { status: AuctionStatus.ENDING_SOON } }),
      prisma.auction.count({
        where: {
          endTime: { gte: now, lte: todayEnd }
        }
      }),
      prisma.auction.count({
        where: {
          endTime: { gte: now, lte: next24h }
        }
      }),
      prisma.auction.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      prisma.auctionSource.count({ where: { enabled: true } }),
      prisma.organization.count(),
      prisma.location.count(),
      // Group by Source
      prisma.auctionSource.findMany({
        select: {
          code: true,
          name: true,
          _count: { select: { auctions: true } }
        }
      }),
      // Group by Category
      prisma.category.findMany({
        select: {
          name: true,
          slug: true,
          _count: { select: { auctions: true } }
        },
        orderBy: { auctions: { _count: 'desc' } },
        take: 10
      }),
      // Group by Location/State
      prisma.location.groupBy({
        by: ['state'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      // Group by Status
      prisma.auction.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    return {
      overview: {
        totalAuctions,
        liveAuctions: liveAuctions + endingSoonAuctions,
        upcomingAuctions,
        endingTodayAuctions,
        ending24HoursAuctions,
        newTodayAuctions,
        totalSources,
        totalOrganizations,
        totalLocations
      },
      bySource: bySource.map((s) => ({
        code: s.code,
        name: s.name,
        count: s._count.auctions
      })),
      byCategory: byCategory.map((c) => ({
        name: c.name,
        slug: c.slug,
        count: c._count.auctions
      })),
      byState: byState.map((s) => ({
        state: s.state,
        count: s._count.id
      })),
      byStatus: byStatus.map((st) => ({
        status: st.status,
        count: st._count.id
      }))
    };
  }
}

export const auctionService = new AuctionService();
