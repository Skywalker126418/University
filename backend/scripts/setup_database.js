const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setup() {
  const sqlPath = path.resolve(__dirname, '../../database/university_management_system.sql');
  let sql = fs.readFileSync(sqlPath, 'utf8');

  const testHash = '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci';
  const valid = await bcrypt.compare('password123', testHash);
  console.log('Hash verification check:', valid);
  if (!valid) throw new Error('Invalid test hash!');

  // Replace old hashes in seed data
  sql = sql.replace(/\$2[ab]\$10\$[A-Za-z0-9./]{53}/g, testHash);
  fs.writeFileSync(sqlPath, sql, 'utf8');
  console.log('Updated SQL file with validated password hash.');

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
  });

  console.log('Connected to MySQL. Executing schema and seeds...');
  await conn.query(sql);
  console.log('Database import successful!');

  // Verify users
  const [users] = await conn.query('SELECT id, email, role, is_active FROM university_management_system.users');
  console.log('Inserted Users:');
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.is_active}`);
  }

  await conn.end();
  console.log('Setup finished cleanly.');
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
