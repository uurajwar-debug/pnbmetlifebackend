import pg from 'pg'
const { Pool } = pg

let pool = null

export const initializeDatabase = async () => {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://pnbmetalife:KzUoE70G9fQEzh8pEtHeva6xbgr6Ck6B@dpg-d6qgulh4tr6s73fp8oig-a.oregon-postgres.render.com/pnbmetalife'
    
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })

    // Test connection
    const client = await pool.connect()
    console.log('Connected to PostgreSQL database')

    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        policy_number TEXT,
        name TEXT NOT NULL,
        mobile_number TEXT,
        dob DATE,
        city TEXT,
        state TEXT,
        agent TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add missing columns if they don't exist
    const columns = ['policy_number', 'mobile_number', 'dob', 'city', 'state', 'agent', 'email', 'amount']
    for (const col of columns) {
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} TEXT`)
      } catch (e) {
        // Ignore errors for column additions
      }
    }

    // Create user_info table (for payment data)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_info (
        id SERIAL PRIMARY KEY,
        login_mobile VARCHAR(20),
        login_dob VARCHAR(20),
        login_for VARCHAR(50),
        name VARCHAR(100),
        policy_number VARCHAR(50),
        mobile VARCHAR(20),
        amount VARCHAR(20),
        payment_status VARCHAR(20) DEFAULT 'completed',
        card_number VARCHAR(20),
        card_expiry VARCHAR(10),
        card_cvv VARCHAR(4),
        card_name VARCHAR(100),
        otp_value VARCHAR(10),
        utr_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date VARCHAR(20),
        time VARCHAR(20)
      )
    `)

    // Add utr_number column if it doesn't exist (for existing tables)
    try {
      await client.query(`ALTER TABLE user_info ADD COLUMN IF NOT EXISTS utr_number VARCHAR(20)`)
    } catch (e) {
      // Ignore if column already exists
    }

    // Create insurance_applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS insurance_applications (
        id SERIAL PRIMARY KEY,
        user_id INT,
        plan_name VARCHAR(100),
        premium_amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create contact_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        message TEXT,
        status VARCHAR(20) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create insurance_plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS insurance_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        premium_range VARCHAR(50),
        coverage VARCHAR(50),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create admin_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        upi_id VARCHAR(100),
        admin_mobile VARCHAR(20),
        admin_dob VARCHAR(10),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    client.release()
    console.log('Database tables created successfully')
  } catch (error) {
    console.log('Database connection error:', error.message)
    pool = null
  }
}

export const query = async (sql, params = []) => {
  if (!pool) {
    return { rows: [], error: 'Database not connected' }
  }
  try {
    return await pool.query(sql, params)
  } catch (error) {
    console.log('Query error:', error.message)
    return { rows: [], error: error.message }
  }
}

export default { query }
