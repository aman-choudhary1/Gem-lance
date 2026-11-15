/**
 * Indian portals publish wall-clock times in IST (UTC+05:30) without an offset.
 * Builds the correct UTC instant regardless of the server's own timezone.
 */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function istToDate(year: number, monthIndex: number, day: number, hour = 0, minute = 0, second = 0): Date {
  return new Date(Date.UTC(year, monthIndex, day, hour, minute, second) - IST_OFFSET_MS);
}
