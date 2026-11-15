import axios from 'axios';
import * as cheerio from 'cheerio';

async function testAjaxSearchAuction() {
  console.log('--- Testing Real GeM ajax/search-auction Endpoint ---');

  const client = axios.create({
    baseURL: 'https://forwardauction.gem.gov.in',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://forwardauction.gem.gov.in',
      'Referer': 'https://forwardauction.gem.gov.in/eprocure/home'
    }
  });

  // 1. GET /eprocure/home for Cookies & CSRF
  const getRes = await client.get('/eprocure/home');
  const cookies = (getRes.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
  const csrfMatch = getRes.data.match(/name="_csrf"\s+value="([^"]+)"/);
  const csrf = csrfMatch ? csrfMatch[1] : '';

  console.log('Got CSRF:', csrf);
  console.log('Got Cookies:', cookies);

  // 2. POST to ajax/search-auction
  const params = new URLSearchParams({
    _csrf: csrf,
    moduleType: '2',
    searchType: '1', // 1=Default list, 2=Search
    lstType: '1',    // 1=Live, 2=Closed, 3=Cancelled
    xStatus: '1',    // 1=Live
    currentPage: '1',
    perPage: '20',
    keywrdSearch: ''
  });

  console.log('Posting to /eprocure/ajax/search-auction ...');
  const postRes = await client.post('/eprocure/ajax/search-auction', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': cookies,
      'X-CSRF-TOKEN': csrf
    }
  });

  console.log('Response status:', postRes.status);
  console.log('Response length:', postRes.data?.length);

  const $ = cheerio.load(postRes.data);
  console.log('Record Count input:', $('input#recordCount').val());
  console.log('Found rows/cards:', $('.card, tr, .rfx-row, .row, table').length);

  // Let's print out whatever items are in the response
  $('a, span, div, tr').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.includes('GEM') || text.includes('FA/') || text.includes('Auction') || text.includes('₹')) {
      if (text.length > 20 && text.length < 300) {
        console.log('Matched Element:', $(el).prop('tagName'), text);
      }
    }
  });

  if (postRes.data.length < 1000) {
    console.log('Response body:', postRes.data);
  }
}

testAjaxSearchAuction().catch((err) => {
  console.error('Error in testAjaxSearchAuction:', err.message);
  if (err.response) {
    console.error('Response status:', err.response.status);
    console.error('Response data:', err.response.data);
  }
});
