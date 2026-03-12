const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());

app.get('/proxy', (req, res) => {
  const url = `https://docs.qq.com/dop-api/opendoc?${new URLSearchParams(req.query)}`;
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
      Accept: 'application/json',
      Referer: `https://docs.qq.com/`,
    },
  }, (r) => {
    let data = '';
    r.on('data', c => data += c);
    r.on('end', () => res.send(data));
  }).on('error', e => res.status(502).send(e.message));
});

app.listen(3001, () => console.log('Proxy on http://localhost:3001'));
