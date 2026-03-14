import express from 'express'
import { query } from '../config/db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM insurance_applications ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { user_id, plan_name, premium_amount } = req.body
    const result = await query(
      'INSERT INTO insurance_applications (user_id, plan_name, premium_amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, plan_name, premium_amount, 'pending']
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body
    await query('UPDATE insurance_applications SET status = $1 WHERE id = $2', [status, req.params.id])
    res.json({ message: 'Application updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router