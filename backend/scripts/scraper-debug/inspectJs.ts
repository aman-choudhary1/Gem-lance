import axios from 'axios';

async function checkJs() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/resources/js/app-new.js', { headers });
    console.log('app-new.js length:', res.data.length);

    // Look for URLs or endpoints
    const lines = res.data.split('\n');
    for (const line of lines) {
      if (line.includes('ajax') || line.includes('url:') || line.includes('/eprocure/') || line.includes('DataTable') || line.includes('search')) {
        console.log('Line:', line.trim().substring(0, 200));
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

checkJs();
