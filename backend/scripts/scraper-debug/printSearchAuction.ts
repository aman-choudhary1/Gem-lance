import axios from 'axios';

async function printSearchAuction() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/home', { headers });
  const html = res.data;

  const idx = html.indexOf('function searchAuction');
  if (idx !== -1) {
    console.log(html.substring(idx, idx + 1500));
  } else {
    console.log('function searchAuction not found directly');
  }
}

printSearchAuction();
