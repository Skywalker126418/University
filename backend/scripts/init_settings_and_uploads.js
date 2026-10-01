const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'university_management_system'
  });

  console.log('Connected to MySQL. Creating system_settings table...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`system_settings\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`setting_key\` VARCHAR(100) NOT NULL,
      \`setting_value\` VARCHAR(255) NOT NULL,
      \`description\` VARCHAR(255) DEFAULT NULL,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_setting_key\` (\`setting_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Insert default PIN '12345678' and default master password 'admin12'
  await conn.query(`
    INSERT INTO \`system_settings\` (\`setting_key\`, \`setting_value\`, \`description\`)
    VALUES 
      ('admin_master_pin', '12345678', 'Master PIN required to access administrator registration form'),
      ('admin_master_password', 'admin12', 'Master password required to access administrator registration form')
    ON DUPLICATE KEY UPDATE \`setting_key\` = \`setting_key\`;
  `);

  const [settings] = await conn.query('SELECT * FROM system_settings');
  console.log('System settings initialized:', settings);

  // Ensure uploads/profiles folder exists
  const uploadsDir = path.resolve(__dirname, '../uploads/profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
  } else {
    console.log('Uploads directory already exists at:', uploadsDir);
  }

  await conn.end();
  console.log('Database and upload folder initialized successfully.');
}

run().catch(console.error);
