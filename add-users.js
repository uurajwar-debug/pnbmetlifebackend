import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: 'postgresql://pnbmetalife:KzUoE70G9fQEzh8pEtHeva6xbgr6Ck6B@dpg-d6qgulh4tr6s73fp8oig-a.oregon-postgres.render.com/pnbmetalife',
  ssl: { rejectUnauthorized: false }
})

const users = [
  { policy_number: 'PNB001', name: 'Rajesh Kumar', mobile_number: '9876543210', dob: '1985-03-15', city: 'Mumbai', state: 'Maharashtra', agent: 'Agent Sharma', email: 'rajesh.kumar@email.com' },
  { policy_number: 'PNB002', name: 'Priya Patel', mobile_number: '9876543211', dob: '1990-07-22', city: 'Delhi', state: 'Delhi', agent: 'Agent Verma', email: 'priya.patel@email.com' },
  { policy_number: 'PNB003', name: 'Amit Singh', mobile_number: '9876543212', dob: '1988-11-08', city: 'Bangalore', state: 'Karnataka', agent: 'Agent Gupta', email: 'amit.singh@email.com' }
]

async function addUsers() {
  const client = await pool.connect()
  try {
    for (const user of users) {
      await client.query(
        `INSERT INTO users (policy_number, name, mobile_number, dob, city, state, agent, email) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [user.policy_number, user.name, user.mobile_number, user.dob, user.city, user.state, user.agent, user.email]
      )
      console.log(`Added: ${user.name}`)
    }
    console.log('All 3 users added successfully!')
  } finally {
    client.release()
    await pool.end()
  }
}

addUsers()
