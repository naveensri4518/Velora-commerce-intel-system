const https = require('https');

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: 'hello'
    }]
  }]
});

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: '/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_GEMINI_API_KEY_HERE',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
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
