import axios from 'axios';

async function checkAppCommon() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    const res = await axios.get('https://forwardauction.gem.gov.in/eprocure/resources/js/app-common.js', { headers });
    console.log('app-common.js length:', res.data.length);

    // Look for URLs or endpoints
    const lines = res.data.split('\n');
    for (const line of lines) {
      if (line.includes('ajax') || line.includes('url') || line.includes('getJSON') || line.includes('post') || line.includes('DataTable')) {
        console.log('Common line:', line.trim().substring(0, 200));
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

checkAppCommon();
