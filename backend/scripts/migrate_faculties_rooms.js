require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. faculties table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faculties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        faculty_name VARCHAR(200) NOT NULL,
        faculty_code VARCHAR(20) UNIQUE,
        description TEXT,
        dean VARCHAR(150),
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ faculties table created/verified');

    // 2. Add faculty_id column to departments if missing
    try {
      await pool.query(`ALTER TABLE departments ADD COLUMN faculty_id INT NULL AFTER id`);
      console.log('✅ faculty_id column added to departments');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ faculty_id already exists in departments');
      } else {
        throw e;
      }
    }

    // 3. rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_number VARCHAR(50) NOT NULL UNIQUE,
        building VARCHAR(100),
        capacity INT NOT NULL DEFAULT 30,
        room_type ENUM('lecture_hall', 'lab', 'seminar', 'tutorial') DEFAULT 'lecture_hall',
        available_from TIME DEFAULT '07:00:00',
        available_until TIME DEFAULT '20:00:00',
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ rooms table created/verified');

    // 4. Add room_id column to timetable if missing
    try {
      await pool.query(`ALTER TABLE timetable ADD COLUMN room_id INT NULL AFTER room`);
      console.log('✅ room_id column added to timetable');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ room_id already exists in timetable');
      } else {
        throw e;
      }
    }

    // 5. Check if room_id column exists in students or course_registrations (for assigned room/batch if desired)
    try {
      await pool.query(`ALTER TABLE students ADD COLUMN preferred_room_id INT NULL AFTER department_id`);
      console.log('✅ preferred_room_id added to students');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ preferred_room_id already exists in students');
      } else {
        console.warn('preferred_room_id note:', e.message);
      }
    }

    console.log('🎉 Migration successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
