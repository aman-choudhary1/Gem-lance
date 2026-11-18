import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export const MAX_INTERESTS = 20;

/** Categories the user said they deal in. */
export async function getInterests(userId: string) {
  const rows = await prisma.userInterest.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { category: { select: { id: true, name: true, slug: true } } }
  });
  return rows.map((r) => r.category);
}

/** Replaces the user's interests with exactly these categories (an empty list clears them). */
export async function setInterests(userId: string, categoryIds: string[]) {
  const unique = [...new Set(categoryIds)];
  if (unique.length > MAX_INTERESTS) {
    throw new AppError(`Choose at most ${MAX_INTERESTS} categories`, 400, 'TOO_MANY_INTERESTS');
  }

  const valid = await prisma.category.findMany({ where: { id: { in: unique } }, select: { id: true } });
  if (valid.length !== unique.length) {
    throw new AppError('One or more categories do not exist', 400, 'INVALID_CATEGORY');
  }

  await prisma.$transaction([
    prisma.userInterest.deleteMany({ where: { userId, categoryId: { notIn: unique } } }),
    prisma.userInterest.createMany({ data: unique.map((categoryId) => ({ userId, categoryId })), skipDuplicates: true })
  ]);

  return getInterests(userId);
}
