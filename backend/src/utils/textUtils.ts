/**
 * Utility functions for text cleaning and decoding
 */

/**
 * Decodes HTML entities (both decimal e.g. &#2360;, hex e.g. &#x0938;, and named e.g. &amp;)
 * into clean, readable Unicode characters (Hindi/Devanagari, regional languages, symbols).
 */
export function decodeHtmlEntities(str?: string | null): string {
  if (!str) return '';

  return str
    // Numeric decimal entities: &#2360; -> स
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return _;
      }
    })
    // Numeric hex entities: &#x0938; -> स
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return _;
      }
    })
    // Named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    // Remove any broken/truncated entity fragment cut off at boundary (e.g. &#23)
    .replace(/&#[0-9a-fA-F]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
