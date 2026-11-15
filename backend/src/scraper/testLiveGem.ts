import axios from 'axios';
import * as cheerio from 'cheerio';

async function testGemLiveSession() {
  console.log('--- Testing Live GeM Forward Auction Ingestion with Session & CSRF ---');

  const client = axios.create({
    baseURL: 'https://forwardauction.gem.gov.in',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://forwardauction.gem.gov.in',
      'Referer': 'https://forwardauction.gem.gov.in/eprocure/home'
    }
  });

  // Step 1: GET /eprocure/home to obtain session cookie & CSRF token
  console.log('Step 1: Fetching initial page for CSRF & Cookies...');
  const getRes = await client.get('/eprocure/home');
  const cookies = getRes.headers['set-cookie'] || [];
  const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
  console.log('Cookies received:', cookieHeader);

  const $ = cheerio.load(getRes.data);
  const csrfToken = $('input[name="_csrf"]').val() || '';
  console.log('CSRF Token extracted:', csrfToken);

  // Step 2: POST /eprocure/home with CSRF token and lstType=1 (Live Auctions)
  console.log('Step 2: Sending live auction search request...');
  const formData = new URLSearchParams();
  formData.append('_csrf', csrfToken as string);
  formData.append('moduleType', '2');
  formData.append('searchType', '2');
  formData.append('lstType', '1'); // 1 = Live
  formData.append('xStatus', '2');
  formData.append('perPage', '20');
  formData.append('currentPage', '1');
  formData.append('keywrdSearch', '');

  const postRes = await client.post('/eprocure/home', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader
    }
  });

  console.log('POST Response status:', postRes.status);
  console.log('POST Response length:', postRes.data.length);

  // Step 3: Parse real auctions from HTML response
  const post$ = cheerio.load(postRes.data);
  const auctions: any[] = [];

  // Inspect cards, lists, tables
  post$('table, .auction-card, tr, .rfx-row, .card, [class*="list"]').each((i, el) => {
    const text = post$(el).text().replace(/\s+/g, ' ').trim();
    if (text.includes('GEM') || text.includes('FA/') || text.includes('Auction') || text.includes('₹') || text.includes('INR')) {
      // Look for auction rows
      if (text.length > 30 && text.length < 500) {
        auctions.push({ index: i, text });
      }
    }
  });

  console.log(`\nDiscovered ${auctions.length} candidate auction snippets in live response!`);
  auctions.slice(0, 10).forEach((a, idx) => {
    console.log(`\n[${idx + 1}] Snippet:`, a.text);
  });
}

testGemLiveSession().catch((e) => console.error('Error:', e.message));
