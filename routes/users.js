import express from 'express'
import { query } from '../config/db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body
    const result = await query(
      'INSERT INTO users (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router