import { AuctionStatus } from '@prisma/client';
import { ENDING_SOON_THRESHOLD_HOURS } from '../config/constants';

export function calculateAuctionStatus(
  startTime: Date | string,
  endTime: Date | string,
  now: Date = new Date(),
  endingSoonHours: number = ENDING_SOON_THRESHOLD_HOURS
): AuctionStatus {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const current = now.getTime();

  if (isNaN(start) || isNaN(end)) {
    return 'UNKNOWN' as AuctionStatus;
  }

  if (current < start) {
    return 'UPCOMING' as AuctionStatus;
  }

  if (current >= end) {
    return 'CLOSED' as AuctionStatus;
  }

  // Current is between start and end
  const remainingHours = (end - current) / (1000 * 60 * 60);
  if (remainingHours <= endingSoonHours && remainingHours > 0) {
    return 'ENDING_SOON' as AuctionStatus;
  }

  return 'LIVE' as AuctionStatus;
}
