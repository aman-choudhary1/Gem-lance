/**
 * Admin-assisted full fetch for the Chhattisgarh (CHiPS) portal.
 *
 * The public list we scrape every 30 minutes shows at most 50 tenders per department. The full
 * "open tenders" list (getOpenRfqListAction.do, ~18 pages) is behind an authentication-code check
 * that a person must answer. This module never answers that check itself:
 *
 *   1. start()    opens a session with the portal and returns the code the portal displays
 *   2. an admin types the code in our UI
 *   3. complete() submits what the admin typed, then reads every page in that same session
 *
 * The rows are then imported through the normal pipeline (upsert, no duplicates, alert matching).
 */
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { RawAuction } from '../../types/provider';
import { decodeHtmlEntities } from '../../utils/textUtils';
import { istToDate } from '../../utils/istDate';
import { logger } from '../../utils/logger';

const BASE_URL = 'https://eproc.cgstate.gov.in';
const LIST_PATH = '/CHEPS/business/getOpenRfqListAction.do';
const HOME_PATH = '/CHEPS/security/getSignInAction.do';
/** Defaults of the home page "Advanced Search" form: every open tender, any organisation/type/date. */
const DEFAULT_SEARCH: Record<string, string> = {
  subCatId: '-',
  rfqPart: '1',
  rfqStartFromDate: '-',
  rfqStartToDate: '-',
  rfqEndFromDate: '-',
  rfqEndToDate: '-'
};
const DEFAULT_SELECTS: Record<string, string> = {
  documentSearchOrganization: '-',
  rfqStatus: 'AAS',
  catId: '-',
  documentType: '-',
  subCat: '-'
};
const SESSION_TTL_MS = 10 * 60 * 1000;
const PAGE_DELAY_MS = 1500; // be polite: roughly the pace of a person clicking "Next"
const MAX_PAGES = 60; // safety stop (the portal shows ~18 today)
const DEBUG_DIR = path.resolve(process.cwd(), 'logs', 'cgstate-full-fetch');

/** A full-fetch run. It lives across several code prompts: the portal asks again every ~9 pages. */
interface Run {
  cookies: Map<string, string>;
  /** Fields of the code form the portal last showed (posted back with the code the admin types). */
  codeForm: Record<string, string>;
  rows: Map<string, RawAuction>;
  pagesDone: Set<number>;
  totalPages: number | null;
  /** Last results page: holds the pager form used to ask for the next page. */
  resultsHtml: string | null;
  touchedAt: number;
}

export interface FullFetchStats {
  pagesRead: number;
  totalPages: number | null;
  rows: number;
}

export type FullFetchStep =
  | ({ status: 'needs_code'; sessionId: string; code: string; expiresAt: string; reason: 'start' | 'rejected' | 'rechallenge' } & FullFetchStats)
  | ({ status: 'done'; rawAuctions: RawAuction[]; incomplete: boolean } & FullFetchStats);

const sessions = new Map<string, Run>();

/** Progress of the run in flight (one at a time: the pipeline locks the source). */
let progress: (FullFetchStats & { running: boolean; startedAt: string }) | null = null;
export const getFullFetchProgress = () => progress;
export function setFullFetchProgress(p: typeof progress) {
  progress = p;
}

function pruneSessions() {
  const now = Date.now();
  for (const [id, s] of sessions) if (now - s.touchedAt > SESSION_TTL_MS) sessions.delete(id);
}

const statsOf = (run: Run): FullFetchStats => ({ pagesRead: run.pagesDone.size, totalPages: run.totalPages, rows: run.rows.size });
function client(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 90000,
    // Redirects are followed by hand (see send()) so cookies set on a redirect are kept.
    maxRedirects: 0,
    validateStatus: (status) => status < 400,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: !env.GEPNIC_ALLOW_INSECURE_TLS })
  });
}

