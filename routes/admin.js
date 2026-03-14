import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'pnbmetlife-secret-key'

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await query('SELECT * FROM admin_users WHERE username = $1', [username])
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, JWT_SECRET, { expiresIn: '24h' })
    res.json({ token, username: result.rows[0].username })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/dashboard', async (req, res) => {
  try {
    const users = await query('SELECT COUNT(*) as count FROM users')
    const applications = await query('SELECT COUNT(*) as count FROM insurance_applications WHERE status = $1', ['pending'])
    const messages = await query('SELECT COUNT(*) as count FROM contact_messages WHERE status = $1', ['unread'])
    const plans = await query('SELECT COUNT(*) as count FROM insurance_plans')

    res.json({
      users: parseInt(users.rows[0].count),
      applications: parseInt(applications.rows[0].count),
      messages: parseInt(messages.rows[0].count),
      plans: parseInt(plans.rows[0].count)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM admin_settings ORDER BY id DESC LIMIT 1')
    if (result.rows.length > 0) {
      res.json(result.rows[0])
    } else {
      res.json({})
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/settings', async (req, res) => {
  try {
    const { upiId, adminMobile, adminDob } = req.body
    const existing = await query('SELECT * FROM admin_settings ORDER BY id DESC LIMIT 1')
    
    if (existing.rows.length > 0) {
      await query(
        'UPDATE admin_settings SET upi_id = $1, admin_mobile = $2, admin_dob = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [upiId, adminMobile, adminDob, existing.rows[0].id]
      )
    } else {
      await query(
        'INSERT INTO admin_settings (upi_id, admin_mobile, admin_dob) VALUES ($1, $2, $3)',
        [upiId, adminMobile, adminDob]
      )
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router