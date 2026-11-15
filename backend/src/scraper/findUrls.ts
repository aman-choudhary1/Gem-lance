import axios from 'axios';

async function findAjaxUrls() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/home', { headers });
  const scriptContent = res.data;

  const matches = scriptContent.match(/["'][^"']*(?:ajax|auction|search|list|json)[^"']*["']/gi) || [];
  console.log('Unique potential endpoint matches:', Array.from(new Set(matches)));
}

findAjaxUrls();
