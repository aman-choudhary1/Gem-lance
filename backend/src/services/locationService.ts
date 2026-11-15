import { prisma } from '../config/prisma';

/** Canonical comparison key: case, spacing and '&' vs 'and' are ignored. */
export const stateKey = (v: string) => v.trim().replace(/\s+/g, ' ').replace(/ ?& ?/g, ' and ').toLowerCase();

export class LocationService {
  /** One entry per state (case/whitespace variants merged); count = auctions, not location rows. */
  public async getStates() {
    const rows = await prisma.location.findMany({
      select: { state: true, _count: { select: { auctions: true } } }
    });
    const merged = new Map<string, { name: string; count: number }>();
    for (const r of rows) {
      const name = r.state.trim().replace(/\s+/g, ' ');
      if (!name) continue;
      const key = stateKey(name);
      const entry = merged.get(key);
      if (entry) {
        entry.count += r._count.auctions;
        if (entry.name.includes('&') && !name.includes('&')) entry.name = name;
        // prefer a properly cased spelling over ALL-CAPS / all-lowercase variants
        if (entry.name === entry.name.toUpperCase() || entry.name === entry.name.toLowerCase()) entry.name = name;
      } else {
        merged.set(key, { name, count: r._count.auctions });
      }
    }
    return [...merged.values()]
      .map((s) => ({ ...s, name: s.name === s.name.toUpperCase() || s.name === s.name.toLowerCase() ? s.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getDistricts(state?: string) {
    const where = state ? { state: { equals: state, mode: 'insensitive' as const } } : {};
    
    const locations = await prisma.location.findMany({
      where,
      select: {
        state: true,
        district: true,
        city: true
      },
      distinct: ['state', 'district', 'city']
    });

    return locations;
  }
}

export const locationService = new LocationService();
