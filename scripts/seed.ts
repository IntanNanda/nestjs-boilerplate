import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function seed() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@example.com', name: 'Admin User', role: 'admin' },
    { email: 'user@example.com', name: 'Regular User', role: 'user' },
  ];

  for (const user of users) {
    try {
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [user.email, hashedPassword, user.name, user.role],
      );
      console.log(`✅ Seeded: ${user.email}`);
    } catch (err) {
      console.error(`❌ Failed to seed: ${user.email}`, err.message);
    }
  }

  await pool.end();
  console.log('Seeding completed.');
}

seed();
