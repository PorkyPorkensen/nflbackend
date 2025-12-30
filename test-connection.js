const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('🔧 Testing PostgreSQL connection...');
  console.log(`🌍 Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, // AWS RDS requires SSL
    connectionTimeoutMillis: 5000,
  });

  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log(`🕐 Current time: ${result.rows[0].current_time}`);
    console.log(`🗄️ PostgreSQL version: ${result.rows[0].postgres_version}`);
    
    // Test creating a simple table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table creation test successful!');
    
    // Clean up test table
    await pool.query('DROP TABLE IF EXISTS connection_test');
    console.log('✅ Cleanup successful!');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   → Check your DB_HOST in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Database might not be ready yet');
    } else if (error.code === '28P01') {
      console.error('   → Check your DB_USER and DB_PASSWORD');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testConnection };