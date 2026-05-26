const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quarry_system',
  password: 'dj35mnit',
  port: 5432,
});

(async () => {
  try {
    // 1. Get all columns from users table
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('📋 Users table columns:');
    columns.rows.forEach(col => console.log(`   - ${col.column_name}`));

    // 2. Get first user (without password)
    const user = await pool.query(`
      SELECT id, full_name, phone, role, branch_id, force_password_reset 
      FROM users 
      WHERE deleted_at IS NULL 
      LIMIT 1
    `);
    if (user.rows.length > 0) {
      console.log('\n👤 Sample user:');
      console.log(user.rows[0]);
    } else {
      console.log('\n⚠️ No active users found');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();