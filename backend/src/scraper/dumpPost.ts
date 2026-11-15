import axios from 'axios';
import * as fs from 'fs';

async function dumpPostResponse() {
  const client = axios.create({
    baseURL: 'https://forwardauction.gem.gov.in',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Origin': 'https://forwardauction.gem.gov.in',
      'Referer': 'https://forwardauction.gem.gov.in/eprocure/home'
    }
  });

  const getRes = await client.get('/eprocure/home');
  const cookies = (getRes.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
  const csrfToken = getRes.data.match(/name="_csrf"\s+value="([^"]+)"/)?.[1] || '';

  const formData = new URLSearchParams({
    _csrf: csrfToken,
    moduleType: '2',
    searchType: '2',
    lstType: '1',
    xStatus: '2',
    perPage: '20',
    currentPage: '1',
    keywrdSearch: ''
  });

  const postRes = await client.post('/eprocure/home', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies
    }
  });

  fs.writeFileSync('d:/My Dev/gem/backend/src/scraper/gem_post_sample.html', postRes.data, 'utf-8');
  console.log('Saved gem_post_sample.html with size:', postRes.data.length);
}

dumpPostResponse();