function storeCookies(jar: Map<string, string>, setCookie: string[] | undefined) {
  for (const c of setCookie || []) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

/** Request trail of the current run (status, redirect target, cookie names), saved for diagnosis. */
let trail: string[] = [];

/**
 * One browser-like request: sends the cookie jar, stores every Set-Cookie, and follows redirects
 * manually so a session cookie issued on a redirect (e.g. after the code is accepted) is sent on
 * the next hop. axios' built-in redirect handling would resend the old cookie.
 */
async function send(http: AxiosInstance, jar: Map<string, string>, method: 'GET' | 'POST', url: string, fields?: Record<string, string>): Promise<string> {
  let currentUrl = url;
  let currentMethod = method;
  let body = fields ? querystring.stringify(fields) : undefined;
  for (let hop = 0; hop < 8; hop++) {
    const res = await http.request({
      method: currentMethod,
      url: currentUrl,
      data: currentMethod === 'POST' ? body : undefined,
      headers: {
        Cookie: cookieHeader(jar),
        Referer: `${BASE_URL}${LIST_PATH}`,
        Origin: BASE_URL,
        ...(currentMethod === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
      }
    });
    storeCookies(jar, res.headers['set-cookie']);
    const location = res.headers['location'] as string | undefined;
    trail.push(`${currentMethod} ${currentUrl} -> ${res.status}${location ? ` -> ${location}` : ''} cookies:[${(res.headers['set-cookie'] || []).map((c: string) => c.split('=')[0]).join(',')}]`);
    if (res.status >= 300 && res.status < 400 && location) {
      currentUrl = new URL(location, `${BASE_URL}${currentUrl.startsWith('/') ? currentUrl : `/${currentUrl}`}`).toString().replace(BASE_URL, '');
      currentMethod = 'GET'; // browsers turn a POST into a GET on 301/302/303
      body = undefined;
      continue;
    }
    return String(res.data);
  }
  throw new AppError('The Chhattisgarh portal redirected too many times.', 502, 'CG_REDIRECT_LOOP');
}

const isPortalErrorPage = (html: string) => /General Action Request Error|requested action could not be completed/i.test(html);

const cookieHeader = (jar: Map<string, string>) => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
const text = (html: string) => decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ')).replace(/\s+/g, ' ').trim();
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\\s>]*)`, 'i'))?.[1];

/**
 * The fields a browser would submit for a form: inputs (only ticked checkboxes/radios) and the
 * selected option of each <select>. With duplicate names the last one wins.
 */
function formInputs(fragment: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of fragment.matchAll(/<input\b[^>]*>/gi)) {
    const name = attr(m[0], 'name');
    if (!name) continue;
    const type = (attr(m[0], 'type') || 'text').toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'image' || type === 'file') continue;
    // An unticked checkbox (e.g. the 9 "vendorClasses" filters) is not sent; sending one filters the list.
    if ((type === 'checkbox' || type === 'radio') && !/\bchecked\b/i.test(m[0])) continue;
    out[name] = decodeHtmlEntities(attr(m[0], 'value') ?? '');
  }
  for (const m of fragment.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
    const name = attr(`<select ${m[1]}>`, 'name');
    if (!name) continue;
    const options = [...m[2].matchAll(/<option\b([^>]*)>/gi)];
    const chosen = options.find((o) => /\bselected\b/i.test(o[1])) ?? options[0];
    if (chosen) out[name] = decodeHtmlEntities(attr(`<option ${chosen[1]}>`, 'value') ?? '');
  }
  return out;
}

function formByName(html: string, name: string): { tag: string; body: string } | null {
  const m = html.match(new RegExp(`<form\\b[^>]*name=["']?${name}["']?[^>]*>`, 'i'));
  if (!m || m.index === undefined) return null;
  const rest = html.slice(m.index + m[0].length);
  const end = rest.search(/<\/form>/i);
  return { tag: m[0], body: end >= 0 ? rest.slice(0, end) : rest };
}

