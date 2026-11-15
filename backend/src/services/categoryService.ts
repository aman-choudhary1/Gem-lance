import { prisma } from '../config/prisma';

export class CategoryService {
  public async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { auctions: true } },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { auctions: true } }
          }
        }
      }
    });
  }
}

export const categoryService = new CategoryService();
