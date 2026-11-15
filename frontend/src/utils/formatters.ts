export function formatCurrencyINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '—';
  }
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatCompactINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '—';
  }
  const num = Number(amount);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}k`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Formats full tender reserve price with sensible fallback when not disclosed / NA
 */
export function formatTenderPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    return 'Refer Document';
  }
  return formatCurrencyINR(amount);
}

/**
 * Formats compact tender reserve price with sensible fallback when not disclosed / NA
 */
export function formatCompactTenderPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    return 'Refer Document';
  }
  return formatCompactINR(amount);
}

/**
 * Formats EMD amount with realistic government tender labels
 */
export function formatEmdAmount(amount: number | string | null | undefined): string {
  if (amount !== null && amount !== undefined && !isNaN(Number(amount)) && Number(amount) > 0) {
    return formatCompactINR(amount);
  }
  if (amount === 0) {
    return 'Exempted';
  }
  return 'Refer NIT Doc';
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function getRemainingTime(endTimeStr: string): {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isExpired: boolean;
  formatted: string;
} {
  const end = new Date(endTimeStr).getTime();
  const now = Date.now();
  const totalMs = end - now;

  if (totalMs <= 0 || isNaN(totalMs)) {
    return {
      totalMs: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUrgent: false,
      isExpired: true,
      formatted: 'Auction Ended'
    };
  }

  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = hours > 24
    ? `${Math.floor(hours / 24)}d ${hours % 24}h ${pad(minutes)}m`
    : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    totalMs,
    hours,
    minutes,
    seconds,
    isUrgent: hours < 4,
    isExpired: false,
    formatted
  };
}

/**
 * Decodes HTML entities (e.g. &#2360; -> Hindi 'स', &amp; -> '&') into clean Unicode.
 */
export function decodeHtmlEntities(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return _;
      }
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&#[0-9a-fA-F]*$/i, '')
    .trim();
}

