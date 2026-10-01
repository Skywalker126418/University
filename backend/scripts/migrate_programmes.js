require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/database');

async function run() {
  try {
    // Add degree_type column
    try {
      await pool.query("ALTER TABLE programmes ADD COLUMN degree_type VARCHAR(50) DEFAULT 'Bachelor' AFTER description");
      console.log('✅ degree_type column added');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ degree_type already exists');
      else throw e;
    }

    // Add updated_at column
    try {
      await pool.query('ALTER TABLE programmes ADD COLUMN updated_at DATETIME NULL AFTER created_at');
      await pool.query('UPDATE programmes SET updated_at = created_at WHERE updated_at IS NULL');
      console.log('✅ updated_at column added');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ updated_at already exists');
      else throw e;
    }

    // Verify
    const [cols] = await pool.query('DESCRIBE programmes');
    console.log('\nFinal columns:', cols.map(c => c.Field).join(', '));
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
