import axios from 'axios';
import * as cheerio from 'cheerio';

async function testGeM() {
  console.log('--- Testing GeM Forward Auction Portal Endpoints ---');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  };

  try {
    const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/home', { headers, timeout: 10000 });
    console.log('Status:', res.status);
    console.log('Data length:', res.data?.length);

    const $ = cheerio.load(res.data);
    const scripts: string[] = [];
    $('script').each((_, s) => {
      const src = $(s).attr('src');
      if (src) scripts.push(src);
    });
    console.log('Found scripts:', scripts);

    // Look for form or table or ajax endpoints
    const forms: string[] = [];
    $('form').each((_, f) => {
      forms.push($(f).attr('action') || 'form without action');
    });
    console.log('Forms:', forms);

    // Search for any ajax/api endpoint mentions in inline script
    $('script:not([src])').each((_, s) => {
      const text = $(s).html() || '';
      if (text.includes('ajax') || text.includes('fetch') || text.includes('url:') || text.includes('/eprocure/')) {
        console.log('Inline script snippet:', text.substring(0, 500));
      }
    });

  } catch (err: any) {
    console.error('Error connecting to GeM:', err.message);
  }
}

testGeM();
