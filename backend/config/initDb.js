import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('═══════════════════════════════════════════════════');
  console.log('☕  KALILUNI COFFEE - DATABASE INITIALIZER');
  console.log('═══════════════════════════════════════════════════');

  const client = await pool.connect();

  try {
    console.log('🔄 Connecting to PostgreSQL database...');

    console.log('🔑 Using plain-text password for seed users.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('⚙️  Executing schema creation and seeding tables...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('');
    console.log('✅ DATABASE INITIALIZED SUCCESSFULLY!');
    console.log('');
    console.log('Created and populated tables:');
    console.log('  • users          (Farmer, Staff, Admin)');
    console.log('  • farmers        (Member registry & totals)');
    console.log('  • deliveries     (Cherry deliveries & receipt numbers)');
    console.log('  • transactions   (Advances, deductions & payments)');
    console.log('  • announcements  (Cooperative news & priority alerts)');
    console.log('  • forms          (Downloadable PDFs & applications)');
    console.log('  • settings       (Pricing, rates & cooperative rules)');
    console.log('  • audit_logs     (Activity audit trail)');
    console.log('');
    console.log('Default Demo Accounts (Password: password):');
    console.log('  • Farmer: farmer@kaliluni.com');
    console.log('  • Staff:  staff@kaliluni.com');
    console.log('  • Admin:  admin@kaliluni.com');
    console.log('═══════════════════════════════════════════════════');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('');
    console.error('❌ Failed to initialize database:');
    console.error(error.message);
    console.error('');
    console.error('💡 Please verify that:');
    console.error('  1. PostgreSQL service is running.');
    console.error('  2. The database specified in backend/.env exists.');
    console.error('     (e.g., CREATE DATABASE kaliluni_coffee;)');
    console.error('  3. DATABASE_URL in backend/.env has correct credentials.');
    console.log('═══════════════════════════════════════════════════');
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
