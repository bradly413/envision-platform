const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Idle clients can emit errors after Railway/Postgres restarts; without a
// listener this becomes an unhandled EventEmitter error and crashes Node.
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
