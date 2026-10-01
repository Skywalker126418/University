require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/database');

async function run() {
  try {
    await pool.query([
      'CREATE TABLE IF NOT EXISTS attendance (',
      '  id INT AUTO_INCREMENT PRIMARY KEY,',
      '  course_id INT NOT NULL,',
      '  lecturer_id INT NOT NULL,',
      '  student_id INT NOT NULL,',
      '  session_date DATE NOT NULL,',
      '  day_of_week VARCHAR(10),',
      '  status ENUM("present","absent","late","excused") DEFAULT "present",',
      '  remarks TEXT,',
      '  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,',
      '  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
      '  UNIQUE KEY unique_attendance (course_id, student_id, session_date),',
      '  INDEX idx_lecturer (lecturer_id),',
      '  INDEX idx_course (course_id),',
      '  INDEX idx_student (student_id),',
      '  INDEX idx_date (session_date)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    ].join('\n'));
    console.log('✅ attendance table created/verified');

    // Also add office_location if missing from lecturers
    try {
      await pool.query('ALTER TABLE lecturers ADD COLUMN office_location VARCHAR(100) NULL AFTER qualification');
      console.log('✅ office_location added to lecturers');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ office_location already exists');
      else console.warn('note:', e.message);
    }

    console.log('Done!');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
