const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ucuyqagkzwgmahymclog:FCJKX3GcoImVseEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => {
    console.log('Successfully connected to Supabase Pooler Session Mode!');
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
