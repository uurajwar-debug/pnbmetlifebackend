import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://pnbmetalife:KzUoE70G9fQEzh8pEtHeva6xbgr6Ck6B@dpg-d6qgulh4tr6s73fp8oig-a.oregon-postgres.render.com/pnbmetalife',
  ssl: { rejectUnauthorized: false }
})

const names = ['Rahul Sharma', 'Priya Singh', 'Arjun Das', 'Neha Patel', 'Karan Mehta', 'Sneha Gupta', 'Vikram Joshi', 'Anjali Reddy', 'Raj Kumar', 'Fatima Begum', 'Mohammad Ali', 'Suresh Babu', 'Lakshmi Devi', 'Gopal Krishnan', 'Harish Chandra', 'Divya Nair', 'Binu Sebastian', 'Cynthia Dmello', 'Pavan Kumar', 'Ravi Teja', 'Swathi Let', 'Kalyani Iyer', 'Prashanth Nair', 'Meera Menon', 'Jatin Sharma', 'Nidhi Agarwal', 'Rohit Verma', 'Sakshi Singh', 'Aryan Kapoor', 'Kiara Advani', 'Vicky Kaushal', 'Katrina Kaif', 'Shah Rukh', 'Salman Khan', 'Aamir Khan', 'Hrithik Roshan', 'Ranbir Kapoor', 'Saif Ali Khan', 'Akshay Kumar', 'Ajay Devgn', 'Sunny Deol', 'Bobby Deol', 'Paresh Rawal', 'Anupam Kher', 'Boman Irani', 'Raj Babbar', 'Naseeruddin Shah', 'Irrfan Khan', 'Manoj Bajpayee']

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']
const states = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Kerala', 'Delhi']
const agents = ['Agent Sharma', 'Agent Verma', 'Agent Gupta', 'Agent Singh', 'Agent Patel', 'Agent Kumar', 'Agent Reddy', 'Agent Joshi']
const amounts = ['15000', '18500', '20000', '25000', '30000', '35000', '42000', '50000']

async function addUsers() {
  const client = await pool.connect()
  try {
    let count = 0
    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      const policyNumber = `PNB${String(i + 10).padStart(3, '0')}`
      const mobile = `9876543${String(i).padStart(3, '0')}`
      const city = cities[i % cities.length]
      const state = states[i % states.length]
      const agent = agents[i % agents.length]
      const email = name.toLowerCase().replace(' ', '.') + '@email.com'
      const amount = amounts[i % amounts.length]
      const dob = `19${85 + (i % 10)}-0${1 + (i % 9)}-15`
      
      await client.query(
        `INSERT INTO users (policy_number, name, mobile_number, dob, city, state, agent, email, amount) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [policyNumber, name, mobile, dob, city, state, agent, email, amount]
      )
      count++
    }
    console.log(`Added ${count} users successfully!`)
  } finally {
    client.release()
    await pool.end()
  }
}

addUsers()
