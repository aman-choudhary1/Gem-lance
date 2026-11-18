import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const WINDOW_HOURS = 24;

const formatIst = (d: Date) =>
  d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

/**
 * Creates one "closing soon" notification per user per saved notice that closes within the next 24 hours.
 * Safe to run repeatedly: a user is never reminded twice about the same notice.
 */
export async function sendClosingSoonReminders(): Promise<number> {
  const now = new Date();
  const until = new Date(now.getTime() + WINDOW_HOURS * 60 * 60 * 1000);

  const due = await prisma.savedAuction.findMany({
    where: { auction: { status: { in: ['LIVE', 'ENDING_SOON'] }, endTime: { gt: now, lte: until } } },
    select: {
      userId: true,
      auctionId: true,
      auction: { select: { title: true, endTime: true, source: { select: { code: true } } } }
    }
  });
  if (due.length === 0) return 0;

  const existing = await prisma.notification.findMany({
    where: { type: 'ENDING_SOON', auctionId: { in: due.map((d) => d.auctionId) } },
    select: { userId: true, auctionId: true }
  });
  const done = new Set(existing.map((n) => `${n.userId}:${n.auctionId}`));

  const fresh = due.filter((d) => !done.has(`${d.userId}:${d.auctionId}`) && d.auction.endTime);
  if (fresh.length === 0) return 0;

  await prisma.notification.createMany({
    data: fresh.map((d) => ({
      userId: d.userId,
      auctionId: d.auctionId,
      type: 'ENDING_SOON' as const,
      title: `Closing soon: ${d.auction.title.slice(0, 70)}`,
      message: `A notice you saved closes on ${formatIst(d.auction.endTime!)} IST (source: ${d.auction.source.code}).`
    }))
  });

  logger.info(`Closing-soon reminders created: ${fresh.length}`);
  return fresh.length;
}
