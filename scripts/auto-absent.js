const { Pool } = require('pg');

// Use your database connection string
// If you use .env.local, you can also read it with dotenv
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quarry_system',
  password: 'dj35mnit',   // CHANGE THIS to your actual password
  port: 5432,
});

async function markAbsent() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`Running auto-absent for ${today}...`);

  try {
    const result = await pool.query(`
      INSERT INTO attendance (worker_id, date, status, manual_override)
      SELECT w.id, $1, 'absent', false
      FROM workers w
      WHERE w.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM attendance a WHERE a.worker_id = w.id AND a.date = $1
        )
    `, [today]);

    console.log(`✅ Auto-absent marked ${result.rowCount} workers as absent.`);
  } catch (err) {
    console.error('❌ Error marking absent:', err);
  } finally {
    await pool.end();
  }
}

markAbsent();