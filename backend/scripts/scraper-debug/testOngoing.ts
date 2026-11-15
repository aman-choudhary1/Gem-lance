import axios from 'axios';
import * as cheerio from 'cheerio';

async function testOngoing() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };

  try {
    const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/', { headers });
    console.log('GET /eprocure/ Status:', res.status);
    console.log('Length:', res.data.length);
    const $ = cheerio.load(res.data);
    console.log('Title:', $('title').text());
    console.log('Tables:', $('table').length);
    $('table').each((i, tbl) => {
      console.log(`Table ${i+1}:`, $(tbl).attr('id'), $(tbl).attr('class'));
      $(tbl).find('tr').slice(0, 3).each((_, tr) => {
        console.log('  row:', $(tr).text().replace(/\s+/g, ' ').trim().substring(0, 150));
      });
    });
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testOngoing();
