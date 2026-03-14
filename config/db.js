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

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date VARCHAR(20),
        time VARCHAR(20)
      )
    `)

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

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

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
    return { rows: [] }
  }
  try {
    return await pool.query(sql, params)
  } catch (error) {
    console.log('Query error:', error.message)
    return { rows: [] }
  }
}

export default { query }
