import axios from 'axios';
import * as cheerio from 'cheerio';

async function parseFullGeM() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };

  const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/home', { headers });
  const $ = cheerio.load(res.data);

  console.log('--- Page Title ---');
  console.log($('title').text());

  console.log('\n--- Tables Found ---');
  $('table').each((i, tbl) => {
    console.log(`Table #${i+1} ID: "${$(tbl).attr('id')}" Class: "${$(tbl).attr('class')}"`);
    console.log('Headers:', $(tbl).find('th').map((_, th) => $(th).text().trim()).get());
    console.log('Rows count:', $(tbl).find('tbody tr').length);
    $(tbl).find('tbody tr').slice(0, 3).each((rIdx, tr) => {
      console.log(` Row ${rIdx+1}:`, $(tr).find('td').map((_, td) => $(td).text().trim()).get());
    });
  });

  console.log('\n--- Script search for DataTable or AJAX URLs ---');
  $('script').each((_, s) => {
    const code = $(s).html() || '';
    if (code.includes('DataTable') || code.includes('ajax') || code.includes('url')) {
      console.log('--- Script snippet ---');
      console.log(code.substring(0, 1000));
    }
  });
}

parseFullGeM();
