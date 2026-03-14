import express from 'express'
import { query } from '../config/db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM contact_messages ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body
    const result = await query(
      'INSERT INTO contact_messages (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, message]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body
    await query('UPDATE contact_messages SET status = $1 WHERE id = $2', [status, req.params.id])
    res.json({ message: 'Message updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router