function saveDebug(name: string, html: string) {
  try {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    fs.writeFileSync(path.join(DEBUG_DIR, name), html);
  } catch {
    // debugging aid only
  }
}

// ---------------------------------------------------------------------------------------------
// Code page handling
// ---------------------------------------------------------------------------------------------

const CODE_RE = /Authentication Code\s*:?\s*(?:<[^>]+>\s*)*([A-Za-z0-9]{4,12})\s*</i;
const isCodePage = (html: string) => /name=["']?inputCaptchaValue/i.test(html) && CODE_RE.test(html) && !/viewRfq\s*\(/i.test(html);

/** Remember the code form the portal is showing and return the code it asks for. */
function takeCodePage(run: Run, html: string, criteria?: Record<string, string>): string {
  const form = formByName(html, 'rfqSearchViewForm');
  const code = html.match(CODE_RE)?.[1];
  if (!form || !code) {
    saveDebug('code-page-unexpected.html', html);
    throw new AppError('The Chhattisgarh portal did not show its authentication code. The page layout may have changed.', 502, 'CG_NO_CODE');
  }
  const fields = formInputs(form.body);
  // keep search criteria the code form does not echo (rfqPart, status, dates...)
  for (const [k, v] of Object.entries({ ...(criteria ?? {}), ...run.codeForm })) if (k !== 'Advanced' && k !== 'inputCaptchaValue' && !fields[k]) fields[k] = v;
  run.codeForm = fields;
  return code;
}

function needsCode(sessionId: string, run: Run, code: string, reason: 'start' | 'rejected' | 'rechallenge'): FullFetchStep {
  run.touchedAt = Date.now();
  return { status: 'needs_code', sessionId, code, reason, expiresAt: new Date(run.touchedAt + SESSION_TTL_MS).toISOString(), ...statsOf(run) };
}

/** Add a results page to the run. Returns the page number it showed, or null if it held no tenders. */
function takeResultsPage(run: Run, html: string): number | null {
  const rows = parseOpenRfqRows(html);
  if (!rows.length) return null;
  for (const r of rows) if (!run.rows.has(r.externalId)) run.rows.set(r.externalId, r);
  const label = text(html).match(/\b(\d{1,3})\s+of\s+(\d{1,3})\b\s*\|/);
  const page = label ? parseInt(label[1], 10) : run.pagesDone.size + 1;
  if (label) run.totalPages = parseInt(label[2], 10);
  run.pagesDone.add(page);
  run.resultsHtml = html;
  if (run.pagesDone.size <= 2) saveDebug(`page-${page}.html`, html);
  return page;
}

// ---------------------------------------------------------------------------------------------
// Step 1: open a session the way a browser does and return the code the portal shows
// ---------------------------------------------------------------------------------------------

export async function startFullFetch(): Promise<FullFetchStep> {
  pruneSessions();
  const http = client();
  const jar = new Map<string, string>();

  trail = [];
  // Follow the same path as a browser: home page -> "Advanced Search" (all open tenders) -> code page.
  // Going straight to the list URL gives a code page without search criteria in the session, and the
  // portal then fails with "General Action Request Error" once the correct code is submitted.
  const home = await send(http, jar, 'GET', HOME_PATH);
  const search = formByName(home, 'rfqSearchForm');
  const csrf = home.match(/name=["']?OWASP_CSRFTOKEN["']?\s+value=["']?([A-Za-z0-9-]+)/i)?.[1] ?? '';
  const criteria: Record<string, string> = {
    ...DEFAULT_SEARCH,
    ...(search ? formInputs(search.body) : {}),
    ...DEFAULT_SELECTS, // "-" = any organisation / type / category
    OWASP_CSRFTOKEN: csrf,
    pkiEnabledOrg: 'false',
    Advanced: 'Advanced Search'
  };
  if (!criteria.rfqPart) criteria.rfqPart = '1';
  const html = await send(http, jar, 'POST', LIST_PATH, criteria);
  saveDebug('code-page.html', html);

  const run: Run = { cookies: jar, codeForm: {}, rows: new Map(), pagesDone: new Set(), totalPages: null, resultsHtml: null, touchedAt: Date.now() };
  const code = takeCodePage(run, html, criteria);
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions.set(sessionId, run);
  return needsCode(sessionId, run, code, 'start');
}

// ---------------------------------------------------------------------------------------------
// Step 2: submit the code the admin typed, then read pages until done or the portal asks again
// ---------------------------------------------------------------------------------------------

export async function submitFullFetchCode(sessionId: string, typedCode: string, onStats?: (s: FullFetchStats) => void): Promise<FullFetchStep> {
  pruneSessions();
  const run = sessions.get(sessionId);
  if (!run) throw new AppError('This code has expired. Start the full fetch again.', 410, 'CG_SESSION_EXPIRED');
  run.touchedAt = Date.now();

  const http = client();
  const jar = run.cookies;

  const afterCode = await send(http, jar, 'POST', LIST_PATH, { ...run.codeForm, inputCaptchaValue: typedCode.trim() });
  saveDebug('trail.txt', trail.join('\n'));

  if (isCodePage(afterCode)) {
    // Wrong code: the portal shows a new one. Let the admin try again in the same session.
    return needsCode(sessionId, run, takeCodePage(run, afterCode), 'rejected');
  }
  if (takeResultsPage(run, afterCode) === null) {
    sessions.delete(sessionId);
    saveDebug('after-code.html', afterCode);
    if (isPortalErrorPage(afterCode)) {
      throw new AppError(
        'The Chhattisgarh portal returned its own error page ("session expired / system maintenance"). Please try again in a few minutes.',
        502,
        'CG_PORTAL_ERROR'
      );
    }
    throw new AppError('The portal accepted the code but returned no tenders. The page layout may have changed (saved to logs/cgstate-full-fetch/).', 502, 'CG_NO_ROWS');
  }
  onStats?.(statsOf(run));

  // Read the remaining pages, lowest first. The guard stops a loop if the portal keeps
  // returning pages we already have.
  let requests = 0;
  const maxRequests = (run.totalPages ?? MAX_PAGES) * 2 + 5;
  while (true) {
    const total = Math.min(run.totalPages ?? 1, MAX_PAGES);
    let next = 0;
    for (let p = 1; p <= total; p++) if (!run.pagesDone.has(p)) { next = p; break; }
    if (!next || ++requests > maxRequests) break;

    const request = buildPageRequest(run.resultsHtml!, next - 1);
    if (!request) {
      saveDebug('pagination-not-found.html', run.resultsHtml!);
      logger.warn(`[CgstateFullFetch] Could not find the pager form; stopping at ${run.pagesDone.size}/${run.totalPages} pages.`);
      break;
    }
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    const html = await send(http, jar, request.method, request.url, request.method === 'POST' ? request.fields : undefined);

    if (isCodePage(html)) {
      // The portal wants a person to confirm again (it does so every few pages).
      logger.info(`[CgstateFullFetch] Portal asked for a new code after ${run.pagesDone.size}/${run.totalPages} pages.`);
      return needsCode(sessionId, run, takeCodePage(run, html), 'rechallenge');
    }
    const shown = takeResultsPage(run, html);
    if (shown === null) {
      saveDebug(`page-${next}-unexpected.html`, html);
      logger.warn(`[CgstateFullFetch] Page ${next} returned no tenders${isPortalErrorPage(html) ? ' (portal error page)' : ''}; stopping.`);
      break;
    }
    onStats?.(statsOf(run));
  }

  sessions.delete(sessionId);
  const stats = statsOf(run);
  logger.info(`[CgstateFullFetch] Read ${stats.pagesRead}/${stats.totalPages ?? '?'} pages, ${stats.rows} tenders.`);
  const rawAuctions = [...run.rows.values()];
  await keepRicherExistingData(rawAuctions);
  return { status: 'done', rawAuctions, incomplete: !!stats.totalPages && stats.pagesRead < stats.totalPages, ...stats };
}
// ---------------------------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------------------------

const MONTHS: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

/** "NOV 25, 2026 5:30:00 PM" (IST) -> Date */
function parseListDate(s: string | undefined): Date | null {
  const m = s?.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?)?/i);
  if (!m) return null;
  const month = MONTHS[m[1].toUpperCase()];
  if (month === undefined) return null;
  let hour = m[4] ? parseInt(m[4], 10) : 17;
  const minute = m[5] ? parseInt(m[5], 10) : 0;
  const ampm = (m[6] || '').toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return istToDate(parseInt(m[3], 10), month, parseInt(m[2], 10), hour, minute);
}

