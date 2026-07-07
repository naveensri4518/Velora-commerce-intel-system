const https = require('https');

const data = JSON.stringify({
  model: 'grok-beta',
  messages: [{ role: 'user', content: 'hello' }]
});

const req = https.request({
  hostname: 'api.x.ai',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_GROK_API_KEY_HERE',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
