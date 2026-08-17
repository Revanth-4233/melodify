const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ucuyqagkzwgmahymclog:FCJKX3GcoImVseEz@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
});
client.connect()
  .then(() => {
    console.log('Successfully connected to Supabase!');
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
