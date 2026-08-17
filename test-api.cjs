const https = require('https');
const data = JSON.stringify({
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'password123'
});

const req = https.request('https://sonicvault-backend-5w8l.onrender.com/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk.toString());
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
