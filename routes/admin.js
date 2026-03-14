import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import xlsx from 'xlsx'
import { query } from '../config/db.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const JWT_SECRET = process.env.JWT_SECRET || 'pnbmetlife-secret-key'

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    jwt.verify(token.split(' ')[1], JWT_SECRET)
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Admin Login
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

// Upload users from Excel
router.post('/upload-users', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = xlsx.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' })
    }

    let insertedCount = 0
    let errorCount = 0

    for (const row of jsonData) {
      try {
        const policyNumber = row['Policy Number'] || row['PolicyNumber'] || row['policy_number'] || ''
        const name = row['Name'] || row['name'] || ''
        const mobile = row['Mobile'] || row['Mobile Number'] || row['mobile_number'] || row['MobileNumber'] || ''
        const dob = row['DOB'] || row['dob'] || row['Date of Birth'] || ''
        const city = row['City'] || row['city'] || ''
        const state = row['State'] || row['state'] || ''
        const agent = row['Agent'] || row['agent'] || ''
        const email = row['Email'] || row['email'] || ''
        const amount = row['Amount'] || row['amount'] || ''

        if (name) {
          await query(
            `INSERT INTO users (policy_number, name, mobile_number, dob, city, state, agent, email, amount) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [policyNumber, name, mobile, dob, city, state, agent, email, amount]
          )
          insertedCount++
        } else {
          errorCount++
        }
      } catch (err) {
        errorCount++
        console.log('Error inserting row:', err.message)
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully uploaded ${insertedCount} users`,
      inserted: insertedCount,
      errors: errorCount
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new user
router.post('/create-user', async (req, res) => {
  try {
    const { policy_number, name, mobile_number, dob, city, state, agent, email, amount } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await query(
      `INSERT INTO users (policy_number, name, mobile_number, dob, city, state, agent, email, amount) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [policy_number, name, mobile_number, dob, city, state, agent, email, amount]
    )

    if (result.error) {
      return res.status(500).json({ error: result.error })
    }

    res.json({ success: true, user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all users with pagination and search
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = ''
    const params = []
    
    if (search) {
      params.push(`%${search}%`)
      whereClause = `WHERE name ILIKE $1 OR policy_number ILIKE $1 OR mobile_number ILIKE $1 OR email ILIKE $1 OR amount ILIKE $1`
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    )

    if (countResult.error) {
      return res.status(500).json({ error: countResult.error })
    }

    // Get users
    const result = await query(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    )

    if (result.error) {
      return res.status(500).json({ error: result.error })
    }

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((countResult.rows[0]?.total || 0) / limit)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user
router.put('/update-user/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { policy_number, name, mobile_number, dob, city, state, agent, email, amount } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await query(
      `UPDATE users SET policy_number = $1, name = $2, mobile_number = $3, dob = $4, city = $5, state = $6, agent = $7, email = $8, amount = $9 
       WHERE id = $10 RETURNING *`,
      [policy_number, name, mobile_number, dob, city, state, agent, email, amount, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user
router.delete('/delete-user/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete all users
router.delete('/delete-all-users', async (req, res) => {
  try {
    await query('DELETE FROM users')
    res.json({ success: true, message: 'All users deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Dashboard stats
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

// Get user by policy number
router.get('/user-by-policy/:policyNumber', async (req, res) => {
  try {
    const { policyNumber } = req.params
    const result = await query(
      'SELECT * FROM users WHERE policy_number = $1',
      [policyNumber]
    )

    if (result.error) {
      return res.status(500).json({ error: result.error })
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found with this policy number' })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Settings
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

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    const decoded = jwt.verify(req.headers['authorization'].split(' ')[1], JWT_SECRET)
    const result = await query('SELECT * FROM admin_users WHERE id = $1', [decoded.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hashedPassword, decoded.id])

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