export function parseTotalPages(html: string): number | null {
  const m = text(html).match(/\b(\d{1,3})\s+of\s+(\d{1,3})\s*\|?\s*(?:NEXT|Go To Page|Previous)/i) || text(html).match(/\|\s*(\d{1,3})\s+of\s+(\d{1,3})\s*\|/);
  return m ? parseInt(m[2], 10) : null;
}

/** Rows of the open-tender list: S.No | Tender ID | Title | START-…/DUE-… | Department | PAC | flag */
export function parseOpenRfqRows(html: string): RawAuction[] {
  const out: RawAuction[] = [];
  for (const seg of html.split(/<tr\b/i).slice(1)) {
    const rowHtml = seg.split(/<\/tr>/i)[0];
    const plain = text(rowHtml);
    if (!/START\s*-/i.test(plain) || !/DUE\s*-/i.test(plain)) continue;

    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => ({ html: m[1], text: text(m[1]) }));
    const id = rowHtml.match(/viewRfq\s*\(\s*'?(\d+)/i)?.[1] || rowHtml.match(/rfqId=(\d+)/i)?.[1] || cells.find((c, i) => i > 0 && /^\d{4,}$/.test(c.text))?.text;
    if (!id) continue;

    const dateIdx = cells.findIndex((c) => /DUE\s*-/i.test(c.text));
    const startStr = plain.match(/START\s*-\s*([A-Za-z]{3}[^|]*?\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M)?)/i)?.[1];
    const dueStr = plain.match(/DUE\s*-\s*([A-Za-z]{3}[^|]*?\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M)?)/i)?.[1];
    const endTime = parseListDate(dueStr);
    if (!endTime) continue;
    const startTime = parseListDate(startStr) || new Date();

    // Title: prefer a full-text tooltip/title attribute over the truncated cell text.
    const idIdx = cells.findIndex((c) => c.text === id || c.html.includes(id));
    const titleCell = cells[idIdx + 1] && idIdx + 1 !== dateIdx ? cells[idIdx + 1] : cells[Math.max(0, dateIdx - 1)];
    const tooltip = titleCell?.html.match(/class=["']tooltiptext["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
    const titleAttr = titleCell?.html.match(/title=["']([^"']{10,})["']/i)?.[1];
    const title = (tooltip ? text(tooltip) : titleAttr ? decodeHtmlEntities(titleAttr) : titleCell?.text || '').trim();
    if (!title) continue;

    const after = dateIdx >= 0 ? cells.slice(dateIdx + 1) : [];
    const department = after[0]?.text || 'Government of Chhattisgarh';
    const pacNum = parseFloat((after[1]?.text || '').replace(/[^\d.]/g, ''));
    const pac = !isNaN(pacNum) && pacNum > 0 ? pacNum : 0;

    out.push({
      externalId: id,
      title,
      description: `${title} - Department: ${department}`,
      sourceStatus: 'ACTIVE',
      categoryName: 'State Government Works & Procurement',
      organization: { name: department, department },
      location: { state: 'Chhattisgarh', country: 'India' },
      startPrice: pac,
      startTime,
      endTime,
      officialUrl: `${BASE_URL}/CHEPS/security/getSignInAction.do`,
      items: [{ name: title, quantity: 1, unit: 'Contract', estimatedValue: pac > 0 ? pac : undefined }],
      documents: [],
      rawData: { source: 'CHiPS open tender list (admin full fetch)', rfqId: id, department, pac, startStr, dueStr, flag: after[2]?.text }
    });
  }
  return out;
}

/**
 * Request for a results page. The portal's pager posts its `rfqSearchForm` with a 0-based
 * `pageNumber` (NEXT on page 1 calls submitPage(1), "Go To Page 5" sends pageNumber=4).
 */
export function buildPageRequest(html: string, pageIndex: number): { method: 'GET' | 'POST'; url: string; fields: Record<string, string> } | null {
  const pager = formByName(html, 'rfqSearchForm');
  if (pager) {
    const fields = formInputs(pager.body);
    if ('pageNumber' in fields) {
      fields.pageNumber = String(pageIndex);
      fields.searchPageNumber = '';
      return { method: 'POST', url: attr(pager.tag, 'action') || LIST_PATH, fields };
    }
  }

  // Fallback: the form holding the "Go To Page" box (1-based box, 0-based hidden index).
  const goIdx = html.search(/Go\s*To\s*Page/i);
  if (goIdx >= 0) {
    const formStart = [...html.slice(0, goIdx).matchAll(/<form\b/gi)].pop()?.index ?? -1;
    if (formStart >= 0) {
      const tag = html.slice(formStart).match(/<form\b[^>]*>/i)![0];
      const rest = html.slice(formStart + tag.length);
      const end = rest.search(/<\/form>/i);
      const fields = formInputs(end >= 0 ? rest.slice(0, end) : rest);
      const keys = Object.keys(fields).filter((k) => /page/i.test(k));
      if (keys.length) {
        for (const k of keys) fields[k] = /search|goto/i.test(k) ? String(pageIndex + 1) : String(pageIndex);
        return { method: 'POST', url: attr(tag, 'action') || LIST_PATH, fields };
      }
    }
  }
  return null;
}
/**
 * The full list truncates long titles ("...") and may upper-case department names. For tenders we
 * already hold (from the public list, which has full titles), keep the richer text and the existing
 * department spelling so the import does not degrade them or create duplicate organisations.
 */
async function keepRicherExistingData(rows: RawAuction[]) {
  const source = await prisma.auctionSource.findUnique({ where: { code: 'CGSTATE' }, select: { id: true } });
  if (!source) return;

  const existing = await prisma.auction.findMany({
    where: { sourceId: source.id, externalId: { in: rows.map((r) => r.externalId) } },
    select: { externalId: true, title: true, description: true, organization: { select: { name: true } } }
  });
  const byId = new Map(existing.map((e) => [e.externalId, e]));

  const orgs = await prisma.organization.findMany({ where: { source: 'CGSTATE' }, select: { name: true } });
  const orgByKey = new Map(orgs.map((o) => [o.name.toLowerCase().replace(/\s+/g, ' ').trim(), o.name]));

  for (const r of rows) {
    const dept = r.organization?.name;
    const known = dept ? orgByKey.get(dept.toLowerCase().replace(/\s+/g, ' ').trim()) : undefined;
    if (known && r.organization) {
      r.organization = { name: known, department: known };
      r.description = `${r.title} - Department: ${known}`;
    }

    const prev = byId.get(r.externalId);
    const truncated = /(\.\.\.|…)$/.test(r.title);
    if (prev && (truncated || prev.title.length > r.title.length)) {
      r.title = prev.title;
      r.description = prev.description ?? r.description;
      if (r.items?.[0]) r.items[0].name = prev.title;
    }
    if (prev?.organization?.name && r.organization) {
      r.organization = { name: prev.organization.name, department: prev.organization.name };
    }
  }
}
