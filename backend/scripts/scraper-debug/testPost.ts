import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkSearchForm() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/home', { headers });
  const $ = cheerio.load(res.data);

  console.log('--- Search Form Fields ---');
  $('#searchAucForm input, #searchAucForm select').each((_, el) => {
    console.log({
      tag: el.tagName,
      name: $(el).attr('name'),
      id: $(el).attr('id'),
      type: $(el).attr('type'),
      value: $(el).attr('value')
    });
  });

  console.log('--- Form Action & Method ---');
  console.log('Action:', $('#searchAucForm').attr('action'));
  console.log('Method:', $('#searchAucForm').attr('method'));

  // Test POST to /eprocure/home with form defaults to fetch live auctions
  try {
    console.log('\n--- Testing POST to search /eprocure/home ---');
    const postRes = await axios.post('https://forwardauction.gem.gov.in/eprocure/home', new URLSearchParams({
      status: '1', // 1 = Live/Ongoing
      moduleId: '1',
      page: '1'
    }).toString(), {
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://forwardauction.gem.gov.in/eprocure/home'
      }
    });
    console.log('POST Response status:', postRes.status);
    console.log('POST Response length:', postRes.data.length);

    const post$ = cheerio.load(postRes.data);
    console.log('Tables in POST response:', post$('table').length);
    post$('table').each((i, tbl) => {
      console.log(`Table ${i+1}:`, post$(tbl).attr('id'), post$(tbl).attr('class'));
      console.log('Rows count:', post$(tbl).find('tr').length);
      post$(tbl).find('tr').slice(0, 5).each((_, tr) => {
        console.log('  Tr text:', post$(tr).text().replace(/\s+/g, ' ').trim().substring(0, 150));
      });
    });

  } catch (err: any) {
    console.error('POST error:', err.message);
  }
}

checkSearchForm();
