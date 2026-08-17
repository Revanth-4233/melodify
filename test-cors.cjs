const https = require('https');
const options = {
  hostname: 'sonicvault-backend-5w8l.onrender.com',
  port: 443,
  path: '/api/auth/register',
  method: 'OPTIONS',
  headers: {
    'Origin': 'capacitor://localhost',
    'Access-Control-Request-Method': 'POST'
  }
};
const req = https.request(options, res => {
  console.log('Status:', res.statusCode);
  console.log('Allow Origin:', res.headers['access-control-allow-origin']);
});
req.on('error', e => console.error(e));
req.end();
