import { createHash } from 'crypto';

/** Short, deterministic identifier derived from the given parts (used when a source has no ID). */
export function stableId(...parts: Array<string | undefined | null>): string {
  return createHash('sha1')
    .update(parts.map((p) => (p ?? '').trim().toLowerCase()).join('|'))
    .digest('hex')
    .slice(0, 16);
}
