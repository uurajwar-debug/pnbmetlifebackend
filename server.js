import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase } from './config/db.js'
import userRoutes from './routes/users.js'
import applicationRoutes from './routes/applications.js'
import messageRoutes from './routes/messages.js'
import planRoutes from './routes/plans.js'
import adminRoutes from './routes/admin.js'
import paymentRoutes from './routes/payment.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/users', userRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payment', paymentRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PNB MetLife API' })
})

app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { query } = await import('./config/db.js')
    const users = await query('SELECT COUNT(*) as count FROM users')
    const applications = await query('SELECT COUNT(*) as count FROM insurance_applications')
    const messages = await query('SELECT COUNT(*) as count FROM contact_messages')
    const plans = await query('SELECT COUNT(*) as count FROM insurance_plans')
    res.json({
      users: parseInt(users.rows[0]?.count || 0),
      applications: parseInt(applications.rows[0]?.count || 0),
      messages: parseInt(messages.rows[0]?.count || 0),
      plans: parseInt(plans.rows[0]?.count || 0)
    })
  } catch (error) {
    res.json({ users: 0, applications: 0, messages: 0, plans: 0 })
  }
})

const startServer = async () => {
  await initializeDatabase()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer()
