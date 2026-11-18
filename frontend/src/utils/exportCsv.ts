import { Auction } from '../types';
import { auctionService, AuctionSearchParams } from '../services/auctionService';

export const EXPORT_LIMIT = 1000;
const PAGE_SIZE = 100;

/** Quote a cell and neutralise spreadsheet formulas (scraped titles are untrusted text). */
const cell = (value: unknown): string => {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const num = (v: unknown) => (v !== null && v !== undefined && v !== '' && Number(v) > 0 ? Number(v) : '');

const HEADERS = ['Source', 'Notice ID', 'Title', 'Category', 'Organisation', 'State', 'District', 'City', 'Status', 'Start price (INR)', 'EMD (INR)', 'Opens', 'Closes', 'Official link'];

export const toCsv = (auctions: Auction[]): string => {
  const rows = auctions.map((a) => [
    a.source?.code,
    a.externalId,
    a.title,
    a.category?.name,
    a.organization?.name,
    a.location?.state,
    a.location?.district,
    a.location?.city,
    a.status,
    num(a.startPrice),
    num(a.emdAmount),
    a.startTime,
    a.endTime,
    a.officialUrl
  ]);
  return [HEADERS, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
};

export interface ExportResult {
  count: number;
  total: number;
  truncated: boolean;
}

/** Fetches every page of the current search (up to EXPORT_LIMIT notices) and downloads it as CSV. */
export async function exportAuctionsCsv(params: AuctionSearchParams, filename = 'auctionlens-export'): Promise<ExportResult> {
  const all: Auction[] = [];
  let total = 0;
  for (let page = 1; all.length < EXPORT_LIMIT; page++) {
    const res = await auctionService.getAuctions({ ...params, page, limit: PAGE_SIZE });
    total = res.pagination.total;
    all.push(...res.data);
    if (!res.pagination.hasNextPage) break;
  }
  const rows = all.slice(0, EXPORT_LIMIT);

  // BOM so Excel reads UTF-8 (₹, Hindi names) correctly
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { count: rows.length, total, truncated: total > rows.length };
}
