import { prisma } from '../config/prisma';

export class LocationService {
  public async getStates() {
    const states = await prisma.location.groupBy({
      by: ['state'],
      _count: { id: true },
      orderBy: { state: 'asc' }
    });

    return states.map((s) => ({
      name: s.state,
      count: s._count.id
    }));
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
