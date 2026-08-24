const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureSchema() {
  if (!process.env.DATABASE_URL) return;

  try {
    // Portal create/update always writes plain_password; schema.sql historically omitted it.
    await pool.query(`
      ALTER TABLE portals
        ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255)
    `);

    // Admin create-client forms treat email as optional; NOT NULL + UNIQUE on '' 500s.
    await pool.query(`
      ALTER TABLE clients
        ALTER COLUMN email DROP NOT NULL
    `);
    await pool.query(`
      UPDATE clients SET email = NULL WHERE email = ''
    `);
  } catch (err) {
    console.error('Schema ensure failed:', err.message);
  }
}

ensureSchema();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  ensureSchema,
};
