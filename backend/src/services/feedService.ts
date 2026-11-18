import { prisma } from '../config/prisma';
import { auctionService } from './auctionService';

export interface FeedReason {
  type: 'alert' | 'interest' | 'saved';
  label: string;
}

const LIVE = 'LIVE,ENDING_SOON';
const MAX_ALERTS = 5;
const MAX_KEYWORDS = 3;

/**
 * Personalised feed: live notices that match the user's alert rules, then notices in the
 * categories of the things they saved. Every item says why it was picked.
 */
export async function getForYou(userId: string, limit = 12) {
  const [alerts, saved, interests] = await Promise.all([
    prisma.auctionAlert.findMany({ where: { userId, enabled: true }, orderBy: { createdAt: 'desc' }, take: MAX_ALERTS }),
    prisma.savedAuction.findMany({
      where: { userId },
      select: { auctionId: true, auction: { select: { category: { select: { slug: true, name: true } } } } }
    }),
    prisma.userInterest.findMany({ where: { userId }, select: { category: { select: { slug: true, name: true } } } })
  ]);

  const savedIds = new Set(saved.map((s) => s.auctionId));
  const seen = new Set<string>();
  const items: Array<Record<string, any>> = [];

  const add = (auctions: any[], reason: FeedReason) => {
    for (const a of auctions) {
      if (seen.has(a.id) || savedIds.has(a.id)) continue;
      seen.add(a.id);
      items.push({ ...a, reason });
    }
  };

  // 1. Alert rules (an alert's category may be stored as an id or a slug)
  for (const alert of alerts) {
    let categorySlug: string | undefined;
    if (alert.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ id: alert.categoryId }, { slug: alert.categoryId }] },
        select: { slug: true }
      });
      categorySlug = cat?.slug;
      if (!categorySlug) continue; // category no longer exists: skip rather than match everything
    }

    const keywords = (alert.keywords || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, MAX_KEYWORDS);

    for (const keyword of keywords.length ? keywords : [undefined]) {
      const result = await auctionService.getAuctions({
        page: 1,
        limit: 6,
        search: keyword,
        source: alert.sourceIds.length ? alert.sourceIds.map((s) => s.toUpperCase()).join(',') : undefined,
        category: categorySlug,
        state: alert.state || undefined,
        district: alert.district || undefined,
        minPrice: alert.minPrice ? Number(alert.minPrice) : undefined,
        maxPrice: alert.maxPrice ? Number(alert.maxPrice) : undefined,
        status: LIVE,
        sortBy: 'endingSoon'
      } as any);
      add(result.data, { type: 'alert', label: `Matches your alert "${alert.name}"` });
    }
  }

  // 2. Categories they said they deal in
  for (const { category } of interests) {
    const result = await auctionService.getAuctions({ page: 1, limit: 6, category: category.slug, status: LIVE, sortBy: 'endingSoon' } as any);
    add(result.data, { type: 'interest', label: `You follow ${category.name}` });
  }

  // 3. Similar to what they saved: the categories they save most
  const counts = new Map<string, { name: string; n: number }>();
  for (const s of saved) {
    const c = s.auction.category;
    if (!c) continue;
    counts.set(c.slug, { name: c.name, n: (counts.get(c.slug)?.n ?? 0) + 1 });
  }
  const topCategories = [...counts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 3);
  for (const [slug, { name }] of topCategories) {
    const result = await auctionService.getAuctions({ page: 1, limit: 6, category: slug, status: LIVE, sortBy: 'endingSoon' } as any);
    add(result.data, { type: 'saved', label: `Because you saved ${name} notices` });
  }

  // Alert matches first, then followed categories, then "similar to saved". Inside a tier, interleave
  // the reasons (each soonest-closing first) so one busy category cannot crowd out the others.
  const tier = (x: any) => (x.reason.type === 'alert' ? 0 : x.reason.type === 'interest' ? 1 : 2);
  const endsAt = (x: any) => new Date(x.endTime ?? 8.64e15).getTime();
  const ordered: Array<Record<string, any>> = [];
  for (const t of [0, 1, 2]) {
    const byReason = new Map<string, Array<Record<string, any>>>();
    for (const item of items.filter((x) => tier(x) === t).sort((x, y) => endsAt(x) - endsAt(y))) {
      byReason.set(item.reason.label, [...(byReason.get(item.reason.label) ?? []), item]);
    }
    const queues = [...byReason.values()];
    while (queues.some((q) => q.length)) {
      for (const q of queues) {
        const next = q.shift();
        if (next) ordered.push(next);
      }
    }
  }

  return {
    data: ordered.slice(0, limit),
    hasAlerts: alerts.length > 0,
    hasInterests: interests.length > 0,
    hasSaved: saved.length > 0
  };
}